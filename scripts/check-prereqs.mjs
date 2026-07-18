import { existsSync } from "node:fs";
import { chromium } from "playwright";
import { commandExists } from "./lib/process.mjs";
import { loadEnvironment } from "./lib/project.mjs";

loadEnvironment();
const nodeMajor = Number.parseInt(process.versions.node.split(".")[0], 10);
const voiceboxApiBase = (process.env.VOICEBOX_API_BASE ?? "http://127.0.0.1:8000").replace(/\/$/, "");
const engine = process.env.VOICEBOX_ENGINE ?? "chatterbox_turbo";
const modelNames = { chatterbox: "chatterbox-tts", chatterbox_turbo: "chatterbox-turbo" };
const modelName = modelNames[engine];
let voicebox = { reachable: false, modelReported: false, modelDownloaded: false, modelLoaded: false };
if (modelName) {
  try {
    const response = await fetch(`${voiceboxApiBase}/models/status`, { signal: AbortSignal.timeout(2500) });
    if (response.ok) {
      const status = await response.json();
      const model = status.models.find((candidate) => candidate.model_name === modelName);
      voicebox = {
        reachable: true,
        modelReported: Boolean(model),
        modelDownloaded: Boolean(model?.downloaded),
        modelLoaded: Boolean(model?.loaded)
      };
    }
  } catch {
    // The offline slideshow path remains available when Voicebox is stopped.
  }
}
const checks = {
  node20OrNewer: nodeMajor >= 20,
  ffmpeg: commandExists("ffmpeg"),
  ffprobe: commandExists("ffprobe"),
  playwrightChromium: existsSync(chromium.executablePath()),
  narration: {
    provider: "voicebox",
    apiBase: voiceboxApiBase,
    engine,
    chatterboxEngine: Boolean(modelName),
    ...voicebox
  }
};

console.log(JSON.stringify(checks, null, 2));
if (!checks.node20OrNewer || !checks.ffmpeg || !checks.ffprobe || !checks.playwrightChromium) {
  console.error("Missing a required slideshow/render prerequisite. Run npm install, npm run setup, and install FFmpeg.");
  process.exitCode = 1;
}
if (!modelName) {
  console.error("VOICEBOX_ENGINE must be 'chatterbox_turbo' or 'chatterbox'.");
  process.exitCode = 1;
}
if (!voicebox.reachable) {
  console.warn(`Voicebox is not reachable at ${voiceboxApiBase}. Start it before running npm run voiceover.`);
} else if (!voicebox.modelLoaded) {
  console.warn(`${modelName} is not loaded yet. npm run voiceover will ask Voicebox to download and load it.`);
}
