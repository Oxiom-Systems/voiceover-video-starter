---
name: video-voiceover
description: Create and verify narrated videos or slideshow MP4s from source material using this repository.
---

# Video voiceover

## Rules

1. Read the supplied source material before drafting.
2. Preserve originals and derive visual assets into `src/assets/`.
3. Keep claims defensible and never invent results or quotations.
4. Keep on-screen copy concise and narration natural.
5. Build the requested artifact when local prerequisites are available.
6. Verify technical streams and inspect actual frames before reporting completion.

## Workflow

1. Inspect the inputs and current `src/scenes.js`.
2. Plan roughly six to ten focused scenes unless the content needs a different length.
3. Update deck metadata, scene copy, narration, visuals, and fallback durations.
4. Run `npm run check` and preview with `npm run preview`.
5. For a silent deck, run `npm run render:slideshow` and `npm run verify:slideshow`.
6. For narration, configure `.env`, start Voicebox with Chatterbox Turbo, then run `npm run voiceover`, `npm run render`, and `npm run verify`.
7. Inspect `contact-sheet.png` and full-size opening, text-heavy, and closing frames.
8. Report artifact paths and verification results.

## Boundaries

- Do not commit `.env`, `output/`, private inputs, or voice recordings.
- Use Voicebox with Chatterbox Turbo for narration; do not silently substitute another TTS provider.
- Do not present a slideshow-only render as a narrated deliverable.
- Do not present technical verification as visual inspection.
- State exactly what prerequisite is missing if narration cannot be generated.
