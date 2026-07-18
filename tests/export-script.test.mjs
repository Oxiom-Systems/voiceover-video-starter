import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { scenes } from "../src/scenes.js";

test("script export contains every scene, narration, and source support", () => {
  execFileSync(process.execPath, ["scripts/export-script.mjs"], { cwd: process.cwd(), stdio: "pipe" });
  const markdown = readFileSync("output/starter-story/starter-story-script.md", "utf8");

  for (const scene of scenes) {
    assert.match(markdown, new RegExp(`## Scene \\d+ — ${scene.title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`));
    assert.ok(markdown.includes(scene.voiceover));
    for (const source of Array.isArray(scene.sourceSupport) ? scene.sourceSupport : [scene.sourceSupport]) {
      assert.ok(markdown.includes(source));
    }
  }
  assert.match(markdown, /Narration words:/);
  assert.match(markdown, /Estimated spoken duration:/);
});
