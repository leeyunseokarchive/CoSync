type MemberProgress = { progress?: number };

export function computeTeamProgress(members: MemberProgress[]) {
  if (members.length === 0) return 0;
  const total = members.reduce((sum, member) => sum + (Number(member.progress) || 0), 0);
  const avg = total / members.length;
  return Math.max(0, Math.min(100, Math.round(avg)));
}
