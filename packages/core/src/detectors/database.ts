import type { ConfidenceLabel } from "@secret-response/shared";
import { PLACEHOLDER_PATTERNS } from "../types.js";
import type { Detector, DetectorContext, RawMatch } from "../types.js";

const DB_URL_PATTERNS = [
  /\b(postgres(?:ql)?(?:\+[\w]+)?:\/\/[^\s'"]+)\b/gi,
  /\b(mysql(?:\+[\w]+)?:\/\/[^\s'"]+)\b/gi,
  /\b(mongodb(?:\+srv)?:\/\/[^\s'"]+)\b/gi,
  /\b(redis(?:s)?:\/\/[^\s'"]+)\b/gi,
  /\b(jdbc:[^\s'"]+)\b/gi,
  /\b(sqlserver:\/\/[^\s'"]+)\b/gi,
];

const DB_PASSWORD_ASSIGN =
  /\b((?:DB|DATABASE|MYSQL|POSTGRES|PG|MONGO|REDIS)[_-]?(?:PASSWORD|PASS|SECRET|URI|URL|CONNECTION(?:_STRING)?))\s*[=:]\s*['"]?([^\s'";#]+)['"]?/gi;

export const databaseDetector: Detector = {
  name: "database",
  priority: 15,
  detect(ctx: DetectorContext): RawMatch[] {
    const matches: RawMatch[] = [];
    const seen = new Set<string>();

    for (let i = 0; i < ctx.lines.length; i++) {
      const line = ctx.lines[i]!;
      const lineStart = ctx.content.indexOf(line);

      for (const pattern of DB_URL_PATTERNS) {
        pattern.lastIndex = 0;
        for (const match of line.matchAll(pattern)) {
          const rawValue = match[1]!;
          if (seen.has(rawValue)) continue;
          if (!containsCredentials(rawValue)) continue;
          seen.add(rawValue);
          const start = lineStart + (match.index ?? 0);
          matches.push({
            rawValue,
            start,
            end: start + rawValue.length,
            lineNumber: i + 1,
            provider: "database",
            category: "connection_string",
            confidence: classify(rawValue),
            keyName: extractKeyName(line),
          });
        }
      }

      for (const match of line.matchAll(DB_PASSWORD_ASSIGN)) {
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
          provider: "database",
          category: rawValue.includes("://")
            ? "connection_string"
            : "password",
          confidence: classify(rawValue),
          keyName: match[1],
        });
      }
    }

    return matches;
  },
};

function containsCredentials(url: string): boolean {
  return /:\/\/[^:]+:[^@]+@/.test(url) || url.includes("password=");
}

function classify(value: string): ConfidenceLabel {
  if (PLACEHOLDER_PATTERNS.some((p) => p.test(value))) {
    return "placeholder";
  }
  return "confirmed";
}

function extractKeyName(line: string): string | undefined {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=/);
  return m?.[1];
}
