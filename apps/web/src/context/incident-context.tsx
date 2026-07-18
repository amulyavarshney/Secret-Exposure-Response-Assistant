"use client";

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
import type { IncidentSession, ProgressiveAnswers, WizardStep } from "../lib/types";

interface IncidentContextValue {
  step: WizardStep;
  session: IncidentSession | null;
  progressive: ProgressiveAnswers;
  actionAssignments: Record<string, ActionAssignment>;
  scanError: string | null;
  isScanning: boolean;
  progress: ReturnType<typeof completionProgress>;
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
}

const IncidentContext = createContext<IncidentContextValue | null>(null);

function useWizardState() {
  const [step, setStep] = useState<WizardStep>(1);
  const [session, setSession] = useState<IncidentSession | null>(null);
  const [progressive, setProgressive] = useState<ProgressiveAnswers>({});
  const [actionAssignments, setActionAssignments] = useState<
    Record<string, ActionAssignment>
  >({});
  const [scanError, setScanError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  return {
    step,
    setStep,
    session,
    setSession,
    progressive,
    setProgressive,
    actionAssignments,
    setActionAssignments,
    scanError,
    setScanError,
    isScanning,
    setIsScanning,
  };
}

export function IncidentProvider({ children }: { children: ReactNode }) {
  const state = useWizardState();

  const applyProgressiveToIncident = useCallback(
    (answers: ProgressiveAnswers) => {
      if (!state.session) return;

      const { incident, channel, filename, findingsOnly } = state.session;
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
        state.setSession({
          incident: rebuilt,
          channel,
          filename,
          findingsOnly,
        });
      } else if (
        answers.environmentOverride &&
        incident.findings.length === 0
      ) {
        state.setSession({
          ...state.session,
          incident: {
            ...incident,
            environment: answers.environmentOverride,
          },
        });
      }
    },
    [state],
  );

  const updateProgressive = useCallback(
    (answers: Partial<ProgressiveAnswers>) => {
      const next = { ...state.progressive, ...answers };
      state.setProgressive(next);
      applyProgressiveToIncident(next);
    },
    [state, applyProgressiveToIncident],
  );

  const runScan = useCallback(
    (input: ScanInput) => {
      state.setScanError(null);
      state.setIsScanning(true);
      try {
        const incident = runClientScan(input);
        state.setSession({
          incident,
          channel: input.channel,
          filename: input.filename,
          findingsOnly: true,
        });
        state.setProgressive({});
        state.setActionAssignments({});
        state.setStep(2);
      } catch (err) {
        state.setScanError(
          err instanceof Error ? err.message : "Scan failed unexpectedly.",
        );
      } finally {
        state.setIsScanning(false);
      }
    },
    [state],
  );

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

  const setActionAssignment = useCallback(
    (actionId: string, assignee: string) => {
      state.setActionAssignments((prev) => ({
        ...prev,
        [actionId]: { assignee },
      }));
    },
    [state],
  );

  const setActionStatus = useCallback(
    (actionId: string, status: ActionStatus) => {
      if (!state.session) return;
      state.setSession({
        ...state.session,
        incident: updateActionStatus(state.session.incident, actionId, status),
      });
    },
    [state],
  );

  const toggleVerificationItem = useCallback(
    (id: string, completed: boolean) => {
      if (!state.session) return;
      state.setSession({
        ...state.session,
        incident: toggleVerification(state.session.incident, id, completed),
      });
    },
    [state],
  );

  const resetWizard = useCallback(() => {
    state.setStep(1);
    state.setSession(null);
    state.setProgressive({});
    state.setActionAssignments({});
    state.setScanError(null);
  }, [state]);

  const progress = useMemo(
    () =>
      state.session
        ? completionProgress(state.session.incident)
        : {
            actionsDone: 0,
            actionsTotal: 0,
            verificationDone: 0,
            verificationTotal: 0,
          },
    [state.session],
  );

  const value: IncidentContextValue = {
    step: state.step,
    session: state.session,
    progressive: state.progressive,
    actionAssignments: state.actionAssignments,
    scanError: state.scanError,
    isScanning: state.isScanning,
    progress,
    setStep: state.setStep,
    scanFromContent,
    scanFromGuided,
    updateProgressive,
    setActionAssignment,
    setActionStatus,
    toggleVerificationItem,
    resetWizard,
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
