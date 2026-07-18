export default {
  slug: "starter-story",
  pageFile: "src/index.html",
  sceneFile: "src/scenes.js",
  outputDirectory: "output/starter-story",
  width: 1920,
  height: 1080,
  framesPerSecond: 30,
  sentenceGapSeconds: 0.35,
  slideGapSeconds: 0.8,
  audioSampleRate: 24000,
  speechReplacements: [
    { pattern: "\\bAPI\\b", flags: "g", replacement: "A P I" },
    { pattern: "\\bAI\\b", flags: "g", replacement: "A I" }
  ]
};
