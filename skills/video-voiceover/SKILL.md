---
name: video-voiceover
description: Turn supplied source material into a grounded script, an HTML5 slideshow, Voicebox/Chatterbox narration, captions, and a verified MP4 using this repository.
---

# Video voiceover

Create the requested artifact when the necessary local tools are available. A plan, script, preview, slideshow-only render, and narrated video are different completion states; report them separately.

## Source and story rules

1. Read all supplied source material before drafting.
2. Preserve originals in `inputs/` and put derived visual assets in `src/assets/`.
3. Do not invent claims, results, quotations, customer details, credentials, or citations.
4. Identify unsupported material claims and hold them for verification.
5. Keep on-screen copy concise while making the narration a complete natural script.
6. Use `src/scenes.js` as the editable source for both the browser presentation and narration.

## Creation workflow

### 1. Ground a story brief

For a new video, copy [../../templates/story-brief.md](../../templates/story-brief.md) to `inputs/<slug>-story-brief.md` and record:

- Audience and intended outcome.
- Target duration and tone.
- Source authority and claim limits.
- Opening problem, central message, supporting ideas, and ending.
- Available visuals and brand constraints.
- Selected approved voice recipe.

Read [../../docs/story-script-slides.md](../../docs/story-script-slides.md) for the full method. Do not use the brief to fill evidence gaps with plausible-sounding material.

### 2. Write the spoken script and scene plan

Plan roughly six to ten focused scenes unless the source needs a different structure. Give each scene one narrative job.

For each object in `src/scenes.js`, write:

- `kicker`: a short section label.
- `title`: a concise primary statement, usually 3-10 words.
- `body`: one readable supporting thought.
- `voiceover`: natural spoken copy that advances the full script.
- `sourceSupport`: source paths supporting material claims.
- `durationMs`: slideshow-only and interactive fallback timing.
- `visual`: one useful visual treatment and its data.

The narration must remain coherent when read without the slides. Do not simply read the visible copy aloud. Prefer two to four short spoken sentences per scene, direct language, and explicit pronunciation replacements for abbreviations.

Run:

```bash
npm run check
npm run script
```

Review `output/<slug>/<slug>-script.md` for evidence, flow, repetition, pronunciation, word count, and estimated duration. Edit `src/scenes.js`, never the generated export.

### 3. Create the HTML5 slideshow

Build or adapt:

- `src/index.html`: semantic page structure.
- `src/player.js`: scene rendering and navigation.
- `src/styles.css`: layout, responsive behavior, capture-safe styling.

The slideshow must:

- Use the same `src/scenes.js` content as the narration pipeline.
- Work with local assets and without a CDN dependency.
- Remain legible at the exact dimensions in `project.config.mjs`.
- Support keyboard and visible navigation for review.
- Select a scene with `?scene=N`.
- Provide deterministic capture with `?record=1&clean=1`.
- Set `window.__SLIDES_READY__` and `window.__ACTIVE_SCENE__` after rendering.
- Use safe frame margins, readable contrast, and meaningful image alt text.

Preview with `npm run preview`. Inspect the actual browser page before rendering.

### 4. Select narration

Voicebox with Chatterbox Turbo is the canonical narration path. Two portable recipes are included:

- [../../voices/british-female.env.example](../../voices/british-female.env.example)
- [../../voices/american-male.env.example](../../voices/american-male.env.example)

Copy the chosen recipe to `.env`, or use an approved local Voicebox profile. Designed-profile prompts communicate tone but do not guarantee an identical voice identity across separate Voicebox data stores. Exact voice reuse requires a permitted local reference/profile; never commit that recording or profile id.

Do not silently substitute an operating-system voice or paid cloud TTS provider. If Voicebox or Chatterbox is unavailable, state the missing prerequisite and continue only with artifacts that do not require it.

### 5. Generate, render, and verify

For a narrated video:

```bash
npm run voiceover
npm run render
npm run verify
```

For an HTML5 slideshow-only MP4:

```bash
npm run render:slideshow
npm run verify:slideshow
```

The narration builder generates sentence-level audio and measured timings. The renderer captures the HTML5 scenes, creates H.264/AAC output, and writes SRT/VTT captions for narrated videos.

Inspect `contact-sheet.png` and full-size opening, most text-heavy, and closing frames. Technical verification is not visual inspection.

## Prompt pack

Use [../../prompts/create-video.md](../../prompts/create-video.md) when the user wants reusable prompting. It includes:

- A complete source-to-final-video prompt.
- A script and scene-writing prompt.
- An HTML5 slideshow production prompt.

Replace the bracketed audience, outcome, source path, duration, scene count, tone, and voice values. Keep the evidence and verification requirements intact.

## Completion report

Report these independently:

- Story brief and source files used.
- Script/scene source edited.
- Markdown script exported and reviewed.
- HTML5 slideshow previewed.
- Slideshow-only MP4 rendered and verified, if requested.
- Narration generated with the named profile and engine.
- Narrated MP4 technically verified.
- Contact sheet and full-size frames visually inspected.

## Boundaries

- Do not commit `.env`, `output/`, private inputs, generated media, source recordings, or Voicebox profile identifiers.
- Do not present slideshow-only output as narrated output.
- Do not claim visual inspection after running only command-line checks.
- Do not reuse a person's voice without permission.
