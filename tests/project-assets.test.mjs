import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { validateLocalImageSource } from "../scripts/lib/project.mjs";

test("local image validation accepts existing repository assets", () => {
  const root = mkdtempSync(join(tmpdir(), "voiceover-assets-"));
  const pageFile = join(root, "src", "index.html");
  const imageFile = join(root, "src", "assets", "example.png");
  mkdirSync(join(root, "src", "assets"), { recursive: true });
  writeFileSync(pageFile, "<!doctype html>");
  writeFileSync(imageFile, "image fixture");

  assert.equal(validateLocalImageSource("./assets/example.png", { root, pageFile }), imageFile);
  assert.equal(validateLocalImageSource("/src/assets/example.png", { root, pageFile }), imageFile);
});

test("local image validation rejects missing, remote, and escaping assets", () => {
  const root = mkdtempSync(join(tmpdir(), "voiceover-assets-"));
  const pageFile = join(root, "src", "index.html");
  mkdirSync(join(root, "src"), { recursive: true });
  writeFileSync(pageFile, "<!doctype html>");

  assert.throws(
    () => validateLocalImageSource("./assets/missing.png", { root, pageFile, label: "Test image" }),
    /Test image is missing/
  );
  assert.throws(
    () => validateLocalImageSource("https://example.com/image.png", { root, pageFile, label: "Test image" }),
    /local repository asset/
  );
  assert.throws(
    () => validateLocalImageSource("../../outside.png", { root, pageFile, label: "Test image" }),
    /stay inside the repository/
  );
});
