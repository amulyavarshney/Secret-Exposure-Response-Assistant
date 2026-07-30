import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { ActionStatus, GuidedIncidentInput } from "@secret-response/shared";
import {
  completionProgress,
  toggleVerification,
  updateActionStatus,
  type ActionAssignment,
} from "../lib/export";
import {
  rebuildIncidentWithEnvironment,
  runClientScan,
  type ScanInput,
} from "../lib/scan-client";
import type {
  AppView,
  IncidentSession,
  ProgressiveAnswers,
  WizardStep,
} from "../lib/types";

interface IncidentContextValue {
  view: AppView;
  step: WizardStep;
  session: IncidentSession | null;
  progressive: ProgressiveAnswers;
  actionAssignments: Record<string, ActionAssignment>;
  scanError: string | null;
  isScanning: boolean;
  progress: ReturnType<typeof completionProgress>;
  startWizard: () => void;
  setStep: (step: WizardStep) => void;
  scanFromContent: (
    content: string,
    channel: "paste" | "file_upload",
    filename?: string,
  ) => void;
  scanFromGuided: (input: GuidedIncidentInput) => void;
  updateProgressive: (answers: Partial<ProgressiveAnswers>) => void;
  setActionAssignment: (actionId: string, assignee: string) => void;
  setActionStatus: (actionId: string, status: ActionStatus) => void;
  toggleVerificationItem: (id: string, completed: boolean) => void;
  resetWizard: () => void;
  returnToLanding: () => void;
}

const IncidentContext = createContext<IncidentContextValue | null>(null);

export function IncidentProvider({ children }: { children: ReactNode }) {
  const [view, setView] = useState<AppView>("landing");
  const [step, setStep] = useState<WizardStep>(1);
  const [session, setSession] = useState<IncidentSession | null>(null);
  const [progressive, setProgressive] = useState<ProgressiveAnswers>({});
  const [actionAssignments, setActionAssignments] = useState<
    Record<string, ActionAssignment>
  >({});
  const [scanError, setScanError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  const applyProgressiveToIncident = useCallback(
    (answers: ProgressiveAnswers) => {
      if (!session) return;

      const { incident, channel, filename } = session;
      if (
        answers.environmentOverride &&
        answers.environmentOverride !== incident.environment &&
        incident.findings.length > 0
      ) {
        const rebuilt = rebuildIncidentWithEnvironment(
          incident.findings,
          answers.environmentOverride,
          channel,
          incident.systems,
        );
        setSession({ incident: rebuilt, channel, filename });
      } else if (
        answers.environmentOverride &&
        incident.findings.length === 0
      ) {
        setSession({
          ...session,
          incident: {
            ...incident,
            environment: answers.environmentOverride,
          },
        });
      }
    },
    [session],
  );

  const updateProgressive = useCallback(
    (answers: Partial<ProgressiveAnswers>) => {
      const next = { ...progressive, ...answers };
      setProgressive(next);
      applyProgressiveToIncident(next);
    },
    [progressive, applyProgressiveToIncident],
  );

  const runScan = useCallback((input: ScanInput) => {
    setScanError(null);
    setIsScanning(true);
    try {
      const incident = runClientScan(input);
      setSession({
        incident,
        channel: input.channel,
        filename: input.filename,
      });
      setProgressive({});
      setActionAssignments({});
      setStep(2);
    } catch (err) {
      setScanError(
        err instanceof Error ? err.message : "Scan failed unexpectedly.",
      );
    } finally {
      setIsScanning(false);
    }
  }, []);

  const scanFromContent = useCallback(
    (
      content: string,
      channel: "paste" | "file_upload",
      filename?: string,
    ) => {
      runScan({ content, channel, filename });
    },
    [runScan],
  );

  const scanFromGuided = useCallback(
    (input: GuidedIncidentInput) => {
      runScan({ channel: "guided_form", guided: input });
    },
    [runScan],
  );

  const startWizard = useCallback(() => {
    setView("wizard");
    setStep(1);
  }, []);

  const resetWizard = useCallback(() => {
    setStep(1);
    setSession(null);
    setProgressive({});
    setActionAssignments({});
    setScanError(null);
  }, []);

  const returnToLanding = useCallback(() => {
    setView("landing");
    resetWizard();
  }, [resetWizard]);

  const setActionAssignment = useCallback(
    (actionId: string, assignee: string) => {
      setActionAssignments((prev) => ({
        ...prev,
        [actionId]: { assignee },
      }));
    },
    [],
  );

  const setActionStatus = useCallback(
    (actionId: string, status: ActionStatus) => {
      if (!session) return;
      setSession({
        ...session,
        incident: updateActionStatus(session.incident, actionId, status),
      });
    },
    [session],
  );

  const toggleVerificationItem = useCallback(
    (id: string, completed: boolean) => {
      if (!session) return;
      setSession({
        ...session,
        incident: toggleVerification(session.incident, id, completed),
      });
    },
    [session],
  );

  const progress = useMemo(
    () =>
      session
        ? completionProgress(session.incident)
        : {
            actionsDone: 0,
            actionsTotal: 0,
            verificationDone: 0,
            verificationTotal: 0,
          },
    [session],
  );

  const value: IncidentContextValue = {
    view,
    step,
    session,
    progressive,
    actionAssignments,
    scanError,
    isScanning,
    progress,
    startWizard,
    setStep,
    scanFromContent,
    scanFromGuided,
    updateProgressive,
    setActionAssignment,
    setActionStatus,
    toggleVerificationItem,
    resetWizard,
    returnToLanding,
  };

  return (
    <IncidentContext.Provider value={value}>{children}</IncidentContext.Provider>
  );
}

export function useIncident(): IncidentContextValue {
  const ctx = useContext(IncidentContext);
  if (!ctx) {
    throw new Error("useIncident must be used within IncidentProvider");
  }
  return ctx;
}
