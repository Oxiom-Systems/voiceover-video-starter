# Agent prompts for creating the script and HTML5 slideshow

These prompts work with Claude Code, Codex, or another coding agent operating inside this repository. Replace bracketed values and remove requirements that do not apply.

## Complete production prompt

```text
Read AGENTS.md, skills/video-voiceover/SKILL.md, and all source material in [INPUT PATH].

Create a [TARGET DURATION] narrated explainer for [AUDIENCE]. The viewer should finish understanding or doing: [OUTCOME]. Use a [TONE] tone and the [british-female / american-male / approved local] Voicebox Chatterbox Turbo profile.

First, copy templates/story-brief.md to inputs/<slug>-story-brief.md and complete a grounded brief. Treat the supplied source as the authority. List any material claim that is missing support; do not invent facts, results, quotations, customer names, or citations.

Then write the complete spoken script and the concise on-screen copy as approximately [SCENE COUNT, usually 6-10] scenes in src/scenes.js. Give every scene one narrative job and record the supporting source paths in sourceSupport. Keep visible text readable at a glance and let the narration carry context and nuance. Aim for natural spoken sentences and a total word count appropriate to the target duration.

Build or adapt the self-contained HTML5 slideshow in src/index.html, src/player.js, and src/styles.css. Use local assets, the configured viewport, keyboard navigation, ?scene=N selection, ?record=1&clean=1 capture mode, and the existing render-ready window hooks. Preserve supplied source files; put derived assets in src/assets/.

Run npm run check and npm run script. Review the exported Markdown script for story flow, unsupported claims, repetition, pronunciation, and estimated duration. Preview the HTML slideshow and correct clipping, weak contrast, crowded copy, failed images, or inconsistent visual hierarchy.

If Voicebox and Chatterbox Turbo are available, generate narration, render the narrated MP4, run verification, and visually inspect the contact sheet plus full-size opening, most text-heavy, and closing frames. If narration is unavailable, render and verify the slideshow-only MP4 and state the missing prerequisite precisely. Report source edits, script export, slideshow render, narration render, technical verification, and visual inspection as separate states.
```

## Script and scene prompt

```text
Read the supplied source material in [INPUT PATH] and docs/story-script-slides.md. Copy templates/story-brief.md to inputs/<slug>-story-brief.md and complete a source-grounded brief, then replace the starter content in src/scenes.js.

Write [SCENE COUNT] scenes for [AUDIENCE] with this outcome: [OUTCOME]. For every scene provide a short kicker, a 3-10 word title, one concise on-screen body statement, a natural voiceover paragraph, sourceSupport paths for material claims, a useful visual direction using the supported visual types, and a realistic slideshow fallback duration.

The voiceover must form one coherent script when read without the slides. The on-screen copy must support it without repeating whole sentences. Do not invent unsupported claims. Run npm run check and npm run script, then report the scene count, narration word count, estimated duration, and any claims still held for verification.
```

## HTML5 slideshow prompt

```text
Read AGENTS.md, docs/story-script-slides.md, project.config.mjs, and src/scenes.js. Build or refine the HTML5 slideshow without changing factual meaning.

Keep the presentation self-contained and compatible with the existing Playwright renderer. It must support keyboard and visible controls, ?scene=N, capture mode through ?record=1&clean=1, and the existing render-ready window hooks. Use local assets only. Maintain readable contrast, a clear visual hierarchy, large type, safe frame margins, and one main visual idea per scene.

Run npm run check, render the slideshow-only MP4, verify it, and inspect the contact sheet plus full-size opening, most text-heavy, and closing frames. Correct visual problems before reporting completion.
```
