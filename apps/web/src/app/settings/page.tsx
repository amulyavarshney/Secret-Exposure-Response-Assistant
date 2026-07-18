"use client";

import { useEffect, useState } from "react";
import type { JiraConfig, ServiceNowConfig } from "@secret-response/connectors";
import type { Environment } from "@secret-response/shared";
import {
  loadSettings,
  saveSettings,
  type ItsmProvider,
  type WebSettings,
} from "../../lib/settings";

function jiraDefaults(settings: WebSettings): JiraConfig {
  return {
    baseUrl: settings.connectors.jira?.baseUrl ?? "",
    email: settings.connectors.jira?.email ?? "",
    apiToken: settings.connectors.jira?.apiToken ?? "",
    projectKey: settings.connectors.jira?.projectKey ?? "",
    issueType: settings.connectors.jira?.issueType,
    defaultAssignee: settings.connectors.jira?.defaultAssignee,
  };
}

function snowDefaults(settings: WebSettings): ServiceNowConfig {
  return {
    instanceUrl: settings.connectors.servicenow?.instanceUrl ?? "",
    username: settings.connectors.servicenow?.username ?? "",
    password: settings.connectors.servicenow?.password ?? "",
    assignmentGroup: settings.connectors.servicenow?.assignmentGroup,
    callerId: settings.connectors.servicenow?.callerId,
  };
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<WebSettings | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSettings(loadSettings());
  }, []);

  if (!settings) {
    return <p className="muted">Loading settings…</p>;
  }

  const update = (partial: Partial<WebSettings>) => {
    setSettings((prev) => (prev ? { ...prev, ...partial } : prev));
    setSaved(false);
  };

  const updateConnectors = (
    partial: Partial<WebSettings["connectors"]>,
  ) => {
    setSettings((prev) =>
      prev
        ? { ...prev, connectors: { ...prev.connectors, ...partial } }
        : prev,
    );
    setSaved(false);
  };

  const handleSave = () => {
    saveSettings(settings);
    setSaved(true);
  };

  return (
    <>
      <h2 style={{ marginTop: 0, fontSize: "1.25rem" }}>Settings</h2>
      <p className="muted">
        Connector credentials are stored in your browser&apos;s localStorage
        only. They are never logged or included in incident reports.
      </p>

      <div className="card">
        <h3 className="card-title">General</h3>
        <div className="form-group">
          <label htmlFor="reporter">Default reporter name</label>
          <input
            id="reporter"
            value={settings.reporter ?? ""}
            onChange={(e) => update({ reporter: e.target.value || undefined })}
          />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="fingerprint-salt">
              Fingerprint salt (optional)
            </label>
            <input
              id="fingerprint-salt"
              type="password"
              autoComplete="off"
              value={settings.fingerprintSalt ?? ""}
              onChange={(e) =>
                update({ fingerprintSalt: e.target.value || undefined })
              }
              placeholder="For repeat-exposure correlation"
            />
          </div>
          <div className="form-group">
            <label htmlFor="default-env">Default environment hint</label>
            <select
              id="default-env"
              value={settings.defaultEnvironment ?? "unknown"}
              onChange={(e) =>
                update({
                  defaultEnvironment: e.target.value as Environment,
                })
              }
            >
              <option value="unknown">Unknown</option>
              <option value="production">Production</option>
              <option value="staging">Staging</option>
              <option value="development">Development</option>
            </select>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="card-title">ITSM (ticket creation)</h3>
        <div className="form-group">
          <label htmlFor="itsm-primary">Primary ticketing system</label>
          <select
            id="itsm-primary"
            value={settings.primaryItsm}
            onChange={(e) =>
              update({ primaryItsm: e.target.value as ItsmProvider })
            }
          >
            <option value="jira">Jira</option>
            <option value="servicenow">ServiceNow</option>
          </select>
        </div>

        {settings.primaryItsm === "jira" && (
          <>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="jira-url">Jira base URL</label>
                <input
                  id="jira-url"
                  value={settings.connectors.jira?.baseUrl ?? ""}
                  onChange={(e) =>
                    updateConnectors({
                      jira: { ...jiraDefaults(settings), baseUrl: e.target.value },
                    })
                  }
                  placeholder="https://your-org.atlassian.net"
                />
              </div>
              <div className="form-group">
                <label htmlFor="jira-project">Project key</label>
                <input
                  id="jira-project"
                  value={settings.connectors.jira?.projectKey ?? ""}
                  onChange={(e) =>
                    updateConnectors({
                      jira: {
                        ...jiraDefaults(settings),
                        projectKey: e.target.value,
                      },
                    })
                  }
                  placeholder="SEC"
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="jira-email">API email</label>
                <input
                  id="jira-email"
                  type="email"
                  autoComplete="off"
                  value={settings.connectors.jira?.email ?? ""}
                  onChange={(e) =>
                    updateConnectors({
                      jira: { ...jiraDefaults(settings), email: e.target.value },
                    })
                  }
                />
              </div>
              <div className="form-group">
                <label htmlFor="jira-token">API token</label>
                <input
                  id="jira-token"
                  type="password"
                  autoComplete="off"
                  value={settings.connectors.jira?.apiToken ?? ""}
                  onChange={(e) =>
                    updateConnectors({
                      jira: {
                        ...jiraDefaults(settings),
                        apiToken: e.target.value,
                      },
                    })
                  }
                />
              </div>
            </div>
          </>
        )}

        {settings.primaryItsm === "servicenow" && (
          <>
            <div className="form-group">
              <label htmlFor="snow-url">ServiceNow instance URL</label>
              <input
                id="snow-url"
                value={settings.connectors.servicenow?.instanceUrl ?? ""}
                onChange={(e) =>
                  updateConnectors({
                    servicenow: {
                      ...snowDefaults(settings),
                      instanceUrl: e.target.value,
                    },
                  })
                }
                placeholder="https://your-instance.service-now.com"
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="snow-user">Username</label>
                <input
                  id="snow-user"
                  autoComplete="off"
                  value={settings.connectors.servicenow?.username ?? ""}
                  onChange={(e) =>
                    updateConnectors({
                      servicenow: {
                        ...snowDefaults(settings),
                        username: e.target.value,
                      },
                    })
                  }
                />
              </div>
              <div className="form-group">
                <label htmlFor="snow-pass">Password</label>
                <input
                  id="snow-pass"
                  type="password"
                  autoComplete="off"
                  value={settings.connectors.servicenow?.password ?? ""}
                  onChange={(e) =>
                    updateConnectors({
                      servicenow: {
                        ...snowDefaults(settings),
                        password: e.target.value,
                      },
                    })
                  }
                />
              </div>
            </div>
          </>
        )}
      </div>

      <div className="card">
        <h3 className="card-title">Notifications</h3>
        <div className="form-group">
          <label htmlFor="slack-webhook">Slack incoming webhook URL</label>
          <input
            id="slack-webhook"
            type="password"
            autoComplete="off"
            value={settings.connectors.slack?.webhookUrl ?? ""}
            onChange={(e) =>
              updateConnectors({
                slack: { webhookUrl: e.target.value },
              })
            }
            placeholder="https://hooks.slack.com/services/…"
          />
        </div>
        <div className="form-group">
          <label htmlFor="pd-key">PagerDuty routing key</label>
          <input
            id="pd-key"
            type="password"
            autoComplete="off"
            value={settings.connectors.pagerduty?.routingKey ?? ""}
            onChange={(e) =>
              updateConnectors({
                pagerduty: { routingKey: e.target.value },
              })
            }
          />
        </div>
      </div>

      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
        <button type="button" className="btn btn-primary" onClick={handleSave}>
          Save settings
        </button>
        {saved && (
          <span style={{ color: "var(--success)", fontSize: "0.875rem" }}>
            Saved locally
          </span>
        )}
      </div>
    </>
  );
}
