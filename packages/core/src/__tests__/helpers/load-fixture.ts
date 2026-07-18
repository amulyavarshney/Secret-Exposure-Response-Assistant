import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { expandGoldenPlaceholders } from "../fixtures/golden-secrets.js";

const FIXTURES_DIR = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../fixtures",
);

export function loadFixture(name: string): string {
  const raw = readFileSync(path.join(FIXTURES_DIR, name), "utf8");
  return expandGoldenPlaceholders(raw);
}

export function fixturesDir(): string {
  return FIXTURES_DIR;
}
