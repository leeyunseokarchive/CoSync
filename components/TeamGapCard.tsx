"use client";

import Link from "next/link";

type Team = {
  id: string;
  gapCount?: number;
  gapScore?: "LOW" | "MID" | "HIGH" | "CRITICAL";
  progress?: number;
};

export function TeamGapCard({ team }: { team: Team }) {
  if ((team.progress ?? 0) < 100) return null;
  const gapCount = team.gapCount ?? 0;
  const gapScore = team.gapScore ?? "LOW";
  const scoreLabel = gapScore === "CRITICAL" ? "CRITICAL" : gapScore === "HIGH" ? "HIGH" : gapScore === "MID" ? "MID" : "LOW";

  return (
    <div className="card gap-mini">
      <div className="side-top">
        <span className="pill">GAP SCORE</span>
        <span className={`badge ${scoreLabel.toLowerCase()}`}>{scoreLabel}</span>
      </div>
      <h4>온보딩 진단 결과</h4>
      <p>온보딩 답변에서 갈등 가능성이 높은 항목을 {gapCount}개 발견했습니다.</p>
      <Link href={`/gap-report?teamId=${team.id}`} className="link">
        Gap 리포트 보기 →
      </Link>
    </div>
  );
}
