export type OnboardingAnswers = {
  repeatCount?: number | string;
  timeElapsed?: number | string;
  timeElapsedUnit?: string;
  decisionDeadline?: number | string;
  decisionDeadlineUnit?: string;
  decisionRule?: string;
  decisionMaker?: string;
};

export type GapScore = "LOW" | "MID" | "HIGH";

const toNumber = (value: number | string | undefined) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const normalize = (value: string | undefined) => (value ?? "").trim();

const countGap = (values: string[]) => {
  const unique = new Set(values.filter((value) => value.length > 0));
  return unique.size >= 2 ? 1 : 0;
};

export function computeGapSummary(members: OnboardingAnswers[]) {
  if (members.length <= 1) {
    return { gapCount: 0, gapScore: "LOW" as GapScore };
  }

  const q1Values = members.map((answers) => {
    const repeat = toNumber(answers.repeatCount);
    const time = toNumber(answers.timeElapsed);
    if (repeat <= 0 && time <= 0) return "";
    const unit = normalize(answers.timeElapsedUnit) || "시간";
    return `${repeat}|${time}|${unit}`;
  });

  const q2Values = members.map((answers) => {
    const deadline = toNumber(answers.decisionDeadline);
    if (deadline <= 0) return "";
    const unit = normalize(answers.decisionDeadlineUnit) || "시간";
    return `${deadline}|${unit}`;
  });

  const q3Values = members.map((answers) => normalize(answers.decisionRule));
  const q5Values = members.map((answers) => normalize(answers.decisionMaker));

  const gapCount =
    countGap(q1Values) +
    countGap(q2Values) +
    countGap(q3Values) +
    countGap(q5Values);

  const gapScore: GapScore = gapCount >= 3 ? "HIGH" : gapCount >= 1 ? "MID" : "LOW";

  return { gapCount, gapScore };
}
