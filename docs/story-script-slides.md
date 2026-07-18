# From source material to script and HTML5 slides

The production method has three linked writing layers. Keep them separate even though they live in the same scene object.

1. **Story brief:** the audience, outcome, evidence, claim boundaries, sequence, and visual direction.
2. **Voiceover script:** natural spoken language that explains the story completely.
3. **On-screen copy:** short text that can be read while the narration continues.

Copy `templates/story-brief.md` to `inputs/<slug>-story-brief.md` when the request is more than a trivial edit. The ignored `inputs/` folder keeps working briefs and private source material out of Git by default. Read all supplied source material before completing the brief; it is not permission to invent missing facts.

## Script-writing method

Start with the ending: write one sentence describing what the viewer should understand or do. Then arrange six to ten scenes that earn that ending.

A reliable short-explainer sequence is:

1. Hook or original problem.
2. Why it matters to this audience.
3. What breaks in the current approach.
4. The proposed idea, product, or method.
5. The mechanism or workflow.
6. Evidence, standards, constraints, or differentiation.
7. Practical outcome.
8. Closing takeaway or call to action.

Use only the stages that fit the source. Tutorials may use task steps instead; research explainers may use question, gap, method, evidence, limits, and contribution.

For each scene:

- Give it one job and one main idea.
- Keep the title to roughly 3-10 words.
- Keep the body to one concise thought.
- Write two to four short spoken sentences where possible.
- Prefer direct sentences, concrete nouns, and natural transitions.
- Expand or replace abbreviations in `project.config.mjs` when TTS pronunciation needs help.
- Record supporting source paths in the optional `sourceSupport` scene field.
- Avoid unsupported superlatives, invented numbers, vague hype, and reading dense slide copy aloud word for word.

At roughly 145 spoken words per minute, a 60-second video needs about 130-155 words; a 90-second video needs about 195-230 words. Treat this as a planning estimate. Narrated timing ultimately comes from measured audio.

Run `npm run script` before generating speech. It exports `output/<slug>/<slug>-script.md` with the on-screen copy, narration, visual notes, word count, and estimated duration. Edit `src/scenes.js`, not the generated Markdown.

## HTML5 slideshow method

Use `src/scenes.js` as the story source and `src/index.html`, `src/player.js`, and `src/styles.css` as the web-native presentation layer.

The HTML slideshow must:

- Work from local files and assets without a CDN dependency.
- Remain legible at the exact viewport in `project.config.mjs`.
- Use generous safe margins and avoid text near frame edges.
- Provide keyboard and visible navigation for human review.
- Render a requested scene from `?scene=N`.
- Hide controls and animation for capture with `?record=1&clean=1`.
- Set `window.__SLIDES_READY__` and `window.__ACTIVE_SCENE__` only after the scene is render-ready.
- Use meaningful image `alt` text and retain readable contrast.

The browser preview and captured MP4 must use the same HTML and scene data. Do not create a separate screenshot-only deck that can drift from the reviewed page.

## Review passes

Review in this order:

1. **Evidence:** every factual claim traces to supplied or verified material.
2. **Story:** the sequence is coherent and each scene advances it.
3. **Speech:** the script sounds natural aloud and matches the requested tone.
4. **Screen:** visible text is concise and layouts remain readable.
5. **Render:** timing, streams, captions, and real frames are correct.

Use `prompts/create-video.md` for ready-to-run agent prompts that preserve this workflow.
