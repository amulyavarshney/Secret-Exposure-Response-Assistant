import type { ConfidenceLabel } from "@secret-response/shared";
import { PLACEHOLDER_PATTERNS } from "../types.js";
import type { Detector, DetectorContext, RawMatch } from "../types.js";

const JWT_PATTERN =
  /\b(eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,})\b/g;

export const jwtDetector: Detector = {
  name: "jwt",
  priority: 30,
  detect(ctx: DetectorContext): RawMatch[] {
    const matches: RawMatch[] = [];
    const seen = new Set<string>();

    for (let i = 0; i < ctx.lines.length; i++) {
      const line = ctx.lines[i]!;
      const lineStart = ctx.content.indexOf(line);

      for (const match of line.matchAll(JWT_PATTERN)) {
        const rawValue = match[1]!;
        if (seen.has(rawValue)) continue;
        if (!isLikelyJwt(rawValue)) continue;
        seen.add(rawValue);
        const start = lineStart + (match.index ?? 0);
        matches.push({
          rawValue,
          start,
          end: start + rawValue.length,
          lineNumber: i + 1,
          provider: "jwt",
          category: "session_token",
          confidence: classifyJwt(rawValue),
          keyName: extractKeyName(line),
        });
      }
    }

    return matches;
  },
};

function isLikelyJwt(value: string): boolean {
  const parts = value.split(".");
  if (parts.length !== 3) return false;
  try {
    const header = JSON.parse(
      Buffer.from(parts[0]!.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8"),
    );
    return typeof header === "object" && header !== null && "alg" in header;
  } catch {
    return parts.every((p) => p.length >= 10);
  }
}

function classifyJwt(value: string): ConfidenceLabel {
  if (PLACEHOLDER_PATTERNS.some((p) => p.test(value))) {
    return "placeholder";
  }
  return "high";
}

function extractKeyName(line: string): string | undefined {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=/);
  return m?.[1];
}
