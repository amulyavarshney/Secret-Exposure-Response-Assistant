import type { Environment, ExposureChannel, Incident } from "@secret-response/shared";

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
}

export type AppView = "landing" | "wizard";
