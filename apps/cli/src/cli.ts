import { printHelp } from "./help.js";
import { runPlan } from "./commands/plan.js";
import { runReport } from "./commands/report.js";
import { runScan } from "./commands/scan.js";
import { EXIT_ERROR } from "./exit-codes.js";
import { parseArgs } from "./parse-args.js";

export async function runCli(argv: string[]): Promise<number> {
  const args = parseArgs(argv);

  if (
    args.flags.has("help") ||
    args.flags.has("h") ||
    args.command === "help" ||
    argv.length === 0
  ) {
    printHelp();
    return 0;
  }

  switch (args.command) {
    case "scan":
      return runScan(args.positional[0]);
    case "report":
      return runReport(args);
    case "plan":
      return runPlan();
    default:
      console.error(`Unknown command: ${args.command ?? "(none)"}`);
      printHelp();
      return EXIT_ERROR;
  }
}
