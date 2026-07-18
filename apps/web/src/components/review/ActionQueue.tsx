"use client";

import type { Incident } from "@secret-response/shared";

export function ActionQueue({ incident }: { incident: Incident }) {
  const sorted = [...incident.actions].sort((a, b) => a.order - b.order);

  return (
    <div className="card">
      <h2 className="card-title">What to do, in order</h2>
      <p className="muted" style={{ marginTop: 0 }}>
        Steps are ordered by urgency and dependencies — finish each one before
        moving to steps that rely on it.
      </p>

      {sorted.map((action) => {
        const isNext = action.id === incident.nextActionId;
        return (
          <div
            key={action.id}
            className={`action-item ${isNext ? "next-action" : ""}`}
          >
            <div className="action-item-header">
              <div>
                <span className="muted" style={{ fontSize: "0.75rem" }}>
                  #{action.order}
                  {isNext ? " · Recommended next" : ""}
                </span>
                <div style={{ fontWeight: 600 }}>{action.title}</div>
              </div>
              <span className={`severity-badge severity-${action.status === "done" ? "Low" : "Medium"}`}>
                {action.status.replace("_", " ")}
              </span>
            </div>
            <p style={{ fontSize: "0.875rem", margin: "0.35rem 0" }}>
              {action.why}
            </p>
            <dl className="action-meta">
              <dt>Impact</dt>
              <dd>{action.impact}</dd>
              <dt>Who</dt>
              <dd>{action.suggestedOwnerRole}</dd>
              {action.adminDestination && (
                <>
                  <dt>Where</dt>
                  <dd>
                    <a
                      href={action.adminDestination}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Open admin console
                    </a>
                  </dd>
                </>
              )}
            </dl>
            {action.verificationSteps.length > 0 && (
              <details style={{ fontSize: "0.8rem", marginTop: "0.5rem" }}>
                <summary style={{ cursor: "pointer", color: "var(--text-muted)" }}>
                  How to confirm this step is done ({action.verificationSteps.length})
                </summary>
                <ul style={{ margin: "0.35rem 0 0", paddingLeft: "1.25rem" }}>
                  {action.verificationSteps.map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        );
      })}
    </div>
  );
}
