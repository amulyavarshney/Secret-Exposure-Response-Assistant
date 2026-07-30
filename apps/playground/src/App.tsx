import { IncidentProvider } from "./context/incident-context";
import { AppShell } from "./components/AppShell";

export function App() {
  return (
    <IncidentProvider>
      <AppShell />
    </IncidentProvider>
  );
}
