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

    const teamIds = profile.teamIds || [];
    if (teamIds.length === 0) return;

    const sync = async () => {
      const saved = localStorage.getItem("cosync-state");
      if (!saved) {
        localStorage.removeItem("cosync-pending-save");
        return;
      }
      const state = JSON.parse(saved) as Record<string, string>;

      const answerUpdates = Object.fromEntries(
        ANSWER_KEYS.filter(k => state[k]).map(k => [`answers.${k}`, state[k]])
      );
      if (!Object.keys(answerUpdates).length) {
        localStorage.removeItem("cosync-pending-save");
        return;
      }

      let wroteAny = false;
      for (const teamId of teamIds) {
        const memberDocRef = doc(db, "teams", teamId, "members", user.uid);

        // 이미 답변이 있는 팀은 건너뜀 — 로그인이 기존 답변을 덮어쓰지 않도록
        const existing = await getDoc(memberDocRef);
        const existingAnswers = existing.exists() ? (existing.data().answers ?? {}) : {};
        if (Object.keys(existingAnswers).length > 0) continue;

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
        wroteAny = true;
      }

      // 동기화 성공 후에만 플래그 제거 — 실패 시 다음 마운트에서 자연 재시도
      localStorage.removeItem("cosync-pending-save");
      if (wroteAny) setToast("이전 진단 결과가 저장되었습니다");
    };

    sync().catch(console.error);
  }, [loading, user, profile]);

  if (!toast) return null;
  return <div className="global-toast">{toast}</div>;
}
