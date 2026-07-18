# TTS providers

The narration builder intentionally supports local providers and does not require a paid API key.

## macOS `say`

Use the operating system's built-in voices:

```bash
TTS_PROVIDER=macos-say MACOS_SAY_VOICE=Daniel npm run voiceover
```

List installed voices with `say -v '?'`. The builder converts each generated AIFF clip to a 24 kHz mono WAV before measuring and concatenating it.

## Voicebox / Chatterbox

Start a compatible Voicebox server and configure `.env`:

```bash
TTS_PROVIDER=voicebox
VOICEBOX_API_BASE=http://127.0.0.1:8000
VOICEBOX_ENGINE=chatterbox_turbo
VOICEBOX_PROFILE_NAME=Technical Narrator
```

Then run `npm run voiceover`. If `VOICEBOX_PROFILE_ID` is set, the builder reuses that profile. Otherwise it finds a profile with the configured name or creates one from the design prompt.

Voicebox model availability is managed by the Voicebox server. If generation reports a missing model, load or download the selected engine in Voicebox and retry.

## Existing narration

If narration is created elsewhere, place a WAV or M4A file at `output/<slug>/<slug>-voiceover.wav` and provide a matching `voiceover-manifest.json`. The easiest safe route is to run one supported builder once, then replace sentence clips while preserving the manifest schema and updating measured durations.

Do not clone or publish a person's voice without their explicit permission.
