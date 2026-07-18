# Agent workflow

This repository exposes the same production contract to different coding agents:

- Codex and compatible tools discover `AGENTS.md`.
- Claude Code discovers `CLAUDE.md`, which points to the same canonical instructions.
- `skills/video-voiceover/SKILL.md` contains the task-specific creation and verification workflow.
- GitX and other Git clients require no special integration because all source and instructions are ordinary tracked files.

A good agent task names the source folder, expected number of scenes, target audience, desired tone, narration provider, and whether a narrated or slideshow-only MP4 is required.

The agent should report four states separately: source edited, slideshow rendered, narration rendered, and final artifact visually verified.
