import { describe, expect, it } from "vitest";
import { buildActionPlan } from "../action-plan.js";
import {
  buildGuidedIncident,
  buildIncidentFromScan,
  serializeIncidentJson,
  serializeIncidentMarkdown,
} from "../incident.js";
import { scanContent, scanContentInternal } from "../scan.js";
import { RAW_GOLDEN_SECRETS } from "./fixtures/golden-secrets.js";
import { assertNoSecretLeaks } from "./helpers/leak-guard.js";
import { loadFixture } from "./helpers/load-fixture.js";

describe("golden fixtures — production.env", () => {
  const content = loadFixture("production.env");

  it("detects Critical severity with expected providers", () => {
    const result = scanContent(content, {
      filename: ".env.production",
      channel: "file_upload",
      fingerprintSalt: "golden-test-salt",
    });

    expect(result.findings.length).toBeGreaterThanOrEqual(7);

    const providers = [...new Set(result.findings.map((f) => f.provider))];
    expect(providers).toEqual(
      expect.arrayContaining([
        "aws",
        "stripe",
        "jwt",
        "database",
        "smtp",
        "generic_api",
      ]),
    );

    expect(result.findings.every((f) => f.severity === "Critical")).toBe(true);
    expect(result.findings.every((f) => f.maskedLabel.includes("…"))).toBe(
      true,
    );
  });

  it("orders AWS remediation before Stripe when both are present", () => {
    const { result } = scanContentInternal(content, {
      filename: ".env.production",
    });
    const actions = buildActionPlan(result.findings);
    const providerOrder = [...new Set(actions.map((a) => a.provider))];

    expect(providerOrder.indexOf("aws")).toBeLessThan(
      providerOrder.indexOf("stripe"),
    );
    expect(actions[0]?.provider).toBe("aws");
    expect(actions[0]?.title).toMatch(/Identify all IAM/i);
  });

  it("builds a complete verification checklist per finding and action", () => {
    const { result } = scanContentInternal(content, {
      filename: ".env.production",
    });
    const incident = buildIncidentFromScan(result.findings, {
      channel: "file_upload",
      application: "billing-api",
    });

    const actionableFindings = result.findings.filter(
      (f) => f.confidence !== "placeholder" && f.confidence !== "non_secret",
    );
    const actionVerificationCount = incident.actions.reduce(
      (sum, a) => sum + a.verificationSteps.length,
      0,
    );

    expect(incident.verification.length).toBe(
      actionVerificationCount + actionableFindings.length,
    );
    expect(incident.verification.every((v) => v.description.length > 10)).toBe(
      true,
    );
    expect(
      incident.verification.some((v) =>
        /fully rotated and no longer valid/i.test(v.description),
      ),
    ).toBe(true);
  });

  it("never leaks raw secrets in incident serializers", () => {
    const { result, rawValues } = scanContentInternal(content, {
      filename: ".env.production",
      fingerprintSalt: "golden-test-salt",
    });
    const incident = buildIncidentFromScan(result.findings, {
      channel: "file_upload",
    });

    const json = serializeIncidentJson(incident);
    const md = serializeIncidentMarkdown(incident);

    assertNoSecretLeaks(json);
    assertNoSecretLeaks(md);

    for (const raw of rawValues) {
      if (raw.length >= 8) {
        expect(json).not.toContain(raw);
        expect(md).not.toContain(raw);
      }
    }

    expect(json).toContain("maskedLabel");
    expect(md).toContain("Secret Exposure Incident Report");
    expect(incident.severity).toBe("Critical");
  });
});

describe("golden fixtures — production-app.fixture", () => {
  const content = loadFixture("production-app.fixture");

  it("detects secrets embedded in log lines", () => {
    const result = scanContent(content, {
      filename: "billing-api.log",
      channel: "file_upload",
    });

    expect(result.findings.length).toBeGreaterThanOrEqual(4);
    expect(result.findings.some((f) => f.provider === "aws")).toBe(true);
    expect(result.findings.some((f) => f.provider === "stripe")).toBe(true);
    expect(result.findings.some((f) => f.provider === "jwt")).toBe(true);
  });

  it("serializes log scan without leaking embedded secrets", () => {
    const { result } = scanContentInternal(content, {
      filename: "billing-api.log",
    });
    const incident = buildIncidentFromScan(result.findings, {
      channel: "file_upload",
    });

    assertNoSecretLeaks(serializeIncidentJson(incident));
    assertNoSecretLeaks(serializeIncidentMarkdown(incident));
  });
});

describe("golden fixtures — guided no-content path", () => {
  it("produces conservative checklist without requiring paste/upload", () => {
    const incident = buildGuidedIncident({
      environment: "unknown",
      channel: "guided_form",
      whereShared: "Slack channel",
    });

    expect(incident.findings).toHaveLength(0);
    expect(incident.severity).toBe("Critical");
    expect(incident.actions.length).toBeGreaterThanOrEqual(3);
    expect(incident.actions[0]?.title).toMatch(/Assume production/i);

    const md = serializeIncidentMarkdown(incident);
    expect(md).toContain("guided containment plan");
    assertNoSecretLeaks(md, RAW_GOLDEN_SECRETS);
  });
});
