"use client";

import Link from "next/link";
import { Footer } from "../../../components/Footer";
import { useAppState } from "../../../components/AppState";

export default function WorkspaceCreatePage() {
  const { activeTeams, activeSessions, setActiveTeams, setActiveSessions, setRecentWorkspaces } =
    useAppState();

  const handleCreate = () => {
    const nextTeams = activeTeams + 1;
    const nextSessions = activeSessions + 1;
    setActiveTeams(nextTeams);
    setActiveSessions(nextSessions);
    setRecentWorkspaces([
      {
        id: "workspace-created",
        name: "신규 팀 워크스페이스",
        progress: 0,
        lastActive: "방금 전"
      }
    ]);
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
          <input className="input" placeholder="회사 또는 팀 이름을 입력하세요" />

          <label className="label">비즈니스 분야</label>
          <div className="select-row">
            <select className="input select">
              <option>선택해주세요</option>
              <option>SaaS</option>
              <option>핀테크</option>
              <option>커머스</option>
              <option>콘텐츠</option>
              <option>바이오/헬스</option>
            </select>
          </div>

          <div className="two-col">
            <div>
              <label className="label">팀원 수</label>
              <div className="select-row">
                <select className="input select">
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
                <select className="input select">
                  <option>선택해주세요</option>
                  <option>아이디어 단계</option>
                  <option>MVP 단계</option>
                  <option>PMF 단계</option>
                  <option>스케일업 단계</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <Link className="btn btn-primary full" href="/session" onClick={handleCreate}>
          생성하기 →
        </Link>
      </section>
      <Footer />
    </main>
  );
}
