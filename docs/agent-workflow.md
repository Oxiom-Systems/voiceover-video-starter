# Agent workflow

This repository exposes the same production contract to different coding agents:

- Codex and compatible tools discover `AGENTS.md`.
- Claude Code discovers `CLAUDE.md`, which points to the same canonical instructions.
- `skills/video-voiceover/SKILL.md` contains the task-specific creation and verification workflow.
- GitX and other Git clients require no special integration because all source and instructions are ordinary tracked files.

A good agent task names the source folder, expected number of scenes, target audience, desired Voicebox profile or tone, and whether a narrated or slideshow-only MP4 is required.

For a new video, the agent should:

1. Ground a story brief in the supplied source.
2. Write the spoken script and concise on-screen copy together in `src/scenes.js`.
3. Run `npm run script` and review the exported Markdown before TTS.
4. Build and preview the HTML5 presentation from the same scenes.
5. Generate Voicebox/Chatterbox narration when available.
6. Render, verify, and inspect actual frames.

Ready-to-use prompts live in `prompts/create-video.md`. The agent should report source edited, script exported, slideshow rendered, narration rendered, technically verified, and visually inspected as separate states.
