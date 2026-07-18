import {
  getNextActionId,
  serializeIncidentJson,
  serializeIncidentMarkdown,
} from "@secret-response/core";
import type { ActionStatus, Incident } from "@secret-response/shared";

export interface ActionAssignment {
  assignee?: string;
}

export interface ExportMeta {
  actionAssignments?: Record<string, ActionAssignment>;
  incidentCommander?: string;
  hasActiveOutage?: boolean;
  hasOpenIncident?: boolean;
}

export function downloadText(
  filename: string,
  content: string,
  mime = "text/plain",
): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function exportIncidentJson(
  incident: Incident,
  meta?: ExportMeta,
): string {
  const enriched = enrichIncidentForExport(incident, meta);
  return serializeIncidentJson(enriched);
}

export function exportIncidentMarkdown(
  incident: Incident,
  meta?: ExportMeta,
): string {
  const base = serializeIncidentMarkdown(incident);
  const extras: string[] = [];

  if (meta?.incidentCommander) {
    extras.push(`**Incident Commander:** ${meta.incidentCommander}`);
  }
  if (meta?.hasActiveOutage !== undefined) {
    extras.push(
      `**Active outage reported:** ${meta.hasActiveOutage ? "Yes" : "No"}`,
    );
  }
  if (meta?.hasOpenIncident !== undefined) {
    extras.push(
      `**Existing open incident:** ${meta.hasOpenIncident ? "Yes" : "No"}`,
    );
  }

  const assignments = meta?.actionAssignments;
  if (assignments && Object.keys(assignments).length > 0) {
    extras.push("", "## Assignments", "");
    for (const action of incident.actions) {
      const assignee = assignments[action.id]?.assignee;
      if (assignee) {
        extras.push(`- **${action.title}** → ${assignee}`);
      }
    }
  }

  if (extras.length === 0) return base;
  return base + "\n\n" + extras.join("\n");
}

function enrichIncidentForExport(
  incident: Incident,
  meta?: ExportMeta,
): Incident & ExportMeta {
  return {
    ...incident,
    nextActionId: getNextActionId(incident.actions) ?? incident.nextActionId,
    ...meta,
  };
}

export function updateActionStatus(
  incident: Incident,
  actionId: string,
  status: ActionStatus,
): Incident {
  const actions = incident.actions.map((a) =>
    a.id === actionId ? { ...a, status } : a,
  );
  return {
    ...incident,
    actions,
    nextActionId: getNextActionId(actions) ?? incident.nextActionId,
  };
}

export function toggleVerification(
  incident: Incident,
  verificationId: string,
  completed: boolean,
): Incident {
  return {
    ...incident,
    verification: incident.verification.map((v) =>
      v.id === verificationId ? { ...v, completed } : v,
    ),
  };
}

export function completionProgress(incident: Incident): {
  actionsDone: number;
  actionsTotal: number;
  verificationDone: number;
  verificationTotal: number;
} {
  const actionsDone = incident.actions.filter(
    (a) => a.status === "done" || a.status === "skipped",
  ).length;
  const verificationDone = incident.verification.filter((v) => v.completed)
    .length;

  return {
    actionsDone,
    actionsTotal: incident.actions.length,
    verificationDone,
    verificationTotal: incident.verification.length,
  };
}
