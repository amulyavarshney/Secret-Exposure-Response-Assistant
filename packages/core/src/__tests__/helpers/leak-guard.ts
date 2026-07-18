import { expect } from "vitest";
import { RAW_GOLDEN_SECRETS } from "../fixtures/golden-secrets.js";

/** Fail if any raw fixture secret substring appears in output. */
export function assertNoSecretLeaks(
  output: string,
  secrets: readonly string[] = RAW_GOLDEN_SECRETS,
): void {
  for (const secret of secrets) {
    if (secret.length >= 8) {
      expect(output, `leaked raw secret substring: ${secret.slice(0, 6)}…`).not.toContain(
        secret,
      );
    }
  }
}
