import { useIncident } from "../../context/incident-context";
import { ActionTracker } from "../track/ActionTracker";
import { ExportPanel } from "../track/ExportPanel";
import { VerificationChecklist } from "../track/VerificationChecklist";

export function TrackStep() {
  const { session, setStep, resetWizard, progress } = useIncident();

  if (!session) {
    return (
      <div className="panel">
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
      <div className="panel">
        <h2 className="panel-title">Step 3 — Track progress</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          Mark steps done as you go, assign owners, and download a safe report.
        </p>
        <p style={{ fontSize: "0.875rem" }}>
          Steps completed: {progress.actionsDone}/{progress.actionsTotal} (
          {actionPct}%)
        </p>
        <div className="progress-bar">
          <div
            className="progress-bar-fill"
            style={{ width: `${actionPct}%` }}
          />
        </div>
      </div>

      <ActionTracker incident={session.incident} />
      <VerificationChecklist incident={session.incident} />
      <ExportPanel />

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
