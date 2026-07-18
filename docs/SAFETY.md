# Safety Rules

Contributors, agents, and automation **must** follow these rules. They are enforced by unit tests, golden fixtures, and code review.

## Never reproduce secrets

1. **Do not persist** raw secret values to disk, databases, logs, analytics, tickets, or notifications.
2. **Do not echo** raw matched substrings to stdout, stderr, HTTP responses, or UI after detection.
3. **Mask immediately** — findings expose only `maskedLabel` (e.g. `AWS access key ending in …K92P`).
4. **Fingerprint with HMAC** — store `fingerprint` + category for correlation; set `SECRET_RESPONSE_FINGERPRINT_SALT` in production.
5. **Hold raw input in memory only** for the duration of a scan; discard after sanitization.

## Allowed in outputs

- Masked labels (short suffix only)
- Provider, category, confidence, severity, environment
- HMAC fingerprints (opaque hex)
- Line numbers and key *names* (not values)
- Sanitized incident JSON / Markdown
- Remediation action metadata (no credentials)

## Forbidden in outputs

- Full or partial raw secret strings (beyond the short mask suffix)
- Base64-decoded JWT payloads that embed secrets
- PEM key bodies
- Database connection-string passwords
- Copy-paste of user input into error messages, tickets, or Slack

## Testing requirements

Golden fixtures live in `packages/core/src/__tests__/fixtures/`.

- Serializers must **fail** if any fixture secret substring appears in JSON/Markdown output.
- CLI tests must assert stdout/stderr never contain fixture secret values.
- Connector tests mock `fetch` and assert request bodies are clean.
- Web export helpers are leak-tested the same way.
- Provider-shaped values that trip GitHub push protection (e.g. Stripe `sk_live_…`) must be **assembled from parts** in TypeScript, or stored as placeholders (`__SR_STRIPE_SECRET__`) and expanded at test runtime — never as a contiguous key in a committed blob.

```bash
pnpm test
```

## Connector payloads

Jira, ServiceNow, Slack, and PagerDuty receive **sanitized `Incident` records only**.

- Never attach original files or paste buffers to outbound messages.
- Every send path runs `assertSafeOutboundPayload` before `fetch`.

## Environment

- Set `SECRET_RESPONSE_FINGERPRINT_SALT` in production to a stable, private value.
- Do not commit `.env` / `.env.local` or fixtures containing **real** credentials.
- Use [`.env.example`](../.env.example) as a template only.

## Operating mode (v1)

This product runs in **advisory + assisted** mode only:

| Allowed | Not allowed in v1 |
|---------|-------------------|
| Detect, mask, plan, export | Disable/rotate keys via cloud APIs |
| Create sanitized tickets | Live credential validation against providers |
| Notify Slack / PagerDuty | Autonomous redeploy / session revoke |

## Related docs

- [ARCHITECTURE.md](./ARCHITECTURE.md) — trust boundaries and data flow
- [USAGE.md](./USAGE.md) — how to run safely day to day
