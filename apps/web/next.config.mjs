/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    "@secret-response/core",
    "@secret-response/shared",
    "@secret-response/connectors",
    "@noble/hashes",
  ],
  outputFileTracingRoot: new URL("../../..", import.meta.url).pathname,
};

export default nextConfig;
