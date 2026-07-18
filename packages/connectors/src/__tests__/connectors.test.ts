import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  assertSafeOutboundPayload,
  createJiraIssue,
  createPagerDutyIncident,
  createServiceNowIncident,
  notifySlack,
  resetFetch,
  scanForSecretPatterns,
  SecretLeakError,
  setFetch,
} from "../index.js";
import {
  assertNoRawSecretsInBody,
  FIXTURE_AWS_KEY,
  FIXTURE_STRIPE,
  HIGH_SEVERITY_INCIDENT,
  JIRA_CONFIG,
  MEDIUM_SEVERITY_INCIDENT,
  PAGERDUTY_CONFIG,
  RAW_FIXTURE_SECRETS,
  SANITIZED_INCIDENT,
  SERVICENOW_CONFIG,
  SLACK_CONFIG,
} from "./fixtures.js";

function mockFetch(response: {
  ok?: boolean;
  status?: number;
  body?: unknown;
  text?: string;
}): ReturnType<typeof vi.fn> {
  const fn = vi.fn(async () => ({
    ok: response.ok ?? true,
    status: response.status ?? 200,
    text: async () =>
      response.text ?? JSON.stringify(response.body ?? { ok: true }),
  }));
  setFetch(fn as unknown as typeof fetch);
  return fn;
}

beforeEach(() => {
  resetFetch();
});

afterEach(() => {
  resetFetch();
  vi.restoreAllMocks();
});

describe("secret guard", () => {
  it("allows sanitized incident summaries", () => {
    expect(() =>
      assertSafeOutboundPayload({
        summary: "AWS access key ending in …MPLE",
        categories: ["aws/access_key: AWS access key ending in …MPLE"],
      }),
    ).not.toThrow();
  });

  it("blocks AWS access keys", () => {
    expect(() =>
      assertSafeOutboundPayload({ description: FIXTURE_AWS_KEY }),
    ).toThrow(SecretLeakError);
  });

  it("blocks Stripe live keys", () => {
    expect(() =>
      assertSafeOutboundPayload({ text: FIXTURE_STRIPE }),
    ).toThrow(SecretLeakError);
  });

  it("blocks additional forbidden substrings", () => {
    expect(() =>
      assertSafeOutboundPayload(
        { note: "value leaked: custom-secret-value-12345" },
        { additionalForbiddenSubstrings: ["custom-secret-value-12345"] },
      ),
    ).toThrow(SecretLeakError);
  });

  it("detects patterns via scanForSecretPatterns", () => {
    expect(scanForSecretPatterns(FIXTURE_AWS_KEY)).toBe("aws_access_key");
    expect(scanForSecretPatterns("AWS access key ending in …MPLE")).toBeUndefined();
  });
});

describe("createJiraIssue", () => {
  it("creates issue with sanitized payload and returns key/url", async () => {
    const fetchMock = mockFetch({
      body: { id: "10001", key: "SEC-42" },
    });

    const result = await createJiraIssue(SANITIZED_INCIDENT, {
      config: JIRA_CONFIG,
      assignee: "security.lead@example.com",
      incidentLink: "https://app.example.com/incidents/incident-test-001",
    });

    expect(result).toEqual({
      issueKey: "SEC-42",
      url: "https://example.atlassian.net/browse/SEC-42",
    });

    expect(fetchMock).toHaveBeenCalledOnce();
    const [, init] = fetchMock.mock.calls[0]!;
    const body = init?.body as string;
    assertNoRawSecretsInBody(body);

    const parsed = JSON.parse(body);
    expect(parsed.fields.project.key).toBe("SEC");
    expect(parsed.fields.summary).toContain("Critical");
    expect(parsed.fields.assignee.emailAddress).toBe("security.lead@example.com");
    expect(JSON.stringify(parsed)).toContain("…MPLE");
  });

  it("refuses to send when incident field contains raw secret", async () => {
    const contaminated: typeof SANITIZED_INCIDENT = {
      ...SANITIZED_INCIDENT,
      application: FIXTURE_STRIPE,
    };

    await expect(
      createJiraIssue(contaminated, { config: JIRA_CONFIG }),
    ).rejects.toThrow(SecretLeakError);
  });
});

describe("createServiceNowIncident", () => {
  it("creates incident with sanitized payload", async () => {
    const fetchMock = mockFetch({
      body: {
        result: {
          number: "INC0012345",
          sys_id: "abc123sysid",
        },
      },
    });

    const result = await createServiceNowIncident(SANITIZED_INCIDENT, {
      config: SERVICENOW_CONFIG,
      assignee: "security.ops",
      incidentLink: "https://app.example.com/incidents/incident-test-001",
    });

    expect(result).toEqual({
      incidentNumber: "INC0012345",
      sysId: "abc123sysid",
      url: "https://example.service-now.com/nav_to.do?uri=incident.do?sys_id=abc123sysid",
    });

    const body = fetchMock.mock.calls[0]![1]?.body as string;
    assertNoRawSecretsInBody(body);
    expect(body).toContain("Credential exposure");
    expect(body).not.toContain(FIXTURE_AWS_KEY);
  });
});

describe("notifySlack", () => {
  it("posts discreet notification without secret text", async () => {
    const fetchMock = mockFetch({ body: "ok" });

    const result = await notifySlack(SANITIZED_INCIDENT, {
      config: SLACK_CONFIG,
      incidentLink: "https://app.example.com/incidents/incident-test-001",
    });

    expect(result).toEqual({ ok: true });

    const body = fetchMock.mock.calls[0]![1]?.body as string;
    assertNoRawSecretsInBody(body);

    const parsed = JSON.parse(body);
    expect(parsed.text).toContain("Critical");
    expect(JSON.stringify(parsed.blocks)).toContain("masked only");
    expect(JSON.stringify(parsed)).toContain("…MPLE");
    for (const secret of RAW_FIXTURE_SECRETS) {
      expect(JSON.stringify(parsed)).not.toContain(secret);
    }
  });
});

describe("createPagerDutyIncident", () => {
  it("triggers alert for Critical severity", async () => {
    const fetchMock = mockFetch({
      body: {
        status: "success",
        message: "Event processed",
        dedup_key: "secret-response-incident-test-001",
      },
    });

    const result = await createPagerDutyIncident(SANITIZED_INCIDENT, {
      config: PAGERDUTY_CONFIG,
      incidentLink: "https://app.example.com/incidents/incident-test-001",
    });

    expect(result).toMatchObject({
      dedupKey: "secret-response-incident-test-001",
      status: "success",
    });

    const body = fetchMock.mock.calls[0]![1]?.body as string;
    assertNoRawSecretsInBody(body);

    const parsed = JSON.parse(body);
    expect(parsed.payload.severity).toBe("critical");
    expect(parsed.payload.custom_details.categories).toEqual(
      expect.arrayContaining([expect.stringContaining("…MPLE")]),
    );
  });

  it("triggers alert for High severity", async () => {
    mockFetch({ body: { status: "success", dedup_key: "secret-response-incident-test-002" } });

    const result = await createPagerDutyIncident(HIGH_SEVERITY_INCIDENT, {
      config: PAGERDUTY_CONFIG,
    });

    expect(result).toMatchObject({ status: "success" });
  });

  it("skips Medium and Low severities", async () => {
    const fetchMock = mockFetch({ body: { status: "success" } });

    const result = await createPagerDutyIncident(MEDIUM_SEVERITY_INCIDENT, {
      config: PAGERDUTY_CONFIG,
    });

    expect(result).toEqual({
      skipped: true,
      reason: expect.stringContaining("Medium"),
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
