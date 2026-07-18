# Contributing

Contributions are welcome. Keep changes small, preserve the Voicebox/Chatterbox narration contract, and keep the slideshow path testable without a live speech service.

Before opening a pull request:

```bash
npm install
npm run setup
npm run check
npm run render:slideshow
npm run verify:slideshow
```

Do not commit `.env`, `output/`, private source material, voice samples, or generated client media. Explain any new external service, binary, or platform dependency in the pull request.
