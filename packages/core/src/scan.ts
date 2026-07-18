import type {
  ExposureChannel,
  Finding,
  ScanOptions,
  ScanResult,
} from "@secret-response/shared";
import { ALL_DETECTORS, deduplicateMatches } from "./detectors/index.js";
import { fingerprintSecret, generateId } from "./fingerprint.js";
import { maskSecretValue } from "./mask.js";
import { computeSeverity, resolveEnvironment } from "./severity.js";
import type { DetectorContext, RawMatch } from "./types.js";

export function scanContent(
  content: string,
  options: ScanOptions = {},
): ScanResult {
  const channel: ExposureChannel = options.channel ?? "unknown";
  const lines = content.split(/\r?\n/);
  const ctx: DetectorContext = {
    content,
    lines,
    environmentHint: options.environmentHint,
    filename: options.filename,
  };

  const rawMatches: RawMatch[] = [];
  for (const detector of ALL_DETECTORS) {
    rawMatches.push(...detector.detect(ctx));
  }

  const deduped = deduplicateMatches(rawMatches);
  const salt = options.fingerprintSalt;

  const findings: Finding[] = deduped.map((match) => {
    const environment = resolveEnvironment(
      options.environmentHint,
      match.keyName,
      options.filename,
    );

    const severity = computeSeverity({
      provider: match.provider,
      category: match.category,
      confidence: match.confidence,
      environment,
      channel,
    });

    return {
      id: generateId("finding"),
      provider: match.provider,
      category: match.category,
      confidence: match.confidence,
      maskedLabel: maskSecretValue(
        match.rawValue,
        match.provider,
        match.category,
        match.keyName,
      ),
      fingerprint: fingerprintSecret(match.rawValue, salt),
      severity,
      lineNumber: match.lineNumber,
      keyName: match.keyName,
      environment,
    };
  });

  return {
    findings: findings.filter((f) => f.confidence !== "non_secret"),
    rawMatchCount: deduped.length,
    scannedAt: new Date().toISOString(),
  };
}

/** Internal helper for tests — never expose raw values in production API. */
export function scanContentInternal(
  content: string,
  options: ScanOptions = {},
): { result: ScanResult; rawValues: string[] } {
  const lines = content.split(/\r?\n/);
  const ctx: DetectorContext = {
    content,
    lines,
    environmentHint: options.environmentHint,
    filename: options.filename,
  };

  const rawMatches: RawMatch[] = [];
  for (const detector of ALL_DETECTORS) {
    rawMatches.push(...detector.detect(ctx));
  }

  const deduped = deduplicateMatches(rawMatches);
  const result = scanContent(content, options);

  return {
    result,
    rawValues: deduped.map((m) => m.rawValue),
  };
}
