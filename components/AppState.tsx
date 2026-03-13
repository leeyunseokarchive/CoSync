"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

type AppState = {
  activeTeams: number;
  activeSessions: number;
  decisionRule: string;
  repeatCount: string;
  timeElapsed: string;
  timeElapsedUnit: string;
  decisionDeadline: string;
  decisionDeadlineUnit: string;
  department: string;
  role: string;
  decisionMaker: string;
};

type AppStateContextValue = AppState & {
  setActiveTeams: (value: number) => void;
  setActiveSessions: (value: number) => void;
  setDecisionRule: (value: string) => void;
  setRepeatCount: (value: string) => void;
  setTimeElapsed: (value: string) => void;
  setDecisionDeadline: (value: string) => void;
  setTimeElapsedUnit: (value: string) => void;
  setDecisionDeadlineUnit: (value: string) => void;
  setDepartment: (value: string) => void;
  setRole: (value: string) => void;
  setDecisionMaker: (value: string) => void;
  progress: number;
};

const defaultState: AppState = {
  activeTeams: 0,
  activeSessions: 0,
  decisionRule: "",
  repeatCount: "",
  timeElapsed: "",
  timeElapsedUnit: "시간",
  decisionDeadline: "",
  decisionDeadlineUnit: "시간",
  department: "",
  role: "",
  decisionMaker: ""
};

const AppStateContext = createContext<AppStateContextValue | null>(null);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(defaultState);

  useEffect(() => {
    const saved = localStorage.getItem("cosync-state");
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as AppState;
        setState({ ...defaultState, ...parsed, isAuthed: false });
      } catch {
        setState(defaultState);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("cosync-state", JSON.stringify(state));
  }, [state]);

  const progress = useMemo(() => {
    const textFields = [state.decisionRule, state.department, state.role, state.decisionMaker];
    const numericFields = [
      Number(state.repeatCount),
      Number(state.timeElapsed),
      Number(state.decisionDeadline)
    ];
    const answeredText = textFields.filter((value) => value.trim().length > 0).length;
    const answeredNumeric = numericFields.filter((value) => Number.isFinite(value) && value > 0).length;
    const total = textFields.length + numericFields.length;
    const answered = answeredText + answeredNumeric;
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
  const setDecisionRule = useCallback(
    (value: string) => setState((prev) => ({ ...prev, decisionRule: value })),
    []
  );
  const setRepeatCount = useCallback(
    (value: string) => setState((prev) => ({ ...prev, repeatCount: value })),
    []
  );
  const setTimeElapsed = useCallback(
    (value: string) => setState((prev) => ({ ...prev, timeElapsed: value })),
    []
  );
  const setDecisionDeadline = useCallback(
    (value: string) => setState((prev) => ({ ...prev, decisionDeadline: value })),
    []
  );
  const setTimeElapsedUnit = useCallback(
    (value: string) => setState((prev) => ({ ...prev, timeElapsedUnit: value })),
    []
  );
  const setDecisionDeadlineUnit = useCallback(
    (value: string) => setState((prev) => ({ ...prev, decisionDeadlineUnit: value })),
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
  const setDecisionMaker = useCallback(
    (value: string) => setState((prev) => ({ ...prev, decisionMaker: value })),
    []
  );

  const value: AppStateContextValue = useMemo(
    () => ({
      ...state,
      setActiveTeams,
      setActiveSessions,
      setDecisionRule,
      setRepeatCount,
      setTimeElapsed,
      setDecisionDeadline,
      setTimeElapsedUnit,
      setDecisionDeadlineUnit,
      setDepartment,
      setRole,
      setDecisionMaker,
      progress
    }),
    [
      state,
      setActiveTeams,
      setActiveSessions,
      setDecisionRule,
      setRepeatCount,
      setTimeElapsed,
      setDecisionDeadline,
      setTimeElapsedUnit,
      setDecisionDeadlineUnit,
      setDepartment,
      setRole,
      setDecisionMaker,
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
