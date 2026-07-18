"use client";

import { useIncident } from "../../context/incident-context";
import { ActionQueue } from "./ActionQueue";
import { IncidentSummary } from "./IncidentSummary";
import { ProgressiveQuestions } from "./ProgressiveQuestions";

export function ReviewStep() {
  const { session, setStep, resetWizard } = useIncident();

  if (!session) {
    return (
      <div className="card">
        <p>No incident loaded. Go back to provide content.</p>
        <button type="button" className="btn" onClick={() => setStep(1)}>
          Back to provide
        </button>
      </div>
    );
  }

  return (
    <>
      <IncidentSummary incident={session.incident} />
      <ProgressiveQuestions />
      <ActionQueue incident={session.incident} />

      <div className="step-actions">
        <button type="button" className="btn btn-ghost" onClick={resetWizard}>
          Start over
        </button>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button type="button" className="btn" onClick={() => setStep(1)}>
            Back
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setStep(3)}
          >
            Continue to track progress
          </button>
        </div>
      </div>
    </>
  );
}
