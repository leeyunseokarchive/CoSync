"use client";

import Link from "next/link";
import { useState } from "react";
import { TopNav } from "../../components/TopNav";
import { Footer } from "../../components/Footer";
import { useAppState } from "../../components/AppState";

export default function WorkspaceHubPage() {
  const {
    activeTeams,
    activeSessions,
    recentWorkspaces,
    setActiveTeams,
    setActiveSessions,
    setRecentWorkspaces
  } = useAppState();
  const [teamCode, setTeamCode] = useState("");
  const [joinHint, setJoinHint] = useState("팀원에게 팀 코드를 받아 입력해주세요.");

  const handleJoin = () => {
    if (!teamCode.trim()) {
      setJoinHint("유효한 팀 코드를 입력해주세요.");
      return;
    }
    const nextTeams = Math.max(1, activeTeams);
    const nextSessions = Math.max(1, activeSessions);
    setActiveTeams(nextTeams);
    setActiveSessions(nextSessions);
    setRecentWorkspaces([
      {
        id: "workspace-joined",
        name: "초대받은 팀",
        progress: 65,
        lastActive: "방금 전"
      }
    ]);
  };

  return (
    <main className="page">
      <TopNav
        links={[
          { label: "대시보드", href: "/workspace" },
          { label: "합의 세션", href: "/onboarding/diagnosis" },
          { label: "리포트", href: "/gap-report" },
          { label: "팀 설정", href: "/team-setting" }
        ]}
        active="대시보드"
        rightName="황주명"
        showBell
      />

      <section className="container workspace-hero">
        <h1 className="section-title">팀 합의를 시작하거나 계속하세요</h1>
        <p className="section-sub">
          공동 창업자들과 함께 혁신적인 여정을 시작하세요.
        </p>
        <div className="count-pills">
          <span className="pill">현재 활성 팀 {activeTeams}개</span>
          <span className="pill">진행 중 합의 {activeSessions}개</span>
        </div>

        <div className="workspace-grid">
          <Link className="card workspace-card" href="/workspace/create">
            <div className="icon-box">+</div>
            <h3>새로운 팀 만들기</h3>
            <p>새로운 비즈니스 가치를 창출하기 위한 첫걸음</p>
          </Link>
          <div className="card workspace-card">
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
          <span>최근 접속한 워크스페이스</span>
          <Link href="/session" className="link">
            전체보기
          </Link>
        </div>
        {recentWorkspaces.length === 0 ? (
          <div className="card recent-empty">최근 접속한 워크스페이스가 없습니다.</div>
        ) : (
          recentWorkspaces.map((workspace) => (
            <Link className="card recent-card" href="/session" key={workspace.id}>
              <div className="avatar-sq" />
              <div className="recent-info">
                <div className="recent-title">{workspace.name}</div>
                <div className="recent-meta">
                  합의 진행중 · 마지막 활동 {workspace.lastActive}
                </div>
              </div>
              <div className="progress-wrap">
                <div className="progress-bar">
                  <span style={{ width: `${workspace.progress}%` }} />
                </div>
                <span className="progress-label">{workspace.progress}%</span>
              </div>
              <div className="next-arrow">›</div>
            </Link>
          ))
        )}
      </section>

      <Footer />
    </main>
  );
}
