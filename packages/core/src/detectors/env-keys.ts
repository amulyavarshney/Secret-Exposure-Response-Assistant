import type { ConfidenceLabel, SecretCategory } from "@secret-response/shared";
import { PLACEHOLDER_PATTERNS } from "../types.js";
import type { Detector, DetectorContext, RawMatch } from "../types.js";

const ENV_KEY_PATTERN =
  /^\s*((?:[A-Z][A-Z0-9_]*)(?:KEY|SECRET|TOKEN|PASSWORD|PASS|PRIVATE|CREDENTIAL|AUTH)(?:_[A-Z0-9_]*)*)\s*=\s*['"]?([^\s'";#]+)['"]?\s*$/;

const KEY_CATEGORY_MAP: Array<{ pattern: RegExp; category: SecretCategory }> = [
  { pattern: /PASSWORD|PASS/i, category: "password" },
  { pattern: /PRIVATE/i, category: "private_key" },
  { pattern: /TOKEN/i, category: "api_token" },
  { pattern: /SECRET/i, category: "secret_key" },
  { pattern: /KEY/i, category: "api_token" },
];

export const envKeyDetector: Detector = {
  name: "env-keys",
  priority: 80,
  detect(ctx: DetectorContext): RawMatch[] {
    const matches: RawMatch[] = [];
    const seen = new Set<string>();

    for (let i = 0; i < ctx.lines.length; i++) {
      const line = ctx.lines[i]!;
      const match = line.match(ENV_KEY_PATTERN);
      if (!match) continue;

      const keyName = match[1]!;
      const rawValue = match[2]!;
      if (seen.has(`${keyName}=${rawValue}`)) continue;
      seen.add(`${keyName}=${rawValue}`);

      const lineStart = ctx.content.indexOf(line);
      const valueStart = lineStart + line.indexOf(rawValue);

      matches.push({
        rawValue,
        start: valueStart,
        end: valueStart + rawValue.length,
        lineNumber: i + 1,
        provider: inferProvider(keyName),
        category: inferCategory(keyName),
        confidence: classifyEnvValue(rawValue, keyName),
        keyName,
      });
    }

    return matches;
  },
};

function inferProvider(keyName: string): RawMatch["provider"] {
  if (/AWS/i.test(keyName)) return "aws";
  if (/STRIPE/i.test(keyName)) return "stripe";
  if (/JWT|BEARER/i.test(keyName)) return "jwt";
  if (/SMTP|MAIL/i.test(keyName)) return "smtp";
  if (/DB|DATABASE|MYSQL|POSTGRES|MONGO|REDIS/i.test(keyName)) return "database";
  return "generic_api";
}

function inferCategory(keyName: string): SecretCategory {
  for (const { pattern, category } of KEY_CATEGORY_MAP) {
    if (pattern.test(keyName)) return category;
  }
  return "other";
}

function classifyEnvValue(value: string, keyName: string): ConfidenceLabel {
  if (PLACEHOLDER_PATTERNS.some((p) => p.test(value))) {
    return "placeholder";
  }
  if (value.length < 8) return "possible";
  if (/^(true|false|null|none|empty)$/i.test(value)) return "non_secret";
  if (/example|sample|dummy|test/i.test(value) && value.length < 16) {
    return "placeholder";
  }
  if (/PROD|LIVE/i.test(keyName) && value.length >= 8) {
    return "high";
  }
  return "high";
}
