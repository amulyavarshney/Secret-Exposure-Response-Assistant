export type ConfidenceLabel =
  | "confirmed"
  | "high"
  | "possible"
  | "placeholder"
  | "non_secret";

export type Severity = "Critical" | "High" | "Medium" | "Low";

export type Environment =
  | "production"
  | "staging"
  | "development"
  | "unknown";

export type SecretProvider =
  | "aws"
  | "stripe"
  | "jwt"
  | "smtp"
  | "database"
  | "pem"
  | "generic_api"
  | "unknown";

export type SecretCategory =
  | "access_key"
  | "secret_key"
  | "api_token"
  | "password"
  | "private_key"
  | "connection_string"
  | "webhook_secret"
  | "publishable_key"
  | "session_token"
  | "other";

export type ExposureChannel =
  | "paste"
  | "file_upload"
  | "cli_scan"
  | "guided_form"
  | "unknown";

export type ActionStatus = "pending" | "in_progress" | "done" | "skipped";

export type IncidentStatus =
  | "open"
  | "contained"
  | "resolved"
  | "monitoring";

export interface Finding {
  id: string;
  provider: SecretProvider;
  category: SecretCategory;
  confidence: ConfidenceLabel;
  maskedLabel: string;
  fingerprint: string;
  severity: Severity;
  lineNumber?: number;
  keyName?: string;
  environment: Environment;
}

export interface RemediationAction {
  id: string;
  order: number;
  title: string;
  why: string;
  impact: string;
  permissions: string[];
  suggestedOwnerRole: string;
  adminDestination?: string;
  verificationSteps: string[];
  rollbackNotes?: string;
  status: ActionStatus;
  dependsOn?: string[];
  provider: SecretProvider;
  findingIds: string[];
}

export interface VerificationItem {
  id: string;
  description: string;
  completed: boolean;
  relatedActionId?: string;
  relatedFindingId?: string;
}

export interface ScanInput {
  content: string;
  channel?: ExposureChannel;
  filename?: string;
  environmentHint?: Environment;
}

export interface ScanOptions {
  /** Keyed salt for HMAC fingerprints — never store raw secrets. */
  fingerprintSalt?: string;
  channel?: ExposureChannel;
  environmentHint?: Environment;
  filename?: string;
}

export interface ScanResult {
  findings: Finding[];
  rawMatchCount: number;
  scannedAt: string;
}

export interface IncidentInput {
  findings: Finding[];
  actions: RemediationAction[];
  reporter?: string;
  channel?: ExposureChannel;
  application?: string;
  environment?: Environment;
  discoveredAt?: string;
  systems?: string[];
}

export interface Incident {
  id: string;
  createdAt: string;
  discoveredAt: string;
  reporter?: string;
  channel: ExposureChannel;
  application?: string;
  environment: Environment;
  findings: Finding[];
  severity: Severity;
  nextActionId?: string;
  actions: RemediationAction[];
  status: IncidentStatus;
  verification: VerificationItem[];
  systems: string[];
}

export interface GuidedIncidentInput {
  whereShared?: string;
  environment?: Environment;
  systems?: string[];
  whenDiscovered?: string;
  stillAccessible?: boolean;
  regulatedData?: boolean;
  reporter?: string;
  channel?: ExposureChannel;
  application?: string;
}

export interface ActionPlanOptions {
  environment?: Environment;
  channel?: ExposureChannel;
}
