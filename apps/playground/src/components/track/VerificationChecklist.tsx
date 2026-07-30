import type { Incident } from "@secret-response/shared";
import { useIncident } from "../../context/incident-context";

export function VerificationChecklist({ incident }: { incident: Incident }) {
  const { toggleVerificationItem } = useIncident();

  if (incident.verification.length === 0) {
    return null;
  }

  return (
    <div className="panel">
      <h2 className="panel-title">Verification checklist</h2>
      <p className="muted" style={{ marginTop: 0 }}>
        Confirm each item before closing the incident.
      </p>
      <ul className="verify-list">
        {incident.verification.map((item) => (
          <li key={item.id}>
            <input
              type="checkbox"
              id={item.id}
              checked={item.completed}
              onChange={(e) =>
                toggleVerificationItem(item.id, e.target.checked)
              }
            />
            <label htmlFor={item.id}>{item.description}</label>
          </li>
        ))}
      </ul>
    </div>
  );
}
