import type { SecretProvider } from "@secret-response/shared";
import type { RawMatch } from "../types.js";

const PROVIDER_PRIORITY: Record<SecretProvider, number> = {
  pem: 5,
  aws: 10,
  database: 15,
  stripe: 20,
  jwt: 30,
  smtp: 40,
  generic_api: 90,
  unknown: 100,
};

const CONFIDENCE_RANK: Record<RawMatch["confidence"], number> = {
  confirmed: 5,
  high: 4,
  possible: 2,
  placeholder: 1,
  non_secret: 0,
};

function pickBetterMatch(a: RawMatch, b: RawMatch): RawMatch {
  const pa = PROVIDER_PRIORITY[a.provider] ?? 100;
  const pb = PROVIDER_PRIORITY[b.provider] ?? 100;
  if (pa !== pb) return pa < pb ? a : b;

  const ca = CONFIDENCE_RANK[a.confidence];
  const cb = CONFIDENCE_RANK[b.confidence];
  if (ca !== cb) return ca > cb ? a : b;

  const lenA = a.end - a.start;
  const lenB = b.end - b.start;
  return lenA >= lenB ? a : b;
}

function overlaps(a: RawMatch, b: RawMatch): boolean {
  return a.start < b.end && a.end > b.start;
}

export function deduplicateMatches(matches: RawMatch[]): RawMatch[] {
  const sorted = [...matches].sort((a, b) => a.start - b.start);
  const kept: RawMatch[] = [];

  for (const match of sorted) {
    let merged = false;

    for (let i = 0; i < kept.length; i++) {
      const existing = kept[i]!;
      if (!overlaps(match, existing)) continue;

      kept[i] = pickBetterMatch(existing, match);
      merged = true;
      break;
    }

    if (!merged) {
      kept.push(match);
    }
  }

  return kept.filter((m) => m.confidence !== "non_secret");
}

export { PROVIDER_PRIORITY };
