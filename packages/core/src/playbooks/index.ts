import type {
  RemediationAction,
  SecretProvider,
} from "@secret-response/shared";
import { generateId } from "../fingerprint.js";

export interface PlaybookActionTemplate {
  title: string;
  why: string;
  impact: string;
  permissions: string[];
  suggestedOwnerRole: string;
  adminDestination?: string;
  verificationSteps: string[];
  rollbackNotes?: string;
  dependsOnTitles?: string[];
}

export interface Playbook {
  provider: SecretProvider;
  actions: PlaybookActionTemplate[];
}

export const awsPlaybook: Playbook = {
  provider: "aws",
  actions: [
    {
      title: "Identify all IAM users/roles using the exposed access key",
      why: "Determine blast radius before rotation to avoid breaking unknown workloads.",
      impact: "Read-only inventory; no service disruption.",
      permissions: ["iam:ListAccessKeys", "iam:GetUser", "cloudtrail:LookupEvents"],
      suggestedOwnerRole: "Cloud Security / Platform Engineer",
      adminDestination: "https://console.aws.amazon.com/iam/home#/users",
      verificationSteps: [
        "List every app, CI job, and service account that uses this key.",
        "Check CloudTrail for API calls from this key in the last 7 days.",
        "Record who owns each system before rotating.",
      ],
    },
    {
      title: "Create a new IAM access key pair",
      why: "Generate replacement credentials before deactivating the exposed key.",
      impact: "New credentials must be distributed securely to authorized systems only.",
      permissions: ["iam:CreateAccessKey"],
      suggestedOwnerRole: "Cloud Security / Platform Engineer",
      adminDestination: "https://console.aws.amazon.com/iam/home#/users",
      verificationSteps: [
        "Store the new key in your approved secrets manager (not in git).",
        "Confirm the new key appears active in the IAM console.",
      ],
      dependsOnTitles: ["Identify all IAM users/roles using the exposed access key"],
    },
    {
      title: "Update secret stores and CI/CD with the new key",
      why: "Workloads must use the new credentials before the old key is revoked.",
      impact: "Brief redeploy or secret sync may be required.",
      permissions: ["secretsmanager:UpdateSecret", "ssm:PutParameter"],
      suggestedOwnerRole: "DevOps / Application Owner",
      verificationSteps: [
        "Confirm apps authenticate successfully with the new key.",
        "Search configs and repos for the old key — none should remain.",
        "Watch error logs for auth failures during the swap.",
      ],
      dependsOnTitles: ["Create a new IAM access key pair"],
    },
    {
      title: "Deactivate and delete the exposed access key",
      why: "Remove attacker-usable credentials after migration completes.",
      impact: "Any system still using the old key will fail authentication.",
      permissions: ["iam:UpdateAccessKey", "iam:DeleteAccessKey"],
      suggestedOwnerRole: "Cloud Security / Platform Engineer",
      adminDestination: "https://console.aws.amazon.com/iam/home#/users",
      verificationSteps: [
        "Confirm the old key shows Inactive, then Deleted in IAM.",
        "Watch CloudTrail for denied auth attempts on the old key.",
        "Verify no production alerts fired during rotation.",
      ],
      rollbackNotes: "If workloads break, temporarily reactivate only after emergency approval.",
      dependsOnTitles: ["Update secret stores and CI/CD with the new key"],
    },
  ],
};

export const databasePlaybook: Playbook = {
  provider: "database",
  actions: [
    {
      title: "Create a new database user or rotate password",
      why: "Establish replacement credentials before revoking the exposed password.",
      impact: "New connection string required for all dependent services.",
      permissions: ["database admin / CREATE USER or ALTER USER"],
      suggestedOwnerRole: "DBA / Platform Engineer",
      verificationSteps: [
        "Connect to the database with the new password from a bastion host.",
        "Confirm the new user/password works before updating apps.",
      ],
    },
    {
      title: "Update secret stores and application configuration",
      why: "Applications must point to the new credentials before old ones are revoked.",
      impact: "May require rolling restarts of application pods or services.",
      permissions: ["secrets manager write", "deployment update"],
      suggestedOwnerRole: "DevOps / Application Owner",
      verificationSteps: [
        "Confirm health checks pass after updating connection strings.",
        "Check connection pool metrics — no authentication errors.",
        "Verify secret manager shows the new password only.",
      ],
      dependsOnTitles: ["Create a new database user or rotate password"],
    },
    {
      title: "Roll workloads to pick up new credentials",
      why: "Running processes may cache old connection strings in memory.",
      impact: "Brief connection churn during rolling restart.",
      permissions: ["deployment restart / rollout"],
      suggestedOwnerRole: "DevOps / SRE",
      verificationSteps: ["Monitor error rates and DB connection counts during rollout."],
      dependsOnTitles: ["Update secret stores and application configuration"],
    },
    {
      title: "Verify connectivity and revoke old credentials",
      why: "Ensure no service depends on the exposed password before revocation.",
      impact: "Old password becomes invalid; lingering references will fail.",
      permissions: ["database admin / DROP USER or ALTER PASSWORD"],
      suggestedOwnerRole: "DBA / Platform Engineer",
      verificationSteps: [
        "Attempt connection with old credentials — must fail.",
        "Review DB audit logs for auth attempts with old user.",
      ],
      rollbackNotes: "Keep new credentials documented; do not re-enable old password.",
      dependsOnTitles: ["Roll workloads to pick up new credentials"],
    },
  ],
};

