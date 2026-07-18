"use client";

import type { WizardStep } from "../lib/types";

const STEPS: { num: WizardStep; label: string }[] = [
  { num: 1, label: "Share details" },
  { num: 2, label: "Review plan" },
  { num: 3, label: "Track progress" },
];

export function StepIndicator({ current }: { current: WizardStep }) {
  return (
    <div className="step-indicator" aria-label="Progress">
      {STEPS.map(({ num, label }) => {
        const cls = [
          "step-indicator-item",
          num === current ? "active" : "",
          num < current ? "done" : "",
        ]
          .filter(Boolean)
          .join(" ");
        return (
          <div key={num} className={cls}>
            {num}. {label}
          </div>
        );
      })}
    </div>
  );
}
