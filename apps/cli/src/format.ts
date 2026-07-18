import type { Finding, Incident, RemediationAction } from "@secret-response/shared";

export function hasActionableFindings(findings: Finding[]): boolean {
  return findings.some(
    (f) => f.confidence !== "placeholder" && f.confidence !== "non_secret",
  );
}

export function formatScanSummary(incident: Incident, source?: string): string {
  const lines: string[] = [
    "Secret Exposure Scan",
    `Severity: ${incident.severity}`,
    `Findings: ${incident.findings.length}`,
  ];

  if (source) {
    lines.push(`Source: ${source}`);
  }

  if (incident.findings.length === 0) {
    lines.push("", "No secrets detected.");
  } else {
    lines.push("");
    incident.findings.forEach((finding, index) => {
      lines.push(`[${index + 1}] ${finding.maskedLabel}`);
      lines.push(
        `    ${finding.provider}/${finding.category} | confidence: ${finding.confidence} | severity: ${finding.severity}${formatLineNumber(finding.lineNumber)}`,
      );
    });
  }

  const nextAction = getNextAction(incident);
  if (nextAction) {
    lines.push("", `Next action: ${nextAction.title}`);
  }

  return lines.join("\n");
}

export function formatPlan(incident: Incident): string {
  const lines: string[] = [
    `Action Plan (${incident.actions.length} step${incident.actions.length === 1 ? "" : "s"})`,
    `Severity: ${incident.severity}`,
    "",
  ];

  if (incident.actions.length === 0) {
    lines.push("No remediation actions — scan was clean.");
    return lines.join("\n");
  }

  for (const action of [...incident.actions].sort((a, b) => a.order - b.order)) {
    lines.push(`${action.order}. ${action.title}`);
    lines.push(`   Why: ${action.why}`);
    lines.push(`   Impact: ${action.impact}`);
    lines.push(`   Owner: ${action.suggestedOwnerRole}`);
    if (action.adminDestination) {
      lines.push(`   Admin: ${action.adminDestination}`);
    }
    lines.push("");
  }

  const nextAction = getNextAction(incident);
  if (nextAction) {
    lines.push(`Recommended next: ${nextAction.order}. ${nextAction.title}`);
  }

  return lines.join("\n").trimEnd();
}

function getNextAction(incident: Incident): RemediationAction | undefined {
  if (!incident.nextActionId) return undefined;
  return incident.actions.find((action) => action.id === incident.nextActionId);
}

function formatLineNumber(lineNumber?: number): string {
  return lineNumber !== undefined ? ` | line: ${lineNumber}` : "";
}
