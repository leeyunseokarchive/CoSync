"use client";

import { TopNav } from "../../components/TopNav";
import { Footer } from "../../components/Footer";
import { useTeams } from "../../components/useTeams";
import { TeamSessionCard } from "../../components/TeamSessionCard";
import { TeamGapSlot } from "../../components/TeamGapSlot";

export default function SessionHomePage() {
  const { teams, loading, error } = useTeams();
  if (error) {
    console.warn(error);
  }

  return (
    <main className="page session-page">
      <TopNav links={[{ label: "대시보드", href: "/workspace" }]} active="대시보드" />

      <section className="container">
        <div className="team-overview">
          <div>
            <div className="section-sub">MY TEAMS</div>
            <h2>내가 속한 팀</h2>
          </div>
          <div className="dashboard-row">
            <div className="session-list">
              {loading && <div className="card session-card compact">로딩 중...</div>}
              {!loading && teams.length === 0 && (
                <div className="card session-card compact">아직 속한 팀이 없습니다.</div>
              )}
              {!loading &&
                teams.map((team) => (
                  <TeamSessionCard key={team.id} team={team} canViewReport={(team.progress ?? 0) >= 100} />
                ))}
            </div>
            <div className="gap-list">
              {!loading &&
                teams.map((team) => (
                  <TeamGapSlot key={`${team.id}-gap`} team={team} />
                ))}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
