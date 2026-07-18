import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { chromium } from "playwright";
import { writeCaptions } from "./lib/captions.mjs";
import { loadProject, relativeToRoot, ROOT } from "./lib/project.mjs";
import { run } from "./lib/process.mjs";
import { startStaticServer } from "./lib/server.mjs";

const slideshowOnly = process.argv.includes("--slideshow");
const project = await loadProject();
const modeSuffix = slideshowOnly ? "-slideshow" : "";
const frameDirectory = join(project.outputDirectory, `frames${modeSuffix}`);
const manifestPath = join(project.outputDirectory, "voiceover-manifest.json");
const outputVideo = join(project.outputDirectory, `${project.slug}${modeSuffix}.mp4`);
const outputSrt = join(project.outputDirectory, `${project.slug}-captions.srt`);
const outputVtt = join(project.outputDirectory, `${project.slug}-captions.vtt`);
const contactSheet = join(project.outputDirectory, `contact-sheet${modeSuffix}.png`);
const renderManifestPath = join(project.outputDirectory, `render-manifest${modeSuffix}.json`);
mkdirSync(frameDirectory, { recursive: true });

let voiceoverManifest = null;
let audioPath = null;
if (!slideshowOnly) {
  if (!existsSync(manifestPath)) {
    throw new Error("Narration manifest is missing. Run npm run voiceover, or use npm run render:slideshow.");
  }
  voiceoverManifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  if (voiceoverManifest.slides.length !== project.scenes.length) {
    throw new Error("The narration manifest scene count does not match src/scenes.js. Rebuild the voiceover.");
  }
  audioPath = resolve(ROOT, voiceoverManifest.audioFile);
  if (!existsSync(audioPath)) throw new Error(`Narration audio is missing: ${voiceoverManifest.audioFile}`);
}

function narratedDuration(slide) {
  const speech = slide.sentences.reduce((total, sentence) => total + sentence.durationSeconds, 0);
  const sentenceGaps = Math.max(0, slide.sentences.length - 1) * voiceoverManifest.sentenceGapSeconds;
  const slideGap = slide.slide < voiceoverManifest.slides.length ? voiceoverManifest.slideGapSeconds : 0;
  return speech + sentenceGaps + slideGap;
}

const durations = slideshowOnly
  ? project.scenes.map((scene) => scene.durationMs / 1000)
  : voiceoverManifest.slides.map(narratedDuration);
const targetDuration = durations.reduce((total, duration) => total + duration, 0);

const { server, url } = await startStaticServer({ pageFile: project.pageFile });
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: project.width, height: project.height }, deviceScaleFactor: 1 });
  for (let index = 0; index < project.scenes.length; index += 1) {
    const sceneNumber = index + 1;
    const framePath = join(frameDirectory, `scene-${String(sceneNumber).padStart(2, "0")}.png`);
    await page.goto(`${url}?record=1&clean=1&scene=${sceneNumber}`, { waitUntil: "networkidle" });
    await page.waitForFunction(() => window.__SLIDES_READY__ === true && window.__ACTIVE_SCENE__ > 0);
    await page.screenshot({ path: framePath });
  }
} finally {
  if (browser) await browser.close();
  await new Promise((resolveClose) => server.close(resolveClose));
}

const frames = readdirSync(frameDirectory)
  .filter((name) => /^scene-\d+\.png$/.test(name))
  .sort()
  .map((name) => join(frameDirectory, name));
if (frames.length !== project.scenes.length) throw new Error("Rendered frame count does not match the scene count.");

const videoInputs = [];
for (const [index, frame] of frames.entries()) {
  videoInputs.push("-loop", "1", "-t", durations[index].toFixed(3), "-i", frame);
}
const audioInputIndex = frames.length;
if (audioPath) videoInputs.push("-i", audioPath);
const scaleFilters = frames
  .map(
    (_, index) =>
      `[${index}:v]scale=${project.width}:${project.height},format=yuv420p,setsar=1,fps=${project.framesPerSecond}[v${index}]`
  )
  .join(";");
const concatInputs = frames.map((_, index) => `[v${index}]`).join("");
const filter = `${scaleFilters};${concatInputs}concat=n=${frames.length}:v=1:a=0[v]`;
const ffmpegArgs = [
  "-hide_banner",
  "-loglevel",
  "error",
  "-y",
  ...videoInputs,
  "-filter_complex",
  filter,
  "-map",
  "[v]"
];
if (audioPath) ffmpegArgs.push("-map", `${audioInputIndex}:a`);
ffmpegArgs.push(
  "-c:v",
  "libx264",
  "-profile:v",
  "high",
  "-crf",
  "18",
  "-preset",
  "medium",
  "-pix_fmt",
  "yuv420p"
);
if (audioPath) ffmpegArgs.push("-c:a", "aac", "-b:a", "192k");
else ffmpegArgs.push("-an");
ffmpegArgs.push("-t", targetDuration.toFixed(3), "-movflags", "+faststart", outputVideo);
run("ffmpeg", ffmpegArgs);

let captionCount = 0;
if (voiceoverManifest) captionCount = writeCaptions(voiceoverManifest, outputSrt, outputVtt);

const contactInputs = frames.flatMap((frame) => ["-i", frame]);
const cellWidth = 480;
const cellHeight = 270;
const columns = Math.min(3, frames.length);
const layouts = frames
  .map((_, index) => `${(index % columns) * cellWidth}_${Math.floor(index / columns) * cellHeight}`)
  .join("|");
const contactScales = frames.map((_, index) => `[${index}:v]scale=${cellWidth}:${cellHeight},setsar=1[c${index}]`).join(";");
const contactStreams = frames.map((_, index) => `[c${index}]`).join("");
run("ffmpeg", [
  "-hide_banner",
  "-loglevel",
  "error",
  "-y",
  ...contactInputs,
  "-filter_complex",
  `${contactScales};${contactStreams}xstack=inputs=${frames.length}:layout=${layouts}:fill=white[grid]`,
  "-map",
  "[grid]",
  "-frames:v",
  "1",
  contactSheet
]);

const renderManifest = {
  mode: slideshowOnly ? "slideshow" : "narrated",
  output: relativeToRoot(outputVideo),
  width: project.width,
  height: project.height,
  framesPerSecond: project.framesPerSecond,
  durationSeconds: Number(targetDuration.toFixed(3)),
  sceneCount: frames.length,
  frames: relativeToRoot(frameDirectory),
  contactSheet: relativeToRoot(contactSheet),
  captions: voiceoverManifest
    ? { srt: relativeToRoot(outputSrt), vtt: relativeToRoot(outputVtt), entries: captionCount }
    : null
};
writeFileSync(renderManifestPath, `${JSON.stringify(renderManifest, null, 2)}\n`);
console.log(JSON.stringify(renderManifest, null, 2));
