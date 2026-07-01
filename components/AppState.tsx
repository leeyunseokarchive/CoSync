"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "./AuthContext";

type AgendaOwner = {
  lead: string;
  approver: string;
};

type AppState = {
  activeTeams: number;
  activeSessions: number;
  extraWorkPriority: string;
  extraWorkPrinciple: string;
  underperformanceAction: string;
  exitRecoveryPriority: string;
  exitCleanupTiming: string;
  exitDisputeResolution: string;
  exitVision: string;
  pivotCriteria: string;
  dealbreaker: string;
  fundingRunway: string;
  spendingApproval: string;
  investmentCriteria: string;
  decisionStructure: string;
  decisionFailure: string;
  actionVsConsensus: string;
  deadlockTolerance: string;
  salaryStructure: string;
  equityStructure: string;
  profitDistribution: string;
  growthStrategy: string;
  department: string;
  role: string;
};

type AppStateContextValue = AppState & {
  setActiveTeams: (value: number) => void;
  setActiveSessions: (value: number) => void;
  setExtraWorkPriority: (value: string) => void;
  setExtraWorkPrinciple: (value: string) => void;
  setUnderperformanceAction: (value: string) => void;
  setExitRecoveryPriority: (value: string) => void;
  setExitCleanupTiming: (value: string) => void;
  setExitDisputeResolution: (value: string) => void;
  setExitVision: (value: string) => void;
  setPivotCriteria: (value: string) => void;
  setDealbreaker: (value: string) => void;
  setFundingRunway: (value: string) => void;
  setSpendingApproval: (value: string) => void;
  setInvestmentCriteria: (value: string) => void;
  setDecisionStructure: (value: string) => void;
  setDecisionFailure: (value: string) => void;
  setActionVsConsensus: (value: string) => void;
  setDeadlockTolerance: (value: string) => void;
  setSalaryStructure: (value: string) => void;
  setEquityStructure: (value: string) => void;
  setProfitDistribution: (value: string) => void;
  setGrowthStrategy: (value: string) => void;
  setDepartment: (value: string) => void;
  setRole: (value: string) => void;
  resetState: () => void;
  progress: number;
  resetAnswers: () => void;
  loadAnswersForTeam: (teamId: string) => Promise<void>;
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
  extraWorkPriority: "",
  extraWorkPrinciple: "",
  underperformanceAction: "",
  exitRecoveryPriority: "",
  exitCleanupTiming: "",
  exitDisputeResolution: "",
  exitVision: "",
  pivotCriteria: "",
  dealbreaker: "",
  fundingRunway: "",
  spendingApproval: "",
  investmentCriteria: "",
  decisionStructure: "",
  decisionFailure: "",
  actionVsConsensus: "",
  deadlockTolerance: "",
  salaryStructure: "",
  equityStructure: "",
  profitDistribution: "",
  growthStrategy: "",
  department: "",
  role: ""
};

