"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Footer } from "../../../components/Footer";
import { useAuth } from "../../../components/AuthContext";
import { useAppState } from "../../../components/AppState";
import { addDoc, arrayUnion, collection, doc, getDoc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { generateInviteCode } from "../../../lib/team";
import { useEffect, useState } from "react";
import { useUserProfile } from "../../../components/useUserProfile";
import { computeGapSummary } from "../../../lib/gap";
import { computeTeamProgress } from "../../../lib/teamProgress";

export default function WorkspaceCreatePage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const {
    activeTeams,
    activeSessions,
    setActiveTeams,
    setActiveSessions,
    progress,
    department,
    role,
    extraWorkPriority,
    extraWorkPrinciple,
    underperformanceAction,
    exitRecoveryPriority,
    exitCleanupTiming,
    exitDisputeResolution,
    exitVision,
    pivotCriteria,
    dealbreaker,
    fundingRunway,
    spendingApproval,
    investmentCriteria,
    decisionStructure,
    decisionFailure,
    actionVsConsensus,
    deadlockTolerance,
    salaryStructure,
    equityStructure,
    profitDistribution,
    growthStrategy,
    resetAnswers
  } = useAppState();
  const { profile } = useUserProfile();
  const [teamName, setTeamName] = useState("");
  const [industry, setIndustry] = useState("선택해주세요");
  const [members, setMembers] = useState("선택해주세요");
  const [stage, setStage] = useState("선택해주세요");
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [prevAnswers, setPrevAnswers] = useState<any>(null);
  const [prevProgress, setPrevProgress] = useState(0);
  const [createLoading, setCreateLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && !user) {
      router.push("/register");
    }
  }, [loading, user, router]);

  const handleCreate = async () => {
    if (!user) return;
    if (!teamName.trim()) {
      setError("팀 이름을 입력해주세요.");
      return;
    }
    if (industry === "선택해주세요") {
      setError("비즈니스 분야를 선택해주세요.");
      return;
    }
    if (members === "선택해주세요") {
      setError("팀원 수를 선택해주세요.");
      return;
    }
    if (stage === "선택해주세요") {
      setError("팀 단계를 선택해주세요.");
      return;
    }

    setCreateLoading(true);

    try {
      const teamIds = profile?.teamIds || [];
      if (teamIds.length > 0) {
        const prevDoc = await getDoc(doc(db, "teams", teamIds[0], "members", user.uid));
        if (prevDoc.exists()) {
          const prevData = prevDoc.data();
          if (prevData.answers && Object.keys(prevData.answers).length > 0) {
            setPrevAnswers(prevData.answers);
            setPrevProgress(prevData.progress || 0);
            setShowCopyModal(true);
            setCreateLoading(false);
            return;
          }
        }
      }

      await executeCreate(false);
    } catch (e) {
      console.error(e);
      setCreateLoading(false);
    }
  };

  const executeCreate = async (copyAnswers: boolean) => {
    if (!user) return;
    setCreateLoading(true);

    let finalAnswers: any = {};
    let finalProgress = 0;

    if (copyAnswers && prevAnswers) {
      finalAnswers = prevAnswers;
      finalProgress = prevProgress;
    } else if (!profile?.teamIds || profile.teamIds.length === 0) {
      finalAnswers = {
        extraWorkPriority,
        extraWorkPrinciple,
        underperformanceAction,
        exitRecoveryPriority,
        exitCleanupTiming,
        exitDisputeResolution,
        exitVision,
        pivotCriteria,
        dealbreaker,
        fundingRunway,
        spendingApproval,
        investmentCriteria,
        decisionStructure,
        decisionFailure,
        actionVsConsensus,
        deadlockTolerance,
        salaryStructure,
        equityStructure,
        profitDistribution,
        growthStrategy
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
    
    const teamRef = await addDoc(collection(db, "teams"), {
      name: teamName,
      industry,
      memberCount: members,
      stage,
      inviteCode,
      createdBy: user.uid,
      members: [user.uid],
      createdAt: serverTimestamp(),
      progress: teamProgress,
      gapCount,
      gapScore
    });

    await setDoc(doc(db, "inviteCodes", inviteCode), {
      teamId: teamRef.id,
      createdAt: serverTimestamp()
    });

    await setDoc(
      doc(db, "teams", teamRef.id, "members", user.uid),
      {
        name: profile?.name || user.displayName || "팀원",
        role: role || profile?.role || "OWNER",
        department: department || "",
        status: "active",
        progress: finalProgress,
        answers: finalAnswers
      },
      { merge: true }
    );

    await updateDoc(doc(db, "users", user.uid), {
      teamIds: arrayUnion(teamRef.id),
      lastActiveTeamId: teamRef.id
    });

    setActiveTeams(activeTeams + 1);
    setActiveSessions(activeSessions + 1);
    setCreateLoading(false);
    setShowCopyModal(false);

    if (!copyAnswers && profile?.teamIds && profile.teamIds.length > 0) {
      router.push(`/onboarding/diagnosis?teamId=${teamRef.id}`);
    } else {
      router.push(`/session?teamId=${teamRef.id}`);
    }
  };

  return (
    <main className="page auth-page">
      <div className="container">
        <Link className="back-arrow" href="/workspace">
          ←
        </Link>
      </div>
      <section className="center-card auth-card">
        <h1>팀 생성하기</h1>
        <p className="auth-sub">워크스페이스 정보를 입력하여 팀 구성을 완료하세요.</p>

        <div className="form-grid">
          <label className="label">팀 이름</label>
          <input
            className="input"
            placeholder="회사 또는 팀 이름을 입력하세요"
            value={teamName}
            onChange={(event) => setTeamName(event.target.value)}
          />

          <label className="label">비즈니스 분야</label>
          <div className="select-row">
            <select className="input select" value={industry} onChange={(event) => setIndustry(event.target.value)}>
              <option>선택해주세요</option>
              <option>SaaS</option>
              <option>핀테크</option>
              <option>커머스</option>
              <option>콘텐츠</option>
              <option>바이오/헬스</option>
              <option>기타</option>
            </select>
          </div>

          <div className="two-col">
            <div>
              <label className="label">팀원 수</label>
              <div className="select-row">
                <select className="input select" value={members} onChange={(event) => setMembers(event.target.value)}>
                  <option>선택해주세요</option>
                  <option>1-2명</option>
                  <option>3-5명</option>
                  <option>6-10명</option>
                  <option>10명 이상</option>
                </select>
              </div>
            </div>
            <div>
              <label className="label">팀 단계</label>
              <div className="select-row">
                <select className="input select" value={stage} onChange={(event) => setStage(event.target.value)}>
                  <option>선택해주세요</option>
                  <option value="아이디어 단계">아이디어 단계</option>
                  <option value="MVP 단계">MVP 단계</option>
                  <option value="PMF 단계">PMF 단계</option>
                  <option value="스케일업 단계">스케일업 단계</option>
                </select>
                {stage !== "선택해주세요" && (
                  <p className="hint" style={{ marginTop: "6px" }}>
                    {stage === "아이디어 단계" && "아직 제품이 없고 아이디어를 구체화하는 단계예요."}
                    {stage === "MVP 단계" && "핵심 기능만 담은 첫 제품을 만들어 시장에 검증하는 단계예요."}
                    {stage === "PMF 단계" && "제품이 시장에 맞는지 반복 실험하며 맞춰가는 단계예요."}
                    {stage === "스케일업 단계" && "검증된 모델을 바탕으로 본격적으로 성장을 가속하는 단계예요."}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {error && <div className="error-text">{error}</div>}

        <button className="btn btn-primary full" type="button" onClick={handleCreate}>
          생성하기 →
        </button>
      </section>
      <Footer />
      {showCopyModal && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-card">
            <div className="modal-top">
              <div />
              <button className="close" type="button" onClick={() => setShowCopyModal(false)}>
                ✕
              </button>
            </div>
            <h2>이전 진단 결과 불러오기</h2>
            <p className="section-sub join-modal-sub" style={{ wordBreak: "keep-all" }}>
              이미 이전 팀에서 완료하신 온보딩 진단 답변이 존재합니다. <br />
              이 답변들을 새로운 팀(<strong>{teamName}</strong>)으로 불러오시겠습니까?
            </p>
            <div className="modal-footer" style={{ flexDirection: "column", gap: "10px", marginTop: "24px" }}>
              <button className="btn btn-primary" type="button" onClick={() => executeCreate(true)} disabled={createLoading} style={{ width: "100%" }}>
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
