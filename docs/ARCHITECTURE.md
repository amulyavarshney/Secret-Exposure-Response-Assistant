# Architecture

## Goals

| Goal | Implementation |
|------|----------------|
| Fast response under stress | One recommended next action + ordered plan |
| Zero secret echo | Mask immediately; leak tests on serializers |
| Shared logic | Playground and CLI share `@secret-response/core` |
| Static public demo | Vite playground on GitHub Pages (advisory) |
| Progressive automation | Connectors library for **server-side** assisted mode |

## Monorepo layout

```text
apps/playground   Vite + React UI (Pages + local)
apps/cli          secret-response CLI
packages/core     Detect → mask → severity → playbooks → incident
packages/shared   Types + Zod
packages/connectors  Jira / ServiceNow / Slack / PagerDuty
```

```mermaid
flowchart TB
  subgraph apps [Apps]
    Play[apps/playground]
    CLI[apps/cli]
  end

  subgraph packages [Packages]
    Core[packages/core]
    Shared[packages/shared]
    Conn[packages/connectors]
  end

  Play --> Core
  CLI --> Core
  Core --> Shared
  Conn --> Shared
```

## Detection pipeline

```mermaid
flowchart LR
  Input[Raw text in memory] --> Detectors
  Detectors --> Dedup[Deduplicate]
  Dedup --> Mask[Mask + HMAC fingerprint]
  Mask --> Severity
  Severity --> Playbooks
  Playbooks --> Incident[Sanitized incident]
```

## Production vs playground

```mermaid
flowchart LR
  subgraph pages [GitHub Pages]
    UI[Playground UI]
    UI --> BrowserCore[core in browser]
  end

  subgraph org [Your infrastructure]
    Server[Your API]
    Server --> Conn[connectors]
    Server --> CoreSrv[core]
  end

  BrowserCore -.->|export sanitized JSON| Server
```

Playground never holds org connector secrets. Assisted ticket/notify flows belong on a trusted backend that consumes a sanitized `Incident`.

## Playbook priority

AWS → PEM → Database → Stripe → JWT (include session invalidation) → SMTP → Generic API

## Related

- [USAGE.md](./USAGE.md)
- [SAFETY.md](./SAFETY.md)
- [../README.md](../README.md)