export const stripePlaybook: Playbook = {
  provider: "stripe",
  actions: [
    {
      title: "Roll the exposed Stripe secret key in Dashboard",
      why: "Immediately invalidate the leaked key to stop unauthorized API calls.",
      impact: "All integrations using the old key will fail until updated.",
      permissions: ["Stripe Dashboard admin"],
      suggestedOwnerRole: "Billing / Finance Engineering",
      adminDestination: "https://dashboard.stripe.com/apikeys",
      verificationSteps: [
        "Confirm the old Stripe key shows as rolled/revoked in the Dashboard.",
        "Try an API call with the old key — it must fail.",
      ],
    },
    {
      title: "Update webhook endpoints and server-side integrations",
      why: "Backend services and webhook signing secrets must use the new key.",
      impact: "Payment processing may pause until integrations are updated.",
      permissions: ["Stripe Dashboard", "deployment config"],
      suggestedOwnerRole: "Backend Engineer",
      verificationSteps: [
        "Process a test payment in staging.",
        "Verify webhook signatures validate with new secret.",
      ],
      dependsOnTitles: ["Roll the exposed Stripe secret key in Dashboard"],
    },
    {
      title: "Review Stripe logs for unauthorized activity",
      why: "Determine if the exposed key was used maliciously.",
      impact: "Read-only audit; may trigger incident escalation.",
      permissions: ["Stripe Dashboard logs"],
      suggestedOwnerRole: "Security / Finance Engineering",
      adminDestination: "https://dashboard.stripe.com/logs",
      verificationSteps: [
        "Check for unexpected charges, refunds, or customer data access.",
        "Document timeline for incident report.",
      ],
    },
  ],
};

export const jwtPlaybook: Playbook = {
  provider: "jwt",
  actions: [
    {
      title: "Replace the JWT signing secret",
      why: "A leaked signing secret lets attackers forge valid login tokens.",
      impact: "Existing tokens stop working once the new secret is deployed.",
      permissions: ["auth service config", "secrets manager"],
      suggestedOwnerRole: "Backend / Identity Engineer",
      verificationSteps: [
        "Deploy the new signing secret to every service that issues tokens.",
        "Confirm old tokens fail signature validation in staging.",
      ],
    },
    {
      title: "Sign users out and invalidate existing tokens",
      why: "Anyone holding a token signed with the old secret must be logged out.",
      impact: "All users will need to sign in again.",
      permissions: ["session store flush", "auth service admin"],
      suggestedOwnerRole: "Backend / Identity Engineer",
      verificationSteps: [
        "Clear session stores and token blocklists.",
        "Verify existing tokens return 401 Unauthorized.",
        "Confirm new sign-ins issue tokens signed with the new secret.",
      ],
      dependsOnTitles: ["Replace the JWT signing secret"],
    },
    {
      title: "Audit auth logs for suspicious token usage",
      why: "Identify potential abuse of exposed signing material.",
      impact: "Read-only investigation.",
      permissions: ["auth logs read"],
      suggestedOwnerRole: "Security Engineer",
      verificationSteps: [
        "Review token issuance patterns around exposure window.",
        "Flag anomalous IP addresses or privilege escalations.",
      ],
    },
  ],
};

export const smtpPlaybook: Playbook = {
  provider: "smtp",
  actions: [
    {
      title: "Reset SMTP / email provider password",
      why: "Prevent unauthorized email sending or mailbox access.",
      impact: "Email-sending services must be updated with new credentials.",
      permissions: ["email provider admin"],
      suggestedOwnerRole: "IT / Platform Engineer",
      verificationSteps: ["Confirm old password no longer authenticates."],
    },
    {
      title: "Update application mailer configuration",
      why: "Services sending email must use the new SMTP credentials.",
      impact: "Outbound email may fail until config is updated.",
      permissions: ["deployment config", "secrets manager"],
      suggestedOwnerRole: "DevOps / Application Owner",
      verificationSteps: [
        "Send test email from each mail-sending service.",
        "Monitor bounce/error logs for auth failures.",
      ],
      dependsOnTitles: ["Reset SMTP / email provider password"],
    },
    {
      title: "Review sent-mail logs for unauthorized messages",
      why: "Detect if the exposed credential was used to send phishing or spam.",
      impact: "Read-only audit.",
      permissions: ["email provider logs"],
      suggestedOwnerRole: "Security / IT",
      verificationSteps: ["Document any unauthorized sends during exposure window."],
    },
  ],
};

