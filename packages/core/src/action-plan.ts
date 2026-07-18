import type {
  ActionPlanOptions,
  Finding,
  RemediationAction,
  SecretProvider,
} from "@secret-response/shared";
import {
  ALL_PLAYBOOKS,
  instantiatePlaybookActions,
} from "./playbooks/index.js";
import { effectiveEnvironment } from "./severity.js";

const PROVIDER_PRIORITY: SecretProvider[] = [
  "aws",
  "pem",
  "database",
  "stripe",
  "jwt",
  "smtp",
  "generic_api",
  "unknown",
];

export function buildActionPlan(
  findings: Finding[],
  options: ActionPlanOptions = {},
): RemediationAction[] {
  const actionable = findings.filter(
    (f) => f.confidence !== "placeholder" && f.confidence !== "non_secret",
  );

  if (actionable.length === 0) {
    return conservativeChecklist(options);
  }

  const byProvider = groupByProvider(actionable);
  const orderedProviders = PROVIDER_PRIORITY.filter((p) => byProvider.has(p));

  const allActions: RemediationAction[] = [];
  let orderOffset = 0;

  for (const provider of orderedProviders) {
    const providerFindings = byProvider.get(provider)!;
    const findingIds = providerFindings.map((f) => f.id);
    const playbook = ALL_PLAYBOOKS.find((p) => p.provider === provider);

    if (playbook) {
      const actions = instantiatePlaybookActions(
        playbook,
        findingIds,
        orderOffset,
      );
      allActions.push(...actions);
      orderOffset += actions.length;
    } else {
      const generic = ALL_PLAYBOOKS.find((p) => p.provider === "generic_api")!;
      const actions = instantiatePlaybookActions(
        generic,
        findingIds,
        orderOffset,
      );
      allActions.push(...actions);
      orderOffset += actions.length;
    }
  }

  return resolveDependencies(allActions);
}

function groupByProvider(
  findings: Finding[],
): Map<SecretProvider, Finding[]> {
  const map = new Map<SecretProvider, Finding[]>();
  for (const finding of findings) {
    const list = map.get(finding.provider) ?? [];
    list.push(finding);
    map.set(finding.provider, list);
  }
  return map;
}

function resolveDependencies(actions: RemediationAction[]): RemediationAction[] {
  const idSet = new Set(actions.map((a) => a.id));
  return actions.map((action) => ({
    ...action,
    dependsOn: action.dependsOn?.filter((d) => idSet.has(d)),
  }));
}

function conservativeChecklist(
  options: ActionPlanOptions,
): RemediationAction[] {
  const env = effectiveEnvironment(options.environment ?? "unknown");
  return [
    {
      id: "action_conservative_1",
      order: 1,
      title: "Assume production impact until environment is confirmed",
      why: `Environment is treated as ${env} when unknown — act with maximum caution.`,
      impact: "May trigger broader rotation scope than strictly necessary.",
      permissions: ["incident coordinator"],
      suggestedOwnerRole: "Security / Incident Commander",
      verificationSteps: [
        "Confirm actual environment with application owner.",
        "Document systems that may be affected.",
      ],
      status: "pending",
      provider: "unknown",
      findingIds: [],
    },
    {
      id: "action_conservative_2",
      order: 2,
      title: "Identify and rotate all potentially exposed credentials",
      why: "Without original content, assume worst-case credential exposure.",
      impact: "Broad rotation may cause temporary service disruption.",
      permissions: ["varies by system"],
      suggestedOwnerRole: "Platform / Application Owners",
      verificationSteps: [
        "Inventory all systems in scope.",
        "Rotate credentials following provider-specific playbooks.",
      ],
      status: "pending",
      provider: "unknown",
      findingIds: [],
      dependsOn: ["action_conservative_1"],
    },
    {
      id: "action_conservative_3",
      order: 3,
      title: "Review access logs and notify stakeholders",
      why: "Detect unauthorized use and meet notification obligations.",
      impact: "May require legal/compliance involvement for regulated data.",
      permissions: ["log access", "incident comms"],
      suggestedOwnerRole: "Security Engineer",
      verificationSteps: [
        "Review audit logs for the exposure window.",
        "Complete stakeholder notification checklist.",
      ],
      status: "pending",
      provider: "unknown",
      findingIds: [],
      dependsOn: ["action_conservative_2"],
    },
  ];
}

export function getNextActionId(actions: RemediationAction[]): string | undefined {
  const pending = actions
    .filter((a) => a.status === "pending")
    .sort((a, b) => a.order - b.order);

  for (const action of pending) {
    const depsMet =
      !action.dependsOn?.length ||
      action.dependsOn.every((depId) => {
        const dep = actions.find((a) => a.id === depId);
        return dep?.status === "done" || dep?.status === "skipped";
      });
    if (depsMet) return action.id;
  }

  return pending[0]?.id;
}
