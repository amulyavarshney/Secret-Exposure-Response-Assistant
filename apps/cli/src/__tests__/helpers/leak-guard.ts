import { expect } from "vitest";

/**
 * Raw secret substrings from golden fixtures — must never appear on stdout/stderr.
 * Stripe-shaped values are assembled at runtime (no contiguous key in the git blob).
 */
export const FIXTURE_SECRETS = [
  "AKIAIOSFODNN7EXAMPLE",
  "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
  ["sk_live_", "51Habcdef123456789012345678901234"].join(""),
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n68I_v9VLY8BDj0",
  "Pr0dDb!S3cretP@ss",
  "EmailPr0vider!Pass2026",
  "ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
] as const;

export function assertNoSecretLeaks(
  output: string,
  secrets: readonly string[] = FIXTURE_SECRETS,
): void {
  for (const secret of secrets) {
    if (secret.length >= 8) {
      expect(output).not.toContain(secret);
    }
  }
}
