# Customization

## Scene contract

Edit `src/scenes.js`. The browser and build scripts both import this module, so it is the single story source.

Required fields:

- `kicker`: short section label.
- `title`: primary on-screen statement.
- `body`: one concise supporting thought.
- `voiceover`: natural spoken copy.
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

## Project settings

Edit `project.config.mjs` to change the output slug, paths, frame dimensions, frame rate, silence gaps, sample rate, or pronunciation replacements.

The default is 1920 by 1080 at 30 fps. Use exact values in the config rather than relying on browser scaling.

## Timing

Narrated videos use measured sentence durations from `voiceover-manifest.json`. Slideshow-only videos use `durationMs` from each scene.

After changing narration, rebuild it before rendering so cached timings cannot drift from the spoken content.

## Visual verification

Every render writes full-size frames and `contact-sheet.png`. Inspect the contact sheet first, then inspect the opening, most text-heavy, and closing frames at full size.
