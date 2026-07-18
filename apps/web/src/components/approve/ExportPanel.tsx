"use client";

import {
  downloadText,
  exportIncidentJson,
  exportIncidentMarkdown,
} from "../../lib/export";
import { useIncident } from "../../context/incident-context";

export function ExportPanel() {
  const { session, progressive, actionAssignments } = useIncident();
  if (!session) return null;

  const meta = {
    actionAssignments,
    incidentCommander: progressive.incidentCommander,
    hasActiveOutage: progressive.hasActiveOutage,
    hasOpenIncident: progressive.hasOpenIncident,
  };

  const { incident } = session;

  return (
    <div className="card">
      <h2 className="card-title">Export sanitized report</h2>
      <p className="muted" style={{ marginTop: 0 }}>
        Downloads contain masked labels only — never raw secret values.
      </p>
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <button
          type="button"
          className="btn"
          onClick={() =>
            downloadText(
              `incident-${incident.id}.md`,
              exportIncidentMarkdown(incident, meta),
              "text/markdown",
            )
          }
        >
          Download Markdown
        </button>
        <button
          type="button"
          className="btn"
          onClick={() =>
            downloadText(
              `incident-${incident.id}.json`,
              exportIncidentJson(incident, meta),
              "application/json",
            )
          }
        >
          Download JSON
        </button>
      </div>
    </div>
  );
}
