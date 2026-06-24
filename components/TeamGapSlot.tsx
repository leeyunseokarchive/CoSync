"use client";

import { TeamGapCard } from "./TeamGapCard";
import { useTeamMembers } from "./useTeamMembers";
import type { OnboardingAnswers } from "../lib/gap";

type Team = {
  id: string;
  gapCount?: number;
  gapScore?: "LOW" | "MID" | "HIGH" | "CRITICAL";
};

const BASIC_FIELDS: (keyof OnboardingAnswers)[] = ["extraWorkPriority", "extraWorkPrinciple", "underperformanceAction", "exitRecoveryPriority", "exitCleanupTiming", "exitDisputeResolution", "exitVision", "pivotCriteria", "dealbreaker", "fundingRunway", "spendingApproval", "investmentCriteria"];
const hasBasicComplete = (m: { answers?: unknown }) =>
  BASIC_FIELDS.every(f => Boolean((m.answers as OnboardingAnswers | undefined)?.[f]));

export function TeamGapSlot({ team }: { team: Team }) {
  const { members, loading } = useTeamMembers(team.id);

  if (loading) return null;
  if (members.length < 2) return null;
  if (!members.every(hasBasicComplete)) return null;

  return <TeamGapCard team={team} />;
}
