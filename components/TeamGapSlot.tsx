"use client";

import { TeamGapCard } from "./TeamGapCard";
import { useTeamMembers } from "./useTeamMembers";

type Team = {
  id: string;
  gapCount?: number;
  gapScore?: "LOW" | "MID" | "HIGH" | "CRITICAL";
};

export function TeamGapSlot({ team }: { team: Team }) {
  const { members, loading } = useTeamMembers(team.id);

  if (loading) return null;
  if (members.length <= 1) return null;

  return <TeamGapCard team={team} />;
}
