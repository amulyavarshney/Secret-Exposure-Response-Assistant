import { useIncident } from "../../context/incident-context";
import { SafetyWarning } from "../SafetyWarning";
import { StepIndicator } from "../StepIndicator";
import { ProvideStep } from "./ProvideStep";
import { ReviewStep } from "./ReviewStep";
import { TrackStep } from "./TrackStep";

export function ResponseWizard() {
  const { step } = useIncident();

  return (
    <div className="wizard-section" key={step}>
      <StepIndicator current={step} />
      {step === 1 && <SafetyWarning />}
      {step === 1 && <ProvideStep />}
      {step === 2 && <ReviewStep />}
      {step === 3 && <TrackStep />}
    </div>
  );
}
