"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

type AgendaOwner = {
  lead: string;
  approver: string;
};

type AppState = {
  activeTeams: number;
  activeSessions: number;
  decisionStructure: string;
  decisionConfirmation: string;
  deadlockRepeat: string;
  deadlockDays: string;
  extraWorkPrinciple: string;
  extraWorkPriority: string;
  motivationChoices: string[];
  workType: string;
  boundaryTasks: string[];
  allocationRule: string;
  burdenTasks: string[];
  conflictRepeat: string;
  conflictWeeks: string;
  agendaOwners: Record<string, AgendaOwner>;
  customAgendaName: string;
  customAgendaOwner: AgendaOwner;
  exitRecoveryItems: string[];
  handoverMethod: string;
  exitCleanupHours: string;
  exitCleanupDays: string;
  department: string;
  role: string;
};

type AppStateContextValue = AppState & {
  setActiveTeams: (value: number) => void;
  setActiveSessions: (value: number) => void;
  setDecisionStructure: (value: string) => void;
  setDecisionConfirmation: (value: string) => void;
  setDeadlockRepeat: (value: string) => void;
  setDeadlockDays: (value: string) => void;
  setExtraWorkPrinciple: (value: string) => void;
  setExtraWorkPriority: (value: string) => void;
  setMotivationChoices: (value: string[]) => void;
  setWorkType: (value: string) => void;
  setBoundaryTasks: (value: string[]) => void;
  setAllocationRule: (value: string) => void;
  setBurdenTasks: (value: string[]) => void;
  setConflictRepeat: (value: string) => void;
  setConflictWeeks: (value: string) => void;
  setAgendaOwners: (value: Record<string, AgendaOwner>) => void;
  setCustomAgendaName: (value: string) => void;
  setCustomAgendaOwner: (value: AgendaOwner) => void;
  setExitRecoveryItems: (value: string[]) => void;
  setHandoverMethod: (value: string) => void;
  setExitCleanupHours: (value: string) => void;
  setExitCleanupDays: (value: string) => void;
  setDepartment: (value: string) => void;
  setRole: (value: string) => void;
  progress: number;
};

const defaultAgendaOwners: Record<string, AgendaOwner> = {
  제품: { lead: "대표", approver: "대표" },
  개발: { lead: "공동창업자 A(개발)", approver: "대표" },
  디자인: { lead: "공동창업자 B(디자인)", approver: "대표" },
  일정: { lead: "대표", approver: "대표" },
  "외부 커밋": { lead: "대표", approver: "대표" },
  예산: { lead: "대표", approver: "대표" }
};

const defaultState: AppState = {
  activeTeams: 0,
  activeSessions: 0,
  decisionStructure: "",
  decisionConfirmation: "",
  deadlockRepeat: "",
  deadlockDays: "",
  extraWorkPrinciple: "",
  extraWorkPriority: "",
  motivationChoices: [],
  workType: "",
  boundaryTasks: [],
  allocationRule: "",
  burdenTasks: [],
  conflictRepeat: "",
  conflictWeeks: "",
  agendaOwners: defaultAgendaOwners,
  customAgendaName: "",
  customAgendaOwner: { lead: "대표", approver: "대표" },
  exitRecoveryItems: [],
  handoverMethod: "",
  exitCleanupHours: "",
  exitCleanupDays: "",
  department: "",
  role: ""
};

