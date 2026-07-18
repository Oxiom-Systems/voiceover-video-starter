import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";
import { loadProject, relativeToRoot } from "./lib/project.mjs";
import { durationSeconds, ffmpegConcatPath, run } from "./lib/process.mjs";

const project = await loadProject();
const VOICEBOX_API_BASE = (process.env.VOICEBOX_API_BASE ?? "http://127.0.0.1:8000").replace(/\/$/, "");
const ENGINE = process.env.VOICEBOX_ENGINE ?? "chatterbox_turbo";
const MODEL_NAME_BY_ENGINE = {
  chatterbox: "chatterbox-tts",
  chatterbox_turbo: "chatterbox-turbo"
};
const MODEL_NAME = MODEL_NAME_BY_ENGINE[ENGINE];
if (!MODEL_NAME) {
  throw new Error("VOICEBOX_ENGINE must be 'chatterbox_turbo' or 'chatterbox'.");
}
const PROFILE_NAME = process.env.VOICEBOX_PROFILE_NAME ?? "Technical Narrator";
const PROFILE_DESIGN_PROMPT =
  process.env.VOICEBOX_PROFILE_DESIGN_PROMPT ??
  "Clear, warm technical narrator with calm documentary pacing.";
const GENERATION_INSTRUCT =
  process.env.VOICEBOX_GENERATION_INSTRUCT ??
  "Speak clearly and naturally. Keep sentence endings confident and unhurried.";
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
  const voiceboxSettings = [
    VOICEBOX_API_BASE,
    ENGINE,
    process.env.VOICEBOX_PROFILE_ID ?? PROFILE_NAME,
    PROFILE_DESIGN_PROMPT,
    GENERATION_INSTRUCT
  ].join("|");
  return createHash("sha256").update(`voicebox|${voiceboxSettings}|${text}`).digest("hex");
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

async function voiceboxJson(path, options = {}) {
  const { timeout = 60000, ...fetchOptions } = options;
  let response;
  try {
    response = await fetch(`${VOICEBOX_API_BASE}${path}`, {
      ...fetchOptions,
      headers: { "Content-Type": "application/json", ...(fetchOptions.headers ?? {}) },
      signal: AbortSignal.timeout(timeout)
    });
  } catch (error) {
    throw new Error(`Voicebox is not reachable at ${VOICEBOX_API_BASE}. Start the server and retry.`, { cause: error });
  }
  if (!response.ok) throw new Error(`Voicebox ${path} failed: ${response.status} ${await response.text()}`);
  return response.json();
}

async function voiceboxProfile() {
  if (process.env.VOICEBOX_PROFILE_ID) {
    return { id: process.env.VOICEBOX_PROFILE_ID, name: PROFILE_NAME };
  }
  const profiles = await voiceboxJson("/profiles");
  const existing = profiles.find((profile) => profile.name === PROFILE_NAME);
  if (existing) return existing;
  return voiceboxJson("/profiles", {
    method: "POST",
    body: JSON.stringify({
      name: PROFILE_NAME,
      description: "Narration profile created by voiceover-video-starter.",
      language: "en",
      voice_type: "designed",
      design_prompt: PROFILE_DESIGN_PROMPT,
      default_engine: ENGINE
    })
  });
}

async function ensureChatterboxModel() {
  const status = await voiceboxJson("/models/status", { timeout: 60000 });
  const target = status.models.find((model) => model.model_name === MODEL_NAME);
  if (!target) throw new Error(`Voicebox did not report the ${MODEL_NAME} model.`);
  if (target.downloaded && target.loaded) return;

  await voiceboxJson("/models/download", {
    method: "POST",
    timeout: 60000,
    body: JSON.stringify({ model_name: MODEL_NAME })
  });

  const deadline = Date.now() + 10 * 60 * 1000;
  while (Date.now() < deadline) {
    await new Promise((resolveWait) => setTimeout(resolveWait, 2000));
    const currentStatus = await voiceboxJson("/models/status", { timeout: 60000 });
    const current = currentStatus.models.find((model) => model.model_name === MODEL_NAME);
    if (current?.downloaded && current?.loaded) return;
  }
  throw new Error(`Timed out waiting for Voicebox to load ${MODEL_NAME}.`);
}

async function generateVoicebox(profile, text, destination) {
  const source = `${destination}.source.wav`;
  const response = await fetch(`${VOICEBOX_API_BASE}/generate/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      profile_id: profile.id,
      text,
      language: "en",
      engine: ENGINE,
      instruct: GENERATION_INSTRUCT,
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
const profile = await voiceboxProfile();
await ensureChatterboxModel();

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
      await generateVoicebox(profile, speech, path);
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
  provider: "voicebox",
  engine: ENGINE,
  model: MODEL_NAME,
  profile: { id: profile.id, name: profile.name },
  audioFile: relativeToRoot(finalAudio),
  sentenceGapSeconds: project.sentenceGapSeconds,
  slideGapSeconds: project.slideGapSeconds,
  slides
};
writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

console.log(
  JSON.stringify(
    {
      provider: "voicebox",
      engine: ENGINE,
      model: MODEL_NAME,
      output: relativeToRoot(finalAudio),
      durationSeconds: Number(durationSeconds(finalAudio).toFixed(3)),
      manifest: relativeToRoot(manifestPath),
      clips: basename(clipDirectory)
    },
    null,
    2
  )
);
