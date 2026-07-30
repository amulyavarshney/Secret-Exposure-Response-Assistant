import { useIncident } from "../../context/incident-context";
import { ActionQueue } from "../review/ActionQueue";
import { IncidentSummary } from "../review/IncidentSummary";
import { ProgressiveQuestions } from "../review/ProgressiveQuestions";

export function ReviewStep() {
  const { session, setStep, resetWizard } = useIncident();

  if (!session) {
    return (
      <div className="panel">
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
        <div className="step-actions-group">
          <button type="button" className="btn" onClick={() => setStep(1)}>
            Back
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setStep(3)}
          >
            Continue to track
          </button>
        </div>
      </div>
    </>
  );
}
