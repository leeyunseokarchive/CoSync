"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { TopNav } from "../../components/TopNav";
import { Footer } from "../../components/Footer";
import { useAppState } from "../../components/AppState";
import { useAuth } from "../../components/AuthContext";
import { useTeams } from "../../components/useTeams";
import { arrayUnion, collection, doc, getDoc, getDocs, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useRouter } from "next/navigation";
import { TeamSessionCard } from "../../components/TeamSessionCard";
import { TeamGapSlot } from "../../components/TeamGapSlot";
import { computeGapSummary } from "../../lib/gap";
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
    decisionStructure,
    decisionFailure,
    actionVsConsensus,
    extraWorkPrinciple,
    extraWorkPriority,
    underperformanceAction,
    exitRecoveryPriority,
    exitCleanupTiming,
    exitDisputeResolution
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
    };
    setFoundTeam({ id: teamId, ...teamData });
    setIsExistingMember((teamData.members ?? []).includes(user.uid));
    setShowJoinModal(true);
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
    const teamRef = doc(db, "teams", foundTeam.id);
    const teamSnap = await getDoc(teamRef);
    const existingProgress = teamSnap.exists()
      ? Number(teamSnap.data()?.progress ?? 0)
      : 0;
    const nextProgress = Math.max(existingProgress, progress);
    await updateDoc(teamRef, {
      members: arrayUnion(user.uid)
    });
    await updateDoc(doc(db, "users", user.uid), {
      teamIds: arrayUnion(foundTeam.id),
      lastActiveTeamId: foundTeam.id
    });
    const answers = {
      decisionStructure,
      decisionFailure,
      actionVsConsensus,
      extraWorkPrinciple,
      extraWorkPriority,
      underperformanceAction,
      exitRecoveryPriority,
      exitCleanupTiming,
      exitDisputeResolution
    };
    await setDoc(
      doc(db, "teams", foundTeam.id, "members", user.uid),
      {
        name: user.displayName || "팀원",
        role: role || "MEMBER",
        department: department || "",
        status: "active",
        progress,
        answers
      },
      { merge: true }
    );
    const membersSnapshot = await getDocs(collection(db, "teams", foundTeam.id, "members"));
    const memberDocs = membersSnapshot.docs.map((doc) => doc.data());
    const memberAnswers = memberDocs.map((data) => (data.answers ?? {}) as typeof answers);
    const { gapCount, gapScore } = computeGapSummary(memberAnswers);
    const teamProgress = computeTeamProgress(memberDocs);
    await updateDoc(teamRef, {
      progress: teamProgress,
      gapCount,
      gapScore
    });
    setActiveTeams(Math.max(1, activeTeams));
    setActiveSessions(Math.max(1, activeSessions));
    setJoinLoading(false);
    setShowJoinModal(false);
    router.push("/onboarding/diagnosis");
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
            <p>새로운 비즈니스 가치를 창출하기 위한 첫걸음</p>
          </Link>
          <div className="card workspace-card compact">
            <h3>팀 코드로 참가하기</h3>
            <p>팀원에게 전달받은 초대코드를 입력하세요</p>
            <input
              className="code-input"
              value={teamCode}
              onChange={(event) => setTeamCode(event.target.value)}
              placeholder="예: HJM-LYS-JJH"
            />
            {joinHint && <div className="hint">{joinHint}</div>}
            <button className="btn btn-primary" type="button" onClick={handleJoinSearch}>
              참가하기
            </button>
          </div>
        </div>

        <div className="recent-row">
          <span>내가 속한 팀</span>
          <Link href="/session" className="link">
            전체보기
          </Link>
        </div>
        <div className="team-list">
          {teamsLoading && <div className="card session-card compact">로딩 중...</div>}
          {!teamsLoading && teams.length === 0 && (
            <div className="card session-card compact">아직 속한 팀이 없습니다.</div>
          )}
          {!teamsLoading &&
            teams.map((team) => (
              <div className="team-row" key={team.id}>
                <TeamSessionCard team={team} canViewReport={(team.progress ?? 0) >= 100} />
                {(team.progress ?? 0) >= 100 && <TeamGapSlot team={team} />}
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
    </main>
  );
}
