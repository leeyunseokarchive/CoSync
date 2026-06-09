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
  exitVision?: string;
  pivotCriteria?: string;
  conflictResolution?: string;
  dealbreaker?: string;
  salaryStructure?: string;
  equityStructure?: string;
  profitDistribution?: string;
  growthStrategy?: string;
};

export type GapScore = "LOW" | "MID" | "HIGH" | "CRITICAL";
export type IssueStatus = "match" | "diff" | "conflict" | "unanswered";

export const getIssueStatus = (val1?: string, val2?: string, toxicPairs: [string, string][] = []): IssueStatus => {
  if (!val1 || !val2) return "unanswered";
  if (val1 === val2) return "match";

  const opt1 = val1[0];
  const opt2 = val2[0];

  for (const [p1, p2] of toxicPairs) {
    if ((opt1 === p1 && opt2 === p2) || (opt1 === p2 && opt2 === p1)) {
      return "conflict";
    }
  }

  return "diff";
};

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
      // Q1: "결정 후 공유" vs "합의 후 결정" — 담당 영역 자율 결정 vs 공동 합의 철학 충돌
      const q1 = getScore(a1.decisionStructure, a2.decisionStructure, [["1", "3"]], 1.0);
      // Q2: "빠른 전환" vs "프로세스 먼저" — 실행 속도 vs 재발 방지 우선순위 충돌
      const q2 = getScore(a1.decisionFailure, a2.decisionFailure, [["1", "4"]], 1.0);
      // Q3: "결정 수용" vs "납득까지 재논의" — 팀 실행 속도를 지속적으로 막는 패턴
      const q3 = getScore(a1.actionVsConsensus, a2.actionVsConsensus, [["1", "2"]], 1.0);
      // Q4: "70% 확신으로 즉시 실행" vs "90% 확신까지 대기" — 근본적인 속도 철학 충돌
      const q4 = getScore(a1.deadlockTolerance, a2.deadlockTolerance, [["1", "2"]], 1.0);

      // --- Category 2: Role (Weight 1.5) ---
      const q5 = getScore(a1.extraWorkPriority, a2.extraWorkPriority, [["3", "4"]], 1.5);
      // Q6: (1,3)도 toxic — "정규 시간만" vs "초기 높은 몰입 기본"은 실질적 기대치 충돌
      const q6 = getScore(a1.extraWorkPrinciple, a2.extraWorkPrinciple, [["1", "3"], ["1", "4"]], 1.5);
      // Q7: "즉시 역할 조정" vs "원인 파악/지원" — 한쪽은 즉각 구조 조정, 다른쪽은 감정적 지원 우선
      const q7 = getScore(a1.underperformanceAction, a2.underperformanceAction, [["1", "3"]], 1.5);
      const q8 = getScore(a1.workstyleConstraint, a2.workstyleConstraint, [["1", "4"]], 1.5);

      // --- Category 3: Exit (Weight 2.0) ---
      const q9 = getScore(a1.handoverMethod, a2.handoverMethod, [["1", "4"]], 2.0);
      // Q10: 핵심 충돌은 결과물 vs 관리자 권한 우선순위. (2,3), (2,4)는 같은 맥락의 세부 차이라 제거.
      const q10 = getScore(a1.exitRecoveryPriority, a2.exitRecoveryPriority, [["1", "2"], ["2", "4"]], 2.0);
      // Q11: (1,3)도 toxic — 즉시 차단 vs 인수인계 기간 내 권한 유지는 보안 철학 충돌
      const q11 = getScore(a1.exitCleanupTiming, a2.exitCleanupTiming, [["1", "3"], ["1", "4"]], 2.0);
      const q12 = getScore(a1.exitDisputeResolution, a2.exitDisputeResolution, [["1", "4"], ["2", "4"]], 2.0);

      // --- Category 4: Vision (Weight 1.5) ---
      // Q13: M&A 엑싯 vs 독립 운영 — 출구 전략 근본 충돌
      const q13 = getScore(a1.exitVision, a2.exitVision, [["1", "3"]], 1.5);
      // Q14: 자금 소진까지 버팀 vs 시장 신호로 먼저 판단
      const q14 = getScore(a1.pivotCriteria, a2.pivotCriteria, [["1", "2"]], 1.5);
      // Q15: 즉시 직접 대화 vs 냉각 기간 후 대화 — 갈등 처리 스타일 충돌
      const q15 = getScore(a1.conflictResolution, a2.conflictResolution, [["1", "3"]], 1.5);
      // Q16: 속도를 못 참는 것 vs 방향 불일치를 못 참는 것
      const q16 = getScore(a1.dealbreaker, a2.dealbreaker, [["1", "4"]], 1.5);

      // --- Category 5: Money (Weight 2.0) ---
      // Q17: 차등 지급 vs 동일 분배 — 보상 철학 충돌
      const q17 = getScore(a1.salaryStructure, a2.salaryStructure, [["1", "2"]], 2.0);
      // Q18: 관행 고수 vs 기여 기반 유동 조정 — 지분 철학 충돌
      const q18 = getScore(a1.equityStructure, a2.equityStructure, [["1", "2"]], 2.0);
      // Q19: 전액 재투자 vs 보상 먼저
      const q19 = getScore(a1.profitDistribution, a2.profitDistribution, [["1", "3"]], 2.0);
      // Q20: 희석 감수 성장 vs 지분 보호 생존
      const q20 = getScore(a1.growthStrategy, a2.growthStrategy, [["1", "2"]], 2.0);

      const gapsList = [q1, q2, q3, q4, q5, q6, q7, q8, q9, q10, q11, q12, q13, q14, q15, q16, q17, q18, q19, q20];
      
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
  
  // Total max score possible is around 102 points.
  // Cat1(Q1-4): 12, Cat2(Q5-8): 18, Cat3(Q9-12): 24, Cat4(Q13-16): 18, Cat5(Q17-20): 24
  if (maxGapScore >= 32) gapScore = "CRITICAL";
  else if (maxGapScore >= 18) gapScore = "HIGH";
  else if (maxGapScore >= 7) gapScore = "MID";

  return { gapCount, gapScore, rawScore: maxGapScore };
}

