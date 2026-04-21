export type OnboardingAnswers = {
  decisionStructure?: string;
  decisionFailure?: string;
  actionVsConsensus?: string;
  deadlockTolerance?: string;
  extraWorkPrinciple?: string;
  extraWorkPriority?: string;
  underperformanceAction?: string;
  workstyleConstraint?: string;
  handoverMethod?: string;
  exitRecoveryPriority?: string;
  exitCleanupTiming?: string;
  exitDisputeResolution?: string;
};

export type GapScore = "LOW" | "MID" | "HIGH" | "CRITICAL";

const getScore = (val1?: string, val2?: string, toxicPairs: [string, string][] = [], weight: number = 1.0) => {
  if (!val1 || !val2 || val1 === val2) return 0;
  
  const opt1 = val1[0]; // extract "1", "2", "3", "4"
  const opt2 = val2[0];
  
  // Toxic match -> Max Gap (3)
  for (const [p1, p2] of toxicPairs) {
    if ((opt1 === p1 && opt2 === p2) || (opt1 === p2 && opt2 === p1)) {
      return 3 * weight;
    }
  }
  
  // Normal mismatch -> 1 pt
  return 1 * weight;
};

export function computeGapSummary(members: OnboardingAnswers[]) {
  if (members.length <= 1) {
    return { gapCount: 0, gapScore: "LOW" as GapScore };
  }

  let maxGapScore = 0;
  let gapCount = 0;

  for (let i = 0; i < members.length; i++) {
    for (let j = i + 1; j < members.length; j++) {
      const a1 = members[i];
      const a2 = members[j];
      
      let localGapCount = 0;
      let localTotalScore = 0;

      // --- Category 1: Decision (Weight 1.0) ---
      const q1 = getScore(a1.decisionStructure, a2.decisionStructure, [["1", "4"]], 1.0);
      const q2 = getScore(a1.decisionFailure, a2.decisionFailure, [["1", "3"], ["1", "4"]], 1.0);
      const q3 = getScore(a1.actionVsConsensus, a2.actionVsConsensus, [["1", "2"], ["2", "4"]], 1.0);
      const q4 = getScore(a1.deadlockTolerance, a2.deadlockTolerance, [["1", "4"]], 1.0);

      // --- Category 2: Role (Weight 1.5) ---
      const q5 = getScore(a1.extraWorkPrinciple, a2.extraWorkPrinciple, [["1", "3"]], 1.5);
      const q6 = getScore(a1.extraWorkPriority, a2.extraWorkPriority, [["3", "4"]], 1.5);
      const q7 = getScore(a1.underperformanceAction, a2.underperformanceAction, [["3", "4"]], 1.5);
      const q8 = getScore(a1.workstyleConstraint, a2.workstyleConstraint, [["1", "3"]], 1.5);

      // --- Category 3: Exit (Weight 2.0) ---
      const q9 = getScore(a1.handoverMethod, a2.handoverMethod, [["1", "4"]], 2.0);
      const q10 = getScore(a1.exitRecoveryPriority, a2.exitRecoveryPriority, [["1", "2"], ["2", "3"], ["2", "4"]], 2.0);
      const q11 = getScore(a1.exitCleanupTiming, a2.exitCleanupTiming, [["1", "4"]], 2.0);
      const q12 = getScore(a1.exitDisputeResolution, a2.exitDisputeResolution, [["1", "2"], ["1", "4"]], 2.0);

      const gapsList = [q1, q2, q3, q4, q5, q6, q7, q8, q9, q10, q11, q12];
      
      for (const gap of gapsList) {
        if (gap > 0) {
          localGapCount++;
          localTotalScore += gap;
        }
      }

      if (localTotalScore > maxGapScore) maxGapScore = localTotalScore;
      if (localGapCount > gapCount) gapCount = localGapCount;
    }
  }

  let gapScore: GapScore = "LOW";
  
  // Total max score possible is around 54 points. (12 points for Cat1, 18 for Cat2, 24 for Cat3)
  // Thresholds are re-adjusted for this scale.
  if (maxGapScore >= 20) gapScore = "CRITICAL";
  else if (maxGapScore >= 12) gapScore = "HIGH";
  else if (maxGapScore >= 5) gapScore = "MID";

  return { gapCount, gapScore, rawScore: maxGapScore };
}
