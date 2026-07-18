/**
 * Golden fixture secrets for leak-detection tests.
 *
 * Provider-shaped values that trip GitHub push protection (e.g. Stripe
 * `sk_live_…`) are assembled from parts so a contiguous secret never appears
 * in the git blob. Fixture files on disk use placeholders expanded via
 * `expandGoldenPlaceholders`.
 */

export const GOLDEN_AWS_ACCESS_KEY = "AKIAIOSFODNN7EXAMPLE";
export const GOLDEN_AWS_SECRET_KEY =
  "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY";

/** Assembled at runtime — do not write this string literally into source files. */
export const GOLDEN_STRIPE_SECRET = ["sk_live_", "51Habcdef123456789012345678901234"].join(
  "",
);

export const GOLDEN_STRIPE_PUBLISHABLE = [
  "pk_live_",
  "51Habcdefpubkey123456789012345678",
].join("");

export const GOLDEN_JWT =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n68I_v9VLY8BDj0";
export const GOLDEN_DB_PASSWORD = "Pr0dDb!S3cretP@ss";
export const GOLDEN_SMTP_PASSWORD = "EmailPr0vider!Pass2026";
export const GOLDEN_API_TOKEN = "ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";
export const GOLDEN_PEM_BODY = "MIIEpAIBAAKCAQEA0Z3VS5JJcds3xfn/ygWyY8L";

export const GOLDEN_STRIPE_SECRET_PLACEHOLDER = "__SR_STRIPE_SECRET__";
export const GOLDEN_STRIPE_PUBLISHABLE_PLACEHOLDER = "__SR_STRIPE_PUBLISHABLE__";

/** Expand placeholders in on-disk fixture templates. */
export function expandGoldenPlaceholders(content: string): string {
  return content
    .replaceAll(GOLDEN_STRIPE_SECRET_PLACEHOLDER, GOLDEN_STRIPE_SECRET)
    .replaceAll(GOLDEN_STRIPE_PUBLISHABLE_PLACEHOLDER, GOLDEN_STRIPE_PUBLISHABLE);
}

/** All raw substrings that leak-detection tests must reject. */
export const RAW_GOLDEN_SECRETS = [
  GOLDEN_AWS_ACCESS_KEY,
  GOLDEN_AWS_SECRET_KEY,
  GOLDEN_STRIPE_SECRET,
  GOLDEN_STRIPE_PUBLISHABLE,
  GOLDEN_JWT,
  GOLDEN_DB_PASSWORD,
  GOLDEN_SMTP_PASSWORD,
  GOLDEN_API_TOKEN,
  GOLDEN_PEM_BODY,
] as const;
