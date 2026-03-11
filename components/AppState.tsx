"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

type AppState = {
  isAuthed: boolean;
  activeTeams: number;
  activeSessions: number;
  recentWorkspaces: {
    id: string;
    name: string;
    progress: number;
    lastActive: string;
  }[];
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
  setIsAuthed: (value: boolean) => void;
  setActiveTeams: (value: number) => void;
  setActiveSessions: (value: number) => void;
  setRecentWorkspaces: (
    value: {
      id: string;
      name: string;
      progress: number;
      lastActive: string;
    }[]
  ) => void;
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
  isAuthed: false,
  activeTeams: 0,
  activeSessions: 0,
  recentWorkspaces: [],
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

  const value: AppStateContextValue = {
    ...state,
    setIsAuthed: (value) => setState((prev) => ({ ...prev, isAuthed: value })),
    setActiveTeams: (value) => setState((prev) => ({ ...prev, activeTeams: value })),
    setActiveSessions: (value) => setState((prev) => ({ ...prev, activeSessions: value })),
    setRecentWorkspaces: (value) => setState((prev) => ({ ...prev, recentWorkspaces: value })),
    setDecisionRule: (value) => setState((prev) => ({ ...prev, decisionRule: value })),
    setRepeatCount: (value) => setState((prev) => ({ ...prev, repeatCount: value })),
    setTimeElapsed: (value) => setState((prev) => ({ ...prev, timeElapsed: value })),
    setDecisionDeadline: (value) => setState((prev) => ({ ...prev, decisionDeadline: value })),
    setTimeElapsedUnit: (value) => setState((prev) => ({ ...prev, timeElapsedUnit: value })),
    setDecisionDeadlineUnit: (value) => setState((prev) => ({ ...prev, decisionDeadlineUnit: value })),
    setDepartment: (value) => setState((prev) => ({ ...prev, department: value })),
    setRole: (value) => setState((prev) => ({ ...prev, role: value })),
    setDecisionMaker: (value) => setState((prev) => ({ ...prev, decisionMaker: value })),
    progress
  };

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error("useAppState must be used within AppStateProvider.");
  }
  return context;
}
