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
  ".yaml.tpl",
  ".yml.tpl",
];

export const ACCEPTED_MIME_HINTS = [
  "text/",
  "application/json",
  "application/x-yaml",
  "application/yaml",
];

export const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;

export const PRE_SUBMIT_WARNING =
  "Do not edit or reformat the content before scanning. Changing line breaks, redacting characters, or re-ordering keys can cause missed detections or false negatives.";

export const SAFETY_NOTE =
  "Scanning happens in your browser. Raw secret values are never stored, displayed, or sent to a server after detection.";
