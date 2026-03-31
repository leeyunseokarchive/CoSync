export type OnboardingAnswers = {
  decisionStructure?: string;
  decisionConfirmation?: string;
  deadlockRepeat?: string;
  deadlockDays?: string;
  extraWorkPrinciple?: string;
  extraWorkPriority?: string;
  motivationChoices?: string[];
  workType?: string;
  boundaryTasks?: string[];
  allocationRule?: string;
  burdenTasks?: string[];
  conflictRepeat?: string;
  conflictWeeks?: string;
  agendaOwners?: Record<string, { lead: string; approver: string }>;
  customAgendaName?: string;
  customAgendaOwner?: { lead: string; approver: string };
  exitRecoveryItems?: string[];
  handoverMethod?: string;
  exitCleanupHours?: string;
  exitCleanupDays?: string;
};

export type GapScore = "LOW" | "MID" | "HIGH";

const normalize = (value?: string) => (value ?? "").trim();

const normalizeArray = (value?: string[]) => (value ?? []).map((item) => item.trim()).sort().join("|");

const normalizeAgenda = (value?: Record<string, { lead: string; approver: string }>) => {
  if (!value) return "";
  const entries = Object.entries(value)
    .map(([key, item]) => `${key}:${item.lead || ""}/${item.approver || ""}`)
    .sort();
  return entries.join("|");
};

const countGap = (values: string[]) => {
  const unique = new Set(values.filter((value) => value.length > 0));
  return unique.size >= 2 ? 1 : 0;
};

export function computeGapSummary(members: OnboardingAnswers[]) {
  if (members.length <= 1) {
    return { gapCount: 0, gapScore: "LOW" as GapScore };
  }

  const cellValues = [
    members.map((answers) => normalize(answers.decisionStructure)),
    members.map((answers) => normalize(answers.decisionConfirmation)),
    members.map((answers) => `${normalize(answers.deadlockRepeat)}|${normalize(answers.deadlockDays)}`),
    members.map((answers) => normalize(answers.extraWorkPrinciple)),
    members.map((answers) => `${normalize(answers.extraWorkPriority)}|${normalize(answers.allocationRule)}|${normalize(answers.workType)}`),
    members.map((answers) => `${normalizeArray(answers.boundaryTasks)}|${normalizeArray(answers.burdenTasks)}|${normalizeArray(answers.motivationChoices)}`),
    members.map((answers) => normalizeArray(answers.exitRecoveryItems)),
    members.map((answers) => normalize(answers.handoverMethod)),
    members.map((answers) => `${normalize(answers.exitCleanupHours)}|${normalize(answers.exitCleanupDays)}|${normalizeAgenda(answers.agendaOwners)}`)
  ];

  const gapCount = cellValues.reduce((sum, values) => sum + countGap(values), 0);
  const gapScore: GapScore = gapCount >= 3 ? "HIGH" : gapCount >= 1 ? "MID" : "LOW";

  return { gapCount, gapScore };
}
