import { hmac } from "@noble/hashes/hmac.js";
import { sha256 } from "@noble/hashes/sha2.js";
import { bytesToHex, utf8ToBytes } from "@noble/hashes/utils.js";

const DEFAULT_SALT = "secret-response-dev-salt-change-in-production";

let runtimeSalt: string | undefined;

export function configureFingerprintSalt(salt: string): void {
  runtimeSalt = salt;
}

export function getFingerprintSalt(): string {
  return (
    runtimeSalt ??
    (typeof process !== "undefined"
      ? process.env?.SECRET_RESPONSE_FINGERPRINT_SALT
      : undefined) ??
    DEFAULT_SALT
  );
}

export function fingerprintSecret(rawValue: string, salt?: string): string {
  const effectiveSalt = salt ?? getFingerprintSalt();
  const digest = hmac(sha256, utf8ToBytes(effectiveSalt), utf8ToBytes(rawValue));
  return bytesToHex(digest).slice(0, 16);
}

export function generateId(prefix: string): string {
  const bytes = new Uint8Array(8);
  globalThis.crypto.getRandomValues(bytes);
  return `${prefix}_${bytesToHex(bytes)}`;
}
