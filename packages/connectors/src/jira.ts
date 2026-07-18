import type { Incident } from "@secret-response/shared";
import { resolveJiraConfig } from "./config.js";
import { ConnectorRequestError } from "./errors.js";
import { getFetch } from "./http.js";
import { assertSafeOutboundPayload } from "./secret-guard.js";
import { buildIncidentSummary } from "./template.js";
import type { JiraIssueOptions, JiraIssueResult } from "./types.js";

function jiraAuthHeader(email: string, apiToken: string): string {
  return `Basic ${Buffer.from(`${email}:${apiToken}`).toString("base64")}`;
}

function buildJiraDescription(description: string): Record<string, unknown> {
  return {
    type: "doc",
    version: 1,
    content: description.split("\n").map((line) => ({
      type: "paragraph",
      content: line
        ? [{ type: "text", text: line }]
        : [],
    })),
  };
}

/**
 * Create a Jira issue from a sanitized incident record.
 * Assigns when `assignee` or `SECRET_RESPONSE_JIRA_ASSIGNEE` is configured.
 */
export async function createJiraIssue(
  incident: Incident,
  options: JiraIssueOptions = {},
): Promise<JiraIssueResult> {
  const config = resolveJiraConfig(options.config);
  const summary = buildIncidentSummary(incident, options.incidentLink);
  const assignee = options.assignee ?? config.defaultAssignee;

  const fields: Record<string, unknown> = {
    project: { key: config.projectKey },
    issuetype: { name: config.issueType ?? "Task" },
    summary: summary.title,
    description: buildJiraDescription(summary.description),
    labels: ["secret-exposure", incident.severity.toLowerCase()],
  };

  if (assignee) {
    if (assignee.includes("@")) {
      fields.assignee = { emailAddress: assignee };
    } else if (/^[a-f0-9-]{36}$/i.test(assignee)) {
      fields.assignee = { id: assignee };
    } else {
      fields.assignee = { name: assignee };
    }
  }

  const payload = { fields };
  assertSafeOutboundPayload(payload);

  const response = await getFetch()(
    `${config.baseUrl}/rest/api/3/issue`,
    {
      method: "POST",
      headers: {
        Authorization: jiraAuthHeader(config.email, config.apiToken),
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );

  const bodyText = await response.text();

  if (!response.ok) {
    throw new ConnectorRequestError(
      `Jira issue creation failed (${response.status})`,
      response.status,
      bodyText,
    );
  }

  const body = JSON.parse(bodyText) as { key?: string; id?: string };
  const issueKey = body.key;

  if (!issueKey) {
    throw new ConnectorRequestError(
      "Jira issue creation returned no issue key",
      response.status,
      bodyText,
    );
  }

  return {
    issueKey,
    url: `${config.baseUrl}/browse/${issueKey}`,
  };
}
