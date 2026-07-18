import type { SecretCategory, SecretProvider } from "@secret-response/shared";

export function maskSecretValue(
  rawValue: string,
  provider: SecretProvider,
  category: SecretCategory,
  keyName?: string,
): string {
  const suffix = suffixForMask(rawValue);
  const prefix = labelPrefix(provider, category, keyName);
  return `${prefix} ending in …${suffix}`;
}

function suffixForMask(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length <= 4) {
    return "****";
  }
  return trimmed.slice(-4);
}

function labelPrefix(
  provider: SecretProvider,
  category: SecretCategory,
  keyName?: string,
): string {
  if (keyName) {
    return `${keyName}`;
  }

  switch (provider) {
    case "aws":
      return category === "access_key" ? "AWS access key" : "AWS secret key";
    case "stripe":
      if (category === "webhook_secret") return "Stripe webhook secret";
      if (category === "publishable_key") return "Stripe publishable key";
      return "Stripe secret key";
    case "jwt":
      return "JWT token";
    case "smtp":
      return "SMTP credential";
    case "database":
      return "Database connection string";
    case "pem":
      return "Private key (PEM)";
    case "generic_api":
      return "API token";
    default:
      return "Secret value";
  }
}

/** Strip raw values from arbitrary text — for safe logging only. */
export function redactRawValues(text: string, rawValues: string[]): string {
  let result = text;
  for (const value of rawValues.sort((a, b) => b.length - a.length)) {
    if (!value || value.length < 4) continue;
    const masked = `[REDACTED:${value.slice(-4)}]`;
    result = result.split(value).join(masked);
  }
  return result;
}
