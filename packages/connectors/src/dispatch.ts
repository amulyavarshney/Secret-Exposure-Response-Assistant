import type { Incident } from "@secret-response/shared";
import { ConnectorConfigError } from "./errors.js";
import { createJiraIssue } from "./jira.js";
import { createPagerDutyIncident } from "./pagerduty.js";
import { createServiceNowIncident } from "./servicenow.js";
import { notifySlack } from "./slack.js";
import type { ConnectorConfig } from "./types.js";

export interface LegacyTicketOptions {
  assignee?: string;
  incidentLink?: string;
}

export interface LegacyNotifyOptions {
  incidentLink?: string;
}

/** Create a ticket via the first configured ITSM provider (Jira, then ServiceNow). */
export async function createTicketFromIncident(
  incident: Incident,
  config: ConnectorConfig,
  options: LegacyTicketOptions = {},
): Promise<{ ticketId: string; url: string }> {
  if (config.jira) {
    const result = await createJiraIssue(incident, {
      config: config.jira,
      assignee: options.assignee,
      incidentLink: options.incidentLink,
    });
    return { ticketId: result.issueKey, url: result.url };
  }

  if (config.servicenow) {
    const result = await createServiceNowIncident(incident, {
      config: config.servicenow,
      assignee: options.assignee,
      incidentLink: options.incidentLink,
    });
    return { ticketId: result.incidentNumber, url: result.url };
  }

  throw new ConnectorConfigError(
    "No Jira or ServiceNow configuration provided for ticket creation",
  );
}

/** Notify via PagerDuty (if configured) or Slack. */
export async function notifyFromIncident(
  incident: Incident,
  config: ConnectorConfig,
  options: LegacyNotifyOptions = {},
): Promise<{ notificationId: string }> {
  if (config.pagerduty) {
    const result = await createPagerDutyIncident(incident, {
      config: config.pagerduty,
      incidentLink: options.incidentLink,
    });

    if ("skipped" in result) {
      return { notificationId: `skipped:${incident.id}` };
    }

    return { notificationId: result.dedupKey };
  }

  if (config.slack) {
    await notifySlack(incident, {
      config: config.slack,
      incidentLink: options.incidentLink,
    });
    return { notificationId: incident.id };
  }

  throw new ConnectorConfigError(
    "No Slack or PagerDuty configuration provided for notification",
  );
}
