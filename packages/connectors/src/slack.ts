import type { Incident } from "@secret-response/shared";
import { resolveSlackConfig } from "./config.js";
import { ConnectorRequestError } from "./errors.js";
import { getFetch } from "./http.js";
import { assertSafeOutboundPayload } from "./secret-guard.js";
import { buildIncidentSummary } from "./template.js";
import type { SlackNotifyOptions, SlackNotifyResult } from "./types.js";

/**
 * Post a discreet Slack notification with masked categories and optional tracking link.
 * Never includes raw secret text.
 */
export async function notifySlack(
  incident: Incident,
  options: SlackNotifyOptions = {},
): Promise<SlackNotifyResult> {
  const config = resolveSlackConfig(options.config);
  const summary = buildIncidentSummary(incident, options.incidentLink);

  const categoryLines = summary.categories.map((category) => `• ${category}`).join("\n");

  const blocks: Record<string, unknown>[] = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: summary.title,
        emoji: false,
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: [
          `*Severity:* ${incident.severity}`,
          `*Environment:* ${incident.environment}`,
          `*Status:* ${incident.status}`,
          incident.application ? `*Application:* ${incident.application}` : undefined,
        ]
          .filter(Boolean)
          .join("\n"),
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Exposed categories (masked only):*\n${categoryLines}`,
      },
    },
  ];

  if (options.incidentLink) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `<${options.incidentLink}|Open incident tracking>`,
      },
    });
  }

  blocks.push({
    type: "context",
    elements: [
      {
        type: "mrkdwn",
        text: "Sanitized notification — no raw credentials included.",
      },
    ],
  });

  const payload = {
    text: summary.title,
    blocks,
  };

  assertSafeOutboundPayload(payload);

  const response = await getFetch()(config.webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const bodyText = await response.text();

  if (!response.ok) {
    throw new ConnectorRequestError(
      `Slack notification failed (${response.status})`,
      response.status,
      bodyText,
    );
  }

  return { ok: true };
}
