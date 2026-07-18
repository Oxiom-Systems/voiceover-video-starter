import { spawnSync } from "node:child_process";

export function commandExists(command) {
  const probe = spawnSync(command, ["-version"], { encoding: "utf8", stdio: "ignore" });
  return probe.status === 0 || probe.status === 1;
}

export function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd,
    encoding: options.encoding ?? "utf8",
    stdio: options.stdio ?? "inherit",
    env: options.env ?? process.env
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    const detail = typeof result.stderr === "string" ? result.stderr.trim() : "";
    throw new Error(`${command} exited with status ${result.status}${detail ? `: ${detail}` : ""}`);
  }
  return result.stdout ?? "";
}

export function durationSeconds(path) {
  const output = run(
    "ffprobe",
    ["-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", path],
    { stdio: "pipe" }
  );
  const duration = Number.parseFloat(output.trim());
  if (!Number.isFinite(duration) || duration <= 0) throw new Error(`Could not measure audio duration: ${path}`);
  return duration;
}

export function ffmpegConcatPath(path) {
  return `'${path.replaceAll("'", "'\\''")}'`;
}
