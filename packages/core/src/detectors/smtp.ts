import type { ConfidenceLabel } from "@secret-response/shared";
import { PLACEHOLDER_PATTERNS } from "../types.js";
import type { Detector, DetectorContext, RawMatch } from "../types.js";

const SMTP_URL =
  /smtp(?:s)?:\/\/([^:\s@]+):([^@\s/]+)@[^\s'"]+/gi;
const SMTP_PASSWORD_ASSIGN =
  /\b(SMTP[_-]?(?:PASSWORD|PASS|SECRET)|MAIL[_-]?(?:PASSWORD|PASS)|EMAIL[_-]?(?:PASSWORD|PASS))\s*[=:]\s*['"]?([^\s'";#]+)['"]?/gi;

export const smtpDetector: Detector = {
  name: "smtp",
  priority: 40,
  detect(ctx: DetectorContext): RawMatch[] {
    const matches: RawMatch[] = [];
    const seen = new Set<string>();

    for (let i = 0; i < ctx.lines.length; i++) {
      const line = ctx.lines[i]!;
      const lineStart = ctx.content.indexOf(line);

      for (const match of line.matchAll(SMTP_URL)) {
        const rawValue = match[2]!;
        if (seen.has(rawValue)) continue;
        seen.add(rawValue);
        const start = lineStart + (match.index ?? 0);
        matches.push({
          rawValue,
          start,
          end: start + rawValue.length,
          lineNumber: i + 1,
          provider: "smtp",
          category: "password",
          confidence: classify(rawValue),
          keyName: "SMTP_URL",
        });
      }

      for (const match of line.matchAll(SMTP_PASSWORD_ASSIGN)) {
        const rawValue = match[2]!;
        if (seen.has(rawValue)) continue;
        seen.add(rawValue);
        const start =
          lineStart + (match.index ?? 0) + match[0].indexOf(rawValue);
        matches.push({
          rawValue,
          start,
          end: start + rawValue.length,
          lineNumber: i + 1,
          provider: "smtp",
          category: "password",
          confidence: classify(rawValue),
          keyName: match[1],
        });
      }
    }

    return matches;
  },
};

function classify(value: string): ConfidenceLabel {
  if (PLACEHOLDER_PATTERNS.some((p) => p.test(value))) {
    return "placeholder";
  }
  if (value.length < 4) return "possible";
  return "confirmed";
}
