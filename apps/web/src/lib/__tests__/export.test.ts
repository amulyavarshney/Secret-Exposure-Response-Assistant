import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  buildIncidentFromScan,
  scanContentInternal,
  serializeIncidentJson,
  serializeIncidentMarkdown,
} from "@secret-response/core";
import {
  expandGoldenPlaceholders,
  RAW_GOLDEN_SECRETS,
} from "../../../../../packages/core/src/__tests__/fixtures/golden-secrets.js";
import {
  exportIncidentJson,
  exportIncidentMarkdown,
} from "../export.js";

const PRODUCTION_ENV = expandGoldenPlaceholders(
  readFileSync(
    path.resolve(
      path.dirname(fileURLToPath(import.meta.url)),
      "../../../../../packages/core/src/__tests__/fixtures/production.env",
    ),
    "utf8",
  ),
);

function assertNoLeaks(output: string): void {
  for (const secret of RAW_GOLDEN_SECRETS) {
    if (secret.length >= 8) {
      expect(output).not.toContain(secret);
    }
  }
}

describe("web export helpers — leak safety", () => {
  it("exportIncidentJson never contains raw golden fixture secrets", () => {
    const { result } = scanContentInternal(PRODUCTION_ENV, {
      filename: ".env.production",
    });
    const incident = buildIncidentFromScan(result.findings, {
      channel: "file_upload",
    });

    const json = exportIncidentJson(incident, {
      incidentCommander: "oncall",
      hasActiveOutage: false,
    });

    assertNoLeaks(json);
    expect(json).toContain("maskedLabel");
  });

  it("exportIncidentMarkdown never contains raw golden fixture secrets", () => {
    const { result } = scanContentInternal(PRODUCTION_ENV, {
      filename: ".env.production",
    });
    const incident = buildIncidentFromScan(result.findings, {
      channel: "file_upload",
    });

    const md = exportIncidentMarkdown(incident, {
      incidentCommander: "oncall",
      actionAssignments: {
        [incident.actions[0]!.id]: { assignee: "platform-team" },
      },
    });

    assertNoLeaks(md);
    expect(md).toContain("Secret Exposure Incident Report");
    expect(md).toContain("Incident Commander");
  });

  it("core serializers used by web also pass leak property", () => {
    const { result } = scanContentInternal(PRODUCTION_ENV, {
      filename: ".env.production",
    });
    const incident = buildIncidentFromScan(result.findings, {
      channel: "paste",
    });

    assertNoLeaks(serializeIncidentJson(incident));
    assertNoLeaks(serializeIncidentMarkdown(incident));
  });
});
