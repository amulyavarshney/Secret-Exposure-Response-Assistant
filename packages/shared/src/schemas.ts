import { z } from "zod";

export const ConfidenceLabelSchema = z.enum([
  "confirmed",
  "high",
  "possible",
  "placeholder",
  "non_secret",
]);

export const SeveritySchema = z.enum(["Critical", "High", "Medium", "Low"]);

export const EnvironmentSchema = z.enum([
  "production",
  "staging",
  "development",
  "unknown",
]);

export const SecretProviderSchema = z.enum([
  "aws",
  "stripe",
  "jwt",
  "smtp",
  "database",
  "pem",
  "generic_api",
  "unknown",
]);

export const SecretCategorySchema = z.enum([
  "access_key",
  "secret_key",
  "api_token",
  "password",
  "private_key",
  "connection_string",
  "webhook_secret",
  "publishable_key",
  "session_token",
  "other",
]);

export const ExposureChannelSchema = z.enum([
  "paste",
  "file_upload",
  "cli_scan",
  "guided_form",
  "unknown",
]);

export const ActionStatusSchema = z.enum([
  "pending",
  "in_progress",
  "done",
  "skipped",
]);

export const IncidentStatusSchema = z.enum([
  "open",
  "contained",
  "resolved",
  "monitoring",
]);

export const FindingSchema = z.object({
  id: z.string(),
  provider: SecretProviderSchema,
  category: SecretCategorySchema,
  confidence: ConfidenceLabelSchema,
  maskedLabel: z.string(),
  fingerprint: z.string(),
  severity: SeveritySchema,
  lineNumber: z.number().optional(),
  keyName: z.string().optional(),
  environment: EnvironmentSchema,
});

export const RemediationActionSchema = z.object({
  id: z.string(),
  order: z.number(),
  title: z.string(),
  why: z.string(),
  impact: z.string(),
  permissions: z.array(z.string()),
  suggestedOwnerRole: z.string(),
  adminDestination: z.string().optional(),
  verificationSteps: z.array(z.string()),
  rollbackNotes: z.string().optional(),
  status: ActionStatusSchema,
  dependsOn: z.array(z.string()).optional(),
  provider: SecretProviderSchema,
  findingIds: z.array(z.string()),
});

export const VerificationItemSchema = z.object({
  id: z.string(),
  description: z.string(),
  completed: z.boolean(),
  relatedActionId: z.string().optional(),
  relatedFindingId: z.string().optional(),
});

export const ScanResultSchema = z.object({
  findings: z.array(FindingSchema),
  rawMatchCount: z.number(),
  scannedAt: z.string(),
});

export const IncidentSchema = z.object({
  id: z.string(),
  createdAt: z.string(),
  discoveredAt: z.string(),
  reporter: z.string().optional(),
  channel: ExposureChannelSchema,
  application: z.string().optional(),
  environment: EnvironmentSchema,
  findings: z.array(FindingSchema),
  severity: SeveritySchema,
  nextActionId: z.string().optional(),
  actions: z.array(RemediationActionSchema),
  status: IncidentStatusSchema,
  verification: z.array(VerificationItemSchema),
  systems: z.array(z.string()),
});
