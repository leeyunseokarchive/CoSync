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
import { ScenarioIllustration } from "../../../components/ScenarioIllustration";



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
          scenario: "온보딩 첫 화면 전환율이 낮아서 플로우를 바꾸면 될 것 같습니다. 아직 공동창업자와 이야기하지 않은 상황, 어떻게 할 것 같아요?",
          options: [
            "1. 내 영역이면 바로 수정하고 결과를 공유한다",
            "2. 간단히 알림만 보내고 바로 진행한다",
            "3. 먼저 의견을 맞추고 나서 진행한다",
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
          scenario: "이번 달 B2B 영업 결과가 계약 0건입니다. 다음 달 방향을 어떻게 잡을 것 같아요?",
          options: [
            "1. 결과가 말해주고 있으니 당장 전략을 바꾼다",
            "2. 원인을 분석하고 방향을 함께 논의한다",
            "3. 데이터를 더 모아보고 한 달 뒤에 판단한다",
            "4. 전략은 유지하고 영업 방식만 일부 수정한다"
          ],
          value: decisionFailure,
          onSelect: setDecisionFailure,
          autoNext: true
        },
        {
          id: "actionVsConsensus",
          label: "",
          type: "single",
          scenario: "마케팅 예산 300만원을 인스타그램 광고에 쓰기로 결정됐습니다. 반대 의견을 냈지만 실행이 이미 진행된 지금, 어떻게 할 것 같아요?",
          options: [
            "1. 결정된 이상 내 역할에서 최선을 다한다",
            "2. 결과 전까지 재검토를 계속 요청한다",
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
          scenario: "경쟁사가 유사 기능을 먼저 출시했습니다. 1주 내 단순화 출시 vs 2주 더 다듬어 완성도 출시, 어떻게 할 것 같아요?",
          options: [
            "1. 단순화해서 당장 내보낸다 — 속도 우선",
            "2. 2주 더 다듬어서 출시한다 — 완성도 우선",
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
          scenario: "베타 출시 이후 고객 문의가 하루 5~10건 발생하고 있습니다. CS 담당이 따로 정해지지 않은 상황, 어떻게 할 것 같아요?",
          options: [
            "1. 일단 내가 직접 처리하며 상황을 파악한다",
            "2. 담당자를 정하고 역할을 함께 나눈다",
            "3. 현재 우선순위를 유지한다 — 별도 대응 없이",
            "4. 패턴 확인 후 구조적으로 해결한다 (채용 포함)"
          ],
          value: extraWorkPriority,
          onSelect: setExtraWorkPriority,
          autoNext: true
        },
        {
          id: "extraWorkPrinciple",
          label: "",
          type: "single",
          scenario: "토요일 밤 12시, 공동창업자 카톡이 왔습니다. '내일 오전 투자자 미팅 전에 IR 덱 30분만 같이 봐줘.' 어떻게 할 것 같아요?",
          options: [
            "1. 당연히 해야지 — 초기엔 이런 게 기본이다",
            "2. 하겠지만 미리 알려줬으면 좋겠다",
            "3. 중요한 일이지만 개인 시간은 지켜져야 한다",
            "4. 업무 외 시간 요청은 원칙적으로 거절한다"
          ],
          value: extraWorkPrinciple,
          onSelect: setExtraWorkPrinciple,
          autoNext: true
        },
        {
          id: "underperformanceAction",
          label: "",
          type: "single",
          scenario: "공동창업자가 맡은 개발 일정이 이번 달도 밀렸습니다. 저번 달에 이어 두 번째인데, 매번 이유는 있어요. 어떻게 할 것 같아요?",
          options: [
            "1. 즉시 역할 조정이나 업무 대행을 검토한다",
            "2. 기준과 타임라인을 정하고 이행을 확인한다",
            "3. 원인을 먼저 파악하고 도울 방법을 찾는다",
            "4. 한계라고 판단하면 구조 변경을 논의한다"
          ],
          value: underperformanceAction,
          onSelect: setUnderperformanceAction,
          autoNext: true
        },
        {
          id: "workstyleConstraint",
          label: "",
          type: "single",
          scenario: "긴급 의사결정이 필요한데, 한 명은 업무 중이고 다른 한 명은 2~3시간째 응답이 없습니다. 이 상황, 어떻게 할 것 같아요?",
          options: [
            "1. 기다리지 않고 내가 결정한다 — 속도 우선",
            "2. 최대한 빨리 연락을 취하고 결정을 보류한다",
            "3. 이런 상황을 대비한 규칙이 미리 필요하다",
            "4. 공동 결정 원칙 — 연락될 때까지 기다린다"
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
          scenario: "공동창업자가 한 달 후 떠난다고 했습니다. 담당하던 고객 관리와 서버 운영, 문서화가 안 된 상태예요. 인수인계 어떻게 할 것 같아요?",
          options: [
            "1. 이번 주 즉시 문서화와 인수인계를 시작한다",
            "2. 이탈 일정 2주 연장해 충분한 시간을 확보한다",
            "3. 핵심은 구두로 받고 나머지는 직접 파악한다",
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
          scenario: "떠나는 공동창업자가 GitHub, AWS, 고객 연락처, 법인 계좌 권한을 모두 갖고 있어요. 가장 먼저 뭘 챙길 것 같아요?",
          options: [
            "1. 핵심 시스템 권한 회수와 백업을 처리한다",
            "2. 주요 고객 관계 인수인계를 먼저 챙긴다",
            "3. 운영 문서와 프로세스 정리를 우선한다",
            "4. 법인 계좌·지분 법적 처리를 먼저 한다"
          ],
          value: exitRecoveryPriority,
          onSelect: setExitRecoveryPriority,
          autoNext: true
        },
        {
          id: "exitCleanupTiming",
          label: "",
          type: "single",
          scenario: "공동창업자가 오늘 갑자기 퇴사를 통보했어요. 인수인계는 시작도 안 됐고 시스템 권한은 그대로예요. 계정과 권한, 어떻게 할 것 같아요?",
          options: [
            "1. 통보 즉시 모든 권한을 차단한다",
            "2. 핵심 인수인계 완료 직후 단계적으로 차단한다",
            "3. 2~4주 인수인계 기간에 순차적으로 처리한다",
            "4. 모든 절차 합의 후 마지막에 차단한다"
          ],
          value: exitCleanupTiming,
          onSelect: setExitCleanupTiming,
          autoNext: true
        },
        {
          id: "exitDisputeResolution",
          label: "",
          type: "single",
          scenario: "1년 함께한 공동창업자가 떠납니다. 약속한 지분은 20%인데, 실제 기여도 평가가 서로 달라요. 어떤 기준으로 정리할 것 같아요?",
          options: [
            "1. 처음 합의한 계약 내용을 그대로 이행한다",
            "2. 기여도와 활동 기간 기준으로 재산정한다",
            "3. 변호사 등 제3자의 도움을 받아 결정한다",
            "4. 서로 납득할 수 있는 선에서 협의한다"
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
          scenario: "'이 회사가 어디로 가야 하는가'라는 의문이 생기기 시작했어요. 지금 함께 만들고 있는 이 회사, 가장 이상적인 결말은 뭐라고 생각해요?",
          options: [
            "1. 빠르게 성장해 대기업에 인수된다 (M&A 엑싯)",
            "2. 상장(IPO)해서 더 큰 회사로 키운다",
            "3. 수익성 있는 독립 회사로 오래 운영한다",
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
          scenario: "출시 8개월차, 지표는 정체고 번레이트(매달 소진되는 운영 자금)도 줄고 있어요. 피벗이나 중단을 결정하는 기준이 뭘 것 같아요?",
          options: [
            "1. 자금이 부족해 더 이상 운영이 어려울 때",
            "2. 일정 기간 동안 시장 반응이 거의 없을 때",
            "3. 핵심 팀원이 이탈하거나 계속 흔들릴 때",
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
          scenario: "첫 채용 예산이 생겼는데, 시니어 개발자가 먼저라는 의견과 영업 인력이 먼저라는 의견이 서로 물러서지 않는 상황, 어떻게 할 것 같아요?",
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
          scenario: "공동창업자에게 이것만큼은 절대 용납할 수 없다고 느끼는 게 있다면 무엇인가요?",
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
          scenario: "초기 팀 보상 구조를 논의하다 스톡옵션 필요 여부로 의견이 갈렸어요. 어떻게 할 것 같아요?",
          options: [
            "1. 스톡옵션으로 핵심 인재를 유치한다",
            "2. 성과 기반 현금 인센티브로 대신한다",
            "3. 회사가 안정된 후 보상 구조를 정한다",
            "4. 별도 보상 없이 급여만으로 운영한다"
          ],
          value: salaryStructure,
          onSelect: setSalaryStructure,
          autoNext: true
        },
        {
          id: "equityStructure",
          label: "",
          type: "single",
          scenario: "초기 지분을 6:4로 합의했지만 1년이 지난 지금, 두 사람의 실제 기여도와 시간 투자가 달라졌습니다. 지분 구조에 대해 어떻게 생각하나요?",
          options: [
            "1. 투자 유치에 맞게 시장 관행 구조를 유지한다",
            "2. 기여도가 달라지면 지분도 조정해야 한다",
            "3. 처음 합의한 지분은 어떤 상황에서도 지킨다",
            "4. 지분 고정 후 급여·옵션으로 기여도를 보완한다"
          ],
          value: equityStructure,
          onSelect: setEquityStructure,
          autoNext: true
        },
        {
          id: "profitDistribution",
          label: "",
          type: "single",
          scenario: "서비스 출시 2년차, 월 매출이 처음으로 5천만원을 넘었어요. 이 수익을 어떻게 처리하는 게 맞다고 생각해요?",
          options: [
            "1. 전액 재투자한다 — 지금은 성장이 먼저다",
            "2. 재투자와 창업자 보상을 나눠서 배분한다",
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
          scenario: "PMF를 찾았고 이제 본격적인 성장 단계입니다. VC에서 시리즈 A 투자 제안도 들어온 상황에서, 회사를 어떻게 성장시키는 게 맞다고 생각하나요?",
          options: [
            "1. 외부 투자로 빠르게 성장한다 — 희석 감수",
            "2. 수익으로 버티면서 최대한 지분을 지킨다",
            "3. 필요한 시점에 선택적으로 투자를 받는다",
            "4. 정부 지원금·대출 등 비희석 자금을 우선한다"
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
  const totalQuestions = categories.filter((c) => c.id !== "profile").reduce((sum, category) => sum + category.questions.length, 0);
  const currentQuestionNumber =
    categories.slice(0, categoryIndex).reduce((sum, category) => sum + category.questions.length, 0) +
    questionIndex +
    1;
  const questionProgress = totalQuestions
    ? Math.min(100, Math.round((currentQuestionNumber / totalQuestions) * 100))
    : 0;
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
                {currentQuestion.id !== "profile" && (
                  <span className="question-step">
                    Question {currentQuestionNumber} / {totalQuestions}
                  </span>
                )}
                <div className="scenario-body">
                  <p>{(isSingleQuestion(currentQuestion) && currentQuestion.scenario) || currentCategory.scenario}</p>
                </div>
                {currentQuestion.id !== "profile" && (
                  <div className="scenario-media">
                    <ScenarioIllustration questionId={currentQuestion.id} />
                  </div>
                )}
              </div>
            )}
            <div className="diag-section">
              <div className="question-header">
                {currentQuestion.id !== "profile" && currentQuestion.id === "profile" && (
                  <span className="question-step">
                    Question {currentQuestionNumber} / {totalQuestions}
                  </span>
                )}
                {currentQuestion.label && <h4>{currentQuestion.label}</h4>}
              </div>

              {isSingleQuestion(currentQuestion) && (
                <div className={`chip-grid ${isAdvancing ? "is-transitioning" : ""}`}>
                  {currentQuestion.options.map((option) => (
                    <button
                      key={option}
                      type="button"
                      disabled={isAdvancing}
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
