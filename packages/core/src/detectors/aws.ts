import type { ConfidenceLabel } from "@secret-response/shared";
import { PLACEHOLDER_PATTERNS } from "../types.js";
import type { Detector, DetectorContext, RawMatch } from "../types.js";

const AWS_ACCESS_KEY = /\b(AKIA|ASIA|AROA)[0-9A-Z]{16}\b/g;
const AWS_SECRET_KEY =
  /\b(?:aws[_-]?secret[_-]?access[_-]?key|AWS_SECRET_ACCESS_KEY)\s*[=:]\s*['"]?([A-Za-z0-9/+=]{40})['"]?/gi;
export const awsDetector: Detector = {
  name: "aws",
  priority: 10,
  detect(ctx: DetectorContext): RawMatch[] {
    const matches: RawMatch[] = [];
    const seen = new Set<string>();

    for (let i = 0; i < ctx.lines.length; i++) {
      const line = ctx.lines[i]!;
      const lineStart = ctx.content.indexOf(line);

      for (const match of line.matchAll(AWS_ACCESS_KEY)) {
        const rawValue = match[0];
        if (seen.has(rawValue)) continue;
        seen.add(rawValue);
        const start = lineStart + (match.index ?? 0);
        matches.push({
          rawValue,
          start,
          end: start + rawValue.length,
          lineNumber: i + 1,
          provider: "aws",
          category: "access_key",
          confidence: classifyConfidence(rawValue),
          keyName: extractKeyName(line),
        });
      }

      for (const match of line.matchAll(AWS_SECRET_KEY)) {
        const rawValue = match[1]!;
        if (seen.has(rawValue)) continue;
        seen.add(rawValue);
        const start = lineStart + (match.index ?? 0) + match[0].indexOf(rawValue);
        matches.push({
          rawValue,
          start,
          end: start + rawValue.length,
          lineNumber: i + 1,
          provider: "aws",
          category: "secret_key",
          confidence: classifyConfidence(rawValue),
          keyName: "AWS_SECRET_ACCESS_KEY",
        });
      }
    }

    return matches;
  },
};

function extractKeyName(line: string): string | undefined {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=/);
  return m?.[1];
}

function classifyConfidence(value: string): ConfidenceLabel {
  if (PLACEHOLDER_PATTERNS.some((p) => p.test(value))) {
    return "placeholder";
  }
  return "confirmed";
}

export { AWS_ACCESS_KEY };
