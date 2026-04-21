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
    제품: ["CPO", "PO", "PM", "서비스 기획"],
    기술: ["CTO", "프론트엔드", "백엔드", "모바일", "DevOps"],
    비즈니스: ["COO", "사업개발", "세일즈", "CS"],
    마케팅: ["CMO", "퍼포먼스", "콘텐츠", "브랜딩"],
    운영: ["운영", "HR", "총무"],
    재무: ["CFO", "회계", "재무"],
    법무: ["Legal", "컴플라이언스"]
  };
  const rolesForDepartment = roleOptions[department] ?? ["CEO", "CPO", "CTO"];

  const categories: Array<{
    id: string;
    title: string;
    scenario: string;
    questions: Question[];
  }> = [
    {
      id: "decision",
      title: "의사결정 및 권한",
      scenario:
        "출시를 앞두고 중요한 기능을 오늘 열지 말지 의견이 갈렸습니다. 한 사람은 “일단 열고 데이터로 보자”고 하고, 다른 사람은 “아직 최종 확인이 안 끝나 먼저 열기엔 부담스럽다”고 말합니다.",
      questions: [
        {
          id: "decisionStructure",
          label: "Q1. 우리 팀의 의사결정은 어떤 방식이 가장 좋을까요?",
          type: "single",
          options: [
            "1. 담당자의 판단을 우선 존중",
            "2. 사전에 정한 데이터·지표 기준으로 판단",
            "3. 전원 참여 토론을 통한 만장일치 합의",
            "4. 대표가 전체 상황을 보고 최종 결정"
          ],
          value: decisionStructure,
          onSelect: setDecisionStructure,
          autoNext: true
        },
        {
          id: "decisionFailure",
          label: "Q2. 강하게 시도한 일이 실패했을 때, 우리 팀은 무엇을 가장 우선해야 할까요?",
          type: "single",
          options: [
            "1. 빠르게 실패를 인정하고 다음 가설로 전환",
            "2. 원인을 정리하고 같은 방향을 보완해 다시 시도",
            "3. 손실과 리스크를 먼저 수습한 뒤 다음 판단",
            "4. 의사결정 과정을 돌아보고 재발 방지 기준을 정리"
          ],
          value: decisionFailure,
          onSelect: setDecisionFailure,
          autoNext: true
        },
        {
          id: "actionVsConsensus",
          label: "Q3. 의견이 팽팽하게 맞설 때, 최종 결정은 어떻게 내려야 할까요?",
          type: "single",
          options: [
            "1. 한쪽 의견을 채택해 빠른 가설 테스트",
            "2. 모두가 납득할 때까지 지속적인 토론",
            "3. 외부 전문가(고객/어드바이저) 자문",
            "4. 대표가 최종 판단으로 논의를 마무리하고 결정"
          ],
          value: actionVsConsensus,
          onSelect: setActionVsConsensus,
          autoNext: true
        },
        {
          id: "deadlockTolerance",
          label: "Q4. 계속 논의해도 결론이 안 날 때, 언제 강제로 마무리해야 할까요?",
          type: "single",
          options: [
            "1. 1일 이상 결론이 없으면 빠르게 결정",
            "2. 3일 내 결론이 없으면 다수결 또는 대표 판단으로 정리",
            "3. 1주간 추가 논의 후 다시 결정 상정",
            "4. 기한 없이 모두가 동의할 때까지 진행"
          ],
          value: deadlockTolerance,
          onSelect: setDeadlockTolerance,
          autoNext: true
        }
      ]
    },
    {
      id: "role",
      title: "역할 및 책임",
      scenario:
        "출시가 가까워지자 원래 맡지 않던 자잘한 업무가 계속 생기고 있습니다. 한 사람은 “이럴 때는 다 같이 메워야 한다”고 하고, 다른 사람은 “이러면 각자 맡은 핵심 일이 밀린다”고 말합니다.",
      questions: [
        {
          id: "extraWorkPriority",
          label: "Q5. 팀에 꼭 필요하지만 담당자가 정해지지 않은 업무의 최우선 배정 기준은 무엇일까요?",
          type: "single",
          options: [
            "1. 기존 직무와의 연관성",
            "2. 팀원의 현재 업무 여력과 컨디션",
            "3. 해결 역량과 업무의 시급성",
            "4. 무조건 평등하게 1/N 순환 분담"
          ],
          value: extraWorkPriority,
          onSelect: setExtraWorkPriority,
          autoNext: true
        },
        {
          id: "extraWorkPrinciple",
          label: "Q6. 창업 초기, 공동창업자 간의 '업무 몰입 시간(근무 강도)'에 대한 서로의 기대치는?",
          type: "single",
          options: [
            "1. 주말/휴식은 보장하고 정규 시간에 효율 내기",
            "2. 필요 시 근무 시간 외 추가 투입도 감수",
            "3. 강제하진 않지만, 다 같이 비슷한 정도의 시간을 투자",
            "4. 투입 시간은 상관 안 하고, 최종 결과물 달성 여부만 평가"
          ],
          value: extraWorkPrinciple,
          onSelect: setExtraWorkPrinciple,
          autoNext: true
        },
        {
          id: "underperformanceAction",
          label: "Q7. 특정 팀원의 업무 성과가 계속해서 기대에 못 미칠 때, 어떻게 대처할까요?",
          type: "single",
          options: [
            "1. 목표 달성이 우선, 타 팀원이 즉시 대행",
            "2. 피드백 제공 후 자발적 회복까지 지원 및 대기",
            "3. 기한 내 개선이 없으면 역할과 권한을 조정",
            "4. 성과 무관하게 공동창업자 직책/예우 유지"
          ],
          value: underperformanceAction,
          onSelect: setUnderperformanceAction,
          autoNext: true
        },
        {
          id: "workstyleConstraint",
          label: "Q8. 팀의 집중을 위해, 평소 출퇴근 시간과 근무 방식은 어떻게 운영하는 것이 좋을까요?",
          type: "single",
          options: [
            "1. 시간과 장소는 자율, 결과 중심으로 운영",
            "2. 코어타임만 맞추고 나머지는 자율 운영",
            "3. 정해진 출퇴근 시간과 근무 장소를 지킨다",
            "4. 정기 대면일이나 공통 집중일을 두고 운영"
          ],
          value: workstyleConstraint,
          onSelect: setWorkstyleConstraint,
          autoNext: true
        }
      ]
    },
    {
      id: "exit",
      title: "중도 이탈 및 권한 정리",
      scenario:
        "공동창업자 한 명이 다음 달 팀을 떠나겠다고 했습니다. 그는 맡은 일을 정리해 넘기겠다고 하지만, 어디까지 업무를 맡길지와 어떤 권한부터 줄일지를 두고 의견이 갈립니다.",
      questions: [
        {
          id: "handoverMethod",
          label: "Q9. 팀을 떠나기 전, 맡고 있던 일은 어떤 방식으로 넘겨받는 것이 좋을까요?",
          type: "single",
          options: [
            "1. 본인 잔여 업무 끝까지 마무리 후 이관",
            "2. 상세한 인수인계 문서 작성 후 이관",
            "3. 후임 담당자에게 일정 기간 직접 코칭",
            "4. 핵심 권한은 먼저 조정하고 업무는 단계적으로 넘겨받기"
          ],
          value: handoverMethod,
          onSelect: setHandoverMethod,
          autoNext: true
        },
        {
          id: "exitRecoveryPriority",
          label: "Q10. 회사의 자산과 운영을 지키기 위해 가장 먼저 정리해야 할 권한은 무엇일까요?",
          type: "single",
          options: [
            "1. 소스코드·기획·디자인 원본 등 결과물",
            "2. 도메인·인프라·법인 계좌 등 관리자 권한",
            "3. 주요 고객·파트너 연락망과 운영 정보",
            "4. 이메일·메신저·협업툴 등 커뮤니케이션 계정"
          ],
          value: exitRecoveryPriority,
          onSelect: setExitRecoveryPriority,
          autoNext: true
        },
        {
          id: "exitCleanupTiming",
          label: "Q11. 떠나겠다는 의사를 밝힌 뒤, 계정과 권한은 언제부터 줄이거나 차단해야 할까요?",
          type: "single",
          options: [
            "1. 퇴사 의사 확인 기준 1시간 내 즉시 접근 차단",
            "2. 인수인계 최소 권한 외 24시간 내 전체 차단",
            "3. 인수인계 기간(최대 1달) 내 기존 권한 유지",
            "4. 서류상 퇴사가 공식 완료되는 가장 마지막 날 차단"
          ],
          value: exitCleanupTiming,
          onSelect: setExitCleanupTiming,
          autoNext: true
        },
        {
          id: "exitDisputeResolution",
          label: "Q12. 공동창업자가 팀을 떠날 때, 지분은 어떤 기준으로 정리하는 것이 가장 맞을까요?",
          type: "single",
          options: [
            "1. 이미 확정된 지분은 유지하되, 남은 예정 지분은 조정",
            "2. 함께한 기간과 실제 기여한 만큼만 반영해 정리",
            "3. 남은 역할 수행과 인수인계 기여까지 보고 유지 범위를 판단",
            "4. 이탈 사유와 책임 정도에 따라 정리 기준을 달리 적용"
          ],
          value: exitDisputeResolution,
          onSelect: setExitDisputeResolution,
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
    const isLastCategory = categoryIndex === categories.length - 1;
    if (!isLastCategory) {
      setCategoryIndex((prev) => prev + 1);
      setQuestionIndex(0);
      return;
    }
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
      exitDisputeResolution
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
            <h2>{currentCategory.title}</h2>
            <p>아래 시나리오를 읽고 질문에 답해주세요.</p>
            <div className="progress-wrap">
              <div className="progress-bar">
                <span style={{ width: `${questionProgress}%` }} />
              </div>
              <span className="progress-label">{questionProgress}%</span>
            </div>
          </div>

          <div className="diagnosis-body">
            {currentCategory.scenario && (
              <div className="scenario-panel">
                {scenarioImage && (
                  <div className="scenario-media">
                    <img src={scenarioImage.src} alt={`${currentCategory.title} 시나리오`} />
                  </div>
                )}
                <div className="info-box">
                  <span className="scenario-tag">시나리오</span>
                  <p>{currentCategory.scenario}</p>
                </div>
              </div>
            )}
            <div className="diag-section">
              <div className="question-header">
                <span className="question-step">
                  Question {currentQuestionNumber} / {totalQuestions}
                </span>
                <h4>{currentQuestion.label}</h4>
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
                    <option value="제품">제품</option>
                    <option value="기술">기술</option>
                    <option value="비즈니스">비즈니스</option>
                    <option value="마케팅">마케팅</option>
                    <option value="운영">운영</option>
                    <option value="재무">재무</option>
                    <option value="법무">법무</option>
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
            <button
              className="btn btn-ghost"
              type="button"
              onClick={goPrev}
              disabled={isFirstQuestion}
            >
              이전
            </button>
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
    </main>
  );
}
