import {
  createTicketFromIncident,
  resolveJiraConfig,
  resolveServiceNowConfig,
} from "@secret-response/connectors";
import { IncidentSchema } from "@secret-response/shared";
import { NextResponse } from "next/server";
import { z } from "zod";

const ConnectorConfigSchema = z.object({
  jira: z
    .object({
      baseUrl: z.string(),
      email: z.string(),
      apiToken: z.string(),
      projectKey: z.string(),
      issueType: z.string().optional(),
      defaultAssignee: z.string().optional(),
    })
    .optional(),
  servicenow: z
    .object({
      instanceUrl: z.string(),
      username: z.string(),
      password: z.string(),
      assignmentGroup: z.string().optional(),
      callerId: z.string().optional(),
    })
    .optional(),
});

const TicketRequestSchema = z.object({
  incident: IncidentSchema,
  config: ConnectorConfigSchema.optional(),
  assignee: z.string().optional(),
  incidentLink: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = TicketRequestSchema.parse(await request.json());
    const config = body.config ?? {};

    if (config.jira) {
      config.jira = resolveJiraConfig(config.jira);
    }
    if (config.servicenow) {
      config.servicenow = resolveServiceNowConfig(config.servicenow);
    }

    const result = await createTicketFromIncident(body.incident, config, {
      assignee: body.assignee,
      incidentLink: body.incidentLink,
    });
    return NextResponse.json(result);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Ticket creation failed";
    const status =
      message.includes("incomplete") ||
      message.includes("No Jira") ||
      message.includes("configuration")
        ? 400
        : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
