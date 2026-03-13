"use client";

import Link from "next/link";
import { useTeamMembers } from "./useTeamMembers";

type Team = {
  id: string;
  name: string;
  progress?: number;
};

export function TeamSessionCard({ team, canViewReport }: { team: Team; canViewReport: boolean }) {
  const { members, loading } = useTeamMembers(team.id);
  const progressValue = Math.max(0, Math.min(100, team.progress ?? 0));
  const progressLabel = `${progressValue}%`;

  return (
    <div className="card session-card compact">
      <div className="session-head">
        <div>
          <h3>{team.name}</h3>
          <p>팀의 모든 합의가 최종 리포트 생성</p>
        </div>
        <div className="progress-big">{progressLabel}</div>
      </div>
      <div className="progress-bar large">
        <span style={{ width: progressLabel }} />
      </div>
      <div className="member-list">
        {loading && <div className="member-row">멤버 불러오는 중...</div>}
        {!loading &&
          members.map((member) => (
            <div className="member-row" key={member.id}>
              <div className="member-avatar">{member.name?.[0] ?? "?"}</div>
              <div className="member-info">
                <div className="member-name">{member.name}</div>
                <div className="member-role">{member.role} · {member.status}</div>
              </div>
              <div className="member-progress">
                <span style={{ width: `${member.progress ?? 0}%` }} />
              </div>
              <span className="member-status">{member.progress ?? 0}%</span>
            </div>
          ))}
      </div>
      <div className="button-row">
        <Link className="btn btn-ghost full" href="/onboarding/diagnosis">
          온보딩 질문으로 돌아가기
        </Link>
        <Link
          className={`btn btn-primary full ${canViewReport ? "" : "disabled"}`}
          href={canViewReport ? "/gap-report" : "#"}
          aria-disabled={!canViewReport}
        >
          진단 결과 보러가기
        </Link>
      </div>
    </div>
  );
}
