import { EXIT_ERROR } from "../exit-codes.js";
import { formatPlan } from "../format.js";
import { loadSession } from "../session.js";

export async function runPlan(): Promise<number> {
  let session;
  try {
    session = await loadSession();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    return EXIT_ERROR;
  }

  console.log(formatPlan(session.incident));
  return 0;
}
