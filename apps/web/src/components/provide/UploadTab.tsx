"use client";

import { useCallback, useRef, useState } from "react";
import { MAX_UPLOAD_BYTES } from "../../lib/constants";
import { isAcceptedFile } from "../../lib/scan-client";
import { useIncident } from "../../context/incident-context";

export function UploadTab() {
  const { scanFromContent, isScanning, scanError } = useIncident();
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [acknowledged, setAcknowledged] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(
    (file: File) => {
      if (!isAcceptedFile(file.name)) {
        alert(
          "Unsupported file type. Use .env, .txt, .log, .json, yaml, properties, shell, Terraform, or CI config files.",
        );
        return;
      }
      if (file.size > MAX_UPLOAD_BYTES) {
        alert("File exceeds 2 MB limit.");
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const text = reader.result;
        if (typeof text === "string") {
          setFileName(file.name);
          scanFromContent(text, "file_upload", file.name);
        }
      };
      reader.readAsText(file);
    },
    [scanFromContent],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file && acknowledged) processFile(file);
    },
    [acknowledged, processFile],
  );

  return (
    <div>
      <div
        className={`dropzone ${dragOver ? "dragover" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => acknowledged && inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            acknowledged && inputRef.current?.click();
          }
        }}
      >
        <p>
          <strong>Drop a file here</strong> or click to browse
        </p>
        <p className="hint">
          .env, .txt, .log, .json, .yaml, .yml, .properties, .sh, .tf,
          .tfvars, Dockerfile, CI workflows
        </p>
        <input
          ref={inputRef}
          type="file"
          hidden
          accept=".env,.txt,.log,.json,.yaml,.yml,.properties,.sh,.bash,.zsh,.tf,.tfvars"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) processFile(file);
          }}
        />
      </div>

      <label
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "0.5rem",
          fontSize: "0.85rem",
          color: "var(--text-secondary)",
          margin: "1rem 0",
          cursor: "pointer",
        }}
      >
        <input
          type="checkbox"
          checked={acknowledged}
          onChange={(e) => setAcknowledged(e.target.checked)}
          style={{ marginTop: "0.2rem" }}
        />
        I will upload the file unmodified — no manual redaction or reformatting.
      </label>

      {fileName && (
        <p className="muted">
          Last selected: {fileName}
          {isScanning ? " — scanning…" : ""}
        </p>
      )}

      {scanError && (
        <p style={{ color: "var(--critical)", fontSize: "0.875rem" }}>
          {scanError}
        </p>
      )}

      {!acknowledged && (
        <p className="muted">Confirm the checkbox above to enable upload.</p>
      )}
    </div>
  );
}
