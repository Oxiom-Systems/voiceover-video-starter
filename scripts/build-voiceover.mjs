import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";
import { loadProject, relativeToRoot } from "./lib/project.mjs";
import { durationSeconds, ffmpegConcatPath, run } from "./lib/process.mjs";

const project = await loadProject();
const provider = process.env.TTS_PROVIDER ?? (process.platform === "darwin" ? "macos-say" : "voicebox");
const clipDirectory = join(project.outputDirectory, "voiceover-clips");
const silenceDirectory = join(project.outputDirectory, "silence");
const finalAudio = join(project.outputDirectory, `${project.slug}-voiceover.wav`);
const manifestPath = join(project.outputDirectory, "voiceover-manifest.json");
const scriptPath = join(project.outputDirectory, `${project.slug}-voiceover.txt`);
const concatPath = join(project.outputDirectory, "voiceover-concat.txt");
const cachePath = join(clipDirectory, "cache.json");
mkdirSync(clipDirectory, { recursive: true });
mkdirSync(silenceDirectory, { recursive: true });

function splitSentences(text) {
  return text
    .replace(/\s+/g, " ")
    .trim()
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function spokenText(text) {
  return (project.speechReplacements ?? []).reduce((value, replacement) => {
    return value.replace(new RegExp(replacement.pattern, replacement.flags ?? "g"), replacement.replacement);
  }, text);
}

function signature(text) {
  const providerSettings =
    provider === "macos-say"
      ? process.env.MACOS_SAY_VOICE ?? "Daniel"
      : [
          process.env.VOICEBOX_API_BASE ?? "http://127.0.0.1:8000",
          process.env.VOICEBOX_ENGINE ?? "chatterbox_turbo",
          process.env.VOICEBOX_PROFILE_ID ?? process.env.VOICEBOX_PROFILE_NAME ?? "Technical Narrator"
        ].join("|");
  return createHash("sha256").update(`${provider}|${providerSettings}|${text}`).digest("hex");
}

function normalizeAudio(source, destination) {
  run("ffmpeg", [
    "-hide_banner",
    "-loglevel",
    "error",
    "-y",
    "-i",
    source,
    "-ar",
    String(project.audioSampleRate),
    "-ac",
    "1",
    "-c:a",
    "pcm_s16le",
    destination
  ]);
}

function generateMacosSay(text, destination) {
  if (process.platform !== "darwin") throw new Error("TTS_PROVIDER=macos-say requires macOS.");
  const source = `${destination}.aiff`;
  run("say", ["-v", process.env.MACOS_SAY_VOICE ?? "Daniel", "-o", source, text]);
  normalizeAudio(source, destination);
  unlinkSync(source);
}

async function voiceboxJson(path, options = {}) {
  const base = process.env.VOICEBOX_API_BASE ?? "http://127.0.0.1:8000";
  const response = await fetch(`${base}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers ?? {}) },
    signal: AbortSignal.timeout(options.timeout ?? 60000)
  });
  if (!response.ok) throw new Error(`Voicebox ${path} failed: ${response.status} ${await response.text()}`);
  return response.json();
}

async function voiceboxProfile() {
  if (process.env.VOICEBOX_PROFILE_ID) {
    return { id: process.env.VOICEBOX_PROFILE_ID, name: process.env.VOICEBOX_PROFILE_NAME ?? "Configured profile" };
  }
  const name = process.env.VOICEBOX_PROFILE_NAME ?? "Technical Narrator";
  const profiles = await voiceboxJson("/profiles");
  const existing = profiles.find((profile) => profile.name === name);
  if (existing) return existing;
  const engine = process.env.VOICEBOX_ENGINE ?? "chatterbox_turbo";
  return voiceboxJson("/profiles", {
    method: "POST",
    body: JSON.stringify({
      name,
      description: "Narration profile created by voiceover-video-starter.",
      language: "en",
      voice_type: "designed",
      design_prompt:
        process.env.VOICEBOX_PROFILE_DESIGN_PROMPT ??
        "Clear, warm technical narrator with calm documentary pacing.",
      default_engine: engine
    })
  });
}

async function generateVoicebox(profile, text, destination) {
  const base = process.env.VOICEBOX_API_BASE ?? "http://127.0.0.1:8000";
  const source = `${destination}.source.wav`;
  const response = await fetch(`${base}/generate/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      profile_id: profile.id,
      text,
      language: "en",
      engine: process.env.VOICEBOX_ENGINE ?? "chatterbox_turbo",
      instruct:
        process.env.VOICEBOX_GENERATION_INSTRUCT ??
        "Speak clearly and naturally. Keep sentence endings confident and unhurried.",
      max_chunk_chars: 800,
      crossfade_ms: 0,
      normalize: true
    }),
    signal: AbortSignal.timeout(300000)
  });
  if (!response.ok) throw new Error(`Voicebox generation failed: ${response.status} ${await response.text()}`);
  writeFileSync(source, Buffer.from(await response.arrayBuffer()));
  normalizeAudio(source, destination);
  unlinkSync(source);
}

