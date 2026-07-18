import { describe, expect, it } from "vitest";
import { scanContent, scanContentInternal } from "../scan.js";
import { maskSecretValue } from "../mask.js";
import { fingerprintSecret } from "../fingerprint.js";
import {
  buildIncidentFromScan,
  serializeIncidentJson,
  serializeIncidentMarkdown,
} from "../incident.js";
import { buildActionPlan } from "../action-plan.js";

const FIXTURE_AWS_KEY = "AKIAIOSFODNN7EXAMPLE";
const FIXTURE_AWS_SECRET = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY";
const FIXTURE_STRIPE = ["sk_live_", "51Habcdef123456789012345678901234"].join("");
const FIXTURE_JWT =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n68I_v9VLY8BDj0";
const FIXTURE_DB =
  "postgresql://dbuser:SuperSecretP@ssw0rd!@db.example.com:5432/mydb";
const FIXTURE_PEM = `-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA0Z3VS5JJcds3xfn/ygWyY8L
-----END RSA PRIVATE KEY-----`;

describe("masking", () => {
  it("masks AWS access keys with suffix only", () => {
    const masked = maskSecretValue(FIXTURE_AWS_KEY, "aws", "access_key");
    expect(masked).toContain("…");
    expect(masked).not.toContain(FIXTURE_AWS_KEY);
    expect(masked).toMatch(/MPLE$/);
  });

  it("uses key name when provided", () => {
    const masked = maskSecretValue("secretvalue1234", "generic_api", "api_token", "API_KEY");
    expect(masked.startsWith("API_KEY")).toBe(true);
  });
});

describe("fingerprints", () => {
  it("produces stable HMAC fingerprints", () => {
    const a = fingerprintSecret("test-secret", "test-salt");
    const b = fingerprintSecret("test-secret", "test-salt");
    const c = fingerprintSecret("other-secret", "test-salt");
    expect(a).toBe(b);
    expect(a).not.toBe(c);
    expect(a).toHaveLength(16);
  });
});

describe("detectors", () => {
  it("detects AWS access keys", () => {
    const content = `AWS_ACCESS_KEY_ID=${FIXTURE_AWS_KEY}`;
    const { result, rawValues } = scanContentInternal(content);
    expect(result.findings.length).toBeGreaterThan(0);
    expect(result.findings.some((f) => f.provider === "aws")).toBe(true);
    assertNoLeaks(result, rawValues);
  });

  it("detects Stripe live keys", () => {
    const content = `STRIPE_SECRET=${FIXTURE_STRIPE}`;
    const { result, rawValues } = scanContentInternal(content);
    expect(result.findings.some((f) => f.provider === "stripe")).toBe(true);
    assertNoLeaks(result, rawValues);
  });

  it("detects JWT tokens", () => {
    const content = `TOKEN=${FIXTURE_JWT}`;
    const { result, rawValues } = scanContentInternal(content);
    expect(result.findings.some((f) => f.provider === "jwt")).toBe(true);
    assertNoLeaks(result, rawValues);
  });

  it("detects database connection strings", () => {
    const content = `DATABASE_URL=${FIXTURE_DB}`;
    const { result, rawValues } = scanContentInternal(content);
    expect(result.findings.some((f) => f.provider === "database")).toBe(true);
    assertNoLeaks(result, rawValues);
  });

  it("detects PEM private keys", () => {
    const content = FIXTURE_PEM;
    const { result, rawValues } = scanContentInternal(content);
    expect(result.findings.some((f) => f.provider === "pem")).toBe(true);
    assertNoLeaks(result, rawValues);
  });

  it("classifies placeholders with low confidence", () => {
    const content = "API_KEY=changeme\nSECRET=your_api_key";
    const result = scanContent(content);
    const placeholders = result.findings.filter((f) => f.confidence === "placeholder");
    expect(placeholders.length).toBeGreaterThan(0);
  });

  it("treats unknown environment as production severity", () => {
    const content = `AWS_ACCESS_KEY_ID=${FIXTURE_AWS_KEY}`;
    const result = scanContent(content);
    const aws = result.findings.find((f) => f.provider === "aws");
    expect(aws?.environment).toBe("unknown");
    expect(aws?.severity).toBe("Critical");
  });

  it("infers development from filename hint", () => {
    const content = `API_KEY=someSecretValue12345`;
    const result = scanContent(content, { filename: ".env.development" });
    expect(result.findings.some((f) => f.environment === "development")).toBe(true);
  });
});

describe("action plan", () => {
  it("orders AWS before Stripe when both present", () => {
    const content = [
      `STRIPE_KEY=${FIXTURE_STRIPE}`,
      `AWS_ACCESS_KEY_ID=${FIXTURE_AWS_KEY}`,
    ].join("\n");
    const { result } = scanContentInternal(content);
    const actions = buildActionPlan(result.findings);
    const providers = [...new Set(actions.map((a) => a.provider))];
    expect(providers.indexOf("aws")).toBeLessThan(providers.indexOf("stripe"));
  });

  it("database playbook follows create-update-roll-verify-revoke order", () => {
    const content = `DATABASE_URL=${FIXTURE_DB}`;
    const { result } = scanContentInternal(content);
    const actions = buildActionPlan(result.findings.filter((f) => f.provider === "database"));
    const titles = actions.map((a) => a.title);
    expect(titles[0]).toMatch(/Create a new database/i);
    expect(titles[titles.length - 1]).toMatch(/revoke old/i);
  });

  it("JWT playbook includes session invalidation", () => {
    const content = `JWT_SECRET=${FIXTURE_JWT}`;
    const { result } = scanContentInternal(content);
    const actions = buildActionPlan(result.findings);
    expect(actions.some((a) => /sign users out/i.test(a.title))).toBe(true);
  });
});

describe("incident serialization", () => {
  it("never includes raw secrets in JSON or Markdown output", () => {
    const content = [
      `AWS_ACCESS_KEY_ID=${FIXTURE_AWS_KEY}`,
      `AWS_SECRET_ACCESS_KEY=${FIXTURE_AWS_SECRET}`,
      `STRIPE_SECRET=${FIXTURE_STRIPE}`,
    ].join("\n");
    const { result, rawValues } = scanContentInternal(content, {
      fingerprintSalt: "test-salt",
    });
    const incident = buildIncidentFromScan(result.findings, { channel: "cli_scan" });
    const json = serializeIncidentJson(incident);
    const md = serializeIncidentMarkdown(incident);

    for (const secret of rawValues) {
      expect(json).not.toContain(secret);
      expect(md).not.toContain(secret);
    }

    expect(json).toContain("maskedLabel");
    expect(md).toContain("Secret Exposure Incident Report");
  });
});

function assertNoLeaks(
  result: ReturnType<typeof scanContent>,
  rawValues: string[],
): void {
  const serialized = JSON.stringify(result);
  for (const secret of rawValues) {
    if (secret.length >= 8) {
      expect(serialized).not.toContain(secret);
    }
  }
  for (const finding of result.findings) {
    expect(finding.maskedLabel).toMatch(/…/);
  }
}
