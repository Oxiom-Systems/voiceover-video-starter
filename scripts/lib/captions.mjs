import { writeFileSync } from "node:fs";

function timestamp(seconds, separator) {
  const totalMilliseconds = Math.max(0, Math.round(seconds * 1000));
  const milliseconds = totalMilliseconds % 1000;
  const totalSeconds = Math.floor(totalMilliseconds / 1000);
  const secondsPart = totalSeconds % 60;
  const totalMinutes = Math.floor(totalSeconds / 60);
  const minutesPart = totalMinutes % 60;
  const hoursPart = Math.floor(totalMinutes / 60);
  return `${String(hoursPart).padStart(2, "0")}:${String(minutesPart).padStart(2, "0")}:${String(secondsPart).padStart(2, "0")}${separator}${String(milliseconds).padStart(3, "0")}`;
}

export function captionEntries(manifest) {
  const entries = [];
  let cursor = 0;
  for (const slide of manifest.slides) {
    for (const [index, sentence] of slide.sentences.entries()) {
      const start = cursor;
      cursor += sentence.durationSeconds;
      entries.push({ start, end: cursor, text: sentence.text.replace(/\s+/g, " ").trim() });
      if (index < slide.sentences.length - 1) cursor += manifest.sentenceGapSeconds;
    }
    if (slide.slide < manifest.slides.length) cursor += manifest.slideGapSeconds;
  }
  return entries;
}

export function writeCaptions(manifest, srtPath, vttPath) {
  const entries = captionEntries(manifest);
  const srt = entries
    .map((entry, index) => `${index + 1}\n${timestamp(entry.start, ",")} --> ${timestamp(entry.end, ",")}\n${entry.text}\n`)
    .join("\n");
  const vtt = `WEBVTT\n\n${entries
    .map((entry) => `${timestamp(entry.start, ".")} --> ${timestamp(entry.end, ".")}\n${entry.text}\n`)
    .join("\n")}`;
  writeFileSync(srtPath, `${srt.trim()}\n`);
  writeFileSync(vttPath, `${vtt.trim()}\n`);
  return entries.length;
}
