"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { TopNav } from "../../components/TopNav";
import { Footer } from "../../components/Footer";
import { useAppState } from "../../components/AppState";
import { useAuth } from "../../components/AuthContext";
import { useTeams } from "../../components/useTeams";
import { arrayUnion, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useRouter } from "next/navigation";
import { TeamSessionCard } from "../../components/TeamSessionCard";

export default function WorkspaceHubPage() {
  const { activeTeams, activeSessions, setActiveTeams, setActiveSessions, department, role, progress } =
    useAppState();
  const { user, loading } = useAuth();
  const { teams, loading: teamsLoading, error: teamsError } = useTeams();
  if (teamsError) {
    console.warn(teamsError);
  }
  const router = useRouter();
  const [teamCode, setTeamCode] = useState("");
  const [joinHint, setJoinHint] = useState("팀원에게 팀 코드를 받아 입력해주세요.");

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (teams.length > 0) {
      setActiveTeams(teams.length);
    }
  }, [teams.length, setActiveTeams]);

  const handleJoin = async () => {
    if (!teamCode.trim()) {
      setJoinHint("유효한 팀 코드를 입력해주세요.");
      return;
    }
    if (!user) {
      router.push("/login");
      return;
    }
    const code = teamCode.trim().toUpperCase();
    const inviteRef = doc(db, "inviteCodes", code);
    const inviteSnap = await getDoc(inviteRef);
    if (!inviteSnap.exists()) {
      setJoinHint("해당 팀 코드를 찾을 수 없습니다.");
      return;
    }
    const { teamId } = inviteSnap.data() as { teamId: string };
    const teamRef = doc(db, "teams", teamId);
    const teamSnap = await getDoc(teamRef);
    const existingProgress = teamSnap.exists()
      ? Number(teamSnap.data()?.progress ?? 0)
      : 0;
    const nextProgress = Math.max(existingProgress, progress);
    await updateDoc(teamRef, {
      members: arrayUnion(user.uid)
    });
    await updateDoc(doc(db, "users", user.uid), {
      teamIds: arrayUnion(teamId)
    });
    await setDoc(
      doc(db, "teams", teamId, "members", user.uid),
      {
        name: user.displayName || "팀원",
        role: role || "MEMBER",
        department: department || "",
        status: "active",
        progress
      },
      { merge: true }
    );
    await updateDoc(teamRef, {
      progress: nextProgress
    });
    setActiveTeams(Math.max(1, activeTeams));
    setActiveSessions(Math.max(1, activeSessions));
    router.push("/session");
  };

  return (
    <main className="page">
      <TopNav links={[{ label: "대시보드", href: "/workspace" }]} active="대시보드" />

      <section className="container workspace-hero">
        <h1 className="section-title">팀 합의를 시작하거나 계속하세요</h1>
        <p className="section-sub">공동 창업자들과 함께 혁신적인 여정을 시작하세요.</p>
        <div className="count-pills">
          <span className="pill">현재 활성 팀 {activeTeams}개</span>
          <span className="pill">진행 중 합의 {activeSessions}개</span>
        </div>

        <div className="workspace-grid">
          <Link className="card workspace-card compact" href="/workspace/create">
            <div className="icon-box">+</div>
            <h3>새로운 팀 만들기</h3>
            <p>새로운 비즈니스 가치를 창출하기 위한 첫걸음</p>
          </Link>
          <div className="card workspace-card compact">
            <h3>팀 코드로 참가하기</h3>
            <p>전달받은 초대 코드를 입력하세요</p>
            <input
              className="code-input"
              value={teamCode}
              onChange={(event) => setTeamCode(event.target.value)}
              placeholder="예: CS7X29"
            />
            <div className="hint">{joinHint}</div>
            <button className="btn btn-primary" type="button" onClick={handleJoin}>
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
        <div className="dashboard-row">
          <div className="session-list">
            {teamsLoading && <div className="card session-card compact">로딩 중...</div>}
            {!teamsLoading && teams.length === 0 && (
              <div className="card session-card compact">아직 속한 팀이 없습니다.</div>
            )}
            {!teamsLoading &&
              teams.map((team) => (
                <TeamSessionCard key={team.id} team={team} canViewReport={(team.progress ?? 0) >= 100} />
              ))}
          </div>
          <div className="card gap-mini">
            <div className="side-top">
              <span className="pill">GAP SCORE</span>
              <span className="badge">HIGH</span>
            </div>
            <h4>온보딩 진단 결과</h4>
            <p>의사결정 방식과 갈등 가능성이 높은 항목을 1개 발견했습니다.</p>
            <Link href="/gap-report" className="link">
              Gap 리포트 보기 →
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
