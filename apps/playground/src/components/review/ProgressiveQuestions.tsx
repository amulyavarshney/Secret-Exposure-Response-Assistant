import type { Environment } from "@secret-response/shared";
import { useIncident } from "../../context/incident-context";

const ENV_OPTIONS: { value: Environment; label: string }[] = [
  { value: "production", label: "Production" },
  { value: "staging", label: "Staging" },
  { value: "development", label: "Development" },
  { value: "unknown", label: "Unknown" },
];

export function ProgressiveQuestions() {
  const { session, progressive, updateProgressive } = useIncident();
  if (!session) return null;

  const { incident } = session;
  const showEnvironment =
    incident.environment === "unknown" || incident.findings.length === 0;
  const showOutage =
    incident.severity === "Critical" || incident.severity === "High";
  const showOpenIncident = showOutage;

  const hasQuestions = showEnvironment || showOutage || showOpenIncident;

  if (!hasQuestions) return null;

  return (
    <div className="panel">
      <h2 className="panel-title">Refine context</h2>
      <p className="muted" style={{ marginTop: 0 }}>
        Optional — your answers help refine severity and the plan. If you are not
        sure, leave as Unknown (we treat Unknown as production).
      </p>

      {showEnvironment && (
        <div className="form-group">
          <label htmlFor="prog-env">Which environment is affected?</label>
          <select
            id="prog-env"
            value={progressive.environmentOverride ?? incident.environment}
            onChange={(e) =>
              updateProgressive({
                environmentOverride: e.target.value as Environment,
              })
            }
          >
            {ENV_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {showOutage && (
        <div className="form-group">
          <label htmlFor="prog-outage">Is there an active customer outage?</label>
          <select
            id="prog-outage"
            value={
              progressive.hasActiveOutage === undefined
                ? ""
                : progressive.hasActiveOutage
                  ? "yes"
                  : "no"
            }
            onChange={(e) => {
              const v = e.target.value;
              updateProgressive({
                hasActiveOutage: v === "" ? undefined : v === "yes",
              });
            }}
          >
            <option value="">Not sure</option>
            <option value="yes">Yes — active outage</option>
            <option value="no">No outage</option>
          </select>
        </div>
      )}

      {showOpenIncident && (
        <div className="form-group">
          <label htmlFor="prog-incident">
            Is there already an open security incident?
          </label>
          <select
            id="prog-incident"
            value={
              progressive.hasOpenIncident === undefined
                ? ""
                : progressive.hasOpenIncident
                  ? "yes"
                  : "no"
            }
            onChange={(e) => {
              const v = e.target.value;
              updateProgressive({
                hasOpenIncident: v === "" ? undefined : v === "yes",
              });
            }}
          >
            <option value="">Not sure</option>
            <option value="yes">Yes — link to existing</option>
            <option value="no">No — this is new</option>
          </select>
        </div>
      )}

      <div className="form-group">
        <label htmlFor="prog-commander">Incident commander (optional)</label>
        <input
          id="prog-commander"
          type="text"
          value={progressive.incidentCommander ?? ""}
          onChange={(e) =>
            updateProgressive({ incidentCommander: e.target.value || undefined })
          }
          placeholder="Name or on-call handle"
        />
      </div>
    </div>
  );
}
