import type {
  ConfidenceLabel,
  Environment,
  ExposureChannel,
  Severity,
} from "@secret-response/shared";
import type { SeverityInput } from "./types.js";

const PROVIDER_BASE_SEVERITY: Record<
  SeverityInput["provider"],
  Severity
> = {
  aws: "Critical",
  pem: "Critical",
  database: "Critical",
  stripe: "High",
  jwt: "High",
  smtp: "High",
  generic_api: "Medium",
  unknown: "Medium",
};

const ENV_MULTIPLIER: Record<Environment, number> = {
  production: 4,
  unknown: 4,
  staging: 3,
  development: 1,
};

const CHANNEL_MULTIPLIER: Record<ExposureChannel, number> = {
  paste: 1.2,
  file_upload: 1.1,
  cli_scan: 1.0,
  guided_form: 0.9,
  unknown: 1.0,
};

const CONFIDENCE_ADJUST: Record<ConfidenceLabel, number> = {
  confirmed: 0,
  high: 0,
  possible: -1,
  placeholder: -3,
  non_secret: -4,
};

const SEVERITY_ORDER: Severity[] = ["Low", "Medium", "High", "Critical"];

function severityIndex(s: Severity): number {
  return SEVERITY_ORDER.indexOf(s);
}

function indexToSeverity(index: number): Severity {
  const clamped = Math.max(0, Math.min(SEVERITY_ORDER.length - 1, index));
  return SEVERITY_ORDER[clamped]!;
}

export function resolveEnvironment(
  hint?: Environment,
  keyName?: string,
  filename?: string,
): Environment {
  if (hint && hint !== "unknown") {
    return hint;
  }

  const context = `${keyName ?? ""} ${filename ?? ""}`;
  if (PROD_ENV_KEY_PATTERNS.some((p) => p.test(context))) {
    return "production";
  }
  if (DEV_ENV_KEY_PATTERNS.some((p) => p.test(context))) {
    return "development";
  }

  return hint ?? "unknown";
}

const PROD_ENV_KEY_PATTERNS = [/prod/i, /production/i, /live/i, /prd/i];
const DEV_ENV_KEY_PATTERNS = [/dev/i, /local/i, /sandbox/i, /test/i, /staging/i, /qa/i];

export function computeSeverity(input: SeverityInput): Severity {
  if (input.confidence === "non_secret") {
    return "Low";
  }
  if (input.confidence === "placeholder") {
    return "Low";
  }

  const env = input.environment === "unknown" ? "production" : input.environment;
  let score =
    severityIndex(PROVIDER_BASE_SEVERITY[input.provider]) +
    CONFIDENCE_ADJUST[input.confidence];

  const envBoost = ENV_MULTIPLIER[env] - 2;
  score += envBoost > 0 ? 1 : envBoost < 0 ? -1 : 0;

  const channelFactor = CHANNEL_MULTIPLIER[input.channel];
  if (channelFactor > 1.05) {
    score += 1;
  }

  return indexToSeverity(score);
}

export function aggregateSeverity(severities: Severity[]): Severity {
  if (severities.length === 0) return "Low";
  return severities.reduce((max, current) =>
    severityIndex(current) > severityIndex(max) ? current : max,
  );
}

export function effectiveEnvironment(env: Environment): Environment {
  return env === "unknown" ? "production" : env;
}