function makeSilence(seconds) {
  const path = join(silenceDirectory, `silence-${seconds.toFixed(2).replace(".", "_")}.wav`);
  if (!existsSync(path)) {
    run("ffmpeg", [
      "-hide_banner",
      "-loglevel",
      "error",
      "-y",
      "-f",
      "lavfi",
      "-i",
      `anullsrc=channel_layout=mono:sample_rate=${project.audioSampleRate}`,
      "-t",
      String(seconds),
      "-c:a",
      "pcm_s16le",
      path
    ]);
  }
  return path;
}

const cache = existsSync(cachePath) ? JSON.parse(readFileSync(cachePath, "utf8")) : {};
const profile = provider === "voicebox" ? await voiceboxProfile() : null;
if (!["macos-say", "voicebox"].includes(provider)) {
  throw new Error("TTS_PROVIDER must be 'macos-say' or 'voicebox'.");
}

const sentenceGap = makeSilence(project.sentenceGapSeconds);
const slideGap = makeSilence(project.slideGapSeconds);
const concatEntries = [];
const slides = [];
const scriptLines = [];

for (const [sceneIndex, scene] of project.scenes.entries()) {
  const sentences = [];
  const parts = splitSentences(scene.voiceover);
  for (const [sentenceIndex, text] of parts.entries()) {
    const speech = spokenText(text);
    const filename = `slide-${String(sceneIndex + 1).padStart(2, "0")}-sentence-${String(sentenceIndex + 1).padStart(2, "0")}.wav`;
    const path = join(clipDirectory, filename);
    const currentSignature = signature(speech);
    if (!existsSync(path) || cache[filename] !== currentSignature) {
      if (provider === "macos-say") generateMacosSay(speech, path);
      else await generateVoicebox(profile, speech, path);
      cache[filename] = currentSignature;
      writeFileSync(cachePath, `${JSON.stringify(cache, null, 2)}\n`);
    }
    const duration = durationSeconds(path);
    concatEntries.push(path);
    if (sentenceIndex < parts.length - 1) concatEntries.push(sentenceGap);
    sentences.push({
      index: sentenceIndex + 1,
      text,
      spokenText: speech,
      file: relativeToRoot(path),
      durationSeconds: Number(duration.toFixed(3))
    });
    scriptLines.push(text);
  }
  if (sceneIndex < project.scenes.length - 1) concatEntries.push(slideGap);
  slides.push({ slide: sceneIndex + 1, title: scene.title, sentences });
  scriptLines.push("");
}

writeFileSync(scriptPath, `${scriptLines.join("\n").trim()}\n`);
writeFileSync(concatPath, `${concatEntries.map((path) => `file ${ffmpegConcatPath(path)}`).join("\n")}\n`);
run("ffmpeg", [
  "-hide_banner",
  "-loglevel",
  "error",
  "-y",
  "-f",
  "concat",
  "-safe",
  "0",
  "-i",
  concatPath,
  "-c",
  "copy",
  finalAudio
]);

const manifest = {
  version: 1,
  provider,
  profile: profile ? { id: profile.id, name: profile.name } : { name: process.env.MACOS_SAY_VOICE ?? "Daniel" },
  audioFile: relativeToRoot(finalAudio),
  sentenceGapSeconds: project.sentenceGapSeconds,
  slideGapSeconds: project.slideGapSeconds,
  slides
};
writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

console.log(
  JSON.stringify(
    {
      provider,
      output: relativeToRoot(finalAudio),
      durationSeconds: Number(durationSeconds(finalAudio).toFixed(3)),
      manifest: relativeToRoot(manifestPath),
      clips: basename(clipDirectory)
    },
    null,
    2
  )
);
