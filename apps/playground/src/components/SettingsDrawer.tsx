import { useEffect, useState } from "react";
import type { Environment } from "@secret-response/shared";
import {
  loadSettings,
  saveSettings,
  type PlaygroundSettings,
} from "../lib/settings";

interface SettingsDrawerProps {
  onClose: () => void;
}

const ENV_OPTIONS: { value: Environment; label: string }[] = [
  { value: "unknown", label: "Unknown (conservative)" },
  { value: "production", label: "Production" },
  { value: "staging", label: "Staging" },
  { value: "development", label: "Development" },
];

export function SettingsDrawer({ onClose }: SettingsDrawerProps) {
  const [settings, setSettings] = useState<PlaygroundSettings>(() =>
    loadSettings(),
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleSave = () => {
    saveSettings(settings);
    onClose();
  };

  return (
    <>
      <div
        className="drawer-backdrop"
        role="presentation"
        onClick={onClose}
      />
      <aside className="drawer" role="dialog" aria-labelledby="settings-title">
        <div className="drawer-header">
          <h2 id="settings-title">Settings</h2>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Close
          </button>
        </div>

        <p className="muted" style={{ fontSize: "0.85rem", marginTop: 0 }}>
          Stored in localStorage on this device only. No connector credentials
          in this advisory playground.
        </p>

        <div className="form-group">
          <label htmlFor="reporter">Your name (reporter)</label>
          <input
            id="reporter"
            type="text"
            value={settings.reporter ?? ""}
            onChange={(e) =>
              setSettings((s) => ({ ...s, reporter: e.target.value || undefined }))
            }
            placeholder="Optional — included in exports"
          />
        </div>

        <div className="form-group">
          <label htmlFor="fingerprint-salt">Fingerprint salt (optional)</label>
          <input
            id="fingerprint-salt"
            type="text"
            value={settings.fingerprintSalt ?? ""}
            onChange={(e) =>
              setSettings((s) => ({
                ...s,
                fingerprintSalt: e.target.value || undefined,
              }))
            }
            placeholder="Long random secret — never commit"
            autoComplete="off"
          />
          <p className="muted" style={{ fontSize: "0.75rem", marginTop: "0.35rem" }}>
            Keyed HMAC for secret fingerprints. Use a strong value in production.
          </p>
        </div>

        <div className="form-group">
          <label htmlFor="default-env">Default environment hint</label>
          <select
            id="default-env"
            value={settings.defaultEnvironment ?? "unknown"}
            onChange={(e) =>
              setSettings((s) => ({
                ...s,
                defaultEnvironment: e.target.value as Environment,
              }))
            }
          >
            {ENV_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <button type="button" className="btn btn-primary" onClick={handleSave}>
          Save settings
        </button>
      </aside>
    </>
  );
}
