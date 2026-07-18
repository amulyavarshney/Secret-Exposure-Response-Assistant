import type { Incident } from "@secret-response/shared";
import { resolveServiceNowConfig } from "./config.js";
import { ConnectorRequestError } from "./errors.js";
import { getFetch } from "./http.js";
import { assertSafeOutboundPayload } from "./secret-guard.js";
import { buildIncidentSummary } from "./template.js";
import type {
  ServiceNowIncidentOptions,
  ServiceNowIncidentResult,
} from "./types.js";

function serviceNowAuthHeader(username: string, password: string): string {
  return `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`;
}

function severityToServiceNowUrgency(
  severity: Incident["severity"],
): string {
  switch (severity) {
    case "Critical":
      return "1";
    case "High":
      return "2";
    case "Medium":
      return "3";
    default:
      return "3";
  }
}

function severityToServiceNowImpact(severity: Incident["severity"]): string {
  switch (severity) {
    case "Critical":
      return "1";
    case "High":
      return "2";
    case "Medium":
      return "3";
    default:
      return "3";
  }
}

/**
 * Create a ServiceNow incident from a sanitized incident record.
 */
export async function createServiceNowIncident(
  incident: Incident,
  options: ServiceNowIncidentOptions = {},
): Promise<ServiceNowIncidentResult> {
  const config = resolveServiceNowConfig(options.config);
  const summary = buildIncidentSummary(incident, options.incidentLink);

  const payload: Record<string, unknown> = {
    short_description: summary.title,
    description: summary.description,
    urgency: severityToServiceNowUrgency(incident.severity),
    impact: severityToServiceNowImpact(incident.severity),
    category: "Security",
    subcategory: "Credential exposure",
  };

  if (config.assignmentGroup) {
    payload.assignment_group = config.assignmentGroup;
  }
  if (options.assignee) {
    payload.assigned_to = options.assignee;
  }
  if (config.callerId) {
    payload.caller_id = config.callerId;
  }

  assertSafeOutboundPayload(payload);

  const response = await getFetch()(
    `${config.instanceUrl}/api/now/table/incident`,
    {
      method: "POST",
      headers: {
        Authorization: serviceNowAuthHeader(config.username, config.password),
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );

  const bodyText = await response.text();

  if (!response.ok) {
    throw new ConnectorRequestError(
      `ServiceNow incident creation failed (${response.status})`,
      response.status,
      bodyText,
    );
  }

  const body = JSON.parse(bodyText) as {
    result?: { number?: string; sys_id?: string };
  };
  const result = body.result;
  const incidentNumber = result?.number;
  const sysId = result?.sys_id;

  if (!incidentNumber || !sysId) {
    throw new ConnectorRequestError(
      "ServiceNow incident creation returned incomplete response",
      response.status,
      bodyText,
    );
  }

  return {
    incidentNumber,
    sysId,
    url: `${config.instanceUrl}/nav_to.do?uri=incident.do?sys_id=${sysId}`,
  };
}
