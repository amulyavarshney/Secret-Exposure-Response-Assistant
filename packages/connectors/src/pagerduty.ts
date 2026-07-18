import type { Incident } from "@secret-response/shared";
import { resolvePagerDutyConfig } from "./config.js";
import { ConnectorRequestError } from "./errors.js";
import { getFetch } from "./http.js";
import { assertSafeOutboundPayload } from "./secret-guard.js";
import { buildIncidentSummary } from "./template.js";
import type {
  PagerDutyIncidentOptions,
  PagerDutyResult,
} from "./types.js";

const PAGERDUTY_EVENTS_URL = "https://events.pagerduty.com/v2/enqueue";

function mapSeverityToPagerDuty(severity: Incident["severity"]): string {
  switch (severity) {
    case "Critical":
      return "critical";
    case "High":
      return "error";
    case "Medium":
      return "warning";
    default:
      return "info";
  }
}

/**
 * Create a PagerDuty alert for Critical or High severity incidents.
 * Lower severities are skipped (assisted mode — no noise for Medium/Low).
 */
export async function createPagerDutyIncident(
  incident: Incident,
  options: PagerDutyIncidentOptions = {},
): Promise<PagerDutyResult> {
  if (incident.severity !== "Critical" && incident.severity !== "High") {
    return {
      skipped: true,
      reason: `PagerDuty alert skipped for ${incident.severity} severity (Critical/High only)`,
    };
  }

  const config = resolvePagerDutyConfig(options.config);
  const summary = buildIncidentSummary(incident, options.incidentLink);

  const payload = {
    routing_key: config.routingKey,
    event_action: "trigger",
    dedup_key: `secret-response-${incident.id}`,
    payload: {
      summary: summary.title,
      source: incident.application ?? "secret-response-assistant",
      severity: mapSeverityToPagerDuty(incident.severity),
      component: incident.channel,
      group: incident.environment,
      class: "credential_exposure",
      custom_details: {
        incident_id: incident.id,
        environment: incident.environment,
        status: incident.status,
        categories: summary.categories,
        tracking_link: options.incidentLink,
      },
    },
  };

  assertSafeOutboundPayload(payload);

  const response = await getFetch()(PAGERDUTY_EVENTS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const bodyText = await response.text();

  if (!response.ok) {
    throw new ConnectorRequestError(
      `PagerDuty incident creation failed (${response.status})`,
      response.status,
      bodyText,
    );
  }

  const body = JSON.parse(bodyText) as {
    status?: string;
    message?: string;
    dedup_key?: string;
  };

  return {
    dedupKey: body.dedup_key ?? payload.dedup_key,
    status: body.status ?? "success",
    message: body.message ?? "Event processed",
  };
}
