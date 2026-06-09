"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { TopNav } from "../../../components/TopNav";
import { useAppState } from "../../../components/AppState";
import { Footer } from "../../../components/Footer";
import { useAuth } from "../../../components/AuthContext";
import { useUserProfile } from "../../../components/useUserProfile";
import { collection, doc, getDocs, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { computeGapSummary } from "../../../lib/gap";
import { computeTeamProgress } from "../../../lib/teamProgress";
import { useRouter } from "next/navigation";



type SingleQuestion = {
  id: string;
  label: string;
  type: "single";
  scenario?: string;
  options: string[];
  value: string;
  onSelect: (value: string) => void;
  autoNext?: boolean;
};

type ProfileQuestion = {
  id: "profile";
  label: string;
  type: "profile";
};

type Question = SingleQuestion | ProfileQuestion;

const isSingleQuestion = (question: Question): question is SingleQuestion =>
  question.type === "single";

export default function OnboardingDiagnosisPage() {
  const {
    decisionStructure,
    setDecisionStructure,
    decisionFailure,
    setDecisionFailure,
    actionVsConsensus,
    setActionVsConsensus,
    deadlockTolerance,
    setDeadlockTolerance,
    extraWorkPrinciple,
    setExtraWorkPrinciple,
    extraWorkPriority,
    setExtraWorkPriority,
    underperformanceAction,
    setUnderperformanceAction,
    workstyleConstraint,
    setWorkstyleConstraint,
    handoverMethod,
    setHandoverMethod,
    exitRecoveryPriority,
    setExitRecoveryPriority,
    exitCleanupTiming,
    setExitCleanupTiming,
    exitDisputeResolution,
    setExitDisputeResolution,
    exitVision,
    setExitVision,
    pivotCriteria,
    setPivotCriteria,
    conflictResolution,
    setConflictResolution,
    dealbreaker,
    setDealbreaker,
    salaryStructure,
    setSalaryStructure,
    equityStructure,
    setEquityStructure,
    profitDistribution,
    setProfitDistribution,
    growthStrategy,
    setGrowthStrategy,
    department,
    setDepartment,
    role,
    setRole,
    progress
  } = useAppState();
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const router = useRouter();

  const roleOptions: Record<string, string[]> = {
    "경영/대표": ["CEO", "공동대표", "COO"],
    "제품/기획": ["CPO", "PO", "PM", "서비스 기획"],
    "기술/개발": ["CTO", "프론트엔드", "백엔드", "모바일", "DevOps", "데이터"],
    "디자인": ["CDO", "프로덕트 디자인", "UX/UI 디자인", "브랜드 디자인"],
    "비즈니스": ["사업개발", "세일즈", "CS", "제휴/파트너십"],
    "마케팅": ["CMO", "퍼포먼스 마케팅", "콘텐츠 마케팅", "PR/커뮤니케이션"],
    "운영/지원": ["운영 총괄", "HR/조직문화", "재무/회계", "총무/법무"]
  };
  const rolesForDepartment = roleOptions[department] ?? ["CEO", "CPO", "CTO", "COO", "CDO"];

  const categories: Array<{
    id: string;
    title: string;
    scenario: string;
    questions: Question[];
  }> = [
    {
      id: "decision",
      title: "권한 & 실행",
      scenario: "",
      questions: [
        {
          id: "decisionStructure",
          label: "",
          type: "single",
          scenario: "온보딩 첫 화면 전환율이 낮아서 플로우를 바꾸면 될 것 같습니다. 아직 공동창업자와 이야기하지 않았는데, 보통 나는 어떻게 행동하나요?",
          options: [
            "1. 내 담당 영역이라면 바로 수정하고 결과를 공유한다",
            "2. 간단히 알림만 보내고 바로 진행한다",
            "3. 먼저 의견을 물어보고 방향을 맞춘 뒤 진행한다",
            "4. 함께 검토할 시간을 잡고 결정한다"
          ],
          value: decisionStructure,
          onSelect: setDecisionStructure,
          autoNext: true
        },
        {
          id: "decisionFailure",
          label: "",
          type: "single",
          scenario: "이번 달 B2B 영업 결과가 계약 0건입니다. 다음 달 방향을 결정해야 하는데, 보통 나는 어떻게 행동하나요?",
          options: [
            "1. 결과가 말해주고 있으니 당장 전략을 바꾼다",
            "2. 원인을 분석하고 공동창업자와 방향을 논의한다",
            "3. 데이터를 더 모아보고 한 달 뒤에 판단한다",
            "4. 현재 전략은 맞다고 보고 영업 방식 일부만 수정한다"
          ],
          value: decisionFailure,
          onSelect: setDecisionFailure,
          autoNext: true
        },
        {
          id: "actionVsConsensus",
          label: "",
          type: "single",
          scenario: "마케팅 예산 300만원을 인스타그램 광고에 쓰기로 결정됐습니다. 나는 반대 의견을 냈지만 실행이 이미 진행된 지금, 보통 나는 어떻게 행동하나요?",
          options: [
            "1. 결정된 이상 내 역할에서 최선을 다해 지원한다",
            "2. 결과가 나오기 전까지 재검토를 계속 요청한다",
            "3. 실행에는 참여하지만 이견은 기록해둔다",
            "4. 더 이상 언급하지 않고 결과를 지켜본다"
          ],
          value: actionVsConsensus,
          onSelect: setActionVsConsensus,
          autoNext: true
        },
        {
          id: "deadlockTolerance",
          label: "",
          type: "single",
          scenario: "경쟁사가 유사 기능을 먼저 출시했습니다. 일부를 단순화하면 1주 내 출시가 가능하고, 2주 더 다듬으면 완성도가 높아집니다. 보통 나는 어떻게 행동하나요?",
          options: [
            "1. 지금 당장 단순화해서 내보낸다 — 속도가 먼저다",
            "2. 2주를 더 다듬어 제대로 된 버전을 출시한다 — 완성도가 먼저다",
            "3. 공동창업자와 논의해서 기준을 정한다",
            "4. 핵심 기능만 추려 중간 타협점을 찾는다"
          ],
          value: deadlockTolerance,
          onSelect: setDeadlockTolerance,
          autoNext: true
        }
      ]
    },
    {
      id: "role",
      title: "책임",
      scenario: "",
      questions: [
        {
          id: "extraWorkPriority",
          label: "",
          type: "single",
          scenario: "베타 출시 이후 고객 문의가 하루 5~10건 정도 발생하고 있습니다. CS를 전담하는 역할은 따로 정해져 있지 않은 상태인데, 보통 나는 어떻게 하나요?",
          options: [
            "1. 우선 내가 일부라도 직접 처리하면서 상황을 파악한다",
            "2. 공동창업자와 함께 담당자를 정하고 역할을 나눈다",
            "3. 현재 업무 우선순위를 유지하고 당장은 별도 대응하지 않는다",
            "4. 반복 패턴을 보고 난 뒤 구조적으로 해결한다 (채용 포함)"
          ],
          value: extraWorkPriority,
          onSelect: setExtraWorkPriority,
          autoNext: true
        },
        {
          id: "extraWorkPrinciple",
          label: "",
          type: "single",
          scenario: "금요일 저녁 10시, 공동창업자에게서 카카오톡이 왔습니다. '내일 오전 투자자 미팅 전에 IR 덱 같이 30분만 검토하자.' 나는 어떻게 생각하나요?",
          options: [
            "1. 당연히 해야지 — 초기엔 이런 게 기본이다",
            "2. 하겠지만 이런 요청은 미리 알려줬으면 좋겠다",
            "3. 중요한 일이지만 개인 시간은 지켜져야 한다",
            "4. 업무 시간 외 요청은 원칙적으로 다음 날 처리한다"
          ],
          value: extraWorkPrinciple,
          onSelect: setExtraWorkPrinciple,
          autoNext: true
        },
        {
          id: "underperformanceAction",
          label: "",
          type: "single",
          scenario: "공동창업자가 맡은 개발 일정이 3개월째 반복적으로 밀리고 있습니다. 매번 이유는 있지만 전체 릴리즈 일정에 영향이 누적되고 있는데, 나는 어떻게 해야 한다고 생각하나요?",
          options: [
            "1. 즉시 역할 조정이나 업무 대행을 검토한다",
            "2. 명확한 기준과 타임라인을 함께 정하고 이행을 확인한다",
            "3. 원인을 먼저 파악하고 도울 방법을 찾는다",
            "4. 현재 방식으로는 어렵다고 판단하고 구조 변경을 논의한다"
          ],
          value: underperformanceAction,
          onSelect: setUnderperformanceAction,
          autoNext: true
        },
        {
          id: "workstyleConstraint",
          label: "",
          type: "single",
          scenario: "긴급 의사결정이 필요한데, 한 명은 업무 중이고 다른 한 명은 2~3시간째 응답이 없습니다. 나는 어떤 방식이 맞다고 생각하나요?",
          options: [
            "1. 기다리지 않고 내가 판단해서 결정한다 — 속도가 중요하다",
            "2. 최대한 빨리 연락을 취하고 결정을 보류한다",
            "3. 이런 상황에 대한 규칙을 미리 만들어야 한다고 생각한다",
            "4. 공동 결정이 원칙이므로 연락이 닿을 때까지 기다린다"
          ],
          value: workstyleConstraint,
          onSelect: setWorkstyleConstraint,
          autoNext: true
        }
      ]
    },
    {
      id: "exit",
      title: "종료",
      scenario: "",
      questions: [
        {
          id: "handoverMethod",
          label: "",
          type: "single",
          scenario: "공동창업자가 한 달 후 팀을 떠나겠다고 했습니다. 그가 담당하던 고객 관리와 서버 운영이 문서화되지 않은 상태인데, 인수인계는 어떻게 진행하는 게 맞다고 생각하나요?",
          options: [
            "1. 이번 주부터 즉시 문서화와 인수인계를 시작한다",
            "2. 이탈 일정을 2주 연장하고 충분한 시간을 확보한다",
            "3. 핵심만 구두로 전달받고 나머지는 직접 파악한다",
            "4. 이탈 시점이 가까워지면 그때 정리한다"
          ],
          value: handoverMethod,
          onSelect: setHandoverMethod,
          autoNext: true
        },
        {
          id: "exitRecoveryPriority",
          label: "",
          type: "single",
          scenario: "이탈 예정 공동창업자가 GitHub, AWS, 고객 연락처, 법인 계좌 접근 권한을 모두 갖고 있습니다. 가장 먼저 조치해야 할 사항은 무엇이라고 생각하나요?",
          options: [
            "1. 핵심 시스템 접근 권한 회수 및 백업을 처리한다",
            "2. 주요 고객과의 관계 인수인계를 먼저 진행한다",
            "3. 운영 문서와 프로세스 정리를 우선한다",
            "4. 법인 계좌와 지분 관련 법적 처리를 먼저 진행한다"
          ],
          value: exitRecoveryPriority,
          onSelect: setExitRecoveryPriority,
          autoNext: true
        },
        {
          id: "exitCleanupTiming",
          label: "",
          type: "single",
          scenario: "공동창업자가 당일 퇴사를 통보했습니다. 아직 인수인계는 시작도 안 됐고, 모든 시스템 권한은 유지된 상태입니다. 계정과 권한은 언제 어떻게 조정하는 게 맞다고 생각하나요?",
          options: [
            "1. 통보 즉시 모든 권한을 차단한다",
            "2. 핵심 인수인계 완료 직후 단계적으로 차단한다",
            "3. 2~4주의 인수인계 기간 동안 순차적으로 처리한다",
            "4. 모든 절차가 합의되고 나서 마지막에 차단한다"
          ],
          value: exitCleanupTiming,
          onSelect: setExitCleanupTiming,
          autoNext: true
        },
        {
          id: "exitDisputeResolution",
          label: "",
          type: "single",
          scenario: "공동창업자가 1년을 함께한 뒤 이탈합니다. 처음 약속한 지분은 20%인데, 실제 기여도에 대한 평가가 서로 다릅니다. 이 상황에서 가장 우선해야 할 기준은 무엇이라고 생각하나요?",
          options: [
            "1. 처음 합의한 계약 내용을 그대로 이행한다",
            "2. 실제 기여도와 활동 기간을 기준으로 재산정한다",
            "3. 제3자(변호사, 투자자 등)의 도움을 받아 결정한다",
            "4. 서로 감정 없이 납득할 수 있는 선을 협의한다"
          ],
          value: exitDisputeResolution,
          onSelect: setExitDisputeResolution,
          autoNext: true
        }
      ]
    },
    {
      id: "vision",
      title: "비전/가치관",
      scenario: "",
      questions: [
        {
          id: "exitVision",
          label: "",
          type: "single",
          scenario: "창업을 시작한 지 2년이 지났고 제품이 시장에서 반응을 얻기 시작했습니다. 이 회사의 가장 이상적인 결말은 무엇이라고 생각하나요?",
          options: [
            "1. 빠르게 성장해 대기업에 인수된다 (M&A 엑싯)",
            "2. 상장(IPO)해서 더 큰 회사로 키운다",
            "3. 외부 투자 없이 수익성 있는 독립 회사로 오래 운영한다",
            "4. 아직 정해진 생각은 없다"
          ],
          value: exitVision,
          onSelect: setExitVision,
          autoNext: true
        },
        {
          id: "pivotCriteria",
          label: "",
          type: "single",
          scenario: "팀이 목표한 성과를 지속적으로 내지 못하고 있습니다. 중단 또는 방향 전환을 해야 한다고 판단하는 기준은 무엇인가요?",
          options: [
            "1. 자금이 부족해 더 이상 운영이 어려울 때",
            "2. 일정 기간 동안 시장 반응이 거의 없을 때",
            "3. 핵심 팀원이 이탈하거나 지속적으로 흔들릴 때",
            "4. 공동창업자 간 합의가 되지 않을 때"
          ],
          value: pivotCriteria,
          onSelect: setPivotCriteria,
          autoNext: true
        },
        {
          id: "conflictResolution",
          label: "",
          type: "single",
          scenario: "공동창업자 간 갈등이 생겼을 때 어떻게 해결하는 게 맞다고 생각하나요?",
          options: [
            "1. 당사자끼리 즉시 직접 대화로 해결한다",
            "2. 정해진 기준이나 룰에 따라 처리한다",
            "3. 냉각 기간을 두고 나서 이야기한다",
            "4. 외부 멘토나 제3자의 도움을 받는다"
          ],
          value: conflictResolution,
          onSelect: setConflictResolution,
          autoNext: true
        },
        {
          id: "dealbreaker",
          label: "",
          type: "single",
          scenario: "공동창업자에게 절대 용납할 수 없는 것은 무엇인가요?",
          options: [
            "1. 결정을 미루거나 느리게 움직이는 것",
            "2. 말한 것을 지키지 않는 것",
            "3. 결과 없이 이유만 대는 것",
            "4. 방향이 달라지고 있는데 맞추려 하지 않는 것"
          ],
          value: dealbreaker,
          onSelect: setDealbreaker,
          autoNext: true
        }
      ]
    },
    {
      id: "money",
      title: "돈/보상",
      scenario: "",
      questions: [
        {
          id: "salaryStructure",
          label: "",
          type: "single",
          scenario: "창업 초기 자금이 넉넉하지 않습니다. 공동창업자 간 급여는 어떻게 정하는 게 맞다고 생각하나요?",
          options: [
            "1. 역할과 기여도에 따라 처음부터 차등 지급한다",
            "2. 초기엔 동일하게 맞추고 이후 성과에 따라 조정한다",
            "3. 회사가 안정될 때까지 최소 수준으로 맞춘다",
            "4. 각자 시장 기준 연봉에 맞게 책정한다"
          ],
          value: salaryStructure,
          onSelect: setSalaryStructure,
          autoNext: true
        },
        {
          id: "equityStructure",
          label: "",
          type: "single",
          scenario: "공동창업자 지분 구조에 대해 어떻게 생각하나요?",
          options: [
            "1. 투자 유치를 위해 시장 관행에 맞는 구조를 유지하는 게 맞다",
            "2. 실제 기여도와 시간 투입이 달라지면 지분도 조정해야 한다",
            "3. 처음 합의한 지분은 어떤 상황에서도 계약대로 이행해야 한다",
            "4. 지분은 고정하되 스톡옵션이나 급여로 기여도 차이를 메운다"
          ],
          value: equityStructure,
          onSelect: setEquityStructure,
          autoNext: true
        },
        {
          id: "profitDistribution",
          label: "",
          type: "single",
          scenario: "회사에 의미 있는 수익이 발생하기 시작했습니다. 이 수익을 어떻게 처리하는 게 맞다고 생각하나요?",
          options: [
            "1. 전액 사업에 재투자한다 — 지금은 성장이 먼저다",
            "2. 일부는 재투자, 일부는 공동창업자 보상으로 배분한다",
            "3. 급여 인상이나 인센티브를 먼저 챙긴다",
            "4. 적립해두고 팀이 함께 결정할 때 쓴다"
          ],
          value: profitDistribution,
          onSelect: setProfitDistribution,
          autoNext: true
        },
        {
          id: "growthStrategy",
          label: "",
          type: "single",
          scenario: "회사를 성장시키는 방식에 대해 어떻게 생각하나요?",
          options: [
            "1. 외부 투자를 받아 빠르게 성장한다 — 지분 희석은 감수한다",
            "2. 수익으로 버티면서 최대한 지분을 지킨다",
            "3. 필요한 시점에 선택적으로 투자를 받는다",
            "4. 정부 지원금이나 대출 등 비희석 자금을 먼저 찾는다"
          ],
          value: growthStrategy,
          onSelect: setGrowthStrategy,
          autoNext: true
        }
      ]
    },
    {
      id: "profile",
      title: "부서/직책",
      scenario: "",
      questions: [
        {
          id: "profile",
          label: "마지막입니다. 본인의 부서와 직책을 정확히 선택해 주세요.",
          type: "profile"
        }
      ]
    }
  ];

  const [categoryIndex, setCategoryIndex] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [isAdvancing, setIsAdvancing] = useState(false);
  const [showAdvancedPrompt, setShowAdvancedPrompt] = useState(false);
  const [pendingSelection, setPendingSelection] = useState<{
    questionId: string;
    option: string;
  } | null>(null);
  const autoNextTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hoverUnlockTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentCategory = categories[categoryIndex];
  const currentQuestion = currentCategory.questions[questionIndex];
  const totalQuestions = categories.reduce((sum, category) => sum + category.questions.length, 0);
  const currentQuestionNumber =
    categories.slice(0, categoryIndex).reduce((sum, category) => sum + category.questions.length, 0) +
    questionIndex +
    1;
  const questionProgress = totalQuestions
    ? Math.round((currentQuestionNumber / totalQuestions) * 100)
    : 0;
  const scenarioImage = (() => {
    if (currentCategory.id === "decision") return { src: "/scenario/q1.png" };
    if (currentCategory.id === "role") return { src: "/scenario/q2.png" };
    if (currentCategory.id === "exit") return { src: "/scenario/q3.png" };
    if (currentCategory.id === "vision") return { src: "/scenario/q1.png" };
    if (currentCategory.id === "money") return { src: "/scenario/q3.png" };
    return null;
  })();
  const isFirstQuestion = categoryIndex === 0 && questionIndex === 0;

  useEffect(() => {
    return () => {
      if (autoNextTimeoutRef.current) {
        clearTimeout(autoNextTimeoutRef.current);
      }
      if (hoverUnlockTimeoutRef.current) {
        clearTimeout(hoverUnlockTimeoutRef.current);
      }
    };
  }, []);

  const toggleMulti = (list: string[], value: string, max?: number) => {
    if (list.includes(value)) {
      if (max === 1) return list;
      return list.filter((item) => item !== value);
    }
    if (max === 1) return [value];
    if (max && list.length >= max) return list;
    return [...list, value];
  };

  const canProceed = () => {
    switch (currentQuestion.id) {
      case "profile":
        return Boolean(department && role);
      default:
        return true;
    }
  };

  const goPrev = () => {
    if (categoryIndex === 0 && questionIndex === 0) return;
    if (questionIndex > 0) {
      setQuestionIndex((prev) => prev - 1);
      return;
    }
    setCategoryIndex((prev) => Math.max(0, prev - 1));
    const previousCategory = categories[Math.max(0, categoryIndex - 1)];
    setQuestionIndex(previousCategory.questions.length - 1);
  };

  const goNext = () => {
    const isLastQuestion = questionIndex === currentCategory.questions.length - 1;
    if (!isLastQuestion) {
      setQuestionIndex((prev) => prev + 1);
      return;
    }
    // 1차 진단(exit) 완료 시점 — 심화 진단 선택 모달 표시
    if (currentCategory.id === "exit") {
      setShowAdvancedPrompt(true);
      return;
    }
    const isLastCategory = categoryIndex === categories.length - 1;
    if (!isLastCategory) {
      setCategoryIndex((prev) => prev + 1);
      setQuestionIndex(0);
      return;
    }
  };

  const hasTeam = Boolean(profile?.teamIds?.length);

  const handleSaveAndProceed = async (destination: string) => {
    if (!user) { router.push("/login"); return; }
    const teamId = profile?.teamIds?.[0];
    const answers = {
      decisionStructure, decisionFailure, actionVsConsensus, deadlockTolerance,
      extraWorkPrinciple, extraWorkPriority, underperformanceAction, workstyleConstraint,
      handoverMethod, exitRecoveryPriority, exitCleanupTiming, exitDisputeResolution,
      exitVision, pivotCriteria, conflictResolution, dealbreaker,
      salaryStructure, equityStructure, profitDistribution, growthStrategy
    };
    if (teamId) {
      await setDoc(doc(db, "teams", teamId, "members", user.uid), {
        name: profile?.name || user.displayName || "팀원",
        role: role || "MEMBER",
        status: "active",
        progress,
        answers
      }, { merge: true });
      const membersSnapshot = await getDocs(collection(db, "teams", teamId, "members"));
      const memberDocs = membersSnapshot.docs.map((d) => d.data());
      const memberAnswers = memberDocs.map((data) => (data.answers ?? {}) as typeof answers);
      const { gapCount, gapScore } = computeGapSummary(memberAnswers);
      const teamProgress = computeTeamProgress(memberDocs);
      await updateDoc(doc(db, "teams", teamId), { progress: teamProgress, gapCount, gapScore });
    }
    router.push(destination);
  };

  const handleContinueAdvanced = () => {
    setShowAdvancedPrompt(false);
    const exitIndex = categories.findIndex((c) => c.id === "exit");
    setCategoryIndex(exitIndex + 1);
    setQuestionIndex(0);
  };

  const handleFinish = async () => {
    if (!user) {
      router.push("/login");
      return;
    }
    const teamId = profile?.teamIds?.[0];
    const answers = {
      decisionStructure,
      decisionFailure,
      actionVsConsensus,
      deadlockTolerance,
      extraWorkPrinciple,
      extraWorkPriority,
      underperformanceAction,
      workstyleConstraint,
      handoverMethod,
      exitRecoveryPriority,
      exitCleanupTiming,
      exitDisputeResolution,
      exitVision,
      pivotCriteria,
      conflictResolution,
      dealbreaker,
      salaryStructure,
      equityStructure,
      profitDistribution,
      growthStrategy
    };
    if (teamId) {
      await setDoc(
        doc(db, "teams", teamId, "members", user.uid),
        {
          name: profile?.name || user.displayName || "팀원",
          role: role || "MEMBER",
          status: "active",
          progress,
          answers
        },
        { merge: true }
      );
      const membersSnapshot = await getDocs(collection(db, "teams", teamId, "members"));
      const memberDocs = membersSnapshot.docs.map((doc) => doc.data());
      const memberAnswers = memberDocs.map((data) => (data.answers ?? {}) as typeof answers);
      const { gapCount, gapScore } = computeGapSummary(memberAnswers);
      const teamProgress = computeTeamProgress(memberDocs);
      await updateDoc(doc(db, "teams", teamId), {
        progress: teamProgress,
        gapCount,
        gapScore
      });
    }
    await updateDoc(doc(db, "users", user.uid), {
      department,
      role,
      updatedAt: serverTimestamp()
    });
    router.push("/workspace");
  };

  return (
    <main className="page diagnosis-page">
      <TopNav links={[{ label: "대시보드", href: "/workspace" }]} active="대시보드" />

      <section className="container diagnosis-wrap">
        <div className="diagnosis-card">
          <div className="diagnosis-header">
            <div className="diagnosis-header-top">
              <button
                className="diagnosis-back-button"
                type="button"
                onClick={goPrev}
                disabled={isFirstQuestion}
                aria-label="이전 질문으로 이동"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="M14.75 5.75 8.5 12l6.25 6.25"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                  />
                </svg>
              </button>
              <div className="diagnosis-header-copy">
                <h2>{currentCategory.title}</h2>
                <p>아래 시나리오를 읽고 질문에 답해주세요.</p>
              </div>
            </div>
            <div className="progress-wrap">
              <div className="progress-bar">
                <span style={{ width: `${questionProgress}%` }} />
              </div>
              <span className="progress-label">{questionProgress}%</span>
            </div>
          </div>

          <div className="diagnosis-body">
            {((isSingleQuestion(currentQuestion) && currentQuestion.scenario) || currentCategory.scenario) && (
              <div className="scenario-panel">
                {scenarioImage && (
                  <div className="scenario-media">
                    <img src={scenarioImage.src} alt={`${currentCategory.title} 시나리오`} />
                  </div>
                )}
                <div className="info-box">
                  <span className="scenario-tag">시나리오</span>
                  <p>{(isSingleQuestion(currentQuestion) && currentQuestion.scenario) || currentCategory.scenario}</p>
                </div>
              </div>
            )}
            <div className="diag-section">
              <div className="question-header">
                <span className="question-step">
                  Question {currentQuestionNumber} / {totalQuestions}
                </span>
                {currentQuestion.label && <h4>{currentQuestion.label}</h4>}
              </div>

              {isSingleQuestion(currentQuestion) && (
                <div className={`chip-grid ${isAdvancing ? "is-transitioning" : ""}`}>
                  {currentQuestion.options.map((option) => (
                    <button
                      key={option}
                      type="button"
                      className={`chip ${
                        currentQuestion.value === option ||
                        (pendingSelection?.questionId === currentQuestion.id &&
                          pendingSelection.option === option)
                          ? "active"
                          : ""
                      }`}
                      onClick={() => {
                        if (autoNextTimeoutRef.current) {
                          clearTimeout(autoNextTimeoutRef.current);
                        }
                        if (hoverUnlockTimeoutRef.current) {
                          clearTimeout(hoverUnlockTimeoutRef.current);
                        }

                        setIsAdvancing(true);
                        setPendingSelection({
                          questionId: currentQuestion.id,
                          option
                        });
                        currentQuestion.onSelect(option);

                        if (currentQuestion.autoNext) {
                          autoNextTimeoutRef.current = setTimeout(() => {
                            setPendingSelection(null);
                            goNext();
                            hoverUnlockTimeoutRef.current = setTimeout(() => {
                              setIsAdvancing(false);
                            }, 140);
                          }, 300);
                          return;
                        }

                        setIsAdvancing(false);
                      }}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}

              {currentQuestion.id === "profile" && (
                <div className="select-stack">
                  <select
                    className="chip-select"
                    value={department}
                    onChange={(event) => {
                      setDepartment(event.target.value);
                      setRole("");
                    }}
                  >
                    <option value="">부서 선택</option>
                    <option value="경영/대표">경영/대표</option>
                    <option value="제품/기획">제품/기획</option>
                    <option value="기술/개발">기술/개발</option>
                    <option value="디자인">디자인</option>
                    <option value="비즈니스">비즈니스</option>
                    <option value="마케팅">마케팅</option>
                    <option value="운영/지원">운영/지원</option>
                  </select>
                  <select
                    className="chip-select"
                    value={role}
                    onChange={(event) => setRole(event.target.value)}
                  >
                    <option value="">직책 선택</option>
                    {rolesForDepartment.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          <div className="diag-footer">
            {categoryIndex === categories.length - 1 &&
            questionIndex === currentCategory.questions.length - 1 && (
              <button
                className="btn btn-primary"
                type="button"
                onClick={handleFinish}
                disabled={!canProceed()}
              >
                완료 →
              </button>
            )}
          </div>
        </div>
      </section>
      <div className="diagnosis-footer-shell">
        <Footer />
      </div>

      {showAdvancedPrompt && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-card" style={{ maxWidth: "420px", textAlign: "center" }}>
            <div style={{ marginBottom: "8px" }}>
              <span style={{ display: "inline-block", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff", fontSize: "0.75rem", fontWeight: "700", padding: "4px 12px", borderRadius: "999px", letterSpacing: "1px" }}>
                1차 진단 완료
              </span>
            </div>
            <h2 style={{ fontSize: "1.3rem", fontWeight: "800", marginBottom: "12px" }}>기본 진단이 끝났습니다</h2>
            <p style={{ color: "#64748b", fontSize: "0.95rem", lineHeight: "1.6", marginBottom: "28px" }}>
              {hasTeam
                ? <>공동창업자와 결과를 비교하거나,<br /><strong style={{ color: "#0f172a" }}>비전·가치관·돈/보상</strong>까지 심화 진단을 마저 할 수 있습니다.</>
                : <>심화 진단을 계속하거나,<br /><strong style={{ color: "#0f172a" }}>지금 팀을 만들고 공동창업자를 초대</strong>해서<br />진단 결과를 함께 비교하세요.</>
              }
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <button
                className="btn btn-primary"
                type="button"
                onClick={handleContinueAdvanced}
                style={{ width: "100%", justifyContent: "center" }}
              >
                심화 진단 계속하기 (Q13~Q20) →
              </button>
              {hasTeam ? (
                <button
                  className="btn btn-ghost"
                  type="button"
                  onClick={() => handleSaveAndProceed("/gap-report")}
                  style={{ width: "100%", justifyContent: "center" }}
                >
                  결과 바로 확인하기
                </button>
              ) : (
                <button
                  className="btn btn-ghost"
                  type="button"
                  onClick={() => handleSaveAndProceed("/workspace/create")}
                  style={{ width: "100%", justifyContent: "center" }}
                >
                  팀 만들고 공동창업자 초대하기
                </button>
              )}
            </div>
            <p style={{ marginTop: "20px", fontSize: "0.8rem", color: "#94a3b8" }}>
              심화 진단은 나중에 언제든 이어서 완료할 수 있습니다.
            </p>
          </div>
        </div>
      )}
    </main>
  );
}
