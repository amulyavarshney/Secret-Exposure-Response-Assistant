import { spawn } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { expandGoldenPlaceholders } from "./expand-golden.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const CLI_ENTRY = path.resolve(__dirname, "../../../dist/index.js");
export const FIXTURES_DIR = path.resolve(__dirname, "../fixtures");
export const GOLDEN_FIXTURES_DIR = path.resolve(
  __dirname,
  "../../../../../packages/core/src/__tests__/fixtures",
);

/** Write an expanded golden fixture into tempDir; returns the absolute path. */
export function materializeGoldenFixture(
  name: string,
  tempDir: string,
): string {
  const raw = readFileSync(path.join(GOLDEN_FIXTURES_DIR, name), "utf8");
  const dest = path.join(tempDir, name);
  writeFileSync(dest, expandGoldenPlaceholders(raw), "utf8");
  return dest;
}

export interface CliRunResult {
  stdout: string;
  stderr: string;
  exitCode: number | null;
}

export function runCli(
  args: string[],
  options: {
    env?: NodeJS.ProcessEnv;
    stdin?: string;
  } = {},
): Promise<CliRunResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [CLI_ENTRY, ...args], {
      env: { ...process.env, ...options.env },
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk: string) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk: string) => {
      stderr += chunk;
    });

    child.on("error", reject);
    child.on("close", (exitCode) => {
      resolve({ stdout, stderr, exitCode });
    });

    if (options.stdin !== undefined) {
      child.stdin.write(options.stdin);
    }
    child.stdin.end();
  });
}

export function tempSessionEnv(sessionPath: string): NodeJS.ProcessEnv {
  return { SECRET_RESPONSE_SESSION_PATH: sessionPath };
}
