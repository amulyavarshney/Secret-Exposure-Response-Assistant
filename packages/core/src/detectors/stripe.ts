import type { ConfidenceLabel } from "@secret-response/shared";
import { PLACEHOLDER_PATTERNS } from "../types.js";
import type { Detector, DetectorContext, RawMatch } from "../types.js";

const STRIPE_PATTERNS: Array<{
  regex: RegExp;
  category: RawMatch["category"];
  confidence: ConfidenceLabel;
}> = [
  {
    regex: /\b(sk_live_[0-9a-zA-Z]{24,})\b/g,
    category: "secret_key",
    confidence: "confirmed",
  },
  {
    regex: /\b(sk_test_[0-9a-zA-Z]{24,})\b/g,
    category: "secret_key",
    confidence: "high",
  },
  {
    regex: /\b(pk_live_[0-9a-zA-Z]{24,})\b/g,
    category: "publishable_key",
    confidence: "high",
  },
  {
    regex: /\b(pk_test_[0-9a-zA-Z]{24,})\b/g,
    category: "publishable_key",
    confidence: "possible",
  },
  {
    regex: /\b(whsec_[0-9a-zA-Z]{16,})\b/g,
    category: "webhook_secret",
    confidence: "confirmed",
  },
  {
    regex: /\b(rk_live_[0-9a-zA-Z]{24,})\b/g,
    category: "secret_key",
    confidence: "confirmed",
  },
  {
    regex: /\b(rk_test_[0-9a-zA-Z]{24,})\b/g,
    category: "secret_key",
    confidence: "high",
  },
];

export const stripeDetector: Detector = {
  name: "stripe",
  priority: 20,
  detect(ctx: DetectorContext): RawMatch[] {
    const matches: RawMatch[] = [];
    const seen = new Set<string>();

    for (let i = 0; i < ctx.lines.length; i++) {
      const line = ctx.lines[i]!;
      const lineStart = ctx.content.indexOf(line);

      for (const { regex, category, confidence } of STRIPE_PATTERNS) {
        regex.lastIndex = 0;
        for (const match of line.matchAll(regex)) {
          const rawValue = match[1]!;
          if (seen.has(rawValue)) continue;
          seen.add(rawValue);
          const start = lineStart + (match.index ?? 0);
          matches.push({
            rawValue,
            start,
            end: start + rawValue.length,
            lineNumber: i + 1,
            provider: "stripe",
            category,
            confidence: adjustConfidence(rawValue, confidence),
            keyName: extractKeyName(line),
          });
        }
      }
    }

    return matches;
  },
};

function extractKeyName(line: string): string | undefined {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=/);
  return m?.[1];
}

function adjustConfidence(
  value: string,
  base: ConfidenceLabel,
): ConfidenceLabel {
  if (PLACEHOLDER_PATTERNS.some((p) => p.test(value))) {
    return "placeholder";
  }
  return base;
}
