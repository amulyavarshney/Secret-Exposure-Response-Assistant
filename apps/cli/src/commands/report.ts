import {
  serializeIncidentJson,
  serializeIncidentMarkdown,
} from "@secret-response/core";
import { EXIT_ERROR } from "../exit-codes.js";
import { flagString, type ParsedArgs } from "../parse-args.js";
import { loadSession } from "../session.js";

export async function runReport(args: ParsedArgs): Promise<number> {
  const format = flagString(args.flags, "format", "markdown") ?? "markdown";

  if (format !== "markdown" && format !== "json") {
    console.error(
      `Invalid format: ${format}. Use --format markdown or --format json.`,
    );
    return EXIT_ERROR;
  }

  let session;
  try {
    session = await loadSession();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    return EXIT_ERROR;
  }

  const output =
    format === "json"
      ? serializeIncidentJson(session.incident)
      : serializeIncidentMarkdown(session.incident);

  console.log(output);
  return 0;
}
