import { ConnectorConfigError } from "./errors.js";
import type {
  ConnectorConfig,
  JiraConfig,
  PagerDutyConfig,
  ServiceNowConfig,
  SlackConfig,
} from "./types.js";

function readEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value || undefined;
}

function requireFields(
  label: string,
  fields: Record<string, string | undefined>,
): void {
  const missing = Object.entries(fields)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new ConnectorConfigError(
      `${label} configuration incomplete — missing: ${missing.join(", ")}`,
    );
  }
}

export function loadConnectorConfigFromEnv(): ConnectorConfig {
  const config: ConnectorConfig = {};

  const jiraBaseUrl = readEnv("SECRET_RESPONSE_JIRA_BASE_URL");
  if (jiraBaseUrl) {
    config.jira = {
      baseUrl: jiraBaseUrl.replace(/\/$/, ""),
      email: readEnv("SECRET_RESPONSE_JIRA_EMAIL") ?? "",
      apiToken: readEnv("SECRET_RESPONSE_JIRA_API_TOKEN") ?? "",
      projectKey: readEnv("SECRET_RESPONSE_JIRA_PROJECT_KEY") ?? "",
      issueType: readEnv("SECRET_RESPONSE_JIRA_ISSUE_TYPE") ?? "Task",
      defaultAssignee: readEnv("SECRET_RESPONSE_JIRA_ASSIGNEE"),
    };
  }

  const snowInstance = readEnv("SECRET_RESPONSE_SERVICENOW_INSTANCE_URL");
  if (snowInstance) {
    config.servicenow = {
      instanceUrl: snowInstance.replace(/\/$/, ""),
      username: readEnv("SECRET_RESPONSE_SERVICENOW_USERNAME") ?? "",
      password: readEnv("SECRET_RESPONSE_SERVICENOW_PASSWORD") ?? "",
      assignmentGroup: readEnv("SECRET_RESPONSE_SERVICENOW_ASSIGNMENT_GROUP"),
      callerId: readEnv("SECRET_RESPONSE_SERVICENOW_CALLER_ID"),
    };
  }

  const slackWebhook = readEnv("SECRET_RESPONSE_SLACK_WEBHOOK_URL");
  if (slackWebhook) {
    config.slack = { webhookUrl: slackWebhook };
  }

  const pdRoutingKey = readEnv("SECRET_RESPONSE_PAGERDUTY_ROUTING_KEY");
  if (pdRoutingKey) {
    config.pagerduty = { routingKey: pdRoutingKey };
  }

  return config;
}

export function resolveJiraConfig(override?: JiraConfig): JiraConfig {
  const fromEnv = loadConnectorConfigFromEnv().jira;
  const config = { ...fromEnv, ...override };

  requireFields("Jira", {
    baseUrl: config.baseUrl,
    email: config.email,
    apiToken: config.apiToken,
    projectKey: config.projectKey,
  });

  return config as JiraConfig;
}

export function resolveServiceNowConfig(
  override?: ServiceNowConfig,
): ServiceNowConfig {
  const fromEnv = loadConnectorConfigFromEnv().servicenow;
  const config = { ...fromEnv, ...override };

  requireFields("ServiceNow", {
    instanceUrl: config.instanceUrl,
    username: config.username,
    password: config.password,
  });

  return config as ServiceNowConfig;
}

export function resolveSlackConfig(override?: SlackConfig): SlackConfig {
  const fromEnv = loadConnectorConfigFromEnv().slack;
  const config = { ...fromEnv, ...override };

  requireFields("Slack", {
    webhookUrl: config.webhookUrl,
  });

  return config as SlackConfig;
}

export function resolvePagerDutyConfig(
  override?: PagerDutyConfig,
): PagerDutyConfig {
  const fromEnv = loadConnectorConfigFromEnv().pagerduty;
  const config = { ...fromEnv, ...override };

  requireFields("PagerDuty", {
    routingKey: config.routingKey,
  });

  return config as PagerDutyConfig;
}
