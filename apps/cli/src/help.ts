export function printHelp(): void {
  console.log(`secret-response — Secret Exposure Response Assistant

Usage:
  secret-response scan <path>       Scan a file (sanitized output only)
  secret-response scan -            Read content from stdin
  secret-response report            Export last scan as sanitized report
  secret-response report --format markdown|json
  secret-response plan              Print prioritized remediation actions

Exit codes:
  0  No actionable secrets found
  1  Secrets detected
  2  Error

Safety:
  Raw secret values are never printed or persisted locally.
`);
}
