#!/usr/bin/env node
/**
 * Materialize the golden production.env fixture (expand Stripe placeholders)
 * and run secret-response scan. Safe demo — no contiguous Stripe key in git.
 */
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cli = path.join(root, "apps/cli/dist/index.js");
const template = path.join(
  root,
  "packages/core/src/__tests__/fixtures/production.env",
);

const stripeSecret = ["sk_live_", "51Habcdef123456789012345678901234"].join("");
const stripePublishable = [
  "pk_live_",
  "51Habcdefpubkey123456789012345678",
].join("");

const dir = mkdtempSync(path.join(tmpdir(), "sera-demo-"));
const dest = path.join(dir, "production.env");
const session = path.join(dir, "session.json");

const content = readFileSync(template, "utf8")
  .replaceAll("__SR_STRIPE_SECRET__", stripeSecret)
  .replaceAll("__SR_STRIPE_PUBLISHABLE__", stripePublishable);

writeFileSync(dest, content, "utf8");

const result = spawnSync(process.execPath, [cli, "scan", dest], {
  encoding: "utf8",
  env: { ...process.env, SECRET_RESPONSE_SESSION_PATH: session },
});

process.stdout.write(result.stdout ?? "");
process.stderr.write(result.stderr ?? "");

// CLI exits 1 when secrets are found — that is the expected demo outcome.
if (result.status === 0 || result.status === 1) {
  process.exit(0);
}
process.exit(result.status ?? 2);
