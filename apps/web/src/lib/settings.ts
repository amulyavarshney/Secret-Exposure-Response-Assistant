import type { ConnectorConfig } from "@secret-response/connectors";
import type { Environment } from "@secret-response/shared";

export type ItsmProvider = "jira" | "servicenow";

export interface WebSettings {
  reporter?: string;
  fingerprintSalt?: string;
  defaultEnvironment?: Environment;
  primaryItsm: ItsmProvider;
  connectors: ConnectorConfig;
}

const STORAGE_KEY = "secret-response-web-settings";

const DEFAULT_SETTINGS: WebSettings = {
  primaryItsm: "jira",
  connectors: {},
};

export function loadSettings(): WebSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<WebSettings>;
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      connectors: { ...DEFAULT_SETTINGS.connectors, ...parsed.connectors },
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: WebSettings): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

/** Build connector config for server API calls (credentials from local settings). */
export function buildConnectorConfigForApi(settings: WebSettings): ConnectorConfig {
  const { connectors, primaryItsm } = settings;
  const config: ConnectorConfig = {};

  if (primaryItsm === "jira" && connectors.jira?.baseUrl) {
    config.jira = connectors.jira;
  }

  if (primaryItsm === "servicenow" && connectors.servicenow?.instanceUrl) {
    config.servicenow = connectors.servicenow;
  }

  if (connectors.slack?.webhookUrl) {
    config.slack = connectors.slack;
  }

  if (connectors.pagerduty?.routingKey) {
    config.pagerduty = connectors.pagerduty;
  }

  return config;
}

export function hasItsmConfig(settings: WebSettings): boolean {
  const c = settings.connectors;
  if (settings.primaryItsm === "jira") {
    return Boolean(c.jira?.baseUrl && c.jira.projectKey && c.jira.email && c.jira.apiToken);
  }
  return Boolean(
    c.servicenow?.instanceUrl && c.servicenow.username && c.servicenow.password,
  );
}
