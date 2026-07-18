import type {
  ExposureChannel,
  Finding,
  GuidedIncidentInput,
  Incident,
  IncidentInput,
  RemediationAction,
  VerificationItem,
} from "@secret-response/shared";
import { buildActionPlan, getNextActionId } from "./action-plan.js";
import { generateId } from "./fingerprint.js";
import { aggregateSeverity, effectiveEnvironment } from "./severity.js";

export function buildIncident(input: IncidentInput): Incident {
  const environment = effectiveEnvironment(
    input.environment ??
      highestEnvironment(input.findings) ??
      "unknown",
  );

  const severity =
    input.findings.length > 0
      ? aggregateSeverity(input.findings.map((f) => f.severity))
      : severityForGuidedContainment(environment);

  const nextActionId =
    getNextActionId(input.actions) ?? input.actions[0]?.id;

  return {
    id: generateId("incident"),
    createdAt: new Date().toISOString(),
    discoveredAt: input.discoveredAt ?? new Date().toISOString(),
    reporter: input.reporter,
    channel: input.channel ?? "unknown",
    application: input.application,
    environment,
    findings: input.findings,
    severity,
    nextActionId,
    actions: input.actions,
    status: "open",
    verification: buildVerificationItems(input.actions, input.findings),
    systems: input.systems ?? [],
  };
}

export function buildIncidentFromScan(
  findings: Finding[],
  options: {
    reporter?: string;
    channel?: ExposureChannel;
    application?: string;
    environment?: Incident["environment"];
    discoveredAt?: string;
    systems?: string[];
  } = {},
): Incident {
  const actions = buildActionPlan(findings, {
    environment: options.environment,
    channel: options.channel,
  });

  return buildIncident({
    findings,
    actions,
    reporter: options.reporter,
    channel: options.channel,
    application: options.application,
    environment: options.environment,
    discoveredAt: options.discoveredAt,
    systems: options.systems,
  });
}

export function buildGuidedIncident(input: GuidedIncidentInput): Incident {
  const actions = buildActionPlan([], {
    environment: input.environment,
    channel: input.channel ?? "guided_form",
  });

  return buildIncident({
    findings: [],
    actions,
    reporter: input.reporter,
    channel: input.channel ?? "guided_form",
    application: input.application,
    environment: input.environment ?? "unknown",
    discoveredAt: input.whenDiscovered,
    systems: input.systems ?? [],
  });
}

/** No-content / guided path: unknown environment is treated as production. */
function severityForGuidedContainment(
  environment: Incident["environment"],
): Incident["severity"] {
  if (effectiveEnvironment(environment) === "production") {
    return "Critical";
  }
  if (environment === "staging") {
    return "High";
  }
  return "Medium";
}

function highestEnvironment(
  findings: Finding[],
): Incident["environment"] | undefined {
  const priority = ["production", "staging", "development", "unknown"] as const;
  let best = -1;
  let result: Incident["environment"] | undefined;

  for (const f of findings) {
    const idx = priority.indexOf(f.environment);
    if (idx >= 0 && idx < (best === -1 ? Infinity : best)) {
      best = idx;
      result = f.environment;
    }
  }

  return result;
}

function buildVerificationItems(
  actions: RemediationAction[],
  findings: Finding[],
): VerificationItem[] {
  const items: VerificationItem[] = [];

  for (const action of actions) {
    for (const step of action.verificationSteps) {
      items.push({
        id: generateId("verify"),
        description: `[${action.title}] ${step}`,
        completed: false,
        relatedActionId: action.id,
      });
    }
  }

  for (const finding of findings) {
    items.push({
      id: generateId("verify"),
      description: `Confirm ${finding.maskedLabel} is fully rotated and no longer valid`,
      completed: false,
      relatedFindingId: finding.id,
    });
  }

  return items;
}

/** Serialize incident to JSON — guaranteed sanitized (no raw secrets). */
export function serializeIncidentJson(incident: Incident): string {
  return JSON.stringify(incident, null, 2);
}

/** Serialize incident to Markdown — guaranteed sanitized (no raw secrets). */
export function serializeIncidentMarkdown(incident: Incident): string {
  const lines: string[] = [
    `# Secret Exposure Incident Report`,
    ``,
    `**Incident ID:** ${incident.id}`,
    `**Created:** ${incident.createdAt}`,
    `**Discovered:** ${incident.discoveredAt}`,
    `**Severity:** ${incident.severity}`,
    `**Environment:** ${incident.environment}`,
    `**Status:** ${incident.status}`,
  ];

  if (incident.reporter) {
    lines.push(`**Reporter:** ${incident.reporter}`);
  }
  if (incident.application) {
    lines.push(`**Application:** ${incident.application}`);
  }

  lines.push(``, `## Findings (${incident.findings.length})`, ``);

  if (incident.findings.length === 0) {
    lines.push(`_No scanned findings — guided containment plan._`, ``);
  } else {
    for (const f of incident.findings) {
      lines.push(
        `- **${f.maskedLabel}** — ${f.provider}/${f.category}, confidence: ${f.confidence}, severity: ${f.severity}`,
      );
    }
    lines.push(``);
  }

  lines.push(`## Action Plan`, ``);
  for (const action of incident.actions.sort((a, b) => a.order - b.order)) {
    lines.push(`### ${action.order}. ${action.title}`, ``);
    lines.push(`**Why:** ${action.why}`, ``);
    lines.push(`**Impact:** ${action.impact}`, ``);
    lines.push(`**Owner:** ${action.suggestedOwnerRole}`, ``);
    if (action.adminDestination) {
      lines.push(`**Admin:** ${action.adminDestination}`, ``);
    }
  }

  lines.push(`## Verification Checklist`, ``);
  for (const item of incident.verification) {
    lines.push(`- [ ] ${item.description}`);
  }

  return lines.join("\n");
}
