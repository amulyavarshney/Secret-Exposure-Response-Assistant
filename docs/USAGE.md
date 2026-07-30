# Usage Guide

## Playground (recommended UI)

```bash
pnpm install
pnpm dev:playground
# http://localhost:5173
```

1. **Share details** — paste, upload, or guided form (Unknown allowed)  
2. **Review plan** — severity, masked findings, **Do this next**  
3. **Track progress** — mark done, verify, download Markdown/JSON  

Scanning is client-side. Raw content is discarded after the incident is built.

### GitHub Pages

After deploy from this repo’s Actions workflow:

`https://amulyavarshney.github.io/<repo-name>/`

---

## CLI

```bash
pnpm --filter @secret-response/cli build
pnpm --filter @secret-response/cli exec secret-response scan path/to/.env
pnpm --filter @secret-response/cli exec secret-response report --format markdown
pnpm --filter @secret-response/cli exec secret-response plan
pnpm demo:scan   # golden fixture demo (placeholders expanded at runtime)
```

| Exit | Meaning |
|------|---------|
| `0` | Clean |
| `1` | Secrets found |
| `2` | Error |

---

## Connectors (server-side)

Use `@secret-response/connectors` from a backend only. See [packages/connectors/README.md](../packages/connectors/README.md).

Unset connectors → advisory mode (export still works).

---

## Core library

```typescript
import {
  scanContent,
  buildIncidentFromScan,
  serializeIncidentMarkdown,
} from "@secret-response/core";

const { findings } = scanContent(text, { channel: "paste" });
const incident = buildIncidentFromScan(findings);
console.log(serializeIncidentMarkdown(incident));
```

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Playground 404 on Pages | Confirm repo name matches URL path; re-run Actions deploy |
| `pnpm install` 403 on Intuit registry | `NPM_CONFIG_REGISTRY=https://registry.npmjs.org/ pnpm install` |
| CLI `report` fails | Run `scan` first; check `SECRET_RESPONSE_SESSION_PATH` |
