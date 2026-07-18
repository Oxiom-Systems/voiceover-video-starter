import { existsSync } from "node:fs";
import { chromium } from "playwright";
import { commandExists } from "./lib/process.mjs";
import { loadEnvironment } from "./lib/project.mjs";

loadEnvironment();
const nodeMajor = Number.parseInt(process.versions.node.split(".")[0], 10);
const provider = process.env.TTS_PROVIDER ?? (process.platform === "darwin" ? "macos-say" : "voicebox");
const checks = {
  node20OrNewer: nodeMajor >= 20,
  ffmpeg: commandExists("ffmpeg"),
  ffprobe: commandExists("ffprobe"),
  playwrightChromium: existsSync(chromium.executablePath()),
  narrationProvider: provider,
  narrationProviderAvailable:
    provider === "macos-say" ? process.platform === "darwin" && commandExists("say") : provider === "voicebox"
};

console.log(JSON.stringify(checks, null, 2));
if (!checks.node20OrNewer || !checks.ffmpeg || !checks.ffprobe || !checks.playwrightChromium) {
  console.error("Missing a required slideshow/render prerequisite. Run npm install, npm run setup, and install FFmpeg.");
  process.exitCode = 1;
}
if (!checks.narrationProviderAvailable) {
  console.warn(`Narration provider '${provider}' is unavailable here. The slideshow-only path remains usable.`);
}
