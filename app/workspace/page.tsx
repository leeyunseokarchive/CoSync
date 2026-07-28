"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { TopNav } from "../../components/TopNav";
import { Footer } from "../../components/Footer";
import { useAppState } from "../../components/AppState";
import { useAuth } from "../../components/AuthContext";
import { useTeams } from "../../components/useTeams";
import { arrayUnion, collection, doc, getDoc, getDocs, runTransaction, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useRouter } from "next/navigation";
import { TeamSessionCard } from "../../components/TeamSessionCard";
import { TeamGapSlot } from "../../components/TeamGapSlot";
import { computeGapSummary } from "../../lib/gap";
import { useUserProfile } from "../../components/useUserProfile";
import { computeTeamProgress } from "../../lib/teamProgress";

export default function WorkspaceHubPage() {
  const {
    activeTeams,
    activeSessions,
    setActiveTeams,
    setActiveSessions,
    department,
    role,
    progress,
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
  const { user, loading } = useAuth();
  const { teams, loading: teamsLoading, error: teamsError } = useTeams();
  if (teamsError) {
    console.warn(teamsError);
  }
  const router = useRouter();
  const [teamCode, setTeamCode] = useState("");
  const [joinHint, setJoinHint] = useState("");
  const [joinLoading, setJoinLoading] = useState(false);
  const [foundTeam, setFoundTeam] = useState<{
    id: string;
    name: string;
    industry?: string;
    stage?: string;
    inviteCode?: string;
  } | null>(null);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [isExistingMember, setIsExistingMember] = useState(false);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [pendingTeam, setPendingTeam] = useState<any>(null);
  const [prevAnswers, setPrevAnswers] = useState<any>(null);
  const [prevProgress, setPrevProgress] = useState(0);
  const [selectedSourceTeamId, setSelectedSourceTeamId] = useState("");
  const { profile } = useUserProfile();

  // P2-#9: 모달 Esc 닫기
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (showJoinModal) setShowJoinModal(false);
      if (showCopyModal) setShowCopyModal(false);
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [showJoinModal, showCopyModal]);

  useEffect(() => {
    if (teams && teams.length > 0 && !selectedSourceTeamId) {
      setSelectedSourceTeamId(teams[0].id);
    }
  }, [teams, selectedSourceTeamId]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("inviteCode");
      if (code) {
        setTeamCode(code);
        sessionStorage.setItem("pendingInviteCode", code);
        window.history.replaceState({}, "", "/workspace");
      }
    }
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
    if (!loading && user) {
      const pendingCode = sessionStorage.getItem("pendingInviteCode");
      if (pendingCode) {
        setTeamCode(pendingCode);
        sessionStorage.removeItem("pendingInviteCode");
        setTimeout(() => executeJoinSearch(pendingCode), 100);
      }
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (teams.length > 0) {
      setActiveTeams(teams.length);
    }
  }, [teams.length, setActiveTeams]);

  const executeJoinSearch = async (codeToSearch: string) => {
    if (!codeToSearch.trim()) {
      setJoinHint("유효한 팀 코드를 입력해주세요.");
      return;
    }
    if (!user) {
      router.push("/login");
      return;
    }
    const code = codeToSearch.trim().toUpperCase();
    try {
      const inviteRef = doc(db, "inviteCodes", code);
      const inviteSnap = await getDoc(inviteRef);
      if (!inviteSnap.exists()) {
        setJoinHint("해당 팀 코드를 찾을 수 없습니다.");
        return;
      }
      const { teamId } = inviteSnap.data() as { teamId: string };
      const teamRef = doc(db, "teams", teamId);
      const teamSnap = await getDoc(teamRef);
      if (!teamSnap.exists()) {
        setJoinHint("팀 정보를 찾지 못했습니다.");
        return;
      }
      const teamData = teamSnap.data() as {
        name: string;
        industry?: string;
        stage?: string;
        inviteCode?: string;
        members?: string[];
        status?: string;
      };
      if (teamData.status === "archived") {
        setJoinHint("해당 팀 코드를 찾을 수 없습니다.");
        return;
      }
      setFoundTeam({ id: teamId, ...teamData });
      setIsExistingMember((teamData.members ?? []).includes(user.uid));
      setShowJoinModal(true);
    } catch (e) {
      console.error(e);
      setJoinHint("팀 조회 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    }
  };

  const handleJoinSearch = () => executeJoinSearch(teamCode);

  const handleJoinConfirm = async () => {
    if (!user || !foundTeam) return;
    if (isExistingMember) {
      setShowJoinModal(false);
      router.push("/session");
      return;
    }
    setJoinLoading(true);
    try {
      const teamIds = profile?.teamIds || [];
      if (teamIds.length > 0) {
        setPendingTeam(foundTeam);
        setShowJoinModal(false);
        setShowCopyModal(true);
        setJoinLoading(false);
        return;
      }
      await executeJoin(false);
    } catch (e) {
      console.error(e);
      setJoinLoading(false);
    }
  };

  const handleCopyAndJoin = async () => {
    if (!user || !selectedSourceTeamId) return;
    setJoinLoading(true);
    try {
      const prevDoc = await getDoc(doc(db, "teams", selectedSourceTeamId, "members", user.uid));
      let prevAnswers = {};
      let prevProgress = 0;
      if (prevDoc.exists()) {
        const prevData = prevDoc.data();
        prevAnswers = prevData.answers || {};
        prevProgress = prevData.progress || 0;
      }
      await executeJoin(true, prevAnswers, prevProgress);
    } catch (e) {
      console.error(e);
      setJoinLoading(false);
    }
  };

  const executeJoin = async (copyAnswers: boolean, customAnswers?: any, customProgress?: number) => {
    if (!user) return;
    const targetTeam = pendingTeam || foundTeam;
    if (!targetTeam) return;

    setJoinLoading(true);
    try {
      if (!targetTeam.inviteCode) {
        throw new Error("팀 가입 코드가 없습니다.");
      }
      await runTransaction(db, async (tx) => {
        const inviteRef = doc(db, "inviteCodes", targetTeam.inviteCode);
        const inviteSnap = await tx.get(inviteRef);
        if (!inviteSnap.exists() || inviteSnap.data()?.teamId !== targetTeam.id) {
          throw new Error("유효하지 않은 초대 코드입니다.");
        }
        const teamRef = doc(db, "teams", targetTeam.id);
        const teamSnap = await tx.get(teamRef);
        if (!teamSnap.exists()) {
          throw new Error("팀을 찾을 수 없습니다.");
        }
        if (teamSnap.data()?.status === "archived") {
          throw new Error("이미 삭제된 팀입니다. 팀 코드를 다시 확인해주세요.");
        }
        tx.update(teamRef, { members: arrayUnion(user.uid) });
        tx.update(doc(db, "users", user.uid), {
          teamIds: arrayUnion(targetTeam.id),
          lastActiveTeamId: targetTeam.id,
        });
      });
    } catch (e) {
      console.error(e);
      if (e instanceof Error && e.message === "이미 삭제된 팀입니다. 팀 코드를 다시 확인해주세요.") {
        alert(e.message);
      } else {
        alert("팀 가입 중 오류가 발생했습니다.");
      }
      setJoinLoading(false);
      return;
    }

    let finalAnswers: any = {};
    let finalProgress = 0;

    if (copyAnswers && customAnswers) {
      finalAnswers = customAnswers;
      finalProgress = customProgress || 0;
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

    try {
      await setDoc(
        doc(db, "teams", targetTeam.id, "members", user.uid),
        {
          name: user.displayName || "팀원",
          role: role || "MEMBER",
          department: department || "",
          status: "active",
          progress: finalProgress,
          answers: finalAnswers
        },
        { merge: true }
      );

      const membersSnapshot = await getDocs(collection(db, "teams", targetTeam.id, "members"));
      const memberDocs = membersSnapshot.docs.map((doc) => doc.data());
      const memberAnswers = memberDocs.map((data) => (data.answers ?? {}) as any);
      const { gapCount, gapScore } = computeGapSummary(memberAnswers);
      const teamProgress = computeTeamProgress(memberDocs);
      await updateDoc(doc(db, "teams", targetTeam.id), {
        progress: teamProgress,
        gapCount,
        gapScore
      });
    } catch (e) {
      console.error(e);
      alert("팀 가입은 완료됐지만 일부 데이터 동기화에 실패했습니다. 진단 페이지에서 다시 저장해주세요.");
    } finally {
      setJoinLoading(false);
    }

    setActiveTeams(Math.max(1, activeTeams + 1));
    setActiveSessions(Math.max(1, activeSessions + 1));
    setShowCopyModal(false);
    setShowJoinModal(false);

    if (!copyAnswers && profile?.teamIds && profile.teamIds.length > 0) {
      router.push(`/onboarding/diagnosis?teamId=${targetTeam.id}`);
    } else {
      router.push(`/workspace?teamId=${targetTeam.id}`);
    }
  };

  return (
    <main className="page">
      <TopNav links={[{ label: "대시보드", href: "/workspace" }]} active="대시보드" />

      <section className="container workspace-hero">
        <h1 className="section-title">팀 합의를 시작하거나 계속하세요</h1>
        <p className="section-sub">공동 창업자들과 함께 혁신적인 여정을 시작하세요.</p>
        <div className="workspace-grid">
          <Link className="card workspace-card compact" href="/workspace/create">
            <div className="icon-box">+</div>
            <h3>새로운 팀 만들기</h3>
            <p>팀 이름, 분야, 단계를 설정하고 진단을 시작하세요</p>
          </Link>
          <div className="card workspace-card compact">
            <h3>팀 코드로 참가하기</h3>
            <p>팀원에게 전달받은 초대코드를 입력하세요</p>
            <div style={{ maxWidth: "320px", width: "100%", alignSelf: "center" }}>
              <div className="code-input-row">
                <input
                  className="code-input"
                  value={teamCode}
                  onChange={(event) => setTeamCode(event.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleJoinSearch()}
                  placeholder="예: HJM-LYS-JJH"
                />
                <button className="code-input-btn" type="button" onClick={handleJoinSearch} aria-label="참가하기">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
              {joinHint && <div className="hint" style={{ marginTop: 8, textAlign: "center" }}>{joinHint}</div>}
            </div>
          </div>
        </div>

        <div className="recent-row">
          <span>내가 속한 팀</span>
          <Link href="/session" className="link">
            전체보기
          </Link>
        </div>
        <div className="team-list">
          {/* P2-#13: Skeleton 로딩 상태 */}
          {teamsLoading && (
            <>
              {[0, 1].map((i) => (
                <div key={i} className="card session-card compact skeleton-card" style={{ minHeight: "80px", display: "flex", alignItems: "center", gap: "16px", padding: "20px 24px" }}>
                  <div style={{ width: 44, height: 44, borderRadius: 14, background: "#eef0f7", flexShrink: 0 }} />
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ height: 14, borderRadius: 6, background: "#eef0f7", width: "55%" }} />
                    <div style={{ height: 11, borderRadius: 6, background: "#f4f5fb", width: "35%" }} />
                  </div>
                  <div style={{ width: 100, height: 8, borderRadius: 999, background: "#eef0f7" }} />
                </div>
              ))}
            </>
          )}
          {!teamsLoading && teams.length === 0 && (
            <div className="card session-card compact">아직 속한 팀이 없습니다.</div>
          )}
          {!teamsLoading &&
            teams.map((team) => (
              <div className="team-row" key={team.id}>
                <TeamSessionCard team={team} />
                <TeamGapSlot team={team} />
              </div>
            ))}
        </div>
      </section>

      <Footer />

      {showJoinModal && foundTeam && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-card">
            <div className="modal-top">
              <div />
              <button className="close" type="button" onClick={() => setShowJoinModal(false)}>
                ✕
              </button>
            </div>
            <h2>팀 코드로 참가하기</h2>
            <p className="section-sub join-modal-sub">
              팀 정보를 확인하고 온보딩 진단을 진행해주세요.
            </p>
            <div className="card settings-card" style={{ marginTop: 16 }}>
              <div>
                <div className="card-title">{foundTeam.name}</div>
                <div className="card-sub">
                  {foundTeam.industry || "비즈니스 분야 미입력"} · {foundTeam.stage || "팀 단계 미입력"}
                </div>
              </div>
              <span className="badge">CODE {foundTeam.inviteCode || "N/A"}</span>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" type="button" onClick={() => setShowJoinModal(false)}>
                취소
              </button>
              <button className="btn btn-primary" type="button" onClick={handleJoinConfirm} disabled={joinLoading}>
                {isExistingMember ? "이미 참여 중 · 세션으로 이동" : "온보딩 진단 진행하기 →"}
              </button>
            </div>
          </div>
        </div>
      )}
      {showCopyModal && pendingTeam && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-card">
            <div className="modal-top">
              <div />
              <button className="close" type="button" onClick={() => setShowCopyModal(false)}>
                ✕
              </button>
            </div>
            <h2>이전 진단 결과 불러오기</h2>
            <p className="section-sub join-modal-sub" style={{ wordBreak: "keep-all", marginBottom: "16px" }}>
              이미 참여 중인 이전 팀들의 온보딩 진단 답변이 존재합니다. <br />
              어느 팀의 답변을 새로운 팀(<strong>{pendingTeam.name}</strong>)으로 불러오시겠습니까?
            </p>
            {teams && teams.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", textAlign: "left", marginBottom: "20px" }}>
                <label style={{ fontSize: "12px", fontWeight: "bold", color: "#64748b" }}>답변을 가져올 팀 선택</label>
                <select
                  value={selectedSourceTeamId}
                  onChange={(e) => setSelectedSourceTeamId(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "14px",
                    outline: "none",
                    backgroundColor: "#fff"
                  }}
                >
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="modal-footer" style={{ flexDirection: "column", gap: "10px", marginTop: "12px" }}>
              <button className="btn btn-primary" type="button" onClick={handleCopyAndJoin} disabled={joinLoading} style={{ width: "100%" }}>
                기존 결과 불러와서 참가하기
              </button>
              <button className="btn btn-ghost" type="button" onClick={() => executeJoin(false)} disabled={joinLoading} style={{ width: "100%" }}>
                새롭게 진단 시작하기 (답변 초기화)
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
