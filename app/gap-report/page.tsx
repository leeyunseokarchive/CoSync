"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { TopNav } from "../../components/TopNav";
import { Footer } from "../../components/Footer";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, Keyboard } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import { useAuth } from "../../components/AuthContext";
import { useUserProfile } from "../../components/useUserProfile";
import { useTeams } from "../../components/useTeams";
import { useTeamMembers } from "../../components/useTeamMembers";
import { computeGapSummary, getIssueStatus, type IssueStatus, type OnboardingAnswers } from "../../lib/gap";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";

type QuestionDef = {
  id: string;
  label: string;
  field: keyof OnboardingAnswers;
  toxicPairs: [string, string][];
  insight: string;
};

const QUESTION_DEFS: QuestionDef[] = [
  { id: "q1", label: "단독 결정권 범위", field: "decisionStructure", toxicPairs: [["1","3"]], insight: "한 명이 담당 영역에서 결정하고 나중에 알렸는데, 상대방이 '왜 나한테 먼저 안 물어봤냐'고 할 때 터집니다. 지금 맞춰볼 질문: 각자 단독으로 최종 결정할 수 있는 범위나 기준이 있나요?" },
  { id: "q2", label: "실패 후 반응", field: "decisionFailure", toxicPairs: [["1","4"]], insight: "실패 직후 한 명은 '빨리 다음 거 가자'고 하고, 상대방은 '왜 맨날 회고도 안 하냐'고 할 때 터집니다. 지금 맞춰볼 질문: 실패 후 다음 결정까지 최소한 어떤 과정을 거치기로 할까요?" },
  { id: "q3", label: "반대 의견 처리", field: "actionVsConsensus", toxicPairs: [["1","2"]], insight: "결정이 됐는데 반대했던 사람이 계속 납득 안 된다며 재논의를 요구할 때 팀 실행 속도가 반복적으로 막힙니다. 지금 맞춰볼 질문: 결정 후 반대 의견을 다시 꺼낼 수 있는 조건이 있나요?" },
  { id: "q4", label: "결정 속도 vs 확신", field: "deadlockTolerance", toxicPairs: [["1","2"]], insight: "한 명은 '70%면 충분하니 지금 가자'고 하고, 상대방은 '좀 더 확인하고 가자'고 할 때 반복 충돌합니다. 지금 맞춰볼 질문: 중요한 결정에서 '충분한 확신'의 기준이 맞춰진 적 있나요?" },
  { id: "q5", label: "회색지대 업무 배정", field: "extraWorkPriority", toxicPairs: [["3","4"]], insight: "담당자 없는 일이 생겼을 때 한 명은 당연히 A가 해야 한다고 보고, 당사자는 '왜 나냐'고 할 때 반복 마찰이 생깁니다. 지금 맞춰볼 질문: 회색지대 업무를 누가 어떤 기준으로 결정할지 정해둔 게 있나요?" },
  { id: "q6", label: "업무 몰입 시간 기대", field: "extraWorkPrinciple", toxicPairs: [["1","3"],["1","4"]], insight: "한 명이 저녁·주말에 메시지를 보내거나, 반대로 업무 시간 후엔 연락이 안 될 때 기대치 차이가 드러납니다. 지금 맞춰볼 질문: 서로에게 기대하는 '최소 가용 시간' 기준이 말로 맞춰진 적 있나요?" },
  { id: "q7", label: "퍼포먼스 조치", field: "underperformanceAction", toxicPairs: [["1","4"],["3","4"]], insight: "한 명이 계속 목표를 못 채울 때, 한 명은 '역할을 조정해야 한다'고 보고 상대방은 '좀 더 기다려야 한다'고 볼 때 감정과 지분 문제가 함께 엮입니다. 지금 맞춰볼 질문: 성과 부진이 몇 달 지속될 때 역할 조정을 논의하기로 할까요?" },
  { id: "q8", label: "협업 운영 방식", field: "workstyleConstraint", toxicPairs: [["1","4"]], insight: "중요한 시점에 상대방 일정을 모른 채 연락이 안 되거나, 불필요하게 느껴지는 보고 구조에 피로가 쌓일 때 터집니다. 지금 맞춰볼 질문: 공통으로 지켜야 할 최소 협업 리듬(예: 주 1회 싱크)이 합의됐나요?" },
  { id: "q9", label: "이탈 업무 인수인계", field: "handoverMethod", toxicPairs: [["1","4"]], insight: "이탈 당사자가 '내가 마무리할게'라고 했는데 실제로는 업무가 흐지부지 넘어올 때, 또는 너무 일찍 권한이 차단돼 공백이 생길 때 터집니다. 지금 맞춰볼 질문: 인수인계 완료 기준을 미리 문서로 정해둘 의향이 있나요?" },
  { id: "q10", label: "우선 정리 권한", field: "exitRecoveryPriority", toxicPairs: [["1","2"],["2","4"]], insight: "이탈 상황에서 한 명은 서버 권한부터 차단해야 한다고 하고, 상대방은 고객 연락처가 먼저라고 할 때 초기 몇 시간이 엉키면서 공백이 생깁니다. 지금 맞춰볼 질문: 이탈 발생 시 첫 24시간 안에 처리할 권한 회수 순서가 정해져 있나요?" },
  { id: "q11", label: "권한 차단 타이밍", field: "exitCleanupTiming", toxicPairs: [["1","3"],["1","4"]], insight: "퇴사 의사를 밝혔지만 법적 처리가 안 된 상황에서 한 명은 이미 외부인으로 보고 상대방은 여전히 팀원으로 대할 때 보안과 신뢰 모두 위험해집니다. 지금 맞춰볼 질문: 퇴사 의사 확인 시점부터 권한 단계별 차단 절차가 문서로 있나요?" },
  { id: "q12", label: "이탈 시 지분 정리", field: "exitDisputeResolution", toxicPairs: [["1","4"],["2","4"]], insight: "이탈 당사자는 '나의 기여를 인정해달라'고 하고, 남은 사람은 '계약 기준으로만 처리하자'고 할 때 감정이 최고조로 올라갑니다. 지금 맞춰볼 질문: 이탈 시 지분 정리의 최우선 기준이 지금 당장 합의되어 있나요?" },
  { id: "q13", label: "회사 출구 전략", field: "exitVision", toxicPairs: [["1","3"]], insight: "한 명은 빠른 M&A 엑싯을 목표로 달리고, 상대방은 독립 운영을 원할 때 투자 유치 방향, 성장 속도, 핵심 결정 기준이 전부 어긋납니다. 지금 맞춰볼 질문: 3~5년 후 이 회사의 이상적인 결말을 한 번이라도 맞춰본 적 있나요?" },
  { id: "q14", label: "피벗/중단 기준", field: "pivotCriteria", toxicPairs: [["1","2"]], insight: "한 명은 '자금이 다 떨어지기 전에는 계속 간다'고 하고, 상대방은 '시장 반응이 없으면 먼저 멈춰야 한다'고 할 때 버티는 기준 자체가 달라 결정적 순간에 충돌합니다. 지금 맞춰볼 질문: 방향 전환 또는 중단을 논의하는 기준이 지금 합의되어 있나요?" },
  { id: "q15", label: "갈등 해소 방식", field: "conflictResolution", toxicPairs: [["1","3"]], insight: "한 명은 '지금 당장 얘기하자'고 하고, 상대방은 '좀 식히고 나서 하자'고 할 때 갈등이 해소되지 않고 쌓입니다. 지금 맞춰볼 질문: 갈등이 생겼을 때 처리 방식에 대한 기준을 맞춰본 적 있나요?" },
  { id: "q16", label: "절대 용납 못하는 것", field: "dealbreaker", toxicPairs: [["1","4"]], insight: "한 명이 가장 못 참는 것이 상대방의 가장 자연스러운 행동 방식일 때 반복 마찰의 근원이 됩니다. 지금 맞춰볼 질문: 서로가 절대 용납 못하는 것을 한 번이라도 직접 말한 적 있나요?" },
  { id: "q17", label: "급여 구조", field: "salaryStructure", toxicPairs: [["1","2"]], insight: "한 명은 '기여도가 다르면 급여도 달라야 한다'고 하고, 상대방은 '초기엔 같아야 공평하다'고 할 때 불만이 쌓이다 터집니다. 지금 맞춰볼 질문: 공동창업자 간 급여 차등 기준이 지금 합의되어 있나요?" },
  { id: "q18", label: "지분 구조 철학", field: "equityStructure", toxicPairs: [["1","2"]], insight: "한 명은 '처음 합의한 구조가 맞다'고 하고, 상대방은 '기여도가 달라지면 지분도 바뀌어야 한다'고 할 때 가장 큰 감정 충돌이 생깁니다. 지금 맞춰볼 질문: 지분 조정 가능성에 대해 서로 입장을 명확히 말한 적 있나요?" },
  { id: "q19", label: "수익 배분 우선순위", field: "profitDistribution", toxicPairs: [["1","3"]], insight: "한 명은 '수익은 전부 재투자해야 한다'고 하고, 상대방은 '이제 보상을 받아야 한다'고 할 때 첫 수익이 오히려 갈등의 도화선이 됩니다. 지금 맞춰볼 질문: 수익 발생 시 배분 기준이 미리 합의되어 있나요?" },
  { id: "q20", label: "성장 전략", field: "growthStrategy", toxicPairs: [["1","2"]], insight: "한 명은 투자를 받아 빠르게 성장하고 싶고, 상대방은 지분을 지키며 생존하고 싶을 때 투자 유치 기회가 올 때마다 충돌합니다. 지금 맞춰볼 질문: 외부 투자와 지분 희석에 대한 입장이 맞춰진 적 있나요?" },
];

