# Voiceover Video Starter

Create narrated MP4 videos and clean slideshow-only MP4s from the same web-native scene source. The starter keeps visible slide copy separate from narration, times slides to sentence-level audio, captures frames with Playwright, renders with FFmpeg, and emits SRT/VTT captions.

It is designed to work equally well with Codex, Claude Code, ordinary terminal workflows, and Git clients such as GitX.

## What you get

- A responsive HTML slideshow with keyboard navigation.
- A small, readable JavaScript scene contract.
- Slideshow-only rendering with no TTS service required.
- Voicebox narration using Chatterbox Turbo as the canonical speech engine.
- British female and American male Chatterbox profile recipes.
- Reusable prompts for source analysis, script writing, and HTML5 slideshow creation.
- A reviewable Markdown script export before speech generation.
- Sentence-timed WAV assembly, H.264/AAC MP4 output, SRT/VTT captions, rendered frames, and a contact sheet.
- `AGENTS.md`, `CLAUDE.md`, and a portable video-production skill for agent-assisted work.
- A CI workflow that verifies the offline slideshow path.

## Quick start

Prerequisites: Node.js 20 or newer and FFmpeg. The commands below install the browser used for rendering.

```bash
git clone https://github.com/Oxiom-Systems/voiceover-video-starter.git
cd voiceover-video-starter
npm install
npm run setup
npm run check:prereqs
npm run script
npm run preview
```

Open the printed local URL. Use the arrow keys or on-screen controls to review the slides.

Render an MP4 immediately, without narration:

```bash
npm run render:slideshow
npm run verify:slideshow
```

The result is written to `output/starter-story/starter-story-slideshow.mp4`.

## Add narration

Narration requires a local Voicebox server with Chatterbox Turbo. Choose a voice profile:

```bash
cp voices/british-female.env.example .env
# or: cp voices/american-male.env.example .env
```

`cp .env.example .env` also selects the British female recipe.

Start Voicebox using your installation. For the macOS app, one local example is:

```bash
/Applications/Voicebox.app/Contents/MacOS/voicebox-server --data-dir "$PWD/.voicebox-data"
```

In another terminal, generate and render the narrated video:

```bash
npm run check:prereqs
npm run voiceover
npm run render
npm run verify
```

The builder accepts only Chatterbox engines, ensures the selected model is downloaded and loaded, then creates or reuses the configured Voicebox profile. Designed-profile recipes describe a voice but do not guarantee the same generated identity on separate Voicebox data stores. See [voices/README.md](voices/README.md) and [docs/voicebox-chatterbox.md](docs/voicebox-chatterbox.md) for details.

## Edit the story

Most projects only need three edits:

1. Update deck metadata and scenes in `src/scenes.js`.
2. Adjust the palette and layouts in `src/styles.css`.
3. Change the slug or video dimensions in `project.config.mjs`.

Each scene keeps short on-screen copy separate from the spoken script:

```js
{
  kicker: "The problem",
  title: "Important ideas deserve a clear story.",
  body: "Keep the slide concise. Let the narration carry nuance.",
  voiceover: "This longer paragraph is spoken and used to build captions.",
  sourceSupport: ["inputs/approved-brief.md"],
  durationMs: 8000,
  visual: { type: "steps", items: ["Write", "Narrate", "Render"] }
}
```

Use [docs/story-script-slides.md](docs/story-script-slides.md) for the complete source-to-story method and [prompts/create-video.md](prompts/create-video.md) for ready-to-use Claude Code and Codex prompts. Run `npm run script` at any time to export a review copy to `output/<slug>/<slug>-script.md`; continue editing `src/scenes.js` as the source of truth.

## Use it with an agent

Codex reads `AGENTS.md`; Claude Code reads `CLAUDE.md`. Both point to the same source files, commands, safety rules, and verification standard. A useful first request is:

> Read the repository instructions and `skills/video-voiceover/SKILL.md`. Replace the starter story with a seven-scene explainer based only on the source material in `inputs/`, preview it, render it, and verify the final MP4.

Agents should preserve source inputs, keep claims defensible, and inspect real rendered frames before declaring the video complete.

## Output contract

A narrated run produces:

```text
output/<slug>/
  <slug>-script.md
  <slug>.mp4
  <slug>-captions.srt
  <slug>-captions.vtt
  <slug>-voiceover.wav
  voiceover-manifest.json
  frames/
  contact-sheet.png
```

Generated media and local secrets are ignored by Git.

## Origin and license

This starter generalizes production patterns used for Oxiom Systems and DriveSaver videos without including client content, proprietary assets, or credentials. It is released under the [MIT License](LICENSE).
