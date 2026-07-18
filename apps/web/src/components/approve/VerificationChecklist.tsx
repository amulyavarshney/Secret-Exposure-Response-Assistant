"use client";

import type { Incident } from "@secret-response/shared";
import { useIncident } from "../../context/incident-context";

export function VerificationChecklist({ incident }: { incident: Incident }) {
  const { toggleVerificationItem, progress } = useIncident();

  const pct =
    progress.verificationTotal > 0
      ? Math.round(
          (progress.verificationDone / progress.verificationTotal) * 100,
        )
      : 0;

  return (
    <div className="card">
      <h2 className="card-title">Confirm everything is fixed</h2>
      <p className="muted" style={{ marginTop: 0 }}>
        Check off each item once you have verified the old credential no longer
        works and the new one is in place.
      </p>
      <p className="muted" style={{ marginTop: 0, marginBottom: "0.75rem" }}>
        {progress.verificationDone} of {progress.verificationTotal} checked ({pct}
        %)
      </p>
      <div className="progress-bar" aria-hidden>
        <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
      </div>

      <ul className="verification-list" style={{ marginTop: "1rem" }}>
        {incident.verification.map((item) => (
          <li key={item.id}>
            <input
              type="checkbox"
              checked={item.completed}
              onChange={(e) =>
                toggleVerificationItem(item.id, e.target.checked)
              }
              id={`verify-${item.id}`}
            />
            <label htmlFor={`verify-${item.id}`}>{item.description}</label>
          </li>
        ))}
      </ul>
    </div>
  );
}
