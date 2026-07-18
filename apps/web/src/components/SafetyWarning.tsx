import { PRE_SUBMIT_WARNING, SAFETY_NOTE } from "../lib/constants";

export function SafetyWarning() {
  return (
    <div className="warning-banner" role="alert">
      <strong>Before you submit</strong>
      {PRE_SUBMIT_WARNING}
      <p style={{ margin: "0.5rem 0 0", fontSize: "0.8rem", opacity: 0.85 }}>
        {SAFETY_NOTE}
      </p>
    </div>
  );
}