const statusRank = (s: IssueStatus): number => {
  if (s === "conflict") return 3;
  if (s === "diff") return 2;
  if (s === "match") return 1;
  return 0;
};

export default function GapReportPage() {
  const [showSubscribe, setShowSubscribe] = useState(false);
  const router = useRouter();
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const { teams } = useTeams();
  const [teamName, setTeamName] = useState("격차 리포트");
  const [teamCreator, setTeamCreator] = useState<string | null>(null);
  const [selectedPairId, setSelectedPairId] = useState<string | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"team" | "pair">("team");
  const activeTeamId = profile?.lastActiveTeamId || profile?.teamIds?.[0] || teams[0]?.id;
  const { members, loading: membersLoading } = useTeamMembers(activeTeamId);

  useEffect(() => {
    const fetchTeam = async () => {
      if (!activeTeamId) return;
      const snap = await getDoc(doc(db, "teams", activeTeamId));
      if (snap.exists()) {
        const data = snap.data() as { name?: string; createdBy?: string };
        setTeamName(data.name || "격차 리포트");
        setTeamCreator(data.createdBy || null);
      }
    };
    fetchTeam();
  }, [activeTeamId]);

  const pairs = useMemo(() => {
    if (!user || members.length < 2) return [] as Array<{
      id: string;
      a: (typeof members)[number];
      b: (typeof members)[number];
      gapCount: number;
      gapScore: "LOW" | "MID" | "HIGH" | "CRITICAL";
      rawScore: number;
    }>;
    const result = [];
    for (let i = 0; i < members.length; i++) {
      for (let j = i + 1; j < members.length; j++) {
        const a = members[i];
        const b = members[j];
        const { gapCount, gapScore, rawScore } = computeGapSummary([
          a.answers ?? {},
          b.answers ?? {}
        ]);
        result.push({ id: `${a.id}-${b.id}`, a, b, gapCount, gapScore, rawScore });
      }
    }
    return result;
  }, [user, members]);

  const isCreator = Boolean(user && teamCreator && user.uid === teamCreator);

  const selectedPair = useMemo(() => {
    if (!pairs.length) return null;
    if (pairs.length === 1) return pairs[0];
    if (!selectedPairId) return null;
    return pairs.find((pair) => pair.id === selectedPairId) ?? null;
  }, [pairs, selectedPairId]);

  const teamIssues = useMemo(() => {
    if (members.length < 2) return [] as Array<{
      id: string; label: string; status: IssueStatus; conflict: boolean;
      memberValues: Array<{name: string; value: string}>;
      leftValue: string; rightValue: string; insight: string;
    }>;
    return QUESTION_DEFS.map(def => {
      const memberValues = members.map(m => ({
        name: m.name || "팀원",
        value: (m.answers as OnboardingAnswers | undefined)?.[def.field] || "미입력"
      }));
      let worstStatus: IssueStatus = "match";
      for (let i = 0; i < members.length; i++) {
        for (let j = i + 1; j < members.length; j++) {
          const s = getIssueStatus(
            (members[i].answers as OnboardingAnswers | undefined)?.[def.field],
            (members[j].answers as OnboardingAnswers | undefined)?.[def.field],
            def.toxicPairs
          );
          if (statusRank(s) > statusRank(worstStatus)) worstStatus = s;
        }
      }
      return {
        id: def.id,
        label: def.label,
        status: worstStatus,
        conflict: worstStatus === "diff" || worstStatus === "conflict",
        memberValues,
        leftValue: memberValues[0]?.value || "미입력",
        rightValue: memberValues[1]?.value || "미입력",
        insight: def.insight
      };
    });
  }, [members]);

  const isTeamComplete = members.length >= 2 && members.every(m => (m.progress ?? 0) >= 100);

  const issues = useMemo(() => {
    if (!selectedPair) return [] as Array<{
      id: string;
      label: string;
      conflict: boolean;
      status: IssueStatus;
      leftValue: string;
      rightValue: string;
      insight: string;
    }>;
    const left = selectedPair.a.answers ?? {};
    const right = selectedPair.b.answers ?? {};

    const createIssue = (id: string, label: string, leftVal: string | undefined, rightVal: string | undefined, toxicPairs: [string, string][], insight: string) => {
      const status = getIssueStatus(leftVal, rightVal, toxicPairs);
      return {
        id,
        label,
        status,
        conflict: status === "diff" || status === "conflict",
        leftValue: leftVal || "미입력",
        rightValue: rightVal || "미입력",
        insight
      };
    };

    return [
      createIssue("q1", "단독 결정권 범위", left.decisionStructure, right.decisionStructure, [["1", "3"]], "한 명이 담당 영역에서 결정하고 나중에 알렸는데, 상대방이 '왜 나한테 먼저 안 물어봤냐'고 할 때 터집니다. 지금 맞춰볼 질문: 각자 단독으로 최종 결정할 수 있는 범위나 기준이 있나요?"),
      createIssue("q2", "실패 후 반응", left.decisionFailure, right.decisionFailure, [["1", "4"]], "실패 직후 한 명은 '빨리 다음 거 가자'고 하고, 상대방은 '왜 맨날 회고도 안 하냐'고 할 때 터집니다. 지금 맞춰볼 질문: 실패 후 다음 결정까지 최소한 어떤 과정을 거치기로 할까요?"),
      createIssue("q3", "반대 의견 처리", left.actionVsConsensus, right.actionVsConsensus, [["1", "2"]], "결정이 됐는데 반대했던 사람이 계속 납득 안 된다며 재논의를 요구할 때 팀 실행 속도가 반복적으로 막힙니다. 지금 맞춰볼 질문: 결정 후 반대 의견을 다시 꺼낼 수 있는 조건이 있나요?"),
      createIssue("q4", "결정 속도 vs 확신", left.deadlockTolerance, right.deadlockTolerance, [["1", "2"]], "한 명은 '70%면 충분하니 지금 가자'고 하고, 상대방은 '좀 더 확인하고 가자'고 할 때 '왜 항상 서두르냐' vs '왜 항상 느리냐'로 반복 충돌합니다. 지금 맞춰볼 질문: 중요한 결정에서 '충분한 확신'의 기준이 맞춰진 적 있나요?"),
      createIssue("q5", "회색지대 업무 배정", left.extraWorkPriority, right.extraWorkPriority, [["3", "4"]], "담당자 없는 일이 생겼을 때 한 명은 당연히 A가 해야 한다고 보고, 당사자는 '왜 나냐'고 할 때 반복 마찰이 생깁니다. 지금 맞춰볼 질문: 회색지대 업무를 누가 어떤 기준으로 결정할지 정해둔 게 있나요?"),
      createIssue("q6", "업무 몰입 시간 기대", left.extraWorkPrinciple, right.extraWorkPrinciple, [["1", "3"], ["1", "4"]], "한 명이 저녁·주말에 메시지를 보내거나, 반대로 업무 시간 후엔 연락이 안 될 때 기대치 차이가 드러납니다. 지금 맞춰볼 질문: 서로에게 기대하는 '최소 가용 시간' 기준이 말로 맞춰진 적 있나요?"),
      createIssue("q7", "퍼포먼스 조치", left.underperformanceAction, right.underperformanceAction, [["1", "4"], ["3", "4"]], "한 명이 계속 목표를 못 채울 때, 한 명은 '이제 역할을 조정해야 한다'고 보고 상대방은 '좀 더 기다려야 한다'고 볼 때 감정과 지분 문제가 함께 엮입니다. 지금 맞춰볼 질문: 성과 부진이 몇 달 지속될 때 역할 조정을 논의하기로 할까요?"),
      createIssue("q8", "협업 운영 방식", left.workstyleConstraint, right.workstyleConstraint, [["1", "4"]], "중요한 시점에 상대방 일정을 모른 채 연락이 안 되거나, 불필요하게 느껴지는 보고 구조에 피로가 쌓일 때 터집니다. 지금 맞춰볼 질문: 공통으로 지켜야 할 최소 협업 리듬(예: 주 1회 싱크)이 합의됐나요?"),
      createIssue("q9", "이탈 업무 인수인계", left.handoverMethod, right.handoverMethod, [["1", "4"]], "이탈 당사자가 '내가 마무리할게'라고 했는데 실제로는 업무가 흐지부지 넘어올 때, 또는 너무 일찍 권한이 차단돼 공백이 생길 때 터집니다. 지금 맞춰볼 질문: 인수인계 완료 기준을 미리 문서로 정해둘 의향이 있나요?"),
      createIssue("q10", "우선 정리 권한", left.exitRecoveryPriority, right.exitRecoveryPriority, [["1", "2"], ["2", "4"]], "이탈 상황에서 한 명은 서버 권한부터 차단해야 한다고 하고, 상대방은 고객 연락처가 먼저라고 할 때 초기 몇 시간이 엉키면서 공백이 생깁니다. 지금 맞춰볼 질문: 이탈 발생 시 첫 24시간 안에 처리할 권한 회수 순서가 정해져 있나요?"),
      createIssue("q11", "권한 차단 타이밍", left.exitCleanupTiming, right.exitCleanupTiming, [["1", "3"], ["1", "4"]], "퇴사 의사를 밝혔지만 법적 처리가 안 된 상황에서 한 명은 이미 외부인으로 보고 상대방은 여전히 팀원으로 대할 때 보안과 신뢰 모두 위험해집니다. 지금 맞춰볼 질문: 퇴사 의사 확인 시점부터 권한 단계별 차단 절차가 문서로 있나요?"),
      createIssue("q12", "이탈 시 지분 정리", left.exitDisputeResolution, right.exitDisputeResolution, [["1", "4"], ["2", "4"]], "이탈 당사자는 '나의 기여를 인정해달라'고 하고, 남은 사람은 '계약 기준으로만 처리하자'고 할 때 감정이 최고조로 올라갑니다. 지금 맞춰볼 질문: 이탈 시 지분 정리의 최우선 기준이 지금 당장 합의되어 있나요?"),
      createIssue("q13", "회사 출구 전략", left.exitVision, right.exitVision, [["1", "3"]], "한 명은 빠른 M&A 엑싯을 목표로 달리고, 상대방은 독립 운영을 원할 때 투자 유치 방향, 성장 속도, 핵심 결정 기준이 전부 어긋납니다. 지금 맞춰볼 질문: 3~5년 후 이 회사의 이상적인 결말을 한 번이라도 맞춰본 적 있나요?"),
      createIssue("q14", "피벗/중단 기준", left.pivotCriteria, right.pivotCriteria, [["1", "2"]], "한 명은 '자금이 다 떨어지기 전에는 계속 간다'고 하고, 상대방은 '시장 반응이 없으면 먼저 멈춰야 한다'고 할 때 버티는 기준 자체가 달라 결정적 순간에 충돌합니다. 지금 맞춰볼 질문: 방향 전환 또는 중단을 논의하는 기준이 지금 합의되어 있나요?"),
      createIssue("q15", "갈등 해소 방식", left.conflictResolution, right.conflictResolution, [["1", "3"]], "한 명은 '지금 당장 얘기하자'고 하고, 상대방은 '좀 식히고 나서 하자'고 할 때 갈등이 해소되지 않고 쌓입니다. 지금 맞춰볼 질문: 갈등이 생겼을 때 처리 방식에 대한 기준을 맞춰본 적 있나요?"),
      createIssue("q16", "절대 용납 못하는 것", left.dealbreaker, right.dealbreaker, [["1", "4"]], "한 명이 가장 못 참는 것이 상대방의 가장 자연스러운 행동 방식일 때 반복 마찰의 근원이 됩니다. 지금 맞춰볼 질문: 서로가 절대 용납 못하는 것을 한 번이라도 직접 말한 적 있나요?"),
      createIssue("q17", "급여 구조", left.salaryStructure, right.salaryStructure, [["1", "2"]], "한 명은 '기여도가 다르면 급여도 달라야 한다'고 하고, 상대방은 '초기엔 같아야 공평하다'고 할 때 불만이 쌓이다 터집니다. 지금 맞춰볼 질문: 공동창업자 간 급여 차등 기준이 지금 합의되어 있나요?"),
      createIssue("q18", "지분 구조 철학", left.equityStructure, right.equityStructure, [["1", "2"]], "한 명은 '처음 합의한 구조가 맞다'고 하고, 상대방은 '기여도가 달라지면 지분도 바뀌어야 한다'고 할 때 가장 큰 감정 충돌이 생깁니다. 지금 맞춰볼 질문: 지분 조정 가능성에 대해 서로 입장을 명확히 말한 적 있나요?"),
      createIssue("q19", "수익 배분 우선순위", left.profitDistribution, right.profitDistribution, [["1", "3"]], "한 명은 '수익은 전부 재투자해야 한다'고 하고, 상대방은 '이제 보상을 받아야 한다'고 할 때 첫 수익이 오히려 갈등의 도화선이 됩니다. 지금 맞춰볼 질문: 수익 발생 시 배분 기준이 미리 합의되어 있나요?"),
      createIssue("q20", "성장 전략", left.growthStrategy, right.growthStrategy, [["1", "2"]], "한 명은 투자를 받아 빠르게 성장하고 싶고, 상대방은 지분을 지키며 생존하고 싶을 때 투자 유치 기회가 올 때마다 충돌합니다. 지금 맞춰볼 질문: 외부 투자와 지분 희석에 대한 입장이 맞춰진 적 있나요?")
    ];
  }, [selectedPair]);

  const bothHaveAdvancedData = useMemo(() => {
    if (!selectedPair) return false;
    const advancedFields = ["exitVision", "pivotCriteria", "conflictResolution", "dealbreaker", "salaryStructure", "equityStructure", "profitDistribution", "growthStrategy"] as const;
    const leftAnswers = selectedPair.a.answers ?? {};
    const rightAnswers = selectedPair.b.answers ?? {};
    const leftHas = advancedFields.some((f) => Boolean(leftAnswers[f]));
    const rightHas = advancedFields.some((f) => Boolean(rightAnswers[f]));
    return leftHas && rightHas;
  }, [selectedPair]);

  const diffIssues = useMemo(() => {
    return issues.filter((issue) => issue.conflict);
  }, [issues]);

  const teamInsight = useMemo(() => {
    if (!members.length) {
      return {
        gapCount: 0,
        gapScore: "LOW" as const,
        text: "아직 팀 데이터가 충분하지 않습니다. 온보딩 진단을 완료하면 팀 인사이트가 생성됩니다."
      };
    }
    const memberAnswers = members.map((member) => member.answers ?? {});
    const { gapCount, gapScore, rawScore } = computeGapSummary(memberAnswers);
    const counts = {
      decision: teamIssues.slice(0, 4).filter((issue) => issue.conflict).length,
      role: teamIssues.slice(4, 8).filter((issue) => issue.conflict).length,
      exit: teamIssues.slice(8, 12).filter((issue) => issue.conflict).length
    };
    const sorted = [
      { key: "decision", label: "의사결정/권한", count: counts.decision },
      { key: "role", label: "역할/책임", count: counts.role },
      { key: "exit", label: "이탈/권한정리", count: counts.exit }
    ].sort((a, b) => b.count - a.count);
    const top = sorted[0];
    const second = sorted[1];

    const diffCount = teamIssues.filter((i) => i.status === "diff" || i.status === "conflict").length;
    const highRiskCount = teamIssues.filter((i) => i.status === "conflict").length;

    const topPriorityIssuesList = teamIssues.filter((i) => i.status === "conflict");
    if (topPriorityIssuesList.length < 3) {
      topPriorityIssuesList.push(...teamIssues.filter((i) => i.status === "diff").slice(0, 3 - topPriorityIssuesList.length));
    }
    const topPriorityIssuesArray = topPriorityIssuesList.slice(0, 3);
    const topPriorityLabels = topPriorityIssuesArray.length > 0 ? topPriorityIssuesArray.map(i => i.label).join(", ") : "없음";

    const leadSentence = (() => {
      if (gapScore === "CRITICAL") return "팀 와해로 이어질 수 있는 치명적인 인식 차이가 존재합니다!";
      if (gapScore === "HIGH") return "합의 기준에서 차이가 크게 확인됩니다.";
      if (gapScore === "MID") return "전반적인 기준은 맞아가고 있으나 일부 영역에서 차이가 보입니다.";
      return "합의 기준이 전반적으로 잘 맞습니다.";
    })();

    const detailSentence = (() => {
      if (gapScore === "LOW") return "현재 흐름을 유지하며 필요한 부분만 보완하는 것이 적절합니다.";
      if (top.count === 0) return "추가 논의가 필요한 영역을 빠르게 정리하면 실행 안정성이 높아집니다.";
      if (second.count > 0 && top.count === second.count) {
        return `${top.label}과 ${second.label}에서 유사한 수준의 조율 필요성이 확인됩니다.`;
      }
      return `${top.label}에서 조율 필요성이 가장 크게 나타납니다.`;
    })();

    return { 
      gapCount, 
      gapScore, 
      text: `${leadSentence} ${detailSentence}`,
      diffCount,
      highRiskCount,
      topPriorityLabels,
      topPriorityIssuesArray,
      rawScore
    };
  }, [members, teamIssues]);

  const alignmentScore = useMemo(() => {
    const completePairs = pairs.filter(
      (p) => (p.a.progress ?? 0) >= 100 && (p.b.progress ?? 0) >= 100
    );
    if (!completePairs.length) return 0;
    const avg =
      completePairs.reduce(
        (sum, p) => sum + Math.max(0, Math.round(100 - ((p.rawScore ?? 0) / 84) * 100)),
        0
      ) / completePairs.length;
    return Math.round(avg);
  }, [pairs]);

  const isPairComplete = useMemo(() => {
    if (!selectedPair) return false;
    return (selectedPair.a.progress ?? 0) >= 100 && (selectedPair.b.progress ?? 0) >= 100;
  }, [selectedPair]);

  const activeIssues = viewMode === "team" ? teamIssues : issues;

  const allHaveAdvancedData = useMemo(() => {
    if (members.length < 2) return false;
    const advancedFields: (keyof OnboardingAnswers)[] = ["exitVision", "pivotCriteria", "conflictResolution", "dealbreaker", "salaryStructure", "equityStructure", "profitDistribution", "growthStrategy"];
    return members.every(m => advancedFields.some(f => Boolean((m.answers as OnboardingAnswers | undefined)?.[f])));
  }, [members]);

  const showAdvancedHeatmap = viewMode === "team" ? allHaveAdvancedData : bothHaveAdvancedData;
  const showReport = viewMode === "team" ? isTeamComplete : (selectedPair !== null && isPairComplete);

  const slides = [
    { title: "합의 세션", src: "/preview/agreement-confirm.png" },
    { title: "계약서 생성", src: "/preview/document-view.png" },
    { title: "구체적인 질문 리스트", src: "/preview/questions.png" },
    { title: "AI 추천 문구", src: "/preview/version-diff.png" },
    { title: "히스토리 관리", src: "/preview/version-history.png" },
    { title: "최종 합의", src: "/preview/consensus.png" }
  ];

  return (
    <main className="page gap-page">
      <TopNav links={[{ label: "대시보드", href: "/workspace" }]} active="리포트" />

      <div className="gap-hero-premium">
        <div className="container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div className="gap-breadcrumb-premium">분석 결과 · 인식 격차 리포트</div>
          <h1 className="section-title-premium">GAP REPORT</h1>
          <div className="premium-divider"></div>
          {viewMode === "team" && members.length >= 2 && (
            <div className="gap-pair-label-premium">
              팀 통합 리포트: {members.map(m => m.name).join(" · ")}
            </div>
          )}
          {viewMode === "pair" && selectedPair && (
            <div className="gap-pair-label-premium">
              비교 대상: {selectedPair.a.name} · {selectedPair.b.name}
            </div>
          )}
          {members.length >= 3 && (
            <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
              <button
                type="button"
                className={`btn ${viewMode === "team" ? "btn-primary" : "btn-ghost"}`}
                style={{ fontSize: "0.85rem", padding: "8px 18px" }}
                onClick={() => { setViewMode("team"); setSelectedPairId(null); }}
              >
                팀 통합 보기
              </button>
              <button
                type="button"
                className={`btn ${viewMode === "pair" ? "btn-primary" : "btn-ghost"}`}
                style={{ fontSize: "0.85rem", padding: "8px 18px" }}
                onClick={() => setViewMode("pair")}
              >
                1:1 비교
              </button>
            </div>
          )}
          {viewMode === "pair" && pairs.length > 1 && selectedPairId && (
            <button
              className="premium-back-btn"
              onClick={() => setSelectedPairId(null)}
              type="button"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
              1:1 쌍 선택으로 돌아가기
            </button>
          )}
        </div>
      </div>

      <section className="container gap-wrap" style={{ position: "relative", zIndex: 10, marginTop: "-40px" }}>
        {/* 팀 통합 보기 - 미완료 */}
        {viewMode === "team" && !isTeamComplete && members.length >= 2 && (
          <div className="card gap-summary" style={{ width: "100%", maxWidth: "600px", margin: "0 auto", textAlign: "center", padding: "40px 32px" }}>
            <div style={{ fontSize: "32px", marginBottom: "16px" }}>🔒</div>
            <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "8px" }}>모든 팀원이 진단을 완료해야 리포트를 볼 수 있어요</h3>
            <p style={{ color: "#64748b", fontSize: "14px", lineHeight: 1.6, marginBottom: "24px" }}>
              {members.filter(m => (m.progress ?? 0) < 100).map(m => (
                <span key={m.id}><strong>{m.name}</strong>의 진단 진행률: {m.progress ?? 0}%<br /></span>
              ))}
              <br />전원 100% 완료 후 통합 리포트가 열립니다.
            </p>
            <Link href="/onboarding/diagnosis" className="btn btn-primary" style={{ display: "inline-flex" }}>
              진단 계속하기 →
            </Link>
          </div>
        )}

        {/* 1:1 비교 모드 - 쌍 선택 */}
        {viewMode === "pair" && !selectedPair && (
          <div
            className="gap-pair-grid"
            style={pairs.length <= 1 ? { display: "flex", justifyContent: "center" } : {}}
          >
            {membersLoading && <div className="card gap-summary" style={{ width: "100%", maxWidth: "600px" }}>요약 카드 준비 중...</div>}
            {!membersLoading && pairs.length === 0 && (
              <div className="card gap-summary" style={{ width: "100%", maxWidth: "600px", textAlign: "center" }}>아직 비교할 팀원이 없습니다.</div>
            )}
            {!membersLoading &&
              pairs.map((pair) => {
                const pairComplete = (pair.a.progress ?? 0) >= 100 && (pair.b.progress ?? 0) >= 100;
                return (
                  <button
                    key={pair.id}
                    className="card gap-summary gap-pair"
                    type="button"
                    style={pairs.length === 1 ? { width: "100%", maxWidth: "600px" } : {}}
                    onClick={() => setSelectedPairId(pair.id)}
                  >
                    <div>
                      <div className="summary-title">비교 대상</div>
                      <div className="summary-value">
                        {pair.a.name} · {pair.b.name}
                      </div>
                    </div>
                    {pairComplete ? (
                      <>
                        <div>
                          <div className="summary-title">GAP SCORE</div>
                          <div className={`summary-value ${pair.gapScore?.toLowerCase()}`}>
                            {pair.gapScore}
                          </div>
                        </div>
                        <div>
                          <div className="summary-title">이해차이 항목</div>
                          <div className="summary-value">{pair.gapCount}개</div>
                        </div>
                      </>
                    ) : (
                      <div>
                        <div className="summary-title">진행률</div>
                        <div className="summary-value muted">
                          {pair.a.name} {pair.a.progress ?? 0}% · {pair.b.name} {pair.b.progress ?? 0}%
                        </div>
                      </div>
                    )}
                    <div className="summary-note">
                      {pairComplete ? "카드를 눌러 상세 격차 리포트를 확인하세요." : "두 사람 모두 진단을 완료해야 리포트가 열립니다."}
                    </div>
                  </button>
                );
              })}
          </div>
        )}

        {viewMode === "pair" && selectedPair && !isPairComplete && (
          <div className="card gap-summary" style={{ width: "100%", maxWidth: "600px", margin: "0 auto", textAlign: "center", padding: "40px 32px" }}>
            <div style={{ fontSize: "32px", marginBottom: "16px" }}>🔒</div>
            <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "8px" }}>진단을 완료해야 리포트를 볼 수 있어요</h3>
            <p style={{ color: "#64748b", fontSize: "14px", lineHeight: 1.6, marginBottom: "24px" }}>
              {(selectedPair.a.progress ?? 0) < 100 && <><strong>{selectedPair.a.name}</strong>의 진단 진행률: {selectedPair.a.progress ?? 0}%<br /></>}
              {(selectedPair.b.progress ?? 0) < 100 && <><strong>{selectedPair.b.name}</strong>의 진단 진행률: {selectedPair.b.progress ?? 0}%<br /></>}
              <br />두 사람 모두 진단을 100% 완료해야 리포트가 열립니다.
            </p>
            <Link href="/onboarding/diagnosis" className="btn btn-primary" style={{ display: "inline-flex" }}>
              진단 계속하기 →
            </Link>
          </div>
        )}

        {showReport && (
          <>
            <div className="card gap-status">
              <div className="status-grid">
                <div className="status-col">
                  <span className="status-label">공식 합의</span>
                  <div className="status-value">미확정</div>
                </div>
                <div className="status-col">
                  <span className="status-label">버전 기록</span>
                  <div className="status-value">없음</div>
                </div>
                <div className="status-col">
                  <span className="status-label">합의 조항</span>
                  <div className="status-value muted">생성되지 않음</div>
                </div>
              </div>
              <div className="status-note">
                <span className="pulse-dot" />
                <span>현재 팀 기준은 문서로 고정되지 않았습니다. 아래의 격차를 먼저 확인하세요.</span>
              </div>
            </div>

            <div className="card gap-insight-card">
              <div className="insight-header">
                <h2>팀 인사이트 요약</h2>
              </div>
              <div className="gap-insight-summary">
              <div className="insight-gauge">
                <div className="gauge-shell">
                  <div className="gauge-fill" style={{ "--fill": `${alignmentScore}` } as CSSProperties} />
                  <div className="gauge-core">
                    <div className="gauge-value">{alignmentScore}%</div>
                    <div className="gauge-label">Alignment Score</div>
                  </div>
                </div>
                <div className={`score-pill ${teamInsight.gapScore.toLowerCase()}`}>
                  {teamInsight.gapScore === "CRITICAL" && "위험 단계: 즉시 조율 필요"}
                  {teamInsight.gapScore === "HIGH" && "주의 단계: 조율 필요"}
                  {teamInsight.gapScore === "MID" && "점검 단계: 조율 필요"}
                  {teamInsight.gapScore === "LOW" && "안정 단계: 양호"}
                </div>
              </div>
              <div className="insight-copy">
                <div className="insight-tag">AI ANALYSIS SUMMARY</div>
                <p className="insight-text">{teamInsight.text}</p>
                <div style={{ marginTop: "24px", display: "flex", flexDirection: "column", gap: "12px" }}>
                  {/* Row 1: Number Stats */}
                  <div className="insight-stats-grid">
                    <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "16px", display: "flex", flexDirection: "column", gap: "4px" }}>
                      <span style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: "600" }}>총 차이 항목</span>
                      <div style={{ fontSize: "1.5rem", fontWeight: "800", color: "#0f172a" }}>{teamInsight.diffCount ?? 0}<span style={{ fontSize: "1rem", fontWeight: "600", color: "#94a3b8", marginLeft: "4px" }}>개</span></div>
                    </div>
                    <div style={{ background: "rgba(239, 68, 68, 0.05)", border: "1px solid rgba(239, 68, 68, 0.15)", borderRadius: "12px", padding: "16px", display: "flex", flexDirection: "column", gap: "4px" }}>
                      <span style={{ fontSize: "0.85rem", color: "#ef4444", fontWeight: "600" }}>고위험 충돌 (High Risk)</span>
                      <div style={{ fontSize: "1.5rem", fontWeight: "800", color: "#ef4444" }}>{teamInsight.highRiskCount ?? 0}<span style={{ fontSize: "1rem", fontWeight: "600", color: "rgba(239,68,68,0.5)", marginLeft: "4px" }}>개</span></div>
                    </div>
                  </div>

                  {/* Row 2: Priority Items */}
                  <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                      <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", background: "#f59e0b" }}></span>
                      <span style={{ fontSize: "0.9rem", color: "#334155", fontWeight: "700" }}>최우선 조율 권장 항목</span>
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                      {teamInsight.topPriorityLabels ? teamInsight.topPriorityLabels.split(",").map((label, idx) => (
                        <span key={idx} style={{ background: "#fef3c7", color: "#d97706", padding: "6px 12px", borderRadius: "8px", fontSize: "0.85rem", fontWeight: "600" }}>
                          {label.trim()}
                        </span>
                      )) : <span style={{ color: "#94a3b8", fontSize: "0.85rem" }}>없음</span>}
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: "16px", background: "linear-gradient(to right, rgba(99, 102, 241, 0.08), transparent)", borderLeft: "3px solid #6366f1", padding: "16px 20px", borderRadius: "0 12px 12px 0", display: "flex", alignItems: "flex-start", gap: "12px" }}>
                  <span style={{ fontSize: "1.1rem" }}>💡</span>
                  <p style={{ margin: 0, fontSize: "0.9rem", color: "#334155", lineHeight: "1.5" }}>
                    <strong>전문가의 팁:</strong> 위에서 도출된 <span style={{ color: "#6366f1", fontWeight: "600" }}>최우선 조율 항목</span>부터 먼저 대화의 안건으로 삼아보세요. 갈등의 골이 깊어지기 전에 룰을 정하는 것이 가장 안전합니다.
                  </p>
                </div>
              </div>
              </div>
            </div>

            <div className="card gap-heatmap-card">
              <div className="heatmap-header">
                <div className="heatmap-title-row">
                  <h2 className="heatmap-title">
                    영역별 상세 데이터 시각화 <span className="heatmap-subtitle">(Heatmap)</span>
                  </h2>
                  <div className="heatmap-legend">
                    <div className="legend-item"><span className="legend-dot alignment"></span> 일치</div>
                    <div className="legend-item"><span className="legend-dot" style={{background:"#fdba74"}}></span> 차이</div>
                    <div className="legend-item"><span className="legend-dot conflict"></span> 충돌</div>
                  </div>
                </div>
                <div className="heatmap-instruction">
                  <span className="instruction-icon">💡</span> 히트맵의 갈등 영역(보라색)을 <strong>클릭</strong>하면 실제 응답 차이와 상세 분석을 확인할 수 있습니다.
                </div>
              </div>

              <div style={{ display: "flex", gap: "32px", alignItems: "flex-start", justifyContent: showAdvancedHeatmap ? "flex-start" : "center" }}>
                {/* Basic Diagnosis Heatmap */}
                <div className="heatmap-grid">
                  {/* Header Row */}
                  <div className="hm-cell hm-col-header">
                    <div className="hm-en">권한 & 실행</div>
                    <div className="hm-kr">(Operations)</div>
                  </div>
                  <div className="hm-cell hm-col-header">
                    <div className="hm-en">책임</div>
                    <div className="hm-kr">(Responsibility)</div>
                  </div>
                  <div className="hm-cell hm-col-header">
                    <div className="hm-en">종료</div>
                    <div className="hm-kr">(Exit)</div>
                  </div>

                  {/* Row 1 */}
                  <button type="button" className={`hm-cell hm-item ${activeIssues[0].status}`} onClick={() => setSelectedIssue(activeIssues[0].id)}>Q1</button>
                  <button type="button" className={`hm-cell hm-item ${activeIssues[4].status}`} onClick={() => setSelectedIssue(activeIssues[4].id)}>Q5</button>
                  <button type="button" className={`hm-cell hm-item ${activeIssues[8].status}`} onClick={() => setSelectedIssue(activeIssues[8].id)}>Q9</button>

                  {/* Row 2 */}
                  <button type="button" className={`hm-cell hm-item ${activeIssues[1].status}`} onClick={() => setSelectedIssue(activeIssues[1].id)}>Q2</button>
                  <button type="button" className={`hm-cell hm-item ${activeIssues[5].status}`} onClick={() => setSelectedIssue(activeIssues[5].id)}>Q6</button>
                  <button type="button" className={`hm-cell hm-item ${activeIssues[9].status}`} onClick={() => setSelectedIssue(activeIssues[9].id)}>Q10</button>

                  {/* Row 3 */}
                  <button type="button" className={`hm-cell hm-item ${activeIssues[2].status}`} onClick={() => setSelectedIssue(activeIssues[2].id)}>Q3</button>
                  <button type="button" className={`hm-cell hm-item ${activeIssues[6].status}`} onClick={() => setSelectedIssue(activeIssues[6].id)}>Q7</button>
                  <button type="button" className={`hm-cell hm-item ${activeIssues[10].status}`} onClick={() => setSelectedIssue(activeIssues[10].id)}>Q11</button>

                  {/* Row 4 */}
                  <button type="button" className={`hm-cell hm-item ${activeIssues[3].status}`} onClick={() => setSelectedIssue(activeIssues[3].id)}>Q4</button>
                  <button type="button" className={`hm-cell hm-item ${activeIssues[7].status}`} onClick={() => setSelectedIssue(activeIssues[7].id)}>Q8</button>
                  <button type="button" className={`hm-cell hm-item ${activeIssues[11].status}`} onClick={() => setSelectedIssue(activeIssues[11].id)}>Q12</button>
                </div>

                {/* Advanced Diagnosis Heatmap */}
                {showAdvancedHeatmap ? (
                  <>
                    <div style={{ width: "1px", background: "#e2e8f0", alignSelf: "stretch", marginTop: "40px" }} />
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                        <span style={{ fontSize: "0.8rem", fontWeight: "700", color: "#6366f1", background: "rgba(99,102,241,0.08)", padding: "4px 10px", borderRadius: "999px", letterSpacing: "0.5px" }}>심화 진단</span>
                      </div>
                      <div className="heatmap-grid" style={{ gridTemplateColumns: "repeat(2, 120px)" }}>
                        <div className="hm-cell hm-col-header">
                          <div className="hm-en">비전/가치관</div>
                          <div className="hm-kr">(Vision)</div>
                        </div>
                        <div className="hm-cell hm-col-header">
                          <div className="hm-en">돈/보상</div>
                          <div className="hm-kr">(Money)</div>
                        </div>
                        <button type="button" className={`hm-cell hm-item ${activeIssues[12].status}`} onClick={() => setSelectedIssue(activeIssues[12].id)}>Q13</button>
                        <button type="button" className={`hm-cell hm-item ${activeIssues[16].status}`} onClick={() => setSelectedIssue(activeIssues[16].id)}>Q17</button>
                        <button type="button" className={`hm-cell hm-item ${activeIssues[13].status}`} onClick={() => setSelectedIssue(activeIssues[13].id)}>Q14</button>
                        <button type="button" className={`hm-cell hm-item ${activeIssues[17].status}`} onClick={() => setSelectedIssue(activeIssues[17].id)}>Q18</button>
                        <button type="button" className={`hm-cell hm-item ${activeIssues[14].status}`} onClick={() => setSelectedIssue(activeIssues[14].id)}>Q15</button>
                        <button type="button" className={`hm-cell hm-item ${activeIssues[18].status}`} onClick={() => setSelectedIssue(activeIssues[18].id)}>Q19</button>
                        <button type="button" className={`hm-cell hm-item ${activeIssues[15].status}`} onClick={() => setSelectedIssue(activeIssues[15].id)}>Q16</button>
                        <button type="button" className={`hm-cell hm-item ${activeIssues[19].status}`} onClick={() => setSelectedIssue(activeIssues[19].id)}>Q20</button>
                      </div>
                    </div>
                  </>
                ) : null}
              </div>

              {/* Help Box */}
              <div className="heatmap-help-box">
                <div className="help-title">
                  <span className="help-icon">❓</span> 어떻게 읽나요?
                </div>
                <ul className="help-list">
                  <li>1차 진단: <strong>권한 & 실행(Q1-Q4)</strong>, <strong>책임(Q5-Q8)</strong>, <strong>종료(Q9-Q12)</strong> / 심화 진단: <strong>비전/가치관(Q13-Q16)</strong>, <strong>돈/보상(Q17-Q20)</strong></li>
                  <li><strong style={{color:"#20c997"}}>초록색</strong>은 두 사람의 답이 일치, <strong style={{color:"#fdba74"}}>주황 연한색</strong>은 차이 있음, <strong style={{color:"#f97316"}}>주황 진한색</strong>은 충돌(즉각 조율 필요)입니다.</li>
                  <li>셀을 클릭하면 두 사람의 실제 응답과 상세 분석을 확인할 수 있습니다.</li>
                </ul>
              </div>

              <div className="heatmap-actions">
                <button type="button" className="btn hm-guide-btn" onClick={() => setShowSubscribe(true)}>
                  📄 히트맵 상세 분석 가이드 확인하기 <span className="arrow">→</span>
                </button>
              </div>

              <div className="heatmap-alert">
                <div className="alert-icon">🤖</div>
                <div className="alert-content">
                  <div className="alert-title">AI 생성 상세 리포트 준비됨</div>
                  <div className="alert-desc">운영 방식, 의사결정권, 투자 회수 영역에 대한 팀원의 인식 차이를 심층 분석한 12개 질문에 대한 텍스트 가이드를 확인할 수 있습니다.</div>
                </div>
              </div>
            </div>

            {/* Side-by-Side Wrapper for Desktop */}
            <style dangerouslySetInnerHTML={{__html: `
              .scenario-review-wrapper {
                display: flex;
                flex-direction: column;
                gap: 60px;
                width: 100%;
                margin: 60px 0;
              }
              @media (min-width: 900px) {
                .scenario-review-wrapper {
                  flex-direction: row;
                  align-items: flex-start;
                  justify-content: center;
                  gap: 40px;
                }
                .worst-case-scenario-section, .reviews-section.clean-reviews-section {
                  flex: 1;
                  max-width: 500px;
                  margin: 0;
                  padding: 0;
                }
              }
              .worst-case-scenario-section {
                display: flex;
                flex-direction: column;
                align-items: center;
                width: 100%;
              }
              .clean-reviews-section {
                display: flex;
                flex-direction: column;
                align-items: center;
                width: 100%;
              }
              .clean-reviews-grid {
                display: flex;
                flex-direction: column;
                gap: 20px;
                width: 100%;
              }
              .clean-review-card {
                background: #ffffff;
                border-radius: 16px;
                padding: 28px 32px;
                border: 1px solid #e5e7eb;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
                display: flex;
                flex-direction: column;
                text-align: left;
              }
              .clean-review-stars {
                color: #d4af37;
                font-size: 1.1rem;
                letter-spacing: 2px;
                margin-bottom: 16px;
              }
              .clean-review-text {
                font-size: 1rem;
                line-height: 1.6;
                color: #1f2937;
                font-weight: 400;
                margin-bottom: 24px;
                word-break: keep-all;
              }
              .clean-review-text strong {
                font-weight: 700;
                color: #111827;
              }
              .clean-review-author {
                font-size: 0.85rem;
                color: #6b7280;
              }
            `}} />
            <div className="scenario-review-wrapper">
              {/* Worst Case Scenario Teaser */}
              <div className="worst-case-scenario-section">
                <div className="teaser-header">
                  <h2>발생할 수 있는 최악의 시나리오</h2>
                  <p>기준 없이 구두로만 합의된 동업은 결국 이런 결과를 맞이합니다.</p>
                </div>
                <img src="/comic_ip_new.jpg" alt="최악의 시나리오 만화" className="scenario-comic-img" style={{ width: "100%", display: "block" }} />
              </div>

              {/* Clean White Cards Reviews Section */}
              <div className="reviews-section clean-reviews-section">
              <div className="teaser-header">
                <h2 style={{ color: "#000" }}>REVIEWS</h2>
                <p>이미 수많은 초기 창업팀이 CoSync로 빈틈없는 합의를 마쳤습니다.</p>
              </div>
              
              <div className="clean-reviews-grid">
                <div className="clean-review-card">
                  <div className="clean-review-stars">★★★★★</div>
                  <p className="clean-review-text">
                    “전에는 기능 우선순위 하나에도 2~3시간씩 끝장토론을 했지만, <strong>결정 기준과 최종 책임자를 정한 뒤에는 비슷한 안건도 1시간 이내에 결론</strong>을 낼 수 있었습니다. 실행 속도가 확연히 달라졌어요.”
                  </p>
                  <div className="clean-review-author">초기 스타트업 CEO · 31세</div>
                </div>

                <div className="clean-review-card">
                  <div className="clean-review-stars">★★★★★</div>
                  <p className="clean-review-text">
                    “친한 선배라 돈이나 지분 문제를 먼저 꺼내기 어려웠는데, <strong>객관적인 데이터로 대화의 물꼬를 트니 감정 상할 일 없이</strong> 운영 기준을 문서화할 수 있었습니다. 진짜 꼭 필요했던 서비스예요.”
                  </p>
                  <div className="clean-review-author">기창업(2y) 공동창업 준비 중 · 23세</div>
                </div>

                <div className="clean-review-card">
                  <div className="clean-review-stars">★★★★★</div>
                  <p className="clean-review-text">
                    “대화는 많이 했지만 늘 겉도는 느낌이었어요. CoSync로 진단해보니 <strong>우리가 어떤 부분에서 동상이몽을 하고 있었는지</strong> 한눈에 보였습니다. 덕분에 갈등 없이 안전한 지분 구조를 합의했어요.”
                  </p>
                  <div className="clean-review-author">초기 스타트업 공동창업자 · 29세</div>
                </div>
              </div>
            </div>
            </div>

            <div className="premium-cards-section">
              <div className="teaser-header">
                <div className="legal-badge" style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "linear-gradient(to right, rgba(139, 92, 246, 0.1), rgba(139, 92, 246, 0.05))", border: "1px solid rgba(139, 92, 246, 0.2)", color: "#a78bfa", padding: "8px 18px", borderRadius: "999px", fontSize: "0.85rem", fontWeight: "600", marginBottom: "20px", boxShadow: "0 4px 12px rgba(139, 92, 246, 0.05)" }}>
                  <span style={{ fontSize: "1rem" }}>⚖️</span> 주주간계약 자문 변호사 MOU 체결 & 법률 검토 완료
                </div>
                <h2>프리미엄 팀 합의 솔루션</h2>
                <p>주주간계약 전 반드시 필요한 맞춤형 운영 및 권리관계 합의서를 완성하세요.</p>
              </div>
              
              <div className="premium-card-list">
                {/* Card 1 */}
                <div className="premium-item-card">
                  <div className="card-header" style={{ marginBottom: "12px" }}>
                    <h3 className="card-emoji-title">🚨 변호사가 경고하는 치명적 법적 리스크</h3>
                    <p className="clear-text">현재 팀의 가장 위험한 잠재 분쟁 1위는 <strong>[{teamInsight.topPriorityIssuesArray?.[0]?.label ?? "지분/권한 충돌"}]</strong> 입니다.</p>
                  </div>
                  <div className="clear-preview" style={{ marginBottom: "8px" }}>
                    <p style={{ fontSize: "0.95rem", color: "#334155", lineHeight: "1.6" }}>
                      이 안건을 문서화하지 않을 경우, 공동창업자 이탈 시 지분 회수가 불가능해져 <strong>후속 투자가 전면 무산</strong>될 수 있습니다.
                    </p>
                  </div>
                  <div className="card-blur-area" style={{ marginTop: "8px" }}>
                    <p>법정 분쟁 시 평균 1년 이상의 시간과 막대한 소송 비용이 발생합니다.</p>
                    <ul style={{ listStyleType: "disc", paddingLeft: "20px", marginBottom: "12px", color: "var(--muted)" }}>
                      <li>주의 안건: {teamInsight.topPriorityIssuesArray?.[1]?.label ?? "이탈 업무 인수인계"}</li>
                      <li>주의 안건: {teamInsight.topPriorityIssuesArray?.[2]?.label ?? "퍼포먼스 한계 조치"}</li>
                      <li>주의 안건: {teamInsight.topPriorityIssuesArray?.[3]?.label ?? "의사결정 교착상태 해결"}</li>
                      <li>주의 안건: {teamInsight.topPriorityIssuesArray?.[4]?.label ?? "비밀유지 및 겸업금지 위반"}</li>
                    </ul>
                    <p>데이터에 따르면 초기 합의를 문서화하지 않은 팀의 60%가 1년 내에 이탈 및 지분 분쟁을 겪습니다.</p>
                    <div className="card-unlock-overlay">
                      <button className="btn btn-primary unlock-btn" onClick={() => router.push("/agreement/preview")}>
                        <span className="lock-icon" style={{ fontSize: "16px", marginBottom: "0", marginRight: "6px", display: "inline-block" }}>🔒</span> 우리 팀 맞춤 합의서 완성하기
                      </button>
                    </div>
                  </div>
                </div>

                {/* Card 3 */}
                <div className="premium-item-card">
                  <div className="card-header" style={{ marginBottom: "12px" }}>
                    <h3 className="card-emoji-title">💬 감정 소모 없는 1:1 합의 질문 셋</h3>
                    <p className="clear-text">돈과 권한 문제, 친할수록 꺼내기 어렵습니다. 지금 바로 공유할 수 있는 객관적인 질문:</p>
                  </div>
                  <div className="clear-preview">
                    <div className="chat-bubble" style={{ borderLeft: "3px solid #6366f1", fontWeight: "500" }}>
                      Q. "[{teamInsight.topPriorityIssuesArray?.[0]?.label ?? "핵심 안건"}]에 대한 명확한 기준 부재로 특정 팀원의 업무 기여도가 현저히 떨어졌을 때, 이를 입증하고 지분이나 권한을 재조정할 수 있는 객관적인 합의 문서가 존재하나요?"
                    </div>
                  </div>
                  <div className="card-blur-area" style={{ marginTop: "4px" }}>
                    <div className="chat-bubble">Q. "[{teamInsight.topPriorityIssuesArray?.[1]?.label ?? "업무 몰입 시간"}]에 관한 약정 미이행 시, 해당 팀원의 남은 지분 베스팅(Vesting)을 중단하고 기부여 지분을 회수할 객관적 기준이 존재하나요?"</div>
                    <div className="chat-bubble">Q. "특정 이사가 [{teamInsight.topPriorityIssuesArray?.[2]?.label ?? "투자 회수"}]와 관련해 회사의 이익에 반하는 결정을 내릴 경우, 소수 지분권자가 이를 견제할 수 있는 권리 보호 장치가 있나요?"</div>
                    <div className="chat-bubble">Q. "개인 사정으로 3개월 이상 정상적인 직무 수행이 불가능해질 경우, 해당 팀원의 기존 지분율과 급여 지급 기준은 어떻게 조정되나요?"</div>
                    <div className="chat-bubble">Q. "투자 유치 시 기존 주주들의 지분 희석을 방어하기 위한 우선매수권(Right of First Refusal) 및 동반매도요구권(Drag-along) 조항이 팀원 간 합의되어 있나요?"</div>
                    <div className="card-unlock-overlay">
                      <button className="btn btn-primary unlock-btn" onClick={() => router.push("/agreement/preview")}>
                        <span className="lock-icon" style={{ fontSize: "16px", marginBottom: "0", marginRight: "6px", display: "inline-block" }}>🔒</span> 우리 팀 맞춤 합의서 완성하기
                      </button>
                    </div>
                  </div>
                </div>

                {/* Card 4 */}
                <div className="premium-item-card">
                  <div className="card-header" style={{ marginBottom: "12px" }}>
                    <h3 className="card-emoji-title">🧭 시장 표준(Market Standard) 기반 합의 가이드</h3>
                    <p className="clear-text">성공한 스타트업들이 채택한 가장 안전하고 검증된 운영 기준은...</p>
                  </div>
                  <div className="clear-preview">
                    <div className="option-box" style={{ borderColor: "#cbd5e1", background: "#f1f5f9" }}>
                      <h4 style={{ color: "#0f172a", fontWeight: "700" }}>옵션 A: {teamInsight.topPriorityIssuesArray?.[0]?.label ?? "주요 안건"}에 대한 명시적 기준 설정 (전문가 추천 ⭐)</h4>
                      <p style={{ color: "#475569", fontSize: "0.9rem" }}>사유: 성공하는 스타트업은 가장 갈등 확률이 높은 위 안건에 대해 온정주의적 접근을 버리고, 초기부터 명확한 페널티와 시장 표준을 적용하여 회사의 존립을 보호합니다.</p>
                    </div>
                  </div>
                  <div className="card-blur-area" style={{ marginTop: "12px" }}>
                    <div className="option-box">
                      <h4>옵션 B: 베스팅(Vesting) 조건부 순차적 회수</h4>
                      <p>사유: 기여 기간에 비례하여 지분을 확정하되, 이탈 시 남은 지분은 액면가로 강제 회수하는 조항을 포함해야 합니다.</p>
                    </div>
                    <div className="option-box">
                      <h4>옵션 C: 동반매도요구권(Drag-Along) 포함</h4>
                      <p>사유: 추후 M&A나 매각 시 소수 지분권자가 반대하더라도 강제로 함께 매각할 수 있는 권리를 두어 엑싯을 보장해야 합니다.</p>
                    </div>
                    <div className="option-box">
                      <h4>옵션 D: 이사회 중심의 만장일치 의결</h4>
                      <p>사유: 가장 안전해 보이지만 실제로는 교착 상태를 유발할 위험이 커 시장에서는 절대 권장하지 않는 방식입니다.</p>
                    </div>
                    <div className="card-unlock-overlay">
                      <button className="btn btn-primary unlock-btn" onClick={() => router.push("/agreement/preview")}>
                        <span className="lock-icon" style={{ fontSize: "16px", marginBottom: "0", marginRight: "6px", display: "inline-block" }}>🔒</span> 우리 팀 맞춤 합의서 완성하기
                      </button>
                    </div>
                  </div>
                </div>

                {/* Card 5 */}
                <div className="premium-item-card">
                  <div className="card-header" style={{ marginBottom: "12px" }}>
                    <h3 className="card-emoji-title">📄 주주간계약 전 필수 합의 문서 생성 및 버전 관리</h3>
                    <p className="clear-text">막연했던 대화를 명확한 운영규칙과 권리관계 합의 문서로. 팀의 성장에 맞춰 지속적으로 업데이트하세요:</p>
                  </div>
                  <div className="clear-preview doc-style-area">
                    <p style={{ fontFamily: "monospace", fontSize: "0.95rem", background: "#f8fafc", padding: "12px", borderLeft: "3px solid #6366f1", borderRadius: "6px", color: "#334155" }}>
                      <strong>제 4조 ({teamInsight.topPriorityIssuesArray?.[0]?.label ?? "핵심 안건"}의 처리)</strong><br/> 위 조항과 관련하여 창업 멤버 간의 중대한 이견이나 성과 미달이 발생할 시, 본 합의서는 다음 기준에 따라 조율한다...
                    </p>
                  </div>
                  <div className="card-blur-area doc-style-area" style={{ marginTop: "12px" }}>
                    <p><strong>제 5조 ({teamInsight.topPriorityIssuesArray?.[1]?.label ?? "후속 조치"})</strong> 발생한 문제에 대하여 시장 표준에 따라 대표이사가 선제적으로...</p>
                    <p><strong>제 6조 (주식 매수 선택권 및 부여 기준)</strong> 인재 영입을 위한 스톡옵션 풀(Pool)은 총 발행 주식의 10% 범위 내에서...</p>
                    <p><strong>제 7조 (영업비밀 유지 의무)</strong> 본 합의서 체결 이후 지득한 회사의 기술, 재무, 인적 자원 등 일체의 정보는...</p>
                    <p><strong>제 8조 (경업 금지 의무)</strong> 퇴사 후 최소 2년간 회사가 영위하는 동종 업종의 창업 및 취업을...</p>
                    <p style={{ marginTop: "12px", borderTop: "1px dashed var(--border)", paddingTop: "12px", color: "var(--primary)" }}><strong>🔄 버전 1.0 생성됨 (변경 이력 추적 중)</strong></p>
                    <div className="card-unlock-overlay">
                      <button className="btn btn-primary unlock-btn" onClick={() => router.push("/agreement/preview")}>
                        <span className="lock-icon" style={{ fontSize: "16px", marginBottom: "0", marginRight: "6px", display: "inline-block" }}>🔒</span> 우리 팀 맞춤 합의서 완성하기
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </section>

      <Footer />

      {showSubscribe && (
        <div className="subscribe-backdrop" role="dialog" aria-modal="true">
          <div className="subscribe-card">
            <button
              className="close"
              type="button"
              onClick={() => setShowSubscribe(false)}
              aria-label="닫기"
            >
              ✕
            </button>
            <h3>프리미엄 플로우로 합의를 완성하세요</h3>
            <p>
              계약서 생성, 버전 히스토리, 합의 확정까지 이어지는 프리미엄
              워크플로우가 곧 제공됩니다.
            </p>
            <div className="preview-slider">
              <Swiper
                modules={[Autoplay, Pagination, Keyboard]}
                autoplay={{ delay: 2400, disableOnInteraction: false }}
                pagination={{ clickable: true }}
                keyboard={{ enabled: true }}
                loop
                spaceBetween={16}
              >
                {slides.map((slide) => (
                  <SwiperSlide key={slide.title}>
                    <div className="slide-frame">
                      <img src={slide.src} alt={slide.title} />
                    </div>
                    <div className="slider-caption">{slide.title}</div>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
            <div className="subscribe-actions">
              <button
                className="btn btn-ghost"
                type="button"
                onClick={() => setShowSubscribe(false)}
              >
                나중에
              </button>
              <button className="btn btn-primary" type="button">
                구독 시작하기 →
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedIssue && (showAdvancedHeatmap || ["q1","q2","q3","q4","q5","q6","q7","q8","q9","q10","q11","q12"].includes(selectedIssue)) && (() => {
        const activeIssue = activeIssues.find((issue) => issue.id === selectedIssue);
        if (!activeIssue) return null;
        return (
          <div className="modal-backdrop" role="dialog" aria-modal="true">
            <div className="modal-card">
              <div className="modal-top">
                <span className={`pill ${activeIssue.status}`}>
                  {activeIssue.status === "conflict" ? "고위험 충돌"
                    : activeIssue.status === "diff" ? "조율 필요"
                    : activeIssue.status === "unanswered" ? "판단 불가"
                    : "일치"}
                </span>
                <button className="close" type="button" onClick={() => setSelectedIssue(null)}>
                  ✕
                </button>
              </div>
              <h2>{activeIssue.label}</h2>
              {viewMode === "team" ? (
                <div className="modal-grid" style={{ gridTemplateColumns: `repeat(${Math.min(members.length, 3)}, 1fr)` }}>
                  {(activeIssue as typeof teamIssues[number]).memberValues.map((mv) => (
                    <div key={mv.name} className="modal-user">
                      <div className="user-head">
                        <div className="avatar">{mv.name?.[0] ?? "?"}</div>
                        <div className="user-name">{mv.name}</div>
                      </div>
                      <div className="quote">{mv.value}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="modal-grid">
                  <div className="modal-user">
                    <div className="user-head">
                      <div className="avatar">{selectedPair?.a.name?.[0] ?? "?"}</div>
                      <div className="user-name">{selectedPair?.a.name}</div>
                    </div>
                    <div className="quote">{activeIssue.leftValue}</div>
                  </div>
                  <div className="modal-user">
                    <div className="user-head">
                      <div className="avatar">{selectedPair?.b.name?.[0] ?? "?"}</div>
                      <div className="user-name">{selectedPair?.b.name}</div>
                    </div>
                    <div className="quote">{activeIssue.rightValue}</div>
                  </div>
                </div>
              )}
              <div className="insight">
                <span className="spark">✦</span>
                <div>
                  <div className="insight-title">GAP INSIGHT</div>
                  <p>{activeIssue.insight}</p>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-ghost" type="button" onClick={() => setSelectedIssue(null)}>
                  닫기
                </button>
                <button
                  className="btn btn-primary"
                  type="button"
                  onClick={() => {
                    setSelectedIssue(null);
                    setShowSubscribe(true);
                  }}
                >
                  상세 리스크 및 합의 세션 시작하기 →
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </main>
  );
}
