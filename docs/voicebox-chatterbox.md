# Voicebox and Chatterbox

Voicebox with Chatterbox Turbo is the narration system for this starter. The pipeline does not fall back to an operating-system voice or a paid cloud TTS provider.

## Configure Voicebox

Copy the environment template:

```bash
cp .env.example .env
```

The canonical engine is:

```bash
VOICEBOX_API_BASE=http://127.0.0.1:8000
VOICEBOX_ENGINE=chatterbox_turbo
VOICEBOX_PROFILE_NAME=Technical Narrator
```

`VOICEBOX_ENGINE` may be `chatterbox_turbo` or `chatterbox`. Other engines are rejected so narration cannot silently drift from the repository contract.

If `VOICEBOX_PROFILE_ID` is set, the builder reuses that profile. Otherwise it finds a profile with the configured name or creates a designed Voicebox profile from `VOICEBOX_PROFILE_DESIGN_PROMPT`.

## Start the server

Start the Voicebox server using the command appropriate to your installation. For the macOS app:

```bash
/Applications/Voicebox.app/Contents/MacOS/voicebox-server --data-dir "$PWD/.voicebox-data"
```

The local data directory is ignored by Git.

Confirm the service and selected model:

```bash
npm run check:prereqs
```

## Generate narration

```bash
npm run voiceover
npm run render
npm run verify
```

The builder queries Voicebox model status. If the selected Chatterbox model is not downloaded and loaded, it requests the model and waits for it before generating sentence-level WAV clips.

Each clip is normalized to 24 kHz mono PCM, measured with `ffprobe`, and assembled with explicit sentence and slide gaps. The measured timings become the MP4 edit and SRT/VTT caption source.

Do not clone, publish, or reuse a person's voice without their explicit permission.
