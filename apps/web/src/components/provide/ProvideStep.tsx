"use client";

import { useState } from "react";
import { GuidedTab } from "./GuidedTab";
import { LinkTabPlaceholder } from "./LinkTabPlaceholder";
import { PasteTab } from "./PasteTab";
import { UploadTab } from "./UploadTab";

type ProvideTab = "paste" | "upload" | "guided" | "link";

export function ProvideStep() {
  const [tab, setTab] = useState<ProvideTab>("paste");

  return (
    <div className="card">
      <h2 className="card-title">Step 1 — Tell us what was exposed</h2>

      <div className="tabs" role="tablist">
        {(
          [
            ["paste", "Paste"],
            ["upload", "Upload"],
            ["guided", "No content"],
            ["link", "Link"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            className={`tab ${tab === id ? "active" : ""} ${id === "link" ? "disabled" : ""}`}
            onClick={() => id !== "link" && setTab(id)}
            disabled={id === "link"}
            title={id === "link" ? "Coming soon" : undefined}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "paste" && <PasteTab />}
      {tab === "upload" && <UploadTab />}
      {tab === "guided" && <GuidedTab />}
      {tab === "link" && <LinkTabPlaceholder />}
    </div>
  );
}
