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

const TOTAL_STEPS = 6;

const ROLE_OPTIONS: Record<string, string[]> = {
  "경영/대표": ["CEO", "공동대표", "COO"],
  "제품/기획": ["CPO", "PO", "PM", "서비스 기획"],
  "기술/개발": ["CTO", "프론트엔드", "백엔드", "모바일", "DevOps", "데이터"],
  "디자인": ["CDO", "프로덕트 디자인", "UX/UI 디자인", "브랜드 디자인"],
  "비즈니스": ["사업개발", "세일즈", "CS", "제휴/파트너십"],
  "마케팅": ["CMO", "퍼포먼스 마케팅", "콘텐츠 마케팅", "PR/커뮤니케이션"],
  "운영/지원": ["운영 총괄", "HR/조직문화", "재무/회계", "총무/법무"],
};

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
    progress, department, setDepartment, role, setRole,
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

  const rolesForDepartment = ROLE_OPTIONS[department] ?? ["CEO", "CPO", "CTO", "COO", "CDO"];

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
      router.push(`/workspace?teamId=${teamRef.id}`);
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
            <h1 className="wizard-question">팀에서 맡은 역할이 어떻게 되나요?</h1>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 4 }}>
              <select
                className="input wizard-input"
                value={department}
                onChange={e => { setDepartment(e.target.value); setRole(""); }}
              >
                <option value="">부서 선택</option>
                <option value="경영/대표">경영/대표</option>
                <option value="제품/기획">제품/기획</option>
                <option value="기술/개발">기술/개발</option>
                <option value="디자인">디자인</option>
                <option value="비즈니스">비즈니스</option>
                <option value="마케팅">마케팅</option>
                <option value="운영/지원">운영/지원</option>
              </select>
              <select
                className="input wizard-input"
                value={role}
                onChange={e => setRole(e.target.value)}
                disabled={!department}
                style={{ color: !role ? "var(--text-3)" : undefined }}
              >
                <option value="">직책 선택</option>
                {rolesForDepartment.map(item => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </div>
            <button
              className="btn btn-primary full wizard-btn"
              type="button"
              onClick={() => setStep(6)}
              disabled={!department}
            >
              다음 →
            </button>
            <p
              style={{ textAlign: "center", marginTop: 12, fontSize: 13, color: "var(--text-3)", cursor: "pointer" }}
              onClick={() => setStep(6)}
            >
              건너뛰기
            </p>
          </>
        )}

        {step === 6 && (
          <>
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
