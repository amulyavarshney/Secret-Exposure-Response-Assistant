"use client";

import { useState } from "react";
import type { Environment } from "@secret-response/shared";
import { useIncident } from "../../context/incident-context";

const ENV_OPTIONS: { value: Environment; label: string }[] = [
  { value: "unknown", label: "Unknown" },
  { value: "production", label: "Production" },
  { value: "staging", label: "Staging" },
  { value: "development", label: "Development" },
];

export function GuidedTab() {
  const { scanFromGuided, isScanning, scanError } = useIncident();
  const [whereShared, setWhereShared] = useState("");
  const [environment, setEnvironment] = useState<Environment>("unknown");
  const [systems, setSystems] = useState("");
  const [whenDiscovered, setWhenDiscovered] = useState("");
  const [stillAccessible, setStillAccessible] = useState<boolean | undefined>();
  const [regulatedData, setRegulatedData] = useState<boolean | undefined>();
  const [application, setApplication] = useState("");

  const handleSubmit = () => {
    scanFromGuided({
      whereShared: whereShared || undefined,
      environment,
      systems: systems
        ? systems.split(",").map((s) => s.trim()).filter(Boolean)
        : undefined,
      whenDiscovered: whenDiscovered || undefined,
      stillAccessible,
      regulatedData,
      application: application || undefined,
    });
  };

  return (
    <div>
      <p className="muted" style={{ marginTop: 0 }}>
        No original content available? Answer what you know. Unknown is
        acceptable — we will produce a conservative containment checklist.
      </p>

      <div className="form-group">
        <label htmlFor="where-shared">Where was it shared?</label>
        <input
          id="where-shared"
          value={whereShared}
          onChange={(e) => setWhereShared(e.target.value)}
          placeholder="e.g. Slack channel, email, public gist"
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="guided-env">Environment</label>
          <select
            id="guided-env"
            value={environment}
            onChange={(e) => setEnvironment(e.target.value as Environment)}
          >
            {ENV_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="guided-app">Application (optional)</label>
          <input
            id="guided-app"
            value={application}
            onChange={(e) => setApplication(e.target.value)}
            placeholder="Service or repo name"
          />
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="guided-systems">Systems involved (comma-separated)</label>
        <input
          id="guided-systems"
          value={systems}
          onChange={(e) => setSystems(e.target.value)}
          placeholder="AWS, Postgres, Stripe"
        />
      </div>

      <div className="form-group">
        <label htmlFor="guided-when">When discovered (optional)</label>
        <input
          id="guided-when"
          type="datetime-local"
          value={whenDiscovered}
          onChange={(e) => setWhenDiscovered(e.target.value)}
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="still-accessible">Still publicly accessible?</label>
          <select
            id="still-accessible"
            value={
              stillAccessible === undefined
                ? ""
                : stillAccessible
                  ? "yes"
                  : "no"
            }
            onChange={(e) => {
              const v = e.target.value;
              setStillAccessible(v === "" ? undefined : v === "yes");
            }}
          >
            <option value="">Unknown</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="regulated">Regulated data involved?</label>
          <select
            id="regulated"
            value={
              regulatedData === undefined ? "" : regulatedData ? "yes" : "no"
            }
            onChange={(e) => {
              const v = e.target.value;
              setRegulatedData(v === "" ? undefined : v === "yes");
            }}
          >
            <option value="">Unknown</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </div>
      </div>

      {scanError && (
        <p style={{ color: "var(--critical)", fontSize: "0.875rem" }}>
          {scanError}
        </p>
      )}

      <button
        type="button"
        className="btn btn-primary"
        disabled={isScanning}
        onClick={handleSubmit}
      >
        {isScanning ? "Building plan…" : "Build containment plan"}
      </button>
    </div>
  );
}
