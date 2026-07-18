"use client";

import { useState } from "react";
import { useIncident } from "../../context/incident-context";

export function PasteTab() {
  const { scanFromContent, isScanning, scanError } = useIncident();
  const [content, setContent] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);

  return (
    <div>
      <div className="form-group">
        <label htmlFor="paste-content">Paste exposed content</label>
        <textarea
          id="paste-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Paste .env lines, log excerpts, or config snippets exactly as found…"
          spellCheck={false}
          autoComplete="off"
        />
      </div>

      <label
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "0.5rem",
          fontSize: "0.85rem",
          color: "var(--text-secondary)",
          marginBottom: "1rem",
          cursor: "pointer",
        }}
      >
        <input
          type="checkbox"
          checked={acknowledged}
          onChange={(e) => setAcknowledged(e.target.checked)}
          style={{ marginTop: "0.2rem" }}
        />
        I have not edited or reformatted this content before scanning.
      </label>

      {scanError && (
        <p style={{ color: "var(--critical)", fontSize: "0.875rem" }}>
          {scanError}
        </p>
      )}

      <button
        type="button"
        className="btn btn-primary"
        disabled={!content.trim() || !acknowledged || isScanning}
        onClick={() => scanFromContent(content, "paste")}
      >
        {isScanning ? "Scanning…" : "Scan content"}
      </button>
    </div>
  );
}
