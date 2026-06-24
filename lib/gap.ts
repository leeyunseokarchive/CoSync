export type OnboardingAnswers = {
  extraWorkPriority?: string;
  extraWorkPrinciple?: string;
  underperformanceAction?: string;
  exitRecoveryPriority?: string;
  exitCleanupTiming?: string;
  exitDisputeResolution?: string;
  exitVision?: string;
  pivotCriteria?: string;
  dealbreaker?: string;
  fundingRunway?: string;
  spendingApproval?: string;
  investmentCriteria?: string;
  decisionStructure?: string;
  decisionFailure?: string;
  actionVsConsensus?: string;
  deadlockTolerance?: string;
  salaryStructure?: string;
  equityStructure?: string;
  profitDistribution?: string;
  growthStrategy?: string;
};

export type GapScore = "LOW" | "MID" | "HIGH" | "CRITICAL";
export type IssueStatus = "match" | "diff" | "conflict" | "unanswered";

export type CategoryResult = {
  label: string;
  score: number;
  max: number;
  alignment: number | null;
  gapScore: GapScore | null;
};

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

const toGapScore = (alignment: number): GapScore => {
  if (alignment >= 85) return "LOW";
  if (alignment >= 65) return "MID";
  if (alignment >= 45) return "HIGH";
  return "CRITICAL";
};

type QuestionConfig = {
  field: keyof OnboardingAnswers;
  toxicPairs: [string, string][];
  cat: number;
};

const QUESTION_CONFIGS: QuestionConfig[] = [
  // 역할 & 책임 (cat 0) — 기본 진단 3q
  { field: "extraWorkPriority", toxicPairs: [["3","4"]], cat: 0 },
  { field: "extraWorkPrinciple", toxicPairs: [["1","3"],["1","4"]], cat: 0 },
  { field: "underperformanceAction", toxicPairs: [["1","4"],["3","4"]], cat: 0 },
  // 이탈 & 회수 (cat 1) — 기본 진단 3q
  { field: "exitRecoveryPriority", toxicPairs: [["1","2"],["2","4"]], cat: 1 },
  { field: "exitCleanupTiming", toxicPairs: [["1","3"],["1","4"]], cat: 1 },
  { field: "exitDisputeResolution", toxicPairs: [["1","4"],["2","4"]], cat: 1 },
  // 비전 & 가치관 (cat 2) — 기본 진단 3q
  { field: "exitVision", toxicPairs: [["1","3"]], cat: 2 },
  { field: "pivotCriteria", toxicPairs: [["1","2"]], cat: 2 },
  { field: "dealbreaker", toxicPairs: [["1","4"]], cat: 2 },
  // 조달 & 운용 (cat 3) — 기본 진단 3q
  { field: "fundingRunway", toxicPairs: [["1","4"],["2","3"]], cat: 3 },
  { field: "spendingApproval", toxicPairs: [["1","4"]], cat: 3 },
  { field: "investmentCriteria", toxicPairs: [["1","4"],["1","2"]], cat: 3 },
  // 의사결정 & 실행 (cat 4) — 심화 진단 4q
  { field: "decisionStructure", toxicPairs: [["1","3"]], cat: 4 },
  { field: "decisionFailure", toxicPairs: [["1","4"]], cat: 4 },
  { field: "actionVsConsensus", toxicPairs: [["1","2"]], cat: 4 },
  { field: "deadlockTolerance", toxicPairs: [["1","4"]], cat: 4 },
  // 지분 & 보상 (cat 5) — 심화 진단 4q
  { field: "salaryStructure", toxicPairs: [["1","2"]], cat: 5 },
  { field: "equityStructure", toxicPairs: [["2","4"]], cat: 5 },
  { field: "profitDistribution", toxicPairs: [["1","2"],["2","4"]], cat: 5 },
  { field: "growthStrategy", toxicPairs: [["1","2"]], cat: 5 },
];

