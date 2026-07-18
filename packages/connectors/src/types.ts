export interface JiraConfig {
  baseUrl: string;
  email: string;
  apiToken: string;
  projectKey: string;
  issueType?: string;
  defaultAssignee?: string;
}

export interface ServiceNowConfig {
  instanceUrl: string;
  username: string;
  password: string;
  assignmentGroup?: string;
  callerId?: string;
}

export interface SlackConfig {
  webhookUrl: string;
}

export interface PagerDutyConfig {
  routingKey: string;
}

export interface ConnectorConfig {
  jira?: JiraConfig;
  servicenow?: ServiceNowConfig;
  slack?: SlackConfig;
  pagerduty?: PagerDutyConfig;
}

export interface JiraIssueResult {
  issueKey: string;
  url: string;
}

export interface ServiceNowIncidentResult {
  incidentNumber: string;
  sysId: string;
  url: string;
}

export interface SlackNotifyResult {
  ok: true;
}

export interface PagerDutyIncidentResult {
  dedupKey: string;
  status: string;
  message: string;
}

export interface PagerDutySkippedResult {
  skipped: true;
  reason: string;
}

export type PagerDutyResult = PagerDutyIncidentResult | PagerDutySkippedResult;

export interface JiraIssueOptions {
  config?: JiraConfig;
  assignee?: string;
  incidentLink?: string;
}

export interface ServiceNowIncidentOptions {
  config?: ServiceNowConfig;
  assignee?: string;
  incidentLink?: string;
}

export interface SlackNotifyOptions {
  config?: SlackConfig;
  incidentLink?: string;
}

export interface PagerDutyIncidentOptions {
  config?: PagerDutyConfig;
  incidentLink?: string;
}
