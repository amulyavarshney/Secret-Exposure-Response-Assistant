import type { ConfidenceLabel } from "@secret-response/shared";
import { PLACEHOLDER_PATTERNS } from "../types.js";
import type { Detector, DetectorContext, RawMatch } from "../types.js";

const MIN_ENTROPY_LENGTH = 20;
const ENTROPY_THRESHOLD = 3.5;

export const entropyDetector: Detector = {
  name: "entropy",
  priority: 90,
  detect(ctx: DetectorContext): RawMatch[] {
    const matches: RawMatch[] = [];
    const seen = new Set<string>();

    const tokenPattern = /\b([A-Za-z0-9+/=_-]{20,128})\b/g;

    for (let i = 0; i < ctx.lines.length; i++) {
      const line = ctx.lines[i]!;
      if (/^\s*#/.test(line) || /^\s*\/\//.test(line)) continue;

      const lineStart = ctx.content.indexOf(line);

      for (const match of line.matchAll(tokenPattern)) {
        const rawValue = match[1]!;
        if (seen.has(rawValue)) continue;
        if (rawValue.includes("=")) continue;
        if (/^(?:KEY|SECRET|TOKEN|PASSWORD|PASS)=/i.test(line)) continue;
        if (isLikelyNonSecret(rawValue, line)) continue;

        const entropy = shannonEntropy(rawValue);
        if (entropy < ENTROPY_THRESHOLD) continue;

        seen.add(rawValue);
        const start = lineStart + (match.index ?? 0);
        matches.push({
          rawValue,
          start,
          end: start + rawValue.length,
          lineNumber: i + 1,
          provider: "generic_api",
          category: "api_token",
          confidence: classifyEntropy(rawValue, entropy),
          keyName: extractKeyName(line),
        });
      }
    }

    return matches;
  },
};

function shannonEntropy(value: string): number {
  const freq = new Map<string, number>();
  for (const char of value) {
    freq.set(char, (freq.get(char) ?? 0) + 1);
  }
  let entropy = 0;
  for (const count of freq.values()) {
    const p = count / value.length;
    entropy -= p * Math.log2(p);
  }
  return entropy;
}

function isLikelyNonSecret(value: string, line: string): boolean {
  if (value.length < MIN_ENTROPY_LENGTH) return true;
  if (/^eyJ/.test(value)) return true;
  if (/^(AKIA|ASIA|sk_|pk_|whsec_)/.test(value)) return true;
  if (/^[0-9]+$/.test(value)) return true;
  if (/^[a-f0-9-]{36}$/i.test(value)) return true;
  if (line.includes("http://") || line.includes("https://")) {
    if (value.includes(".") && !value.includes("=")) return true;
  }
  return false;
}

function classifyEntropy(value: string, entropy: number): ConfidenceLabel {
  if (PLACEHOLDER_PATTERNS.some((p) => p.test(value))) {
    return "placeholder";
  }
  if (entropy >= 4.5 && value.length >= 32) {
    return "high";
  }
  return "possible";
}

function extractKeyName(line: string): string | undefined {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=/);
  return m?.[1];
}

export { shannonEntropy };
