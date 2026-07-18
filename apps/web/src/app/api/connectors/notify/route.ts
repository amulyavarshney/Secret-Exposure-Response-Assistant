import {
  notifyFromIncident,
  resolvePagerDutyConfig,
  resolveSlackConfig,
} from "@secret-response/connectors";
import { IncidentSchema } from "@secret-response/shared";
import { NextResponse } from "next/server";
import { z } from "zod";

const ConnectorConfigSchema = z.object({
  slack: z.object({ webhookUrl: z.string() }).optional(),
  pagerduty: z.object({ routingKey: z.string() }).optional(),
});

const NotifyRequestSchema = z.object({
  incident: IncidentSchema,
  config: ConnectorConfigSchema.optional(),
  incidentLink: z.string().optional(),
});

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const provider = searchParams.get("provider") ?? "slack";

  try {
    const body = NotifyRequestSchema.parse(await request.json());
    const config = body.config ?? {};

    if (provider === "pagerduty") {
      if (config.pagerduty) {
        config.pagerduty = resolvePagerDutyConfig(config.pagerduty);
      }
      const result = await notifyFromIncident(
        body.incident,
        { pagerduty: config.pagerduty },
        { incidentLink: body.incidentLink },
      );
      return NextResponse.json(result);
    }

    if (config.slack) {
      config.slack = resolveSlackConfig(config.slack);
    }
    const result = await notifyFromIncident(
      body.incident,
      { slack: config.slack },
      { incidentLink: body.incidentLink },
    );
    return NextResponse.json(result);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Notification failed";
    const status =
      message.includes("incomplete") ||
      message.includes("No Slack") ||
      message.includes("configuration")
        ? 400
        : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
