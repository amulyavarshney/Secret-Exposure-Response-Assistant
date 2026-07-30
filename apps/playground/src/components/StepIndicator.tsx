import type { WizardStep } from "../lib/types";

const STEPS: { step: WizardStep; label: string }[] = [
  { step: 1, label: "Provide" },
  { step: 2, label: "Review" },
  { step: 3, label: "Track" },
];

interface StepIndicatorProps {
  current: WizardStep;
}

export function StepIndicator({ current }: StepIndicatorProps) {
  return (
    <nav className="step-indicator" aria-label="Wizard progress">
      {STEPS.map(({ step, label }) => {
        const isActive = step === current;
        const isDone = step < current;
        const className = [
          "step-indicator-item",
          isActive ? "active" : "",
          isDone ? "done" : "",
        ]
          .filter(Boolean)
          .join(" ");

        return (
          <div
            key={step}
            className={className}
            aria-current={isActive ? "step" : undefined}
          >
            {step}. {label}
          </div>
        );
      })}
    </nav>
  );
}
