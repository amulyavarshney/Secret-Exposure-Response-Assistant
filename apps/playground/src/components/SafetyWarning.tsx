import { PRE_SUBMIT_WARNING } from "../lib/constants";

export function SafetyWarning() {
  return (
    <div className="warning-banner" role="note">
      <strong>Before you scan:</strong> {PRE_SUBMIT_WARNING}
    </div>
  );
}
