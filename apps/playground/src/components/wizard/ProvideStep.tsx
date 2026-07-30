import { useState } from "react";
import { SAFETY_NOTE } from "../../lib/constants";
import { PasteTab } from "../provide/PasteTab";
import { UploadTab } from "../provide/UploadTab";
import { GuidedTab } from "../provide/GuidedTab";

type ProvideTab = "paste" | "upload" | "guided";

export function ProvideStep() {
  const [tab, setTab] = useState<ProvideTab>("paste");

  return (
    <div className="panel">
      <h2 className="panel-title">Step 1 — Provide what was exposed</h2>
      <p className="safety-strip">{SAFETY_NOTE}</p>

      <div className="tabs" role="tablist">
        {(
          [
            ["paste", "Paste"],
            ["upload", "Upload"],
            ["guided", "No content"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            className={`tab ${tab === id ? "active" : ""}`}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "paste" && <PasteTab />}
      {tab === "upload" && <UploadTab />}
      {tab === "guided" && <GuidedTab />}
    </div>
  );
}