const AppStateContext = createContext<AppStateContextValue | null>(null);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(defaultState);
  const { user } = useAuth();

  useEffect(() => {
    const fetchExistingAnswers = async () => {
      if (!user) return;
      
      const saved = localStorage.getItem("cosync-state");
      if (saved) {
        try {
          const parsed = JSON.parse(saved) as AppState;
          const hasAnswers = Object.keys(parsed).some(
            (key) => key !== "activeTeams" && key !== "activeSessions" && key !== "department" && key !== "role" && parsed[key as keyof AppState] !== ""
          );
          if (hasAnswers) return;
        } catch {
          // ignore
        }
      }

      const userSnap = await getDoc(doc(db, "users", user.uid));
      if (!userSnap.exists()) return;
      const userData = userSnap.data() as { teamIds?: string[]; lastActiveTeamId?: string; department?: string; role?: string };
      const teamId = userData.lastActiveTeamId || userData.teamIds?.[0];
      if (!teamId) return;

      const memberSnap = await getDoc(doc(db, "teams", teamId, "members", user.uid));
      if (!memberSnap.exists()) return;
      const memberData = memberSnap.data() as { answers?: Record<string, string>; department?: string; role?: string };
      
      if (memberData.answers) {
        setState((prev) => ({
          ...prev,
          ...memberData.answers,
          department: userData.department || memberData.department || prev.department,
          role: userData.role || memberData.role || prev.role,
        }));
      }
    };

    fetchExistingAnswers().catch(console.error);
  }, [user]);


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
      state.extraWorkPriority,
      state.extraWorkPrinciple,
      state.underperformanceAction,
      state.exitRecoveryPriority,
      state.exitCleanupTiming,
      state.exitDisputeResolution,
      state.exitVision,
      state.pivotCriteria,
      state.dealbreaker,
      state.fundingRunway,
      state.spendingApproval,
      state.investmentCriteria,
      state.decisionStructure,
      state.decisionFailure,
      state.actionVsConsensus,
      state.deadlockTolerance,
      state.salaryStructure,
      state.equityStructure,
      state.profitDistribution,
      state.growthStrategy,
      state.department,
      state.role
    ];
    const answeredText = boolFields.filter((value) => value && value.trim().length > 0).length;
    return Math.min(100, Math.round((answeredText / boolFields.length) * 100));
  }, [state]);

  const setActiveTeams = useCallback((value: number) => setState((prev) => ({ ...prev, activeTeams: value })), []);
  const setActiveSessions = useCallback((value: number) => setState((prev) => ({ ...prev, activeSessions: value })), []);
  const setExtraWorkPriority = useCallback((value: string) => setState((prev) => ({ ...prev, extraWorkPriority: value })), []);
  const setExtraWorkPrinciple = useCallback((value: string) => setState((prev) => ({ ...prev, extraWorkPrinciple: value })), []);
  const setUnderperformanceAction = useCallback((value: string) => setState((prev) => ({ ...prev, underperformanceAction: value })), []);
  const setExitRecoveryPriority = useCallback((value: string) => setState((prev) => ({ ...prev, exitRecoveryPriority: value })), []);
  const setExitCleanupTiming = useCallback((value: string) => setState((prev) => ({ ...prev, exitCleanupTiming: value })), []);
  const setExitDisputeResolution = useCallback((value: string) => setState((prev) => ({ ...prev, exitDisputeResolution: value })), []);
  const setExitVision = useCallback((value: string) => setState((prev) => ({ ...prev, exitVision: value })), []);
  const setPivotCriteria = useCallback((value: string) => setState((prev) => ({ ...prev, pivotCriteria: value })), []);
  const setDealbreaker = useCallback((value: string) => setState((prev) => ({ ...prev, dealbreaker: value })), []);
  const setFundingRunway = useCallback((value: string) => setState((prev) => ({ ...prev, fundingRunway: value })), []);
  const setSpendingApproval = useCallback((value: string) => setState((prev) => ({ ...prev, spendingApproval: value })), []);
  const setInvestmentCriteria = useCallback((value: string) => setState((prev) => ({ ...prev, investmentCriteria: value })), []);
  const setDecisionStructure = useCallback((value: string) => setState((prev) => ({ ...prev, decisionStructure: value })), []);
  const setDecisionFailure = useCallback((value: string) => setState((prev) => ({ ...prev, decisionFailure: value })), []);
  const setActionVsConsensus = useCallback((value: string) => setState((prev) => ({ ...prev, actionVsConsensus: value })), []);
  const setDeadlockTolerance = useCallback((value: string) => setState((prev) => ({ ...prev, deadlockTolerance: value })), []);
  const setSalaryStructure = useCallback((value: string) => setState((prev) => ({ ...prev, salaryStructure: value })), []);
  const setEquityStructure = useCallback((value: string) => setState((prev) => ({ ...prev, equityStructure: value })), []);
  const setProfitDistribution = useCallback((value: string) => setState((prev) => ({ ...prev, profitDistribution: value })), []);
  const setGrowthStrategy = useCallback((value: string) => setState((prev) => ({ ...prev, growthStrategy: value })), []);
  const setDepartment = useCallback((value: string) => setState((prev) => ({ ...prev, department: value })), []);
  const setRole = useCallback((value: string) => setState((prev) => ({ ...prev, role: value })), []);
  const resetAnswers = useCallback(() => {
    setState((prev) => {
      const next = { ...prev };
      const fields = [
        "extraWorkPriority", "extraWorkPrinciple", "underperformanceAction",
        "exitRecoveryPriority", "exitCleanupTiming", "exitDisputeResolution",
        "exitVision", "pivotCriteria", "dealbreaker",
        "fundingRunway", "spendingApproval", "investmentCriteria",
        "decisionStructure", "decisionFailure", "actionVsConsensus", "deadlockTolerance",
        "salaryStructure", "equityStructure", "profitDistribution", "growthStrategy"
      ];
      for (const field of fields) {
        (next as any)[field] = "";
      }
      return next;
    });
  }, []);

  const loadAnswersForTeam = useCallback(async (teamId: string) => {
    if (!user || !teamId) return;
    try {
      const memberSnap = await getDoc(doc(db, "teams", teamId, "members", user.uid));
      if (memberSnap.exists()) {
        const memberData = memberSnap.data() as { answers?: Record<string, string>; department?: string; role?: string };
        if (memberData.answers) {
          setState((prev) => {
            const next = { ...prev };
            const fields = [
              "extraWorkPriority", "extraWorkPrinciple", "underperformanceAction",
              "exitRecoveryPriority", "exitCleanupTiming", "exitDisputeResolution",
              "exitVision", "pivotCriteria", "dealbreaker",
              "fundingRunway", "spendingApproval", "investmentCriteria",
              "decisionStructure", "decisionFailure", "actionVsConsensus", "deadlockTolerance",
              "salaryStructure", "equityStructure", "profitDistribution", "growthStrategy"
            ];
            for (const field of fields) {
              (next as any)[field] = "";
            }
            return {
              ...next,
              ...memberData.answers,
              department: memberData.department || prev.department,
              role: memberData.role || prev.role,
            };
          });
          return;
        }
      }
      resetAnswers();
    } catch (e) {
      console.error(e);
    }
  }, [user, resetAnswers]);

  const resetState = useCallback(() => {
    setState(defaultState);
    if (typeof window !== "undefined") {
      localStorage.removeItem("cosync-state");
      localStorage.removeItem("cosync-pending-save");
    }
  }, []);

  const value: AppStateContextValue = useMemo(
    () => ({
      ...state,
      setActiveTeams,
      setActiveSessions,
      setExtraWorkPriority,
      setExtraWorkPrinciple,
      setUnderperformanceAction,
      setExitRecoveryPriority,
      setExitCleanupTiming,
      setExitDisputeResolution,
      setExitVision,
      setPivotCriteria,
      setDealbreaker,
      setFundingRunway,
      setSpendingApproval,
      setInvestmentCriteria,
      setDecisionStructure,
      setDecisionFailure,
      setActionVsConsensus,
      setDeadlockTolerance,
      setSalaryStructure,
      setEquityStructure,
      setProfitDistribution,
      setGrowthStrategy,
      setDepartment,
      setRole,
      resetState,
      resetAnswers,
      loadAnswersForTeam,
      progress
    }),
    [
      state,
      setActiveTeams,
      setActiveSessions,
      setExtraWorkPriority,
      setExtraWorkPrinciple,
      setUnderperformanceAction,
      setExitRecoveryPriority,
      setExitCleanupTiming,
      setExitDisputeResolution,
      setExitVision,
      setPivotCriteria,
      setDealbreaker,
      setFundingRunway,
      setSpendingApproval,
      setInvestmentCriteria,
      setDecisionStructure,
      setDecisionFailure,
      setActionVsConsensus,
      setDeadlockTolerance,
      setSalaryStructure,
      setEquityStructure,
      setProfitDistribution,
      setGrowthStrategy,
      setDepartment,
      setRole,
      resetState,
      resetAnswers,
      loadAnswersForTeam,
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
