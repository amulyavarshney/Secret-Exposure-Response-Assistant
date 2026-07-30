import { useState } from "react";
import { useIncident } from "../context/incident-context";
import { PRODUCT_NAME } from "../lib/constants";
import { SettingsDrawer } from "./SettingsDrawer";
import { SiteFooter } from "./SiteFooter";
import { Hero } from "./Hero";
import { ResponseWizard } from "./wizard/ResponseWizard";

export function AppShell() {
  const { view } = useIncident();
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div className="app-shell">
      <header className="app-header">
        <BrandButton />
        <div className="header-actions">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => setSettingsOpen(true)}
          >
            Settings
          </button>
        </div>
      </header>

      <main className="app-main">
        {view === "landing" ? <Hero /> : <ResponseWizard />}
      </main>

      <SiteFooter />
      {settingsOpen && (
        <SettingsDrawer onClose={() => setSettingsOpen(false)} />
      )}
    </div>
  );
}

function BrandButton() {
  const { returnToLanding } = useIncident();

  return (
    <button type="button" className="brand-lockup" onClick={returnToLanding}>
      <span className="brand-mark" aria-hidden />
      <span className="brand-name">{PRODUCT_NAME}</span>
    </button>
  );
}
