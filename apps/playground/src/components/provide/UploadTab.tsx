import { useCallback, useRef, useState } from "react";
import { useIncident } from "../../context/incident-context";
import { MAX_UPLOAD_BYTES } from "../../lib/constants";
import { isAcceptedFile } from "../../lib/scan-client";

export function UploadTab() {
  const { scanFromContent, isScanning, scanError } = useIncident();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [acknowledged, setAcknowledged] = useState(false);
  const [selectedName, setSelectedName] = useState<string | null>(null);

  const processFile = useCallback(
    async (file: File) => {
      setFileError(null);

      if (!acknowledged) {
        setFileError("Confirm you have not edited the file before scanning.");
        return;
      }

      if (!isAcceptedFile(file.name)) {
        setFileError(
          "Unsupported file type. Use .env, .txt, .log, .json, .yaml, or similar config files.",
        );
        return;
      }

      if (file.size > MAX_UPLOAD_BYTES) {
        setFileError(`File too large (max ${MAX_UPLOAD_BYTES / 1024 / 1024} MB).`);
        return;
      }

      const text = await file.text();
      setSelectedName(file.name);
      scanFromContent(text, "file_upload", file.name);
    },
    [scanFromContent, acknowledged],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) void processFile(file);
    },
    [processFile],
  );

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void processFile(file);
    e.target.value = "";
  };

  return (
    <div>
      <div
        className={`dropzone ${dragOver ? "drag-over" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".env,.txt,.log,.json,.yaml,.yml,.properties,.sh,.bash,.zsh,.tf,.tfvars"
          onChange={onFileChange}
        />
        <p style={{ margin: "0 0 0.5rem" }}>
          Drop a file here or click to browse
        </p>
        <p style={{ margin: 0, fontSize: "0.8rem" }}>
          .env, logs, YAML, JSON, shell scripts — max 2 MB
        </p>
      </div>

      {selectedName && (
        <p className="muted" style={{ fontSize: "0.85rem", marginTop: "0.75rem" }}>
          Last selected: {selectedName}
        </p>
      )}

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
        I have not edited or reformatted this file before scanning.
      </label>

      {(fileError || scanError) && (
        <p style={{ color: "var(--critical)", fontSize: "0.875rem" }}>
          {fileError ?? scanError}
        </p>
      )}

      {isScanning && (
        <p className="muted" style={{ fontSize: "0.875rem" }}>
          Scanning…
        </p>
      )}

      {!acknowledged && (
        <p className="muted" style={{ fontSize: "0.8rem" }}>
          Confirm the checkbox above before uploading.
        </p>
      )}
    </div>
  );
}
