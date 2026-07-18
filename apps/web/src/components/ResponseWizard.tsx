"use client";

import { useIncident } from "../context/incident-context";
import { ApproveStep } from "../components/approve/ApproveStep";
import { ProvideStep } from "../components/provide/ProvideStep";
import { ReviewStep } from "../components/review/ReviewStep";
import { SafetyWarning } from "../components/SafetyWarning";
import { StepIndicator } from "../components/StepIndicator";

export function ResponseWizard() {
  const { step } = useIncident();

  return (
    <>
      <StepIndicator current={step} />
      {step === 1 && <SafetyWarning />}
      {step === 1 && <ProvideStep />}
      {step === 2 && <ReviewStep />}
      {step === 3 && <ApproveStep />}
    </>
  );
}
