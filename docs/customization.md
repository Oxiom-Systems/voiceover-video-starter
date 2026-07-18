# Customization

## Scene contract

Edit `src/scenes.js`. The browser and build scripts both import this module, so it is the single story source.

For a new story, start with `templates/story-brief.md` and follow `docs/story-script-slides.md`. `prompts/create-video.md` contains complete and staged agent prompts.

Required fields:

- `kicker`: short section label.
- `title`: primary on-screen statement.
- `body`: one concise supporting thought.
- `voiceover`: natural spoken copy.
- `sourceSupport`: optional source path or array of source paths supporting material claims.
- `durationMs`: slideshow-only duration and interactive autoplay fallback.
- `visual`: visual type and its data.

Built-in visual types are `signal`, `steps`, `comparison`, `quote`, `image`, and `finish`. Unknown types fall back to the `signal` visual.

For an image visual, put a derived image in `src/assets/` and use:

```js
visual: {
  type: "image",
  src: "./assets/example.png",
  alt: "Description of the image"
}
```

Do not overwrite source images. Keep originals in an ignored `inputs/` folder and write crops or normalized copies to `src/assets/`.

Image scenes must use an existing local repository asset. Missing, remote, or repository-escaping image paths fail validation rather than producing an apparently successful frame with a broken image.

## Project settings

Edit `project.config.mjs` to change the output slug, paths, frame dimensions, frame rate, silence gaps, sample rate, or pronunciation replacements.

The default is 1920 by 1080 at 30 fps. Use exact values in the config rather than relying on browser scaling.

## Timing

Narrated videos use measured sentence durations from `voiceover-manifest.json`. Slideshow-only videos use `durationMs` from each scene.

After changing narration, rebuild it before rendering so cached timings cannot drift from the spoken content.

Run `npm run script` to export a reviewable Markdown version before generating speech. The file in `output/` is generated; make corrections in `src/scenes.js` and export it again.

## Visual verification

Every render writes full-size frames and `contact-sheet.png`. Inspect the contact sheet first, then inspect the opening, most text-heavy, and closing frames at full size.
