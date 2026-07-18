import type { Incident } from "@secret-response/shared";

/** Raw fixture secrets — must NEVER appear in outbound connector payloads. */
export const FIXTURE_AWS_KEY = "AKIAIOSFODNN7EXAMPLE";
export const FIXTURE_AWS_SECRET = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY";
/** Assembled at runtime so GitHub push protection does not see a contiguous key. */
export const FIXTURE_STRIPE = ["sk_live_", "51Habcdef123456789012345678901234"].join(
  "",
);
export const FIXTURE_JWT =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n68I_v9VLY8BDj0";

export const FIXTURE_DB_PASSWORD = "Pr0dDb!S3cretP@ss";
export const FIXTURE_SMTP_PASSWORD = "EmailPr0vider!Pass2026";
export const FIXTURE_API_TOKEN = "ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";

export const RAW_FIXTURE_SECRETS = [
  FIXTURE_AWS_KEY,
  FIXTURE_AWS_SECRET,
  FIXTURE_STRIPE,
  FIXTURE_JWT,
  FIXTURE_DB_PASSWORD,
  FIXTURE_SMTP_PASSWORD,
  FIXTURE_API_TOKEN,
];

export const SANITIZED_INCIDENT: Incident = {
  id: "incident-test-001",
  createdAt: "2026-07-18T00:00:00.000Z",
  discoveredAt: "2026-07-18T00:00:00.000Z",
  reporter: "security-oncall",
  channel: "file_upload",
  application: "billing-api",
  environment: "production",
  severity: "Critical",
  nextActionId: "action-aws-1",
  status: "open",
  systems: ["billing-api", "worker-queue"],
  findings: [
    {
      id: "finding-aws-1",
      provider: "aws",
      category: "access_key",
      confidence: "confirmed",
      maskedLabel: "AWS access key ending in …MPLE",
      fingerprint: "a1b2c3d4e5f67890",
      severity: "Critical",
      lineNumber: 3,
      keyName: "AWS_ACCESS_KEY_ID",
      environment: "production",
    },
    {
      id: "finding-stripe-1",
      provider: "stripe",
      category: "secret_key",
      confidence: "confirmed",
      maskedLabel: "Stripe live secret key ending in …1234",
      fingerprint: "fedcba9876543210",
      severity: "Critical",
      keyName: "STRIPE_SECRET",
      environment: "production",
    },
  ],
  actions: [
    {
      id: "action-aws-1",
      order: 1,
      title: "Rotate AWS access keys",
      why: "Exposed AWS credentials require immediate rotation.",
      impact: "Brief API disruption during key swap.",
      permissions: ["iam:CreateAccessKey", "iam:DeleteAccessKey"],
      suggestedOwnerRole: "Cloud Security Engineer",
      adminDestination: "https://console.aws.amazon.com/iam/",
      verificationSteps: ["Confirm old key returns AccessDenied"],
      status: "pending",
      provider: "aws",
      findingIds: ["finding-aws-1"],
    },
  ],
  verification: [
    {
      id: "verify-1",
      description: "Confirm AWS access key ending in …MPLE is revoked",
      completed: false,
      relatedFindingId: "finding-aws-1",
    },
  ],
};

export const HIGH_SEVERITY_INCIDENT: Incident = {
  ...SANITIZED_INCIDENT,
  id: "incident-test-002",
  severity: "High",
};

export const MEDIUM_SEVERITY_INCIDENT: Incident = {
  ...SANITIZED_INCIDENT,
  id: "incident-test-003",
  severity: "Medium",
};

export const JIRA_CONFIG = {
  baseUrl: "https://example.atlassian.net",
  email: "bot@example.com",
  apiToken: "jira-token",
  projectKey: "SEC",
  issueType: "Task",
};

export const SERVICENOW_CONFIG = {
  instanceUrl: "https://example.service-now.com",
  username: "integration",
  password: "snow-password",
  assignmentGroup: "Security Operations",
};

export const SLACK_CONFIG = {
  webhookUrl: "https://hooks.slack.com/services/T000/B000/XXXX",
};

export const PAGERDUTY_CONFIG = {
  routingKey: "pagerduty-routing-key",
};

export function assertNoRawSecretsInBody(
  body: string,
  secrets: string[] = RAW_FIXTURE_SECRETS,
): void {
  for (const secret of secrets) {
    expect(body).not.toContain(secret);
  }
}