export const genericApiPlaybook: Playbook = {
  provider: "generic_api",
  actions: [
    {
      title: "Revoke and regenerate the exposed API token",
      why: "Invalidate the leaked token at the provider or internal auth system.",
      impact: "Integrations using the old token will fail until updated.",
      permissions: ["API key admin at provider"],
      suggestedOwnerRole: "Application Owner / Security",
      verificationSteps: ["Confirm old token returns 401/403 from provider API."],
    },
    {
      title: "Update all consumers with the new token",
      why: "Every service referencing the token must be updated before cleanup.",
      impact: "May require coordinated deployment across services.",
      permissions: ["secrets manager", "deployment"],
      suggestedOwnerRole: "DevOps / Application Owner",
      verificationSteps: [
        "Verify each integration authenticates with the new token.",
        "Check logs for auth failures on dependent services.",
      ],
      dependsOnTitles: ["Revoke and regenerate the exposed API token"],
    },
    {
      title: "Review provider audit logs for unauthorized API usage",
      why: "Assess whether the token was used maliciously.",
      impact: "Read-only investigation.",
      permissions: ["provider audit log read"],
      suggestedOwnerRole: "Security Engineer",
      verificationSteps: ["Document suspicious API calls during exposure window."],
    },
  ],
};

export const pemPlaybook: Playbook = {
  provider: "pem",
  actions: [
    {
      title: "Generate a new key pair and certificate",
      why: "Private keys cannot be rotated in place — a new pair is required.",
      impact: "TLS clients or SSH connections must trust the new certificate.",
      permissions: ["PKI admin", "certificate authority"],
      suggestedOwnerRole: "Platform / Security Engineer",
      verificationSteps: ["Validate new cert chain before deployment."],
    },
    {
      title: "Deploy new certificate/key to all endpoints",
      why: "Services must stop using the compromised private key.",
      impact: "May require rolling restarts; brief TLS handshakes may fail during rollout.",
      permissions: ["deployment", "load balancer config"],
      suggestedOwnerRole: "DevOps / SRE",
      verificationSteps: [
        "Verify TLS handshake with new cert from external probe.",
        "Confirm no services still load the old private key.",
      ],
      dependsOnTitles: ["Generate a new key pair and certificate"],
    },
    {
      title: "Revoke old certificate and destroy private key material",
      why: "Ensure the exposed key cannot be used for impersonation.",
      impact: "Connections still presenting the old cert will fail.",
      permissions: ["CA revoke", "key destruction"],
      suggestedOwnerRole: "Platform / Security Engineer",
      verificationSteps: [
        "Confirm certificate appears on CRL/OCSP as revoked.",
        "Verify old key files are securely deleted from all stores.",
      ],
      dependsOnTitles: ["Deploy new certificate/key to all endpoints"],
    },
  ],
};

export const ALL_PLAYBOOKS: Playbook[] = [
  awsPlaybook,
  databasePlaybook,
  stripePlaybook,
  jwtPlaybook,
  smtpPlaybook,
  pemPlaybook,
  genericApiPlaybook,
];

export function instantiatePlaybookActions(
  playbook: Playbook,
  findingIds: string[],
  orderOffset: number,
): RemediationAction[] {
  const titleToId = new Map<string, string>();
  const actions: RemediationAction[] = [];

  for (const template of playbook.actions) {
    const id = generateId("action");
    titleToId.set(template.title, id);
    actions.push({
      id,
      order: 0,
      title: template.title,
      why: template.why,
      impact: template.impact,
      permissions: template.permissions,
      suggestedOwnerRole: template.suggestedOwnerRole,
      adminDestination: template.adminDestination,
      verificationSteps: template.verificationSteps,
      rollbackNotes: template.rollbackNotes,
      status: "pending",
      provider: playbook.provider,
      findingIds,
      dependsOn: template.dependsOnTitles
        ?.map((t) => titleToId.get(t))
        .filter((d): d is string => Boolean(d)),
    });
  }

  return actions.map((action, index) => ({
    ...action,
    order: orderOffset + index + 1,
  }));
}