const AppStateContext = createContext<AppStateContextValue | null>(null);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(defaultState);

  useEffect(() => {
    const saved = localStorage.getItem("cosync-state");
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as AppState;
        setState({ ...defaultState, ...parsed });
      } catch {
        setState(defaultState);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("cosync-state", JSON.stringify(state));
  }, [state]);

  const progress = useMemo(() => {
    const boolFields = [
      state.decisionStructure,
      state.decisionConfirmation,
      state.extraWorkPrinciple,
      state.extraWorkPriority,
      state.handoverMethod,
      state.department,
      state.role
    ];
    const numericFields = [
      Number(state.deadlockRepeat),
      Number(state.deadlockDays),
      Number(state.exitCleanupHours),
      Number(state.exitCleanupDays)
    ];
    const listFields = [state.motivationChoices, state.exitRecoveryItems];

    const answeredText = boolFields.filter((value) => value.trim().length > 0).length;
    const answeredNumeric = numericFields.filter((value) => Number.isFinite(value) && value > 0).length;
    const answeredList = listFields.filter((value) => value.length > 0).length;
    const total = boolFields.length + numericFields.length + listFields.length;
    const answered = answeredText + answeredNumeric + answeredList;
    return Math.min(100, Math.round((answered / total) * 100));
  }, [state]);

  const setActiveTeams = useCallback(
    (value: number) => setState((prev) => ({ ...prev, activeTeams: value })),
    []
  );
  const setActiveSessions = useCallback(
    (value: number) => setState((prev) => ({ ...prev, activeSessions: value })),
    []
  );
  const setDecisionStructure = useCallback(
    (value: string) => setState((prev) => ({ ...prev, decisionStructure: value })),
    []
  );
  const setDecisionConfirmation = useCallback(
    (value: string) => setState((prev) => ({ ...prev, decisionConfirmation: value })),
    []
  );
  const setDeadlockRepeat = useCallback(
    (value: string) => setState((prev) => ({ ...prev, deadlockRepeat: value })),
    []
  );
  const setDeadlockDays = useCallback(
    (value: string) => setState((prev) => ({ ...prev, deadlockDays: value })),
    []
  );
  const setExtraWorkPrinciple = useCallback(
    (value: string) => setState((prev) => ({ ...prev, extraWorkPrinciple: value })),
    []
  );
  const setExtraWorkPriority = useCallback(
    (value: string) => setState((prev) => ({ ...prev, extraWorkPriority: value })),
    []
  );
  const setMotivationChoices = useCallback(
    (value: string[]) => setState((prev) => ({ ...prev, motivationChoices: value })),
    []
  );
  const setWorkType = useCallback(
    (value: string) => setState((prev) => ({ ...prev, workType: value })),
    []
  );
  const setBoundaryTasks = useCallback(
    (value: string[]) => setState((prev) => ({ ...prev, boundaryTasks: value })),
    []
  );
  const setAllocationRule = useCallback(
    (value: string) => setState((prev) => ({ ...prev, allocationRule: value })),
    []
  );
  const setBurdenTasks = useCallback(
    (value: string[]) => setState((prev) => ({ ...prev, burdenTasks: value })),
    []
  );
  const setConflictRepeat = useCallback(
    (value: string) => setState((prev) => ({ ...prev, conflictRepeat: value })),
    []
  );
  const setConflictWeeks = useCallback(
    (value: string) => setState((prev) => ({ ...prev, conflictWeeks: value })),
    []
  );
  const setAgendaOwners = useCallback(
    (value: Record<string, AgendaOwner>) => setState((prev) => ({ ...prev, agendaOwners: value })),
    []
  );
  const setCustomAgendaName = useCallback(
    (value: string) => setState((prev) => ({ ...prev, customAgendaName: value })),
    []
  );
  const setCustomAgendaOwner = useCallback(
    (value: AgendaOwner) => setState((prev) => ({ ...prev, customAgendaOwner: value })),
    []
  );
  const setExitRecoveryItems = useCallback(
    (value: string[]) => setState((prev) => ({ ...prev, exitRecoveryItems: value })),
    []
  );
  const setHandoverMethod = useCallback(
    (value: string) => setState((prev) => ({ ...prev, handoverMethod: value })),
    []
  );
  const setExitCleanupHours = useCallback(
    (value: string) => setState((prev) => ({ ...prev, exitCleanupHours: value })),
    []
  );
  const setExitCleanupDays = useCallback(
    (value: string) => setState((prev) => ({ ...prev, exitCleanupDays: value })),
    []
  );
  const setDepartment = useCallback(
    (value: string) => setState((prev) => ({ ...prev, department: value })),
    []
  );
  const setRole = useCallback(
    (value: string) => setState((prev) => ({ ...prev, role: value })),
    []
  );

  const value: AppStateContextValue = useMemo(
    () => ({
      ...state,
      setActiveTeams,
      setActiveSessions,
      setDecisionStructure,
      setDecisionConfirmation,
      setDeadlockRepeat,
      setDeadlockDays,
      setExtraWorkPrinciple,
      setExtraWorkPriority,
      setMotivationChoices,
      setWorkType,
      setBoundaryTasks,
      setAllocationRule,
      setBurdenTasks,
      setConflictRepeat,
      setConflictWeeks,
      setAgendaOwners,
      setCustomAgendaName,
      setCustomAgendaOwner,
      setExitRecoveryItems,
      setHandoverMethod,
      setExitCleanupHours,
      setExitCleanupDays,
      setDepartment,
      setRole,
      progress
    }),
    [
      state,
      setActiveTeams,
      setActiveSessions,
      setDecisionStructure,
      setDecisionConfirmation,
      setDeadlockRepeat,
      setDeadlockDays,
      setExtraWorkPrinciple,
      setExtraWorkPriority,
      setMotivationChoices,
      setWorkType,
      setBoundaryTasks,
      setAllocationRule,
      setBurdenTasks,
      setConflictRepeat,
      setConflictWeeks,
      setAgendaOwners,
      setCustomAgendaName,
      setCustomAgendaOwner,
      setExitRecoveryItems,
      setHandoverMethod,
      setExitCleanupHours,
      setExitCleanupDays,
      setDepartment,
      setRole,
      progress
    ]
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error("useAppState must be used within AppStateProvider.");
  }
  return context;
}
