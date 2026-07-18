# @secret-response/connectors

Assisted-mode adapters for Jira, ServiceNow, Slack, and PagerDuty. All outbound payloads are **sanitized incident records only** — masked labels, categories, and metadata. A defense-in-depth guard refuses to send if any field matches a raw secret pattern.

> Product overview: [../../README.md](../../README.md) · Usage: [../../docs/USAGE.md](../../docs/USAGE.md) · Safety: [../../docs/SAFETY.md](../../docs/SAFETY.md) · Env template: [../../.env.example](../../.env.example)

## Environment variables

Set only the connectors you need. Unset connectors leave the app in pure advisory mode (report export only).

### Jira

| Variable | Required | Description |
|----------|----------|-------------|
| `SECRET_RESPONSE_JIRA_BASE_URL` | Yes | e.g. `https://your-org.atlassian.net` |
| `SECRET_RESPONSE_JIRA_EMAIL` | Yes | API user email |
| `SECRET_RESPONSE_JIRA_API_TOKEN` | Yes | Jira API token |
| `SECRET_RESPONSE_JIRA_PROJECT_KEY` | Yes | e.g. `SEC` |
| `SECRET_RESPONSE_JIRA_ISSUE_TYPE` | No | Default: `Task` |
| `SECRET_RESPONSE_JIRA_ASSIGNEE` | No | Default assignee (email, username, or account ID) |

### ServiceNow

| Variable | Required | Description |
|----------|----------|-------------|
| `SECRET_RESPONSE_SERVICENOW_INSTANCE_URL` | Yes | e.g. `https://instance.service-now.com` |
| `SECRET_RESPONSE_SERVICENOW_USERNAME` | Yes | Integration user |
| `SECRET_RESPONSE_SERVICENOW_PASSWORD` | Yes | Integration password |
| `SECRET_RESPONSE_SERVICENOW_ASSIGNMENT_GROUP` | No | Assignment group sys_id or name |
| `SECRET_RESPONSE_SERVICENOW_CALLER_ID` | No | Caller sys_id |

### Slack

| Variable | Required | Description |
|----------|----------|-------------|
| `SECRET_RESPONSE_SLACK_WEBHOOK_URL` | Yes | Incoming webhook URL |

### PagerDuty

| Variable | Required | Description |
|----------|----------|-------------|
| `SECRET_RESPONSE_PAGERDUTY_ROUTING_KEY` | Yes | Events API v2 routing key |

PagerDuty alerts are created for **Critical** and **High** severity only.

## Public API

```typescript
import type { Incident } from "@secret-response/shared";
import {
  createJiraIssue,
  createServiceNowIncident,
  notifySlack,
  createPagerDutyIncident,
  loadConnectorConfigFromEnv,
  assertSafeOutboundPayload,
} from "@secret-response/connectors";

const incident: Incident = /* sanitized incident from @secret-response/core */;

// Optional: load all configured connectors from env
const config = loadConnectorConfigFromEnv();

const jira = await createJiraIssue(incident, {
  config: config.jira,
  assignee: "security.lead@example.com",
  incidentLink: "https://app.example.com/incidents/abc",
});

const snow = await createServiceNowIncident(incident, {
  config: config.servicenow,
  incidentLink: "https://app.example.com/incidents/abc",
});

await notifySlack(incident, {
  config: config.slack,
  incidentLink: "https://app.example.com/incidents/abc",
});

const pager = await createPagerDutyIncident(incident, {
  config: config.pagerduty,
  incidentLink: "https://app.example.com/incidents/abc",
});
```

### Exports

| Export | Purpose |
|--------|---------|
| `createJiraIssue` | Create Jira issue; returns `{ issueKey, url }` |
| `createServiceNowIncident` | Create ServiceNow incident; returns `{ incidentNumber, sysId, url }` |
| `notifySlack` | Post discreet Slack notification |
| `createPagerDutyIncident` | Trigger PagerDuty alert (Critical/High) or skip |
| `loadConnectorConfigFromEnv` | Read all connector config from env |
| `resolveJiraConfig` / `resolveServiceNowConfig` / `resolveSlackConfig` / `resolvePagerDutyConfig` | Resolve config with env fallback |
| `assertSafeOutboundPayload` | Guard — throws `SecretLeakError` on raw secret patterns |
| `buildIncidentSummary` | Sanitized title/description/categories for tickets |
| `SecretLeakError` / `ConnectorConfigError` / `ConnectorRequestError` | Error types |

## Safety

See [docs/SAFETY.md](../../docs/SAFETY.md). Every connector call runs `assertSafeOutboundPayload` on the serialized request body before `fetch`.

## Tests

```bash
pnpm --filter @secret-response/connectors test
```

Tests mock `fetch` and assert request bodies never contain fixture raw secrets.
