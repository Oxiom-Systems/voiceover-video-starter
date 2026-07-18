# Voice recipes

The starter includes two Voicebox profile recipes for Chatterbox Turbo:

- `british-female.env.example`: the default warm British female narrator.
- `american-male.env.example`: a grounded American male narrator.

Choose one before generating narration:

```bash
cp voices/british-female.env.example .env
```

or:

```bash
cp voices/american-male.env.example .env
```

Voicebox reuses a profile when its configured name already exists. Otherwise it creates a designed profile from the prompt. A designed-profile prompt communicates the intended voice, but it is not a portable voice identity: separate Voicebox data stores can produce different voices from the same recipe.

For an exact approved voice, create or clone the profile locally from a licensed reference recording and set `VOICEBOX_PROFILE_ID` in the untracked `.env`. Do not commit profile identifiers, reference recordings, generated speech, or a person's voice without permission.
