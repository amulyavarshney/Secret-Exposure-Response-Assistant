import type { Environment, ExposureChannel, Incident } from "@secret-response/shared";
import type { ActionAssignment } from "./export";

export type WizardStep = 1 | 2 | 3;

export interface ProgressiveAnswers {
  environmentOverride?: Environment;
  hasActiveOutage?: boolean;
  hasOpenIncident?: boolean;
  incidentCommander?: string;
}

export interface IncidentSession {
  incident: Incident;
  channel: ExposureChannel;
  filename?: string;
  /** Preserved only for plan rebuilds — never displayed */
  findingsOnly: boolean;
}

export interface WizardState {
  step: WizardStep;
  session: IncidentSession | null;
  progressive: ProgressiveAnswers;
  actionAssignments: Record<string, ActionAssignment>;
  scanError: string | null;
  isScanning: boolean;
}
