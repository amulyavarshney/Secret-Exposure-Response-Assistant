import {
  buildGuidedIncident,
  buildIncidentFromScan,
  configureFingerprintSalt,
  scanContent,
} from "@secret-response/core";
import type {
  Environment,
  ExposureChannel,
  Finding,
  GuidedIncidentInput,
  Incident,
} from "@secret-response/shared";
import { loadSettings } from "./settings";

export interface ScanInput {
  content?: string;
  channel: ExposureChannel;
  filename?: string;
  environmentHint?: Environment;
  guided?: GuidedIncidentInput;
}

/** Run scan in browser; raw content is not returned or persisted. */
export function runClientScan(input: ScanInput): Incident {
  const settings = loadSettings();

  if (settings.fingerprintSalt) {
    configureFingerprintSalt(settings.fingerprintSalt);
  }

  if (input.guided) {
    return buildGuidedIncident({
      ...input.guided,
      channel: "guided_form",
      reporter: input.guided.reporter ?? settings.reporter,
    });
  }

  if (!input.content?.trim()) {
    throw new Error("No content provided for scan.");
  }

  const { findings } = scanContent(input.content, {
    channel: input.channel,
    filename: input.filename,
    environmentHint: input.environmentHint ?? settings.defaultEnvironment,
    fingerprintSalt: settings.fingerprintSalt,
  });

  // Content discarded — only sanitized findings proceed
  return buildIncidentFromScan(findings, {
    channel: input.channel,
    reporter: settings.reporter,
    environment: input.environmentHint ?? settings.defaultEnvironment,
    systems: input.filename ? [input.filename] : undefined,
  });
}

export function rebuildIncidentWithEnvironment(
  findings: Finding[],
  environment: Environment,
  channel: ExposureChannel,
  systems?: string[],
): Incident {
  return buildIncidentFromScan(findings, {
    channel,
    environment,
    systems,
    reporter: loadSettings().reporter,
  });
}

export function isAcceptedFile(name: string): boolean {
  const lower = name.toLowerCase();
  return (
    lower.endsWith(".env") ||
    lower.includes(".env.") ||
    [
      ".txt",
      ".log",
      ".json",
      ".yaml",
      ".yml",
      ".properties",
      ".sh",
      ".bash",
      ".zsh",
      ".tf",
      ".tfvars",
    ].some((ext) => lower.endsWith(ext)) ||
    /(\.ya?ml|Dockerfile|Jenkinsfile|\.gitlab-ci\.yml|\.github\/workflows\/)/i.test(
      lower,
    )
  );
}
