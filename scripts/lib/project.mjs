import { existsSync, readFileSync } from "node:fs";
import { dirname, isAbsolute, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import config from "../../project.config.mjs";

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

export function loadEnvironment() {
  const envPath = resolve(ROOT, ".env");
  if (!existsSync(envPath)) return;

  for (const rawLine of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const separator = line.indexOf("=");
    if (separator < 1) continue;
    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

function insideRoot(path) {
  return path === ROOT || path.startsWith(`${ROOT}${sep}`);
}

function insideDirectory(path, directory) {
  return path === directory || path.startsWith(`${directory}${sep}`);
}

function projectPath(value, label) {
  if (!value || typeof value !== "string") throw new Error(`${label} must be a non-empty string.`);
  const path = isAbsolute(value) ? resolve(value) : resolve(ROOT, value);
  if (!insideRoot(path)) throw new Error(`${label} must stay inside the repository.`);
  return path;
}

function positiveNumber(value, label) {
  if (!Number.isFinite(value) || value <= 0) throw new Error(`${label} must be a positive number.`);
  return value;
}

function validateSourceSupport(value, label) {
  if (value === undefined) return;
  const entries = Array.isArray(value) ? value : [value];
  if (entries.length === 0 || entries.some((entry) => typeof entry !== "string" || !entry.trim())) {
    throw new Error(`${label} must be a non-empty string or array of non-empty strings.`);
  }
}

export function validateLocalImageSource(src, { root = ROOT, pageFile, label = "Image" } = {}) {
  if (typeof src !== "string" || !src.trim()) throw new Error(`${label} requires a non-empty src.`);
  if (!pageFile) throw new Error(`${label} validation requires pageFile.`);
  if (/^[a-z][a-z0-9+.-]*:/i.test(src) || src.startsWith("//")) {
    throw new Error(`${label} must use a local repository asset.`);
  }
  const sourcePath = decodeURIComponent(src.split(/[?#]/, 1)[0]);
  const path = sourcePath.startsWith("/") ? resolve(root, `.${sourcePath}`) : resolve(dirname(pageFile), sourcePath);
  if (!insideDirectory(path, root)) throw new Error(`${label} must stay inside the repository.`);
  if (!existsSync(path)) throw new Error(`${label} is missing: ${src}`);
  return path;
}

export async function loadProject() {
  loadEnvironment();
  if (!/^[a-z0-9][a-z0-9-]*$/.test(config.slug)) {
    throw new Error("project.config.mjs slug must use lowercase letters, digits, and hyphens.");
  }

  const sceneFile = projectPath(config.sceneFile, "sceneFile");
  const pageFile = projectPath(config.pageFile, "pageFile");
  const outputDirectory = projectPath(config.outputDirectory, "outputDirectory");
  const module = await import(`${pathToFileURL(sceneFile).href}?v=${Date.now()}`);
  const scenes = module.scenes;
  const deck = module.deck ?? {};

  if (!Array.isArray(scenes) || scenes.length === 0) throw new Error("src/scenes.js must export a non-empty scenes array.");
  for (const [index, scene] of scenes.entries()) {
    for (const field of ["kicker", "title", "body", "voiceover"]) {
      if (typeof scene[field] !== "string" || !scene[field].trim()) {
        throw new Error(`Scene ${index + 1} requires a non-empty ${field}.`);
      }
    }
    validateSourceSupport(scene.sourceSupport, `Scene ${index + 1} sourceSupport`);
    if (scene.visual?.type === "image") {
      validateLocalImageSource(scene.visual.src, {
        pageFile,
        label: `Scene ${index + 1} image`
      });
    }
    positiveNumber(scene.durationMs, `Scene ${index + 1} durationMs`);
  }

  return {
    ...config,
    width: positiveNumber(config.width, "width"),
    height: positiveNumber(config.height, "height"),
    framesPerSecond: positiveNumber(config.framesPerSecond, "framesPerSecond"),
    sentenceGapSeconds: positiveNumber(config.sentenceGapSeconds, "sentenceGapSeconds"),
    slideGapSeconds: positiveNumber(config.slideGapSeconds, "slideGapSeconds"),
    audioSampleRate: positiveNumber(config.audioSampleRate, "audioSampleRate"),
    sceneFile,
    pageFile,
    outputDirectory,
    scenes,
    deck
  };
}

export function relativeToRoot(path) {
  return path.slice(ROOT.length + 1).split(sep).join("/");
}
