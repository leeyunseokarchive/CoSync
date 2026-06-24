"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { CircleAvatar } from "./Brand";
import { useTeamMembers } from "./useTeamMembers";
import type { OnboardingAnswers } from "../lib/gap";

type Team = {
  id: string;
  name: string;
  progress?: number;
};

const BASIC_FIELDS: (keyof OnboardingAnswers)[] = ["extraWorkPriority", "extraWorkPrinciple", "underperformanceAction", "exitRecoveryPriority", "exitCleanupTiming", "exitDisputeResolution", "exitVision", "pivotCriteria", "dealbreaker", "fundingRunway", "spendingApproval", "investmentCriteria"];
const hasBasicComplete = (m: { answers?: unknown }) =>
  BASIC_FIELDS.every(f => Boolean((m.answers as OnboardingAnswers | undefined)?.[f]));

export function TeamSessionCard({ team, canViewReport: _canViewReportProp }: { team: Team; canViewReport: boolean }) {
  const { members, loading } = useTeamMembers(team.id);
  const canViewReport = !loading && members.length >= 2 && members.every(hasBasicComplete);
  const progressValue = Math.max(0, Math.min(100, team.progress ?? 0));
  const progressLabel = `${progressValue}%`;
  const statusLabel = progressValue >= 100 ? "완료" : "진행중";
  const router = useRouter();
  const isSolo = !loading && members.length <= 1;
  const formatStatus = (status: string) => {
    if (!status || status === "active") return "재직";
    if (status === "pending") return "휴직";
    return "퇴사";
  };

  const handleCardClick = () => {
    router.push(`/team-setting?teamId=${team.id}`);
  };

  return (
    <div
      className="card session-card compact clickable"
      role="button"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          handleCardClick();
        }
      }}
    >
      <div className="session-head">
        <div>
          <h3>{team.name}</h3>
          <p>팀 상태 · {statusLabel}</p>
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
              <CircleAvatar label={member.name?.[0] ?? "?"} size={32} />
              <div className="member-info">
                <div className="member-name">{member.name}</div>
                <div className="member-role">{member.role} · {formatStatus(member.status)}</div>
              </div>
              <div className="member-progress">
                <span style={{ width: `${member.progress ?? 0}%` }} />
              </div>
              <span className="member-status">{member.progress ?? 0}%</span>
            </div>
          ))}
      </div>
      <div className="button-row">
        <Link className="btn btn-ghost full" href="/onboarding/diagnosis" onClick={(event) => event.stopPropagation()}>
          온보딩 질문으로 돌아가기
        </Link>
        {isSolo ? (
          <Link
            className="btn btn-primary full"
            href={`/team-setting?teamId=${team.id}`}
            onClick={(event) => event.stopPropagation()}
          >
            팀원 초대하기
          </Link>
        ) : (
          <Link
            className={`btn btn-primary full ${canViewReport ? "" : "disabled"}`}
            href={canViewReport ? "/gap-report" : "#"}
            aria-disabled={!canViewReport}
            onClick={(event) => event.stopPropagation()}
          >
            진단 결과 보러가기
          </Link>
        )}
      </div>
    </div>
  );
}
