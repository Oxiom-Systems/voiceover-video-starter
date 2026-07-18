import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { loadProject, relativeToRoot } from "./lib/project.mjs";
import { run } from "./lib/process.mjs";

const slideshowOnly = process.argv.includes("--slideshow");
const project = await loadProject();
const suffix = slideshowOnly ? "-slideshow" : "";
const videoPath = join(project.outputDirectory, `${project.slug}${suffix}.mp4`);
const frameDirectory = join(project.outputDirectory, `frames${suffix}`);
const contactSheet = join(project.outputDirectory, `contact-sheet${suffix}.png`);
const srtPath = join(project.outputDirectory, `${project.slug}-captions.srt`);
const vttPath = join(project.outputDirectory, `${project.slug}-captions.vtt`);

if (!existsSync(videoPath)) throw new Error(`Video is missing: ${relativeToRoot(videoPath)}`);
const probe = JSON.parse(
  run(
    "ffprobe",
    ["-v", "error", "-show_entries", "format=duration,size", "-show_streams", "-of", "json", videoPath],
    { stdio: "pipe" }
  )
);
const video = probe.streams.find((stream) => stream.codec_type === "video");
const audio = probe.streams.find((stream) => stream.codec_type === "audio");
const failures = [];
if (!video) failures.push("missing video stream");
if (video?.codec_name !== "h264") failures.push(`expected H.264 video, found ${video?.codec_name ?? "none"}`);
if (video?.width !== project.width || video?.height !== project.height) {
  failures.push(`expected ${project.width}x${project.height}, found ${video?.width}x${video?.height}`);
}
if (slideshowOnly && audio) failures.push("slideshow-only video unexpectedly contains audio");
if (!slideshowOnly && !audio) failures.push("narrated video is missing audio");
if (!slideshowOnly && audio?.codec_name !== "aac") failures.push(`expected AAC audio, found ${audio?.codec_name ?? "none"}`);
if (!Number.isFinite(Number.parseFloat(probe.format.duration)) || Number.parseFloat(probe.format.duration) <= 0) {
  failures.push("video duration is invalid");
}
const frameCount = existsSync(frameDirectory)
  ? readdirSync(frameDirectory).filter((name) => /^scene-\d+\.png$/.test(name)).length
  : 0;
if (frameCount !== project.scenes.length) failures.push(`expected ${project.scenes.length} rendered frames, found ${frameCount}`);
if (!existsSync(contactSheet)) failures.push("contact sheet is missing");
if (!slideshowOnly && (!existsSync(srtPath) || !existsSync(vttPath))) failures.push("caption files are missing");
if (!slideshowOnly) {
  const manifest = JSON.parse(readFileSync(join(project.outputDirectory, "voiceover-manifest.json"), "utf8"));
  if (manifest.slides.length !== project.scenes.length) failures.push("voiceover manifest scene count is stale");
}

const summary = {
  ok: failures.length === 0,
  file: relativeToRoot(videoPath),
  mode: slideshowOnly ? "slideshow" : "narrated",
  durationSeconds: Number(Number.parseFloat(probe.format.duration).toFixed(3)),
  sizeBytes: Number.parseInt(probe.format.size, 10),
  video: video ? { codec: video.codec_name, width: video.width, height: video.height, frameRate: video.avg_frame_rate } : null,
  audio: audio ? { codec: audio.codec_name, sampleRate: audio.sample_rate, channels: audio.channels } : null,
  frames: frameCount,
  contactSheet: existsSync(contactSheet) ? relativeToRoot(contactSheet) : null,
  failures
};
console.log(JSON.stringify(summary, null, 2));
if (failures.length > 0) process.exitCode = 1;
