"use client";

import type { ActionStatus, Incident } from "@secret-response/shared";
import { useIncident } from "../../context/incident-context";

const STATUS_OPTIONS: ActionStatus[] = [
  "pending",
  "in_progress",
  "done",
  "skipped",
];

export function ActionTracker({ incident }: { incident: Incident }) {
  const { setActionStatus, actionAssignments, setActionAssignment } =
    useIncident();

  const sorted = [...incident.actions].sort((a, b) => a.order - b.order);

  return (
    <div className="card">
      <h2 className="card-title">Track remediation steps</h2>
      <p className="muted" style={{ marginTop: 0 }}>
        Mark steps as you complete them. Assign owners for handoff.
      </p>

      {sorted.map((action) => (
        <div key={action.id} className="action-item">
          <div className="action-item-header">
            <div style={{ fontWeight: 600 }}>
              #{action.order} {action.title}
            </div>
            <select
              className="action-status-select"
              value={action.status}
              onChange={(e) =>
                setActionStatus(action.id, e.target.value as ActionStatus)
              }
              aria-label={`Status for ${action.title}`}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s.replace("_", " ")}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0, marginTop: "0.5rem" }}>
            <label htmlFor={`assign-${action.id}`}>Assigned to</label>
            <input
              id={`assign-${action.id}`}
              value={actionAssignments[action.id]?.assignee ?? ""}
              onChange={(e) => setActionAssignment(action.id, e.target.value)}
              placeholder={action.suggestedOwnerRole}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