const CAT_LABELS = ["역할 & 책임", "이탈 & 회수", "비전 & 가치관", "조달 & 운용", "의사결정 & 실행", "지분 & 보상"];

// 정규화 가중치 (출처: 국내 스타트업 팀 와해 및 분쟁 원인 실증 분석 MVP V3)
const CAT_WEIGHTS = [0.11, 0.11, 0.11, 0.17, 0.22, 0.28];

export function computeGapSummary(members: OnboardingAnswers[]) {
  const N = CAT_LABELS.length;

  const empty = {
    gapCount: 0,
    gapScore: "LOW" as GapScore,
    rawScore: 0,
    overallAlignment: 100,
    categories: CAT_LABELS.map(label => ({
      label, score: 0, max: 0, alignment: null, gapScore: null,
    })) as CategoryResult[],
  };

  if (members.length <= 1) return empty;

  let worstScore = -1;
  let saved = {
    gapCount: 0,
    rawScore: 0,
    catGaps: Array(N).fill(0) as number[],
    catCounts: Array(N).fill(0) as number[],
  };

  for (let i = 0; i < members.length; i++) {
    for (let j = i + 1; j < members.length; j++) {
      const m1 = members[i];
      const m2 = members[j];

      const catGapSums = Array(N).fill(0) as number[];
      const catCounts = Array(N).fill(0) as number[];
      let gapCount = 0;

      for (const q of QUESTION_CONFIGS) {
        const v1 = m1[q.field];
        const v2 = m2[q.field];
        if (!v1 || !v2) continue;

        const s1 = v1[0];
        const s2 = v2[0];
        catCounts[q.cat]++;

        let gap = 0;
        if (s1 !== s2) {
          let isToxic = false;
          for (const [p1, p2] of q.toxicPairs) {
            if ((s1 === p1 && s2 === p2) || (s1 === p2 && s2 === p1)) {
              isToxic = true;
              break;
            }
          }
          if (isToxic) {
            gap = 3;
          } else {
            const d1 = parseInt(s1);
            const d2 = parseInt(s2);
            gap = isNaN(d1) || isNaN(d2) ? 1 : Math.abs(d1 - d2);
          }
        }

        catGapSums[q.cat] += gap;
        if (gap > 0) gapCount++;
      }

      // G_i: 카테고리별 평균 갭 (0~3)
      const catGaps = catGapSums.map((sum, k) =>
        catCounts[k] > 0 ? sum / catCounts[k] : 0
      );

      // S_total = Σ W'_i × G_i (max = 3, since Σ W'_i = 1 and max G_i = 3)
      const rawScore = catGaps.reduce((acc, g, k) => acc + CAT_WEIGHTS[k] * g, 0);

      if (rawScore > worstScore) {
        worstScore = rawScore;
        saved = { gapCount, rawScore, catGaps, catCounts };
      }
    }
  }

  // 미진단 카테고리를 제외하고, 실제 답변된 카테고리 가중치 합으로 정규화
  const answeredWeight = saved.catCounts.reduce((sum, count, k) =>
    count > 0 ? sum + CAT_WEIGHTS[k] : sum, 0);
  const overallAlignment = answeredWeight > 0
    ? Math.round((1 - saved.rawScore / (answeredWeight * 3)) * 100)
    : 100;

  const categories: CategoryResult[] = CAT_LABELS.map((label, k) => {
    if (saved.catCounts[k] === 0) {
      return { label, score: 0, max: 0, alignment: null, gapScore: null };
    }
    const alignment = Math.round((1 - saved.catGaps[k] / 3) * 100);
    return {
      label,
      score: Math.round(CAT_WEIGHTS[k] * saved.catGaps[k] * 100) / 100,
      max: CAT_WEIGHTS[k] * 3,
      alignment,
      gapScore: toGapScore(alignment),
    };
  });

  return {
    gapCount: saved.gapCount,
    gapScore: toGapScore(overallAlignment),
    rawScore: saved.rawScore,
    overallAlignment,
    categories,
  };
}
