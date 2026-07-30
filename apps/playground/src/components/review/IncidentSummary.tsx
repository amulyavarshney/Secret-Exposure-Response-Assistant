import type { Incident } from "@secret-response/shared";

function SeverityBadge({ severity }: { severity: Incident["severity"] }) {
  return (
    <span className={`severity-badge severity-${severity}`}>{severity}</span>
  );
}

export function IncidentSummary({ incident }: { incident: Incident }) {
  const nextAction = incident.actions.find(
    (a) => a.id === incident.nextActionId,
  );

  return (
    <div className="panel">
      <h2 className="panel-title">Step 2 — Review incident</h2>

      <div className="summary-grid">
        <div className="summary-stat">
          <div className="label">Severity</div>
          <div className="value">
            <SeverityBadge severity={incident.severity} />
          </div>
        </div>
        <div className="summary-stat">
          <div className="label">Environment</div>
          <div className="value">{incident.environment}</div>
        </div>
        <div className="summary-stat">
          <div className="label">Findings</div>
          <div className="value">{incident.findings.length}</div>
        </div>
        <div className="summary-stat">
          <div className="label">Actions</div>
          <div className="value">{incident.actions.length}</div>
        </div>
      </div>

      {nextAction && (
        <div className="next-action-highlight">
          <div className="next-action-label">Do this next</div>
          <div style={{ fontWeight: 600, marginBottom: "0.35rem" }}>
            {nextAction.title}
          </div>
          <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
            {nextAction.why}
          </div>
          <div
            style={{
              fontSize: "0.8rem",
              color: "var(--text-muted)",
              marginTop: "0.5rem",
            }}
          >
            Who should do this:{" "}
            <strong>{nextAction.suggestedOwnerRole}</strong>
          </div>
        </div>
      )}

      {incident.findings.length > 0 && (
        <>
          <h3
            style={{
              fontSize: "0.85rem",
              margin: "1.25rem 0 0.5rem",
              color: "var(--text-secondary)",
            }}
          >
            Detected credentials (values hidden)
          </h3>
          <ul className="finding-list">
            {incident.findings.map((f) => (
              <li key={f.id}>
                <span>{f.maskedLabel}</span>
                <span className="muted">
                  {f.confidence} · {f.provider}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
