import { describe, it } from "vitest";
import { buildActionPlan } from "../action-plan.js";
import {
  buildIncidentFromScan,
  serializeIncidentJson,
  serializeIncidentMarkdown,
} from "../incident.js";
import { scanContentInternal } from "../scan.js";
import { assertNoSecretLeaks } from "./helpers/leak-guard.js";
import { loadFixture } from "./helpers/load-fixture.js";

const FIXTURE_FILES = ["production.env", "production-app.fixture"] as const;

/**
 * Property: every serializer path must fail (via assertNoSecretLeaks) if any
 * raw golden fixture secret substring appears in output.
 */
describe("leak-detection property — serializers", () => {
  for (const file of FIXTURE_FILES) {
    it(`scan → incident → JSON/Markdown never contains raw secrets (${file})`, () => {
      const content = loadFixture(file);
      const { result } = scanContentInternal(content, {
        filename: file,
        fingerprintSalt: "leak-property-salt",
      });

      const incident = buildIncidentFromScan(result.findings, {
        channel: "file_upload",
      });
      const actions = buildActionPlan(result.findings);

      const outputs = [
        serializeIncidentJson(incident),
        serializeIncidentMarkdown(incident),
        JSON.stringify(result),
        JSON.stringify(incident.findings),
        JSON.stringify(actions),
        JSON.stringify(incident.verification),
      ];

      for (const output of outputs) {
        assertNoSecretLeaks(output);
      }
    });
  }
});
