import { IncidentProvider } from "../context/incident-context";
import { ResponseWizard } from "../components/ResponseWizard";

export default function HomePage() {
  return (
    <IncidentProvider>
      <p className="muted" style={{ marginTop: 0, marginBottom: "1.5rem" }}>
        Found exposed credentials? Paste or upload what you have — we scan locally,
        mask secrets immediately, and give you a step-by-step fix plan. Nothing
        raw is stored or sent to a server.
      </p>
      <ResponseWizard />
    </IncidentProvider>
  );
}
