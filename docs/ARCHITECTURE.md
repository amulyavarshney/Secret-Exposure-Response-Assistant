# Architecture

This document describes how the Secret Exposure Response Assistant is structured, how data flows through a scan, and how safety boundaries are enforced.

## Goals

| Goal | Implementation |
|------|----------------|
| Fast response under stress | One recommended next action + ordered plan |
| Zero secret echo | Mask immediately; leak tests on all serializers |
| Shared logic | Web and CLI call the same `@secret-response/core` |
| Progressive automation | v1 is advisory + assisted (tickets/notify only) |

## Monorepo layout

```text
Security Assistant/
├── apps/
│   ├── web/                 # Next.js App Router UI + connector API routes
│   └── cli/                 # secret-response CLI (scan / report / plan)
├── packages/
│   ├── core/                # Detect → mask → severity → playbooks → incident
│   ├── shared/              # Shared TypeScript types + Zod schemas
│   └── connectors/          # Jira, ServiceNow, Slack, PagerDuty adapters
├── docs/
│   ├── ARCHITECTURE.md      # This file
│   ├── USAGE.md             # How to run and operate
│   └── SAFETY.md            # Never-reproduce-secrets rules
├── package.json             # pnpm + Turborepo root
├── pnpm-workspace.yaml
└── turbo.json
```

## Package responsibilities

```mermaid
flowchart TB
  subgraph apps [Apps]
    Web["apps/web<br/>Next.js wizard"]
    CLI["apps/cli<br/>secret-response"]
  end

  subgraph packages [Packages]
    Core["@secret-response/core<br/>scan · mask · plan"]
    Shared["@secret-response/shared<br/>types · Zod"]
    Conn["@secret-response/connectors<br/>ITSM · notify"]
  end

  Web --> Core
  CLI --> Core
  Web --> Conn
  Core --> Shared
  Conn --> Shared
```

| Package | Role |
|---------|------|
| `@secret-response/shared` | Canonical `Incident`, `Finding`, `RemediationAction` types and Zod validation |
| `@secret-response/core` | Detectors, masking, HMAC fingerprints, severity, playbooks, incident builders, serializers |
| `@secret-response/connectors` | Sanitized outbound adapters + `assertSafeOutboundPayload` |
| `@secret-response/web` | 3-step UX; client-side scan; API routes for connectors only |
| `@secret-response/cli` | File/stdin scan; session persistence of **sanitized** incident only |

## End-to-end data flow

```mermaid
sequenceDiagram
  participant User
  participant App as Web or CLI
  participant Core as packages/core
  participant Conn as packages/connectors
  participant Ext as Jira / Slack / PD

  User->>App: Paste, upload, or guided form
  App->>Core: scanContent(raw) in memory
  Note over Core: Detect → mask → fingerprint<br/>Discard raw after sanitize
  Core-->>App: Findings (masked only)
  App->>Core: buildIncidentFromScan / buildGuidedIncident
  Core-->>App: Incident + action plan + verification
  App-->>User: Summary, next action, checklist
  opt Assisted mode
    User->>App: Create ticket / notify
    App->>Conn: Sanitized Incident
    Conn->>Conn: assertSafeOutboundPayload
    Conn->>Ext: Metadata + masked labels only
  end
```

## Detection pipeline

```mermaid
flowchart LR
  Input[Raw text in memory] --> Detectors
  subgraph Detectors
    AWS
    Stripe
    JWT
    SMTP
    DB[Database]
    PEM
    EnvKeys[".env keys"]
    Entropy[High entropy]
  end
  Detectors --> Dedup[Deduplicate]
  Dedup --> Mask[Mask + HMAC fingerprint]
  Mask --> Findings[Finding list]
  Findings --> Severity[Severity engine]
  Severity --> Playbooks[Provider playbooks]
  Playbooks --> Incident[Sanitized Incident]
```

### Confidence labels

| Label | Meaning |
|-------|---------|
| `confirmed` | Strong format match (e.g. `AKIA…`, `sk_live_…`) |
| `high` | Strong contextual / entropy signal |
| `possible` | Needs owner review |
| `placeholder` | Looks like a known example / dummy |
| `non_secret` | Treated as not a secret |

### Severity

Severity is derived from **effective environment × secret type × channel**.

- Unknown environment is treated as **production** (conservative).
- Live Stripe / AWS / DB / PEM in production → typically **Critical**.
- Guided “no content” path with unknown env → **Critical** containment checklist.

## Playbook ordering

Actions are dependency-aware. Typical priority when multiple providers are present:

1. **AWS** — inventory → create replacement → update stores → deactivate old key  
2. **PEM / TLS** — new key pair → deploy → revoke old  
3. **Database** — create new → update store → roll workloads → verify → revoke old  
4. **Stripe** — roll key → update services → review API activity → revoke  
5. **JWT** — replace signing secret → **sign users out / invalidate tokens**  
6. **SMTP** — rotate → review outbound volume / reputation  
7. **Generic API** — revoke and reissue  

Each action includes: order, why, impact, permissions, suggested owner role, admin deep link (when known), verification steps, status.

## Web architecture

```mermaid
flowchart TB
  subgraph browser [Browser]
    Provide[Step 1 Provide]
    Review[Step 2 Review]
    Approve[Step 3 Approve]
    Settings[Settings localStorage]
    CoreBrowser["@secret-response/core<br/>client-side scan"]
  end

  subgraph server [Next.js server]
    TicketAPI["POST /api/connectors/ticket"]
    NotifyAPI["POST /api/connectors/notify"]
  end

  Provide --> CoreBrowser
  CoreBrowser --> Review
  Review --> Approve
  Approve --> TicketAPI
  Approve --> NotifyAPI
  Settings -.-> TicketAPI
  Settings -.-> NotifyAPI
  TicketAPI --> ConnPkg[connectors package]
  NotifyAPI --> ConnPkg
```

**Privacy boundary:** Detection runs in the browser. Server routes accept only a Zod-validated `Incident` (already sanitized). Raw paste/upload content is not posted to the server for scanning.

## CLI architecture

```mermaid
flowchart LR
  File[File or stdin] --> ScanCmd[scan]
  ScanCmd --> Core[core.scanContent]
  Core --> Session["~/.secret-response/<br/>sanitized session JSON"]
  Session --> ReportCmd[report]
  Session --> PlanCmd[plan]
```

| Exit code | Meaning |
|-----------|---------|
| `0` | No secrets found |
| `1` | Secrets found (findings present) |
| `2` | Usage or runtime error |

## Safety boundaries

```mermaid
flowchart TB
  Raw[Raw secret value] -->|never crosses| Boundary{{Safety boundary}}
  Boundary --> Masked[maskedLabel]
  Boundary --> FP[HMAC fingerprint]
  Boundary --> Meta[provider · category · severity]
  Masked --> UI[UI / CLI stdout]
  Masked --> Ticket[Tickets / Slack / PD]
  Masked --> Export[Markdown / JSON export]
  FP --> Correlate[Repeat-exposure correlation]
```

See [SAFETY.md](./SAFETY.md) for contributor rules and test requirements.

## Modes (v1)

| Mode | Behavior |
|------|----------|
| **Advisory** | Detect, plan, export — no external side effects |
| **Assisted** | Open tickets / send notifications with sanitized payloads |
| **Controlled automation** | *Out of scope for v1* (no key rotation via provider APIs) |

## Extension points (v2+)

- Source connectors (GitHub commit, Slack message, CI log fetch)
- Ownership lookup and secret-manager deep links
- Approved rotation actions with audit trail
- Browser / IDE / Slack message actions
