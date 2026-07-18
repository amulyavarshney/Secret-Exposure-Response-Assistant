import type {
  ConfidenceLabel,
  Environment,
  ExposureChannel,
  SecretCategory,
  SecretProvider,
} from "@secret-response/shared";

export interface RawMatch {
  /** Internal only — never exported from scan results. */
  rawValue: string;
  start: number;
  end: number;
  lineNumber: number;
  provider: SecretProvider;
  category: SecretCategory;
  confidence: ConfidenceLabel;
  keyName?: string;
}

export interface DetectorContext {
  content: string;
  lines: string[];
  environmentHint?: Environment;
  filename?: string;
}

export interface Detector {
  name: string;
  /** Lower runs first for deduplication priority. */
  priority: number;
  detect(ctx: DetectorContext): RawMatch[];
}

export interface SeverityInput {
  provider: SecretProvider;
  category: SecretCategory;
  confidence: ConfidenceLabel;
  environment: Environment;
  channel: ExposureChannel;
}

export const PLACEHOLDER_PATTERNS = [
  /^changeme$/i,
  /^your[_-]?api[_-]?key$/i,
  /^xxx+$/i,
  /^placeholder$/i,
  /^example$/i,
  /^<[^>]+>$/,
  /^\$\{[^}]+\}$/,
  /^TODO$/i,
  /^REPLACE[_-]?ME$/i,
  /^INSERT[_-]?HERE$/i,
  /^dummy$/i,
  /^test123$/i,
  /^password123$/i,
  /^sk_test_xxx+$/i,
  /^pk_test_xxx+$/i,
];

export const DEV_ENV_KEY_PATTERNS = [
  /dev/i,
  /local/i,
  /sandbox/i,
  /test/i,
  /staging/i,
  /qa/i,
];

export const PROD_ENV_KEY_PATTERNS = [
  /prod/i,
  /production/i,
  /live/i,
  /prd/i,
];
