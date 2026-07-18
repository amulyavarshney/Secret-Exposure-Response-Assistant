"use client";

import { useIncident } from "../../context/incident-context";
import { ActionTracker } from "./ActionTracker";
import { ConnectorActions } from "./ConnectorActions";
import { ExportPanel } from "./ExportPanel";
import { VerificationChecklist } from "./VerificationChecklist";

export function ApproveStep() {
  const { session, setStep, resetWizard, progress } = useIncident();

  if (!session) {
    return (
      <div className="card">
        <p>No incident loaded.</p>
        <button type="button" className="btn" onClick={() => setStep(1)}>
          Back to provide
        </button>
      </div>
    );
  }

  const actionPct =
    progress.actionsTotal > 0
      ? Math.round((progress.actionsDone / progress.actionsTotal) * 100)
      : 0;

  return (
    <>
      <div className="card">
        <h2 className="card-title">Step 3 — Track progress & hand off</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          Mark steps done as you go, assign owners, download a safe report, and
          optionally open a ticket or send a notification — only masked details
          are shared.
        </p>
        <p style={{ fontSize: "0.875rem" }}>
          Steps completed: {progress.actionsDone}/{progress.actionsTotal}{" "}
          ({actionPct}%)
        </p>
        <div className="progress-bar">
          <div className="progress-bar-fill" style={{ width: `${actionPct}%` }} />
        </div>
      </div>

      <ActionTracker incident={session.incident} />
      <VerificationChecklist incident={session.incident} />
      <ExportPanel />
      <ConnectorActions />

      <div className="step-actions">
        <button type="button" className="btn btn-ghost" onClick={resetWizard}>
          Start over
        </button>
        <button type="button" className="btn" onClick={() => setStep(2)}>
          Back to review
        </button>
      </div>
    </>
  );
}
