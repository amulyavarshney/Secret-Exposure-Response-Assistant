import type { ConfidenceLabel } from "@secret-response/shared";
import type { Detector, DetectorContext, RawMatch } from "../types.js";

const PEM_BLOCK =
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g;

export const pemDetector: Detector = {
  name: "pem",
  priority: 5,
  detect(ctx: DetectorContext): RawMatch[] {
    const matches: RawMatch[] = [];
    const seen = new Set<string>();

    for (const match of ctx.content.matchAll(PEM_BLOCK)) {
      const rawValue = match[0];
      if (seen.has(rawValue)) continue;
      seen.add(rawValue);

      const before = ctx.content.slice(0, match.index ?? 0);
      const lineNumber = before.split("\n").length;

      matches.push({
        rawValue,
        start: match.index ?? 0,
        end: (match.index ?? 0) + rawValue.length,
        lineNumber,
        provider: "pem",
        category: "private_key",
        confidence: "confirmed" as ConfidenceLabel,
        keyName: extractKeyName(ctx.lines[lineNumber - 1]),
      });
    }

    return matches;
  },
};

function extractKeyName(line: string | undefined): string | undefined {
  if (!line) return undefined;
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=/);
  return m?.[1];
}
