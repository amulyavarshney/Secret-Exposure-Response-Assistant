import { mkdir, mkdtemp, rm } from "node:fs/promises";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { assertNoSecretLeaks, FIXTURE_SECRETS } from "./helpers/leak-guard.js";
import {
  FIXTURES_DIR,
  materializeGoldenFixture,
  runCli,
  tempSessionEnv,
} from "./helpers/run-cli.js";

const TEST_TMP_ROOT = path.join(process.cwd(), ".tmp", "cli-tests");

describe("secret-response CLI", () => {
  let tempDir: string;
  let sessionPath: string;

  beforeEach(async () => {
    await mkdir(TEST_TMP_ROOT, { recursive: true });
    tempDir = await mkdtemp(path.join(TEST_TMP_ROOT, "run-"));
    sessionPath = path.join(tempDir, "session.json");
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it("prints help with exit code 0", async () => {
    const result = await runCli(["--help"]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("secret-response scan");
    expect(result.stderr).toBe("");
  });

  it("scan exits 0 on clean fixture without leaking placeholders", async () => {
    const cleanPath = path.join(FIXTURES_DIR, "clean.env");
    const result = await runCli(["scan", cleanPath], {
      env: tempSessionEnv(sessionPath),
    });

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("No secrets detected");
    assertNoSecretLeaks(`${result.stdout}\n${result.stderr}`);
  });

  it("scan exits 1 on secrets fixture with sanitized stdout only", async () => {
    const secretsPath = materializeGoldenFixture("production.env", tempDir);
    const result = await runCli(["scan", secretsPath], {
      env: tempSessionEnv(sessionPath),
    });

    expect(result.exitCode).toBe(1);
    expect(result.stdout).toContain("Severity:");
    expect(result.stdout).toContain("Next action:");
    expect(result.stdout).toMatch(/…/);
    assertNoSecretLeaks(`${result.stdout}\n${result.stderr}`, FIXTURE_SECRETS);
  });

  it("scan reads stdin when path is -", async () => {
    const stripe = ["sk_live_", "51Habcdef123456789012345678901234"].join("");
    const stdinContent = `AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE\nSTRIPE_SECRET=${stripe}\n`;
    const result = await runCli(["scan", "-"], {
      env: tempSessionEnv(sessionPath),
      stdin: stdinContent,
    });

    expect(result.exitCode).toBe(1);
    expect(result.stdout).toContain("Source: stdin");
    assertNoSecretLeaks(`${result.stdout}\n${result.stderr}`, FIXTURE_SECRETS);
  });

  it("report exports markdown without raw secrets", async () => {
    const secretsPath = materializeGoldenFixture("production.env", tempDir);
    await runCli(["scan", secretsPath], { env: tempSessionEnv(sessionPath) });

    const result = await runCli(["report", "--format", "markdown"], {
      env: tempSessionEnv(sessionPath),
    });

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Secret Exposure Incident Report");
    assertNoSecretLeaks(`${result.stdout}\n${result.stderr}`, FIXTURE_SECRETS);
  });

  it("report exports json without raw secrets", async () => {
    const secretsPath = materializeGoldenFixture("production.env", tempDir);
    await runCli(["scan", secretsPath], { env: tempSessionEnv(sessionPath) });

    const result = await runCli(["report", "--format", "json"], {
      env: tempSessionEnv(sessionPath),
    });

    expect(result.exitCode).toBe(0);
    const parsed = JSON.parse(result.stdout) as { findings: unknown[] };
    expect(parsed.findings.length).toBeGreaterThan(0);
    assertNoSecretLeaks(`${result.stdout}\n${result.stderr}`, FIXTURE_SECRETS);
  });

  it("plan prints prioritized actions without raw secrets", async () => {
    const secretsPath = materializeGoldenFixture("production.env", tempDir);
    await runCli(["scan", secretsPath], { env: tempSessionEnv(sessionPath) });

    const result = await runCli(["plan"], {
      env: tempSessionEnv(sessionPath),
    });

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Action Plan");
    expect(result.stdout).toContain("Recommended next:");
    assertNoSecretLeaks(`${result.stdout}\n${result.stderr}`, FIXTURE_SECRETS);
  });

  it("report exits 2 when no session exists", async () => {
    const result = await runCli(["report"], {
      env: tempSessionEnv(sessionPath),
    });

    expect(result.exitCode).toBe(2);
    expect(result.stderr).toContain("No saved scan session");
    assertNoSecretLeaks(`${result.stdout}\n${result.stderr}`, FIXTURE_SECRETS);
  });

  it("scan production golden fixture: Critical, AWS-first plan, no raw secrets", async () => {
    const productionPath = materializeGoldenFixture("production.env", tempDir);
    const result = await runCli(["scan", productionPath], {
      env: tempSessionEnv(sessionPath),
    });

    expect(result.exitCode).toBe(1);
    expect(result.stdout).toContain("Severity: Critical");
    expect(result.stdout).toMatch(/Identify all IAM/i);
    expect(result.stdout).toMatch(/…/);
    assertNoSecretLeaks(`${result.stdout}\n${result.stderr}`, FIXTURE_SECRETS);
  });

  it("scan exits 2 for missing file", async () => {
    const result = await runCli(["scan", path.join(tempDir, "missing.env")], {
      env: tempSessionEnv(sessionPath),
    });

    expect(result.exitCode).toBe(2);
    expect(result.stderr).toContain("File not found");
    assertNoSecretLeaks(`${result.stdout}\n${result.stderr}`, FIXTURE_SECRETS);
  });
});
