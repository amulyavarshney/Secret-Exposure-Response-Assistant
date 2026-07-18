export class ConnectorConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConnectorConfigError";
  }
}

export class SecretLeakError extends Error {
  readonly pattern: string;

  constructor(pattern: string) {
    super(
      `Outbound payload blocked: potential raw secret detected (${pattern}). Only sanitized incident data may be sent.`,
    );
    this.name = "SecretLeakError";
    this.pattern = pattern;
  }
}

export class ConnectorRequestError extends Error {
  readonly status: number;
  readonly body: string;

  constructor(message: string, status: number, body: string) {
    super(message);
    this.name = "ConnectorRequestError";
    this.status = status;
    this.body = body;
  }
}
