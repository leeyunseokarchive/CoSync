"use client";

import { useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import { useUserProfile } from "./useUserProfile";
import { doc, getDoc, setDoc, getDocs, collection, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { computeGapSummary, OnboardingAnswers } from "../lib/gap";
import { computeTeamProgress } from "../lib/teamProgress";

const ANSWER_KEYS = [
  "extraWorkPriority", "extraWorkPrinciple", "underperformanceAction",
  "exitRecoveryPriority", "exitCleanupTiming", "exitDisputeResolution",
  "exitVision", "pivotCriteria", "dealbreaker",
  "fundingRunway", "spendingApproval", "investmentCriteria",
  "decisionStructure", "decisionFailure", "actionVsConsensus", "deadlockTolerance",
  "salaryStructure", "equityStructure", "profitDistribution", "growthStrategy",
] as const;

export function DiagnosisSyncOnLogin() {
  const { user, loading } = useAuth();
  const { profile } = useUserProfile();
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (loading || !user || !profile) return;

    const pending = localStorage.getItem("cosync-pending-save");
    if (!pending) return;

    const teamId = profile.teamIds?.[0];
    if (!teamId) return;

    localStorage.removeItem("cosync-pending-save");

    const sync = async () => {
      const saved = localStorage.getItem("cosync-state");
      if (!saved) return;
      const state = JSON.parse(saved) as Record<string, string>;

      const answerUpdates = Object.fromEntries(
        ANSWER_KEYS.filter(k => state[k]).map(k => [`answers.${k}`, state[k]])
      );
      if (!Object.keys(answerUpdates).length) return;

      const memberDocRef = doc(db, "teams", teamId, "members", user.uid);

      // 이미 진단 답변이 있는 기존 계정에는 익명(비로그인) 답변을 절대 반영하지 않는다.
      // 멤버 문서에 답변이 전혀 없는 최초 1회(신규 유입)만 동기화한다.
      const existing = await getDoc(memberDocRef);
      const existingAnswers = existing.exists() ? (existing.data()?.answers as Record<string, unknown> | undefined) : undefined;
      if (existingAnswers && Object.keys(existingAnswers).length > 0) {
        localStorage.removeItem("cosync-state");
        return;
      }

      await setDoc(memberDocRef, {
        name: profile.name || user.displayName || "팀원",
        role: state.role || "MEMBER",
        status: "active",
      }, { merge: true });
      await updateDoc(memberDocRef, answerUpdates);

      const membersSnapshot = await getDocs(collection(db, "teams", teamId, "members"));
      const memberDocs = membersSnapshot.docs.map(d => d.data());
      const memberAnswers = memberDocs.map(data => (data.answers ?? {}) as OnboardingAnswers);
      const { gapCount, gapScore } = computeGapSummary(memberAnswers);
      const teamProgress = computeTeamProgress(memberDocs);
      await updateDoc(doc(db, "teams", teamId), { progress: teamProgress, gapCount, gapScore });

      setToast("이전 진단 결과가 저장되었습니다");
    };

    sync().catch(console.error);
  }, [loading, user, profile]);

  if (!toast) return null;
  return <div className="global-toast">{toast}</div>;
}
