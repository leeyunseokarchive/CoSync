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
import { canShare, track } from "../../../lib/analytics";

const TOTAL_STEPS = 2;

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
const STAGE_OPTIONS = [
  { value: "아이디어 단계", sub: "제품이 아직 없어요" },
  { value: "초기 단계", sub: "제품을 만들거나 첫 고객을 찾고 있어요" },
  { value: "성장 단계", sub: "고객이 늘고 매출이 나오고 있어요" },
  { value: "스케일업", sub: "본격적으로 사업을 키우고 있어요" },
];

const chipStyle = (on: boolean): React.CSSProperties => ({
  padding: "9px 14px", borderRadius: 999, cursor: "pointer", fontSize: 13, fontWeight: 600,
  border: `1.5px solid ${on ? "#5b5be7" : "#e2e8f0"}`,
  background: on ? "#f0f0fe" : "#fff",
  color: on ? "#5b5be7" : "#64748b",
  whiteSpace: "nowrap",
});

export default function WorkspaceCreatePage() {
  const router = useRouter();
  const { user, loading, isGuest } = useAuth();
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
  const [stage, setStage] = useState("");
  // 생성 직후 초대 링크를 이 화면에서 바로 준다. 대시보드·팀설정까지 걸어가지 않는다.
  const [createdTeamId, setCreatedTeamId] = useState("");
  const [inviteLink, setInviteLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [savingMeta, setSavingMeta] = useState(false);
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


  // 이름만 받고 곧바로 만든다. 분야·단계는 링크를 손에 쥔 뒤에 묻는다(2단계).
  const handleNameNext = () => {
    if (!teamName.trim()) { setError("팀 이름을 입력해주세요."); return; }
    setError("");
    handleCreate();
  };

  // 팀은 이미 만들어졌다. 고른 값을 그 문서에 바로 얹는다. 실패해도 초대는 이미 성공이므로 막지 않는다.
  const saveMeta = async (patch: Record<string, string>) => {
    if (!createdTeamId) return;
    setSavingMeta(true);
    try {
      await updateDoc(doc(db, "teams", createdTeamId), patch);
    } catch (e) {
      console.error("팀 정보 저장 실패", e);
    } finally {
      setSavingMeta(false);
    }
  };

  const selectIndustry = (val: string) => {
    setIndustry(val);
    if (val === "기타") {
      setTimeout(() => industryCustomRef.current?.focus(), 60);
      return;
    }
    saveMeta({ industry: val });
  };

  const confirmIndustryCustom = () => {
    if (!industryCustom.trim()) return;
    saveMeta({ industry: industryCustom.trim() });
  };

  const selectStage = (val: string) => {
    setStage(val);
    saveMeta({ stage: val });
  };

  const copyInvite = async () => {
    track("invite_sent", { via: canShare() ? "share" : "clipboard" });
    try {
      // 모바일에선 공유 시트가 열려 카카오톡으로 바로 보낼 수 있다. 없으면 클립보드로 떨어진다.
      if (canShare()) {
        await navigator.share({ title: `${teamName} 팀 진단`, text: "같은 진단 20문항 풀고 결과 같이 보자", url: inviteLink });
        return;
      }
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // 사용자가 공유 시트를 닫은 경우 등 — 아무것도 하지 않는다.
    }
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
      // memberCount는 자기신고값이라 실제와 어긋났다. 참가한 멤버 수로 대신한다(참가 시 갱신).
      name: teamName, industry: finalIndustry, memberCount: 1, stage,
      // 초대받은 사람에게 "누가 불렀는지"를 보여주려면 팀 문서에 이름이 있어야 한다.
      // firestore.rules가 users/{uid} 읽기를 본인으로만 제한해서 초대자 프로필은 못 읽는다.
      createdByName: profile?.name || user.displayName || "",
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

    // 익명 사용자는 users 문서가 없다. merge로 만들면서 쓴다.
    await setDoc(doc(db, "users", user.uid), {
      teamIds: arrayUnion(teamRef.id), lastActiveTeamId: teamRef.id,
    }, { merge: true });

    setActiveTeams(activeTeams + 1);
    setActiveSessions(activeSessions + 1);
    setShowCopyModal(false);

    // 대시보드로 보내지 않는다. 초대 링크를 이 자리에서 바로 준다.
    track("team_created");
    setCreatedTeamId(teamRef.id);
    setInviteLink(`${window.location.origin}/workspace?inviteCode=${inviteCode}`);
    setStep(2);
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
          {/* 2단계에선 팀이 이미 만들어져 되돌아갈 곳이 없다. 항상 워크스페이스로 나간다. */}
          <Link className="wizard-back-btn" href="/workspace" aria-label="워크스페이스로 이동">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
              <path d="M14.75 5.75 8.5 12l6.25 6.25" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
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
            <h1 className="wizard-question">팀이 만들어졌어요</h1>
            <p className="wizard-sub" style={{ wordBreak: "keep-all" }}>
              이 링크를 받은 사람은 같은 20문항에 답하게 돼요. 둘 다 마치면 팀 리포트가 열립니다.
            </p>

            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, padding: "12px 14px", margin: "4px 0 12px", display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textAlign: "left" }}>
                {inviteLink}
              </span>
            </div>
            <button className="btn btn-primary full wizard-btn" type="button" onClick={copyInvite}>
              {copied ? "복사됐어요" : "초대 링크 보내기"}
            </button>

            {/* 링크는 이미 손에 있다. 여기서 안 고르고 나가도 초대는 성공이다. */}
            <div style={{ marginTop: 28, paddingTop: 20, borderTop: "1px dashed #e2e8f0", textAlign: "left" }}>
              <p style={{ fontSize: 13.5, fontWeight: 700, color: "#1e293b", margin: "0 0 4px", wordBreak: "keep-all" }}>
                팀원이 답하는 동안 두 가지만 알려주세요
              </p>
              <p style={{ fontSize: 12, color: "#94a3b8", margin: "0 0 14px" }}>
                리포트 기준을 팀 상황에 맞추는 데 씁니다. 나중에 팀 설정에서 바꿀 수 있어요.
              </p>

              <p style={{ fontSize: 12, fontWeight: 700, color: "#64748b", margin: "0 0 8px" }}>어떤 분야인가요?</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
                {INDUSTRIES.map(opt => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => selectIndustry(opt)}
                    style={chipStyle(industry === opt)}
                  >
                    {opt}
                  </button>
                ))}
              </div>
              {industry === "기타" && (
                <div className="code-input-row" style={{ marginBottom: 8 }}>
                  <input
                    ref={industryCustomRef}
                    className="input"
                    placeholder="분야를 직접 입력"
                    value={industryCustom}
                    onChange={e => setIndustryCustom(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && confirmIndustryCustom()}
                  />
                  <button className="code-input-btn" type="button" onClick={confirmIndustryCustom} disabled={!industryCustom.trim()} aria-label="분야 저장">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
              )}

              <p style={{ fontSize: 12, fontWeight: 700, color: "#64748b", margin: "16px 0 8px" }}>지금 어느 단계인가요?</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {STAGE_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => selectStage(opt.value)}
                    style={chipStyle(stage === opt.value)}
                  >
                    {opt.value}
                  </button>
                ))}
              </div>
            </div>

            {/* 가입 유도는 진짜 이유가 생긴 자리에만 둔다. 지금 팀·답변·초대링크가 전부
                이 브라우저에만 있고, 팀원이 답하면 본인이 다시 들어와서 봐야 한다.
                알림 기능은 없으므로 알림을 약속하지 않는다. */}
            {isGuest && (
              <div style={{ marginTop: 24, paddingTop: 18, borderTop: "1px dashed #e2e8f0", textAlign: "center" }}>
                <p style={{ fontSize: 13.5, fontWeight: 700, color: "#1e293b", margin: "0 0 4px", wordBreak: "keep-all" }}>
                  이 결과는 이 브라우저에만 있어요
                </p>
                <p style={{ fontSize: 12.5, color: "#64748b", margin: "0 0 14px", wordBreak: "keep-all" }}>
                  기기를 바꾸면 이 팀을 못 찾아요.
                </p>
                <Link
                  className="btn btn-primary"
                  href="/register"
                  style={{ display: "inline-flex" }}
                  // /register가 이 플래그를 보고 "진단 결과를 저장하고 팀원을 초대하세요"로
                  // 문구를 바꾼다. 이미 있는 분기라 세워주기만 하면 된다.
                  onClick={() => localStorage.setItem("cosync-pending-save", "true")}
                >
                  저장해두기
                </Link>
              </div>
            )}

            <button
              className="btn btn-ghost full wizard-btn"
              type="button"
              style={{ marginTop: 22 }}
              disabled={savingMeta}
              onClick={() => router.push(`/workspace?teamId=${createdTeamId}`)}
            >
              대시보드로 가기 →
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
