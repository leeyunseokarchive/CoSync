"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useUserProfile } from "../../../../components/useUserProfile";
import { useAuth } from "../../../../components/AuthContext";
import { useAppState } from "../../../../components/AppState";
import { collection, doc, getDocs, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../../../../lib/firebase";
import { computeGapSummary } from "../../../../lib/gap";
import { computeTeamProgress } from "../../../../lib/teamProgress";
import { appendDiagnosisHistory, appendSoloHistory } from "../../../../lib/history";

function DiagnosisCompletePageInner() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { profile } = useUserProfile();
  const {
    extraWorkPriority, extraWorkPrinciple, underperformanceAction,
    exitRecoveryPriority, exitCleanupTiming, exitDisputeResolution,
    exitVision, pivotCriteria, dealbreaker,
    fundingRunway, spendingApproval, investmentCriteria,
    decisionStructure, decisionFailure, actionVsConsensus, deadlockTolerance,
    salaryStructure, equityStructure, profitDistribution, growthStrategy,
    role, progress
  } = useAppState();

  const [isSaving, setIsSaving] = useState(false);

  const searchParams = useSearchParams();
  const queryTeamId = searchParams ? searchParams.get("teamId") : null;
  const activeTeamId = queryTeamId || profile?.lastActiveTeamId || profile?.teamIds?.[0];

  const hasTeam = Boolean(profile?.teamIds?.length);

  const handleContinueAdvanced = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      if (user && activeTeamId) {
        const answers = {
          extraWorkPriority, extraWorkPrinciple, underperformanceAction,
          exitRecoveryPriority, exitCleanupTiming, exitDisputeResolution,
          exitVision, pivotCriteria, dealbreaker,
          fundingRunway, spendingApproval, investmentCriteria,
          decisionStructure, decisionFailure, actionVsConsensus, deadlockTolerance,
          salaryStructure, equityStructure, profitDistribution, growthStrategy
        };
        const memberDocRef = doc(db, "teams", activeTeamId, "members", user.uid);
        await setDoc(memberDocRef, {
          name: profile?.name || user.displayName || "팀원",
          role: role || "MEMBER",
          status: "active",
          progress,
        }, { merge: true });
        const answerUpdates = Object.fromEntries(
          Object.entries(answers).filter(([, v]) => v !== "").map(([k, v]) => [`answers.${k}`, v])
        );
        if (Object.keys(answerUpdates).length > 0) {
          await updateDoc(memberDocRef, answerUpdates);
        }
      }
      const url = activeTeamId
        ? `/onboarding/diagnosis?teamId=${activeTeamId}&goTo=q13`
        : "/onboarding/diagnosis?goTo=q13";
      router.push(url);
    } catch (e) {
      console.error(e);
      alert("답변 저장 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAndProceed = async (destination: string) => {
    if (isSaving || authLoading) return;
    // 익명 uid가 있으면 여기 안 걸린다. 익명 로그인이 막힌 환경에서만 아래 경로를 탄다.
    if (!user) {
      if (destination === "/gap-report") { router.push("/gap-report"); return; }
      localStorage.setItem("cosync-pending-save", "true");
      router.push("/register");
      return;
    }
    
    setIsSaving(true);
    try {
      const answers = {
        extraWorkPriority, extraWorkPrinciple, underperformanceAction,
        exitRecoveryPriority, exitCleanupTiming, exitDisputeResolution,
        exitVision, pivotCriteria, dealbreaker,
        fundingRunway, spendingApproval, investmentCriteria,
        decisionStructure, decisionFailure, actionVsConsensus, deadlockTolerance,
        salaryStructure, equityStructure, profitDistribution, growthStrategy
      };
      if (activeTeamId) {
        const memberDocRef = doc(db, "teams", activeTeamId, "members", user.uid);
        await setDoc(memberDocRef, {
          name: profile?.name || user.displayName || "팀원",
          role: role || "MEMBER",
          status: "active",
          progress,
        }, { merge: true });
        const answerUpdates = Object.fromEntries(
          Object.entries(answers).filter(([, v]) => v !== "").map(([k, v]) => [`answers.${k}`, v])
        );
        if (Object.keys(answerUpdates).length > 0) {
          await updateDoc(memberDocRef, answerUpdates);
        }
        await appendDiagnosisHistory(activeTeamId, user.uid, answers, progress);
        const membersSnapshot = await getDocs(collection(db, "teams", activeTeamId, "members"));
        const memberDocs = membersSnapshot.docs.map((d) => d.data());
        const memberAnswers = memberDocs.map((data) => (data.answers ?? {}) as typeof answers);
        const { gapCount, gapScore, rawScore } = computeGapSummary(memberAnswers);
        const teamProgress = computeTeamProgress(memberDocs);
        await updateDoc(doc(db, "teams", activeTeamId), { progress: teamProgress, gapCount, gapScore, rawScore });
      } else {
        const filledAnswers = Object.fromEntries(Object.entries(answers).filter(([, v]) => v !== ""));
        if (Object.keys(filledAnswers).length > 0) {
          // 익명 사용자는 users 문서가 없다. merge로 만들면서 쓴다.
          await setDoc(doc(db, "users", user.uid), { soloAnswers: filledAnswers, soloProgress: progress }, { merge: true });
          // 팀이 없으면 이력이 아예 안 남고 있었다. 팀 멤버 문서 대신 users/{uid}에 쌓는다.
          await appendSoloHistory(user.uid, answers, progress);
        }
      }
      let dest = destination;
      if (activeTeamId && (destination === "/gap-report" || destination === "/workspace" || destination === "/workspace")) {
        dest = `${destination}?teamId=${activeTeamId}`;
      }
      router.push(dest);
    } catch (e) {
      console.error(e);
      alert("진단 결과 저장 중 오류가 발생했습니다. 네트워크를 확인해주세요.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="diag-complete-page">
      <div className="diag-complete-wrap">
        <button
          className="diag-complete-back"
          type="button"
          onClick={() => router.push(activeTeamId
            ? `/onboarding/diagnosis?teamId=${activeTeamId}&goTo=q12`
            : "/onboarding/diagnosis?goTo=q12")}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          12번으로 돌아가기
        </button>

        <div className="diag-complete-card">
          <div className="diag-complete-badge">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M4 10L8 14L16 6" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            1차 진단 완료
          </div>

          <h1 className="diag-complete-title">기본 진단이 끝났습니다</h1>

          <div className="diag-complete-progress">
            <div className="diag-complete-progress-info">
              <span>진행률</span>
              <span><strong>12</strong> / 20 문항</span>
            </div>
            <div className="diag-complete-progress-bar">
              <div className="diag-complete-progress-fill" style={{ width: "60%" }} />
            </div>
          </div>

          <p className="diag-complete-desc">
            {hasTeam
              ? <>팀원과 결과를 비교하거나,<br /><strong>의사결정·지분&amp;보상</strong>까지 추가 진단을 마저 할 수 있습니다.</>
              : <>추가 진단을 계속하거나,<br />팀원을 초대해서 진단 결과를 확인하세요.</>
            }
          </p>

          <div className="diag-complete-actions">
            <button
              className="btn btn-primary diag-complete-btn"
              type="button"
              onClick={handleContinueAdvanced}
            >
              추가 진단 계속하기 (Q13~Q20)
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            {hasTeam ? (
              <button
                className="btn btn-ghost diag-complete-btn"
                type="button"
                onClick={() => handleSaveAndProceed("/gap-report")}
              >
                결과 바로 확인하기
              </button>
            ) : (
              <button
                className="btn btn-ghost diag-complete-btn"
                type="button"
                onClick={() => handleSaveAndProceed("/gap-report")}
              >
                내 기준 먼저 확인하기
              </button>
            )}
          </div>

          <p className="diag-complete-note">추가 진단은 나중에 언제든 이어서 완료할 수 있습니다.</p>
        </div>
      </div>
    </main>
  );
}

export default function DiagnosisCompletePage() {
  return (
    <Suspense>
      <DiagnosisCompletePageInner />
    </Suspense>
  );
}

