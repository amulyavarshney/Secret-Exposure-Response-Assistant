import { awsDetector } from "./aws.js";
import { databaseDetector } from "./database.js";
import { envKeyDetector } from "./env-keys.js";
import { entropyDetector } from "./entropy.js";
import { jwtDetector } from "./jwt.js";
import { pemDetector } from "./pem.js";
import { smtpDetector } from "./smtp.js";
import { stripeDetector } from "./stripe.js";
import type { Detector } from "../types.js";

export const ALL_DETECTORS: Detector[] = [
  pemDetector,
  awsDetector,
  databaseDetector,
  stripeDetector,
  jwtDetector,
  smtpDetector,
  envKeyDetector,
  entropyDetector,
].sort((a, b) => a.priority - b.priority);

export { deduplicateMatches, PROVIDER_PRIORITY } from "./dedup.js";

export {
  awsDetector,
  databaseDetector,
  envKeyDetector,
  entropyDetector,
  jwtDetector,
  pemDetector,
  smtpDetector,
  stripeDetector,
};
