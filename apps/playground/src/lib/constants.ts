export const ACCEPTED_EXTENSIONS = [
  ".env",
  ".txt",
  ".log",
  ".json",
  ".yaml",
  ".yml",
  ".properties",
  ".sh",
  ".bash",
  ".zsh",
  ".tf",
  ".tfvars",
];

export const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;

export const PRE_SUBMIT_WARNING =
  "Do not edit or reformat the content before scanning. Changing line breaks, redacting characters, or re-ordering keys can cause missed detections or false negatives.";

export const SAFETY_NOTE =
  "Scanning happens in your browser. Raw secret values are never stored, displayed, or sent to a server after detection.";

export const PRODUCT_NAME = "Secret Response";

export const TAGLINE =
  "Contain exposed credentials without showing the secret again.";

export const REPO_URL =
  "https://github.com/amulyavarshney/secret-response";

export const PRODUCTION_DOCS_ANCHOR = "#production-checklist";
