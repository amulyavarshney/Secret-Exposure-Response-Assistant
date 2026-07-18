"use client";

import { useState } from "react";
import {
  buildConnectorConfigForApi,
  hasItsmConfig,
  loadSettings,
} from "../../lib/settings";
import { useIncident } from "../../context/incident-context";

interface ConnectorResult {
  type: "success" | "error";
  message: string;
}

export function ConnectorActions() {
  const { session, progressive, actionAssignments } = useIncident();
  const [loading, setLoading] = useState<string | null>(null);
  const [result, setResult] = useState<ConnectorResult | null>(null);

  if (!session) return null;

  const settings = loadSettings();
  const hasItsm = hasItsmConfig(settings);
  const hasSlack = Boolean(settings.connectors.slack?.webhookUrl);
  const hasPagerDuty = Boolean(settings.connectors.pagerduty?.routingKey);

  const payload = {
    incident: session.incident,
    config: buildConnectorConfigForApi(settings),
    assignee: progressive.incidentCommander,
    meta: {
      actionAssignments,
      incidentCommander: progressive.incidentCommander,
      hasActiveOutage: progressive.hasActiveOutage,
    },
  };

  async function callConnector(
    endpoint: string,
    label: string,
  ): Promise<void> {
    setLoading(label);
    setResult(null);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as {
        ticketId?: string;
        url?: string;
        notificationId?: string;
        error?: string;
      };

      if (!res.ok) {
        setResult({
          type: "error",
          message: data.error ?? `${label} failed (${res.status})`,
        });
        return;
      }

      if (data.url) {
        setResult({
          type: "success",
          message: `${label} created: ${data.ticketId ?? data.notificationId} — ${data.url}`,
        });
      } else {
        setResult({
          type: "success",
          message: `${label} sent: ${data.notificationId ?? data.ticketId ?? "OK"}`,
        });
      }
    } catch (err) {
      setResult({
        type: "error",
        message: err instanceof Error ? err.message : "Request failed",
      });
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="card">
      <h2 className="card-title">Create ticket / notify</h2>
      <p className="muted" style={{ marginTop: 0 }}>
        Only sanitized incident data is sent to connectors. Configure credentials
        in Settings.
      </p>

      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <button
          type="button"
          className="btn btn-primary"
          disabled={!hasItsm || loading !== null}
          onClick={() => callConnector("/api/connectors/ticket", "Ticket")}
          title={!hasItsm ? "Configure Jira or ServiceNow in Settings" : undefined}
        >
          {loading === "Ticket" ? "Creating…" : "Create ticket"}
        </button>
        <button
          type="button"
          className="btn"
          disabled={!hasSlack || loading !== null}
          onClick={() => callConnector("/api/connectors/notify", "Slack notify")}
          title={!hasSlack ? "Configure Slack webhook in Settings" : undefined}
        >
          {loading === "Slack notify" ? "Sending…" : "Notify Slack"}
        </button>
        <button
          type="button"
          className="btn"
          disabled={
            !hasPagerDuty ||
            loading !== null ||
            !["Critical", "High"].includes(session.incident.severity)
          }
          onClick={() =>
            callConnector("/api/connectors/notify?provider=pagerduty", "PagerDuty")
          }
          title={
            !hasPagerDuty
              ? "Configure PagerDuty in Settings"
              : !["Critical", "High"].includes(session.incident.severity)
                ? "PagerDuty alerts for Critical/High only"
                : undefined
          }
        >
          {loading === "PagerDuty" ? "Alerting…" : "Alert PagerDuty"}
        </button>
      </div>

      {!hasItsm && !hasSlack && !hasPagerDuty && (
        <p className="muted" style={{ marginTop: "0.75rem" }}>
          No connectors configured — export a report or add credentials in
          Settings for assisted mode.
        </p>
      )}

      {result && (
        <div className={`connector-result ${result.type}`}>{result.message}</div>
      )}
    </div>
  );
}
