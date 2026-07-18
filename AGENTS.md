# Repository instructions for coding agents

## Goal

Turn supplied source material into a verified narrated MP4 or slideshow MP4. Create the actual artifact when the required inputs and local tools are available.

## Read first

1. Read `skills/video-voiceover/SKILL.md`.
2. Read the user's source material before drafting scenes.
3. Inspect `src/scenes.js`, `project.config.mjs`, and the relevant docs.

## Source of truth

- `src/scenes.js`: deck metadata, visible copy, narration, visual type, and fallback duration.
- `src/index.html`, `src/player.js`, `src/styles.css`: browser-visible slideshow.
- `project.config.mjs`: paths, dimensions, timing gaps, and speech replacements.
- `output/`: generated artifacts; never treat generated output as editable source.

## Standard workflow

```bash
npm install
npm run setup
npm run check
npm run preview
npm run render:slideshow
npm run verify:slideshow
```

For narration, configure `.env`, then run:

```bash
npm run voiceover
npm run render
npm run verify
```

## Quality and safety

- Preserve source files. Put user-provided material in `inputs/` and derived visual assets in `src/assets/`.
- Do not invent claims, results, quotations, credentials, or citations.
- Keep visible slide copy short; use narration for nuance.
- Never commit `.env`, generated audio/video, source recordings, or secrets.
- Do not reuse a person's voice without their permission.
- After rendering, run the matching verification command and inspect `contact-sheet.png` plus full-size opening, text-heavy, and closing frames.
- Report separately what was edited, rendered, technically verified, and visually inspected.

## Compatibility

These instructions are canonical for Codex and other `AGENTS.md` readers. `CLAUDE.md` directs Claude Code to the same workflow. Keep both agent surfaces aligned when changing commands or file paths.
