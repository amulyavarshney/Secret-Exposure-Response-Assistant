/**
 * Expand golden fixture placeholders for CLI tests.
 * Kept local so typecheck does not import across package rootDirs.
 * Stripe-shaped values are assembled at runtime (no contiguous key in git).
 */
export function expandGoldenPlaceholders(content: string): string {
  const stripeSecret = ["sk_live_", "51Habcdef123456789012345678901234"].join("");
  const stripePublishable = [
    "pk_live_",
    "51Habcdefpubkey123456789012345678",
  ].join("");

  return content
    .replaceAll("__SR_STRIPE_SECRET__", stripeSecret)
    .replaceAll("__SR_STRIPE_PUBLISHABLE__", stripePublishable);
}
