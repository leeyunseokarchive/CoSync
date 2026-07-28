"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Footer } from "../../../components/Footer";
import { useAuth } from "../../../components/AuthContext";
import { useAppState } from "../../../components/AppState";
import { addDoc, arrayUnion, collection, doc, getDoc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { generateInviteCode } from "../../../lib/team";
import { useEffect, useRef, useState } from "react";
import { useUserProfile } from "../../../components/useUserProfile";
import { useTeams } from "../../../components/useTeams";
import { computeGapSummary } from "../../../lib/gap";
import { computeTeamProgress } from "../../../lib/teamProgress";

const TOTAL_STEPS = 5;

const INDUSTRIES = ["SaaS", "핀테크", "커머스", "콘텐츠", "바이오/헬스", "기타"];
const MEMBER_OPTIONS = ["2명", "3-5명", "6-10명", "11명 이상"];
const STAGE_OPTIONS = [
  { value: "아이디어 단계", sub: "제품이 아직 없어요" },
  { value: "초기 단계", sub: "제품을 만들거나 첫 고객을 찾고 있어요" },
  { value: "성장 단계", sub: "고객이 늘고 매출이 나오고 있어요" },
  { value: "스케일업", sub: "본격적으로 사업을 키우고 있어요" },
];

export default function WorkspaceCreatePage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const {
    activeTeams, activeSessions, setActiveTeams, setActiveSessions,
    progress, department, role,
    extraWorkPriority, extraWorkPrinciple, underperformanceAction,
    exitRecoveryPriority, exitCleanupTiming, exitDisputeResolution, exitVision,
    pivotCriteria, dealbreaker, fundingRunway, spendingApproval,
    investmentCriteria, decisionStructure, decisionFailure, actionVsConsensus,
    deadlockTolerance, salaryStructure, equityStructure, profitDistribution,
    growthStrategy, resetAnswers,
  } = useAppState();
  const { profile } = useUserProfile();
  const { teams } = useTeams();

  const [step, setStep] = useState(1);
  const [teamName, setTeamName] = useState("");
  const [industry, setIndustry] = useState("");
  const [industryCustom, setIndustryCustom] = useState("");
  const [members, setMembers] = useState("");
  const [stage, setStage] = useState("");
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [selectedSourceTeamId, setSelectedSourceTeamId] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [error, setError] = useState("");

  const teamNameRef = useRef<HTMLInputElement>(null);
  const industryCustomRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (teams && teams.length > 0 && !selectedSourceTeamId) {
      setSelectedSourceTeamId(teams[0].id);
    }
  }, [teams, selectedSourceTeamId]);

  useEffect(() => {
    if (!loading && !user) router.push("/register");
  }, [loading, user, router]);

  useEffect(() => {
    if (step === 1) setTimeout(() => teamNameRef.current?.focus(), 60);
    setError("");
  }, [step]);

  const goBack = () => setStep(s => s - 1);

  const handleNameNext = () => {
    if (!teamName.trim()) { setError("팀 이름을 입력해주세요."); return; }
    setError("");
    setStep(2);
  };

  const selectIndustry = (val: string) => {
    setIndustry(val);
    if (val === "기타") {
      setTimeout(() => industryCustomRef.current?.focus(), 60);
      return;
    }
    setTimeout(() => setStep(3), 220);
  };

  const confirmIndustryCustom = () => {
    if (!industryCustom.trim()) return;
    setStep(3);
  };

  const selectMembers = (val: string) => {
    setMembers(val);
    setTimeout(() => setStep(4), 220);
  };

  const selectStage = (val: string) => {
    setStage(val);
    setTimeout(() => setStep(5), 220);
  };

  const handleCreate = async () => {
    if (!user) return;
    const teamIds = profile?.teamIds || [];
    if (teamIds.length > 0) {
      setShowCopyModal(true);
      return;
    }
    await executeCreate(false);
  };

  const handleCopyAndCreate = async () => {
    if (!user || !selectedSourceTeamId) return;
    setCreateLoading(true);
    try {
      const prevDoc = await getDoc(doc(db, "teams", selectedSourceTeamId, "members", user.uid));
      let prevAnswers = {};
      let prevProgress = 0;
      if (prevDoc.exists()) {
        const prevData = prevDoc.data();
        prevAnswers = prevData.answers || {};
        prevProgress = prevData.progress || 0;
      }
      await executeCreate(true, prevAnswers, prevProgress);
    } catch (e) {
      // executeCreate는 내부에서 에러를 처리하므로 여기는 getDoc 실패만 도달
      console.error(e);
      alert("팀 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
      setCreateLoading(false);
    }
  };

  const executeCreate = async (copyAnswers: boolean, customAnswers?: any, customProgress?: number) => {
    if (!user) return;
    setCreateLoading(true);
    try {

    let finalAnswers: any = {};
    let finalProgress = 0;

    if (copyAnswers && customAnswers) {
      finalAnswers = customAnswers;
      finalProgress = customProgress || 0;
    } else if (!profile?.teamIds || profile.teamIds.length === 0) {
      finalAnswers = {
        extraWorkPriority, extraWorkPrinciple, underperformanceAction,
        exitRecoveryPriority, exitCleanupTiming, exitDisputeResolution, exitVision,
        pivotCriteria, dealbreaker, fundingRunway, spendingApproval,
        investmentCriteria, decisionStructure, decisionFailure, actionVsConsensus,
        deadlockTolerance, salaryStructure, equityStructure, profitDistribution, growthStrategy,
      };
      finalProgress = progress;
    } else {
      finalAnswers = {};
      finalProgress = 0;
      resetAnswers();
    }

    const { gapCount, gapScore } = computeGapSummary([finalAnswers]);
    const teamProgress = computeTeamProgress([{ progress: finalProgress }]);
    const inviteCode = generateInviteCode();

    const finalIndustry = industry === "기타" && industryCustom ? industryCustom : industry;
    const teamRef = await addDoc(collection(db, "teams"), {
      name: teamName, industry: finalIndustry, memberCount: members, stage,
      inviteCode, createdBy: user.uid, members: [user.uid],
      createdAt: serverTimestamp(), progress: teamProgress, gapCount, gapScore,
    });

    await setDoc(doc(db, "inviteCodes", inviteCode), {
      teamId: teamRef.id, createdAt: serverTimestamp(),
    });

    await setDoc(
      doc(db, "teams", teamRef.id, "members", user.uid),
      {
        name: profile?.name || user.displayName || "팀원",
        role: role || profile?.role || "OWNER",
        department: department || "",
        status: "active", progress: finalProgress, answers: finalAnswers,
      },
      { merge: true }
    );

    await updateDoc(doc(db, "users", user.uid), {
      teamIds: arrayUnion(teamRef.id), lastActiveTeamId: teamRef.id,
    });

    setActiveTeams(activeTeams + 1);
    setActiveSessions(activeSessions + 1);
    setShowCopyModal(false);

    if (!copyAnswers && profile?.teamIds && profile.teamIds.length > 0) {
      router.push(`/onboarding/diagnosis?teamId=${teamRef.id}`);
    } else {
      router.push(`/session?teamId=${teamRef.id}`);
    }
    } catch (e) {
      console.error(e);
      alert("팀 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <main className="page auth-page">
      <section className="center-card auth-card wizard-card">
        <div className="wizard-header">
          {step > 1 ? (
            <button className="wizard-back-btn" type="button" onClick={goBack} aria-label="이전 단계">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
                <path d="M14.75 5.75 8.5 12l6.25 6.25" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          ) : (
            <Link className="wizard-back-btn" href="/workspace" aria-label="워크스페이스로 이동">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
                <path d="M14.75 5.75 8.5 12l6.25 6.25" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
          )}
          <div className="wizard-progress">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <div
                key={i}
                className={`wizard-dot${i + 1 < step ? " done" : ""}${i + 1 === step ? " active" : ""}`}
              />
            ))}
          </div>
          <div className="wizard-spacer" />
        </div>

        <div className="wizard-body" key={step}>

        {step === 1 && (
          <form onSubmit={e => { e.preventDefault(); handleNameNext(); }}>
            <p className="wizard-step-label">1 / {TOTAL_STEPS}</p>
            <h1 className="wizard-question">팀 이름이 어떻게 되나요?</h1>
            <input
              ref={teamNameRef}
              className="input wizard-input"
              placeholder="회사 또는 팀 이름"
              value={teamName}
              onChange={e => setTeamName(e.target.value)}
            />
            {error && <div className="error-text">{error}</div>}
            <button className="btn btn-primary full wizard-btn" type="submit" disabled={!teamName.trim()}>
              다음 →
            </button>
          </form>
        )}

        {step === 2 && (
          <>
            <p className="wizard-step-label">2 / {TOTAL_STEPS}</p>
            <h1 className="wizard-question">어떤 분야에서 창업하셨나요?</h1>
            <div className="wizard-choice-grid cols-2">
              {INDUSTRIES.map(opt => (
                <button
                  key={opt}
                  type="button"
                  className={`wizard-choice-btn${industry === opt ? " selected" : ""}`}
                  onClick={() => selectIndustry(opt)}
                >
                  {opt}
                </button>
              ))}
            </div>
            {industry === "기타" && (
              <div style={{ marginTop: 14, display: "flex", gap: 8 }}>
                <input
                  ref={industryCustomRef}
                  className="input wizard-input"
                  placeholder="분야를 직접 입력해주세요"
                  value={industryCustom}
                  onChange={e => setIndustryCustom(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && confirmIndustryCustom()}
                  style={{ flex: 1 }}
                />
                <button
                  className="btn btn-primary"
                  type="button"
                  onClick={confirmIndustryCustom}
                  disabled={!industryCustom.trim()}
                  style={{ whiteSpace: "nowrap" }}
                >
                  다음 →
                </button>
              </div>
            )}
          </>
        )}

        {step === 3 && (
          <>
            <p className="wizard-step-label">3 / {TOTAL_STEPS}</p>
            <h1 className="wizard-question">팀 구성원이 몇 명인가요?</h1>
            <div className="wizard-choice-grid cols-2">
              {MEMBER_OPTIONS.map(opt => (
                <button
                  key={opt}
                  type="button"
                  className={`wizard-choice-btn${members === opt ? " selected" : ""}`}
                  onClick={() => selectMembers(opt)}
                >
                  {opt}
                </button>
              ))}
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <p className="wizard-step-label">4 / {TOTAL_STEPS}</p>
            <h1 className="wizard-question">현재 어떤 단계에 있나요?</h1>
            <div className="wizard-choice-grid cols-2">
              {STAGE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  className={`wizard-choice-btn${stage === opt.value ? " selected" : ""}`}
                  onClick={() => selectStage(opt.value)}
                >
                  {opt.value}
                  <span className="choice-sub">{opt.sub}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {step === 5 && (
          <>
            <p className="wizard-step-label">5 / {TOTAL_STEPS}</p>
            <h1 className="wizard-question">이대로 팀을 생성할게요</h1>
            <div className="wizard-summary">
              <div className="wizard-summary-row">
                <span className="summary-label">팀 이름</span>
                <span className="summary-value">{teamName}</span>
              </div>
              <div className="wizard-summary-row">
                <span className="summary-label">비즈니스 분야</span>
                <span className="summary-value">{industry === "기타" && industryCustom ? industryCustom : industry}</span>
              </div>
              <div className="wizard-summary-row">
                <span className="summary-label">구성원 수</span>
                <span className="summary-value">{members}</span>
              </div>
              <div className="wizard-summary-row">
                <span className="summary-label">단계</span>
                <span className="summary-value">{stage}</span>
              </div>
            </div>
            <button
              className="btn btn-primary full wizard-btn"
              type="button"
              onClick={handleCreate}
              disabled={createLoading}
            >
              {createLoading ? "생성 중..." : "팀 생성하기 →"}
            </button>
          </>
        )}

        </div>
      </section>
      <Footer />

      {showCopyModal && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-card">
            <div className="modal-top">
              <div />
              <button className="close" type="button" onClick={() => setShowCopyModal(false)}>✕</button>
            </div>
            <h2>이전 진단 결과 불러오기</h2>
            <p className="section-sub join-modal-sub" style={{ wordBreak: "keep-all", marginBottom: "16px" }}>
              이미 참여 중인 이전 팀들의 온보딩 진단 답변이 존재합니다. <br />
              어느 팀의 답변을 새로운 팀(<strong>{teamName}</strong>)으로 불러오시겠습니까?
            </p>
            {teams && teams.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", textAlign: "left", marginBottom: "20px" }}>
                <label style={{ fontSize: "12px", fontWeight: "bold", color: "#64748b" }}>답변을 가져올 팀 선택</label>
                <select
                  value={selectedSourceTeamId}
                  onChange={e => setSelectedSourceTeamId(e.target.value)}
                  style={{
                    width: "100%", padding: "10px 14px", borderRadius: "8px",
                    border: "1px solid #cbd5e1", fontSize: "14px", outline: "none", backgroundColor: "#fff",
                  }}
                >
                  {teams.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="modal-footer" style={{ flexDirection: "column", gap: "10px", marginTop: "12px" }}>
              <button className="btn btn-primary" type="button" onClick={handleCopyAndCreate} disabled={createLoading} style={{ width: "100%" }}>
                기존 결과 불러와서 생성하기
              </button>
              <button className="btn btn-ghost" type="button" onClick={() => executeCreate(false)} disabled={createLoading} style={{ width: "100%" }}>
                새롭게 진단 시작하기 (답변 초기화)
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
