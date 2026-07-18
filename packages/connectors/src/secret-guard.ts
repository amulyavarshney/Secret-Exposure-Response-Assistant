import { SecretLeakError } from "./errors.js";

interface SecretPattern {
  name: string;
  regex: RegExp;
}

/** Patterns aligned with core detectors — defense in depth before any outbound call. */
const SECRET_PATTERNS: SecretPattern[] = [
  {
    name: "aws_access_key",
    regex: /\b(AKIA|ASIA|AROA)[0-9A-Z]{16}\b/,
  },
  {
    name: "aws_secret_key",
    regex: /\b[A-Za-z0-9/+=]{40}\b/,
  },
  {
    name: "stripe_secret",
    regex: /\b(sk|rk)_(live|test)_[0-9a-zA-Z]{24,}\b/,
  },
  {
    name: "stripe_publishable",
    regex: /\bpk_(live|test)_[0-9a-zA-Z]{24,}\b/,
  },
  {
    name: "stripe_webhook",
    regex: /\bwhsec_[0-9a-zA-Z]{16,}\b/,
  },
  {
    name: "jwt",
    regex: /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/,
  },
  {
    name: "pem_private_key",
    regex: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  },
  {
    name: "database_url",
    regex: /\b(?:postgres(?:ql)?|mysql|mongodb(?:\+srv)?):\/\/[^\s:@]+:[^\s@]+@/i,
  },
];

function collectStrings(value: unknown, out: string[] = []): string[] {
  if (value == null) {
    return out;
  }

  if (typeof value === "string") {
    out.push(value);
    return out;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      collectStrings(item, out);
    }
    return out;
  }

  if (typeof value === "object") {
    for (const entry of Object.values(value)) {
      collectStrings(entry, out);
    }
  }

  return out;
}

function looksLikeMaskedLabel(text: string): boolean {
  return /…/.test(text) || /\.\.\./.test(text);
}

function scanText(
  text: string,
  additionalForbiddenSubstrings: string[],
): string | undefined {
  for (const forbidden of additionalForbiddenSubstrings) {
    if (forbidden.length >= 8 && text.includes(forbidden)) {
      return "forbidden_substring";
    }
  }

  for (const pattern of SECRET_PATTERNS) {
    if (pattern.name === "aws_secret_key" && looksLikeMaskedLabel(text)) {
      continue;
    }

    if (pattern.regex.test(text)) {
      return pattern.name;
    }
  }

  return undefined;
}

/**
 * Refuses to proceed if any string field in the payload matches a raw secret pattern.
 * Call immediately before every outbound connector request.
 */
export function assertSafeOutboundPayload(
  payload: unknown,
  options: { additionalForbiddenSubstrings?: string[] } = {},
): void {
  const forbidden = options.additionalForbiddenSubstrings ?? [];

  for (const text of collectStrings(payload)) {
    const match = scanText(text, forbidden);
    if (match) {
      throw new SecretLeakError(match);
    }
  }
}

/** @internal Exported for unit tests. */
export function scanForSecretPatterns(text: string): string | undefined {
  return scanText(text, []);
}
