export const deck = {
  eyebrow: "VOICEOVER VIDEO STARTER",
  title: "Turn a clear story into a shareable video.",
  description: "One scene source for the browser, narration, captions, and final MP4.",
  brand: "Your project",
  accent: "#2563eb"
};

export const scenes = [
  {
    kicker: "Start with the story",
    title: "Important ideas deserve a clear shape.",
    body: "Build the narrative before polishing transitions, voices, or effects.",
    voiceover:
      "A strong explainer starts with the story. Decide what the audience should understand, then give each idea one clear scene.",
    sourceSupport: ["docs/story-script-slides.md"],
    durationMs: 8500,
    visual: { type: "signal", label: "Source to story", value: "01" }
  },
  {
    kicker: "Separate the layers",
    title: "Slides stay short. Narration carries nuance.",
    body: "The same scene object holds visible copy and the full spoken explanation.",
    voiceover:
      "Keep the words on screen brief enough to read at a glance. The voiceover can explain context, boundaries, and the details that would make a slide feel crowded.",
    sourceSupport: ["docs/story-script-slides.md", "src/scenes.js"],
    durationMs: 9500,
    visual: {
      type: "comparison",
      left: { label: "ON SCREEN", value: "Clear and concise" },
      right: { label: "VOICEOVER", value: "Natural and complete" }
    }
  },
  {
    kicker: "One source",
    title: "The browser and renderer use the same scenes.",
    body: "What you review locally is what Playwright captures for the video.",
    voiceover:
      "The slideshow is not a disposable mockup. The browser preview and the renderer import the same scene data, which keeps review and final output aligned.",
    sourceSupport: ["src/player.js", "scripts/render-video.mjs"],
    durationMs: 9000,
    visual: { type: "steps", items: ["Preview", "Capture", "Render"] }
  },
  {
    kicker: "Timing evidence",
    title: "Audio duration controls the narrated edit.",
    body: "Every spoken sentence is measured before the slides are assembled.",
    voiceover:
      "For a narrated video, each sentence is generated and measured separately. Those measured durations control the slide timing and become the source for the caption files.",
    sourceSupport: ["scripts/build-voiceover.mjs", "scripts/lib/captions.mjs"],
    durationMs: 10000,
    visual: { type: "signal", label: "Sentence timed", value: "A/V" }
  },
  {
    kicker: "Agent friendly",
    title: "Codex and Claude Code share one workflow.",
    body: "Repository instructions, a portable skill, and ordinary Git keep the handoff simple.",
    voiceover:
      "Codex and Claude Code follow the same repository contract. A normal Git structure also means the project remains comfortable in GitX, GitHub Desktop, or the command line.",
    sourceSupport: ["AGENTS.md", "CLAUDE.md", "docs/agent-workflow.md"],
    durationMs: 9500,
    visual: {
      type: "quote",
      text: "One workflow. Multiple tools. Verifiable output."
    }
  },
  {
    kicker: "Finish with proof",
    title: "Render, inspect, then share.",
    body: "Technical checks catch stream errors. Real frame inspection catches visual ones.",
    voiceover:
      "A successful command is not the finish line. Verify the video and audio streams, inspect the contact sheet, and open the most important frames before sharing the result.",
    sourceSupport: ["scripts/verify-video.mjs", "AGENTS.md"],
    durationMs: 9000,
    visual: { type: "finish", items: ["H.264", "AAC", "SRT", "VTT"] }
  }
];
