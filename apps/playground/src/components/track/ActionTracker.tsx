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
    <div className="panel">
      <h2 className="panel-title">Track remediation steps</h2>
      <p className="muted" style={{ marginTop: 0 }}>
        Mark steps as you complete them. Assign owners for handoff.
      </p>

      {sorted.map((action) => {
        const isNext = action.id === incident.nextActionId;
        return (
          <div
            key={action.id}
            className={`action-item ${isNext ? "next-action" : ""}`}
          >
            <div className="action-item-header">
              <div style={{ fontWeight: 600 }}>
                #{action.order} {action.title}
                {isNext && (
                  <span
                    className="muted"
                    style={{ fontSize: "0.75rem", marginLeft: "0.5rem" }}
                  >
                    · next
                  </span>
                )}
              </div>
            </div>

            <div className="action-status-row">
              {STATUS_OPTIONS.map((status) => (
                <button
                  key={status}
                  type="button"
                  className={`status-chip ${action.status === status ? "selected" : ""}`}
                  onClick={() => setActionStatus(action.id, status)}
                >
                  {status.replace("_", " ")}
                </button>
              ))}
            </div>

            <div className="form-group assignee-input">
              <label htmlFor={`assign-${action.id}`}>Assigned to</label>
              <input
                id={`assign-${action.id}`}
                type="text"
                value={actionAssignments[action.id]?.assignee ?? ""}
                onChange={(e) => setActionAssignment(action.id, e.target.value)}
                placeholder={action.suggestedOwnerRole}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
