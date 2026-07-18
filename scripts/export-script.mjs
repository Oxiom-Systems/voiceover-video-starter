import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { loadProject, relativeToRoot } from "./lib/project.mjs";

const project = await loadProject();
mkdirSync(project.outputDirectory, { recursive: true });

function countWords(text) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function visualDescription(visual) {
  if (!visual) return "Default visual";
  if (typeof visual === "string") return visual;
  const { type = "default", ...details } = visual;
  const detailText = Object.keys(details).length > 0 ? ` — ${JSON.stringify(details)}` : "";
  return `${type}${detailText}`;
}

function sourceDescription(sourceSupport) {
  if (sourceSupport === undefined) return "Not recorded — verify material claims before narration.";
  return (Array.isArray(sourceSupport) ? sourceSupport : [sourceSupport]).join("; ");
}

const words = project.scenes.reduce((total, scene) => total + countWords(scene.voiceover), 0);
const estimatedMinutes = words / 145;
const lines = [
  `# ${project.deck.title ?? project.slug} — Voiceover Script`,
  "",
  `- **Project:** ${project.deck.brand ?? "Untitled project"}`,
  `- **Scenes:** ${project.scenes.length}`,
  `- **Narration words:** ${words}`,
  `- **Estimated spoken duration:** ${estimatedMinutes.toFixed(1)} minutes at 145 words per minute`,
  "",
  "> This is a review export. Edit `src/scenes.js`, then run `npm run script` again.",
  ""
];

for (const [index, scene] of project.scenes.entries()) {
  lines.push(
    `## Scene ${index + 1} — ${scene.title}`,
    "",
    "### On screen",
    "",
    `- **Kicker:** ${scene.kicker}`,
    `- **Title:** ${scene.title}`,
    `- **Body:** ${scene.body}`,
    "",
    "### Narration",
    "",
    scene.voiceover.trim(),
    "",
    "### Production notes",
    "",
    `- **Visual:** ${visualDescription(scene.visual)}`,
    `- **Source support:** ${sourceDescription(scene.sourceSupport)}`,
    `- **Slideshow fallback:** ${(scene.durationMs / 1000).toFixed(1)} seconds`,
    ""
  );
}

const destination = join(project.outputDirectory, `${project.slug}-script.md`);
writeFileSync(destination, `${lines.join("\n").trim()}\n`);
console.log(
  JSON.stringify(
    {
      output: relativeToRoot(destination),
      scenes: project.scenes.length,
      narrationWords: words,
      estimatedMinutesAt145Wpm: Number(estimatedMinutes.toFixed(2))
    },
    null,
    2
  )
);
