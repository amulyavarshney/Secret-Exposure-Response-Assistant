import { readFile } from "node:fs/promises";
import { stdin as input } from "node:process";
import path from "node:path";
import {
  buildIncidentFromScan,
  configureFingerprintSalt,
  scanContent,
} from "@secret-response/core";
import { EXIT_CLEAN, EXIT_ERROR, EXIT_SECRETS_FOUND } from "../exit-codes.js";
import { formatScanSummary, hasActionableFindings } from "../format.js";
import { saveSession } from "../session.js";

export async function runScan(target?: string): Promise<number> {
  if (!target) {
    console.error("Usage: secret-response scan <path>");
    console.error("       secret-response scan -    # read from stdin");
    return EXIT_ERROR;
  }

  configureFingerprintSaltFromEnv();

  let content: string;
  let source: string;

  try {
    if (target === "-") {
      content = await readStdin();
      source = "stdin";
    } else {
      const resolved = path.resolve(target);
      content = await readFile(resolved, "utf8");
      source = resolved;
    }
  } catch (error) {
    console.error(formatReadError(error, target));
    return EXIT_ERROR;
  }

  const scanResult = scanContent(content, {
    channel: "cli_scan",
    filename: target === "-" ? undefined : path.basename(target),
    fingerprintSalt: process.env.SECRET_RESPONSE_FINGERPRINT_SALT,
  });

  const incident = buildIncidentFromScan(scanResult.findings, {
    channel: "cli_scan",
    discoveredAt: scanResult.scannedAt,
  });

  try {
    await saveSession(incident, source);
  } catch (error) {
    console.error(
      `Failed to save scan session: ${error instanceof Error ? error.message : String(error)}`,
    );
    return EXIT_ERROR;
  }

  console.log(formatScanSummary(incident, source));

  return hasActionableFindings(incident.findings)
    ? EXIT_SECRETS_FOUND
    : EXIT_CLEAN;
}

function configureFingerprintSaltFromEnv(): void {
  const salt = process.env.SECRET_RESPONSE_FINGERPRINT_SALT;
  if (salt) {
    configureFingerprintSalt(salt);
  }
}

async function readStdin(): Promise<string> {
  if (input.isTTY) {
    throw new Error("No stdin data. Pipe content or use a file path.");
  }

  const chunks: Buffer[] = [];
  for await (const chunk of input) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }

  return Buffer.concat(chunks).toString("utf8");
}

function formatReadError(error: unknown, target: string): string {
  if (error instanceof Error) {
    if ("code" in error && error.code === "ENOENT") {
      return `File not found: ${target}`;
    }
    return error.message;
  }
  return String(error);
}
