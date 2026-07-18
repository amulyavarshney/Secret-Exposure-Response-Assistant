import { mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";
import type { Incident } from "@secret-response/shared";
import { IncidentSchema } from "@secret-response/shared";

const SESSION_VERSION = 1;

export interface CliSession {
  version: typeof SESSION_VERSION;
  savedAt: string;
  source?: string;
  incident: Incident;
}

export function getSessionPath(): string {
  return (
    process.env.SECRET_RESPONSE_SESSION_PATH ??
    path.join(homedir(), ".secret-response", "last-session.json")
  );
}

export async function saveSession(
  incident: Incident,
  source?: string,
): Promise<void> {
  const sessionPath = getSessionPath();
  await mkdir(path.dirname(sessionPath), { recursive: true });

  const session: CliSession = {
    version: SESSION_VERSION,
    savedAt: new Date().toISOString(),
    source,
    incident,
  };

  await writeFile(sessionPath, JSON.stringify(session, null, 2), "utf8");
}

export async function loadSession(): Promise<CliSession> {
  const sessionPath = getSessionPath();
  let raw: string;

  try {
    raw = await readFile(sessionPath, "utf8");
  } catch {
    throw new Error(
      "No saved scan session. Run `secret-response scan <path>` first.",
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Saved session file is corrupted. Run a new scan.");
  }

  if (
    typeof parsed !== "object" ||
    parsed === null ||
    !("version" in parsed) ||
    !("incident" in parsed)
  ) {
    throw new Error("Saved session file is invalid. Run a new scan.");
  }

  const record = parsed as {
    version?: unknown;
    savedAt?: unknown;
    source?: unknown;
    incident?: unknown;
  };

  if (record.version !== SESSION_VERSION) {
    throw new Error("Saved session version is unsupported. Run a new scan.");
  }

  const incidentResult = IncidentSchema.safeParse(record.incident);
  if (!incidentResult.success) {
    throw new Error("Saved session file is invalid. Run a new scan.");
  }

  return {
    version: SESSION_VERSION,
    savedAt:
      typeof record.savedAt === "string"
        ? record.savedAt
        : new Date().toISOString(),
    source: typeof record.source === "string" ? record.source : undefined,
    incident: incidentResult.data,
  };
}
