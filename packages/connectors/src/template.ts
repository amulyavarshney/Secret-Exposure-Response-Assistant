import type { Incident } from "@secret-response/shared";

export interface IncidentSummary {
  title: string;
  description: string;
  categories: string[];
}

function formatFindingCategories(incident: Incident): string[] {
  if (incident.findings.length === 0) {
    return ["No scanned findings — guided containment plan"];
  }

  return incident.findings.map(
    (finding) =>
      `${finding.provider}/${finding.category}: ${finding.maskedLabel} (${finding.confidence}, ${finding.severity})`,
  );
}

function formatNextAction(incident: Incident): string | undefined {
  if (!incident.nextActionId) {
    return undefined;
  }

  const action = incident.actions.find((a) => a.id === incident.nextActionId);
  return action ? `${action.order}. ${action.title}` : undefined;
}

/** Build sanitized ticket/notification text from an incident record. */
export function buildIncidentSummary(
  incident: Incident,
  incidentLink?: string,
): IncidentSummary {
  const categories = formatFindingCategories(incident);
  const nextAction = formatNextAction(incident);

  const lines: string[] = [
    "Secret Exposure Response Assistant — sanitized incident summary",
    "",
    `Incident ID: ${incident.id}`,
    `Severity: ${incident.severity}`,
    `Environment: ${incident.environment}`,
    `Status: ${incident.status}`,
    `Discovered: ${incident.discoveredAt}`,
    `Channel: ${incident.channel}`,
  ];

  if (incident.reporter) {
    lines.push(`Reporter: ${incident.reporter}`);
  }
  if (incident.application) {
    lines.push(`Application: ${incident.application}`);
  }
  if (incident.systems.length > 0) {
    lines.push(`Systems: ${incident.systems.join(", ")}`);
  }
  if (incidentLink) {
    lines.push(`Tracking link: ${incidentLink}`);
  }

  lines.push("", "Exposed credential categories (masked only):");
  for (const category of categories) {
    lines.push(`- ${category}`);
  }

  if (nextAction) {
    lines.push("", `Recommended next action: ${nextAction}`);
  }

  const pendingActions = incident.actions
    .filter((action) => action.status === "pending")
    .sort((a, b) => a.order - b.order)
    .slice(0, 5);

  if (pendingActions.length > 0) {
    lines.push("", "Pending remediation steps:");
    for (const action of pendingActions) {
      lines.push(`- ${action.order}. ${action.title} (owner: ${action.suggestedOwnerRole})`);
    }
  }

  lines.push(
    "",
    "This message contains masked labels and metadata only — no raw secret values.",
  );

  const title = `[${incident.severity}] Secret exposure — ${incident.id}`;

  return {
    title,
    description: lines.join("\n"),
    categories,
  };
}
