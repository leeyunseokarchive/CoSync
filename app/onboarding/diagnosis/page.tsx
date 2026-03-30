"use client";

import { useMemo, useState } from "react";
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
import q1 from "../../../reference/pic/Q1.png";
import q2 from "../../../reference/pic/Q2.png";
import q3 from "../../../reference/pic/Q3.png";

const ownersOptions = [
  "대표",
  "공동창업자 A(개발)",
  "공동창업자 B(디자인)",
  "공동창업자 C(제품)"
];

type SingleQuestion = {
  id: string;
  label: string;
  type: "single";
  options: string[];
  value: string;
  onSelect: (value: string) => void;
  autoNext?: boolean;
};

type MultiQuestion = {
  id: string;
  label: string;
  type: "multi";
  options: string[];
  value: string[];
  onSelect: (value: string[]) => void;
  min?: number;
  max?: number;
};

type InputQuestion = {
  id: string;
  label: string;
  type: "input";
};

type AgendaQuestion = {
  id: "agendaOwners";
  label: string;
  type: "agenda";
};

type ProfileQuestion = {
  id: "profile";
  label: string;
  type: "profile";
};

type Question = SingleQuestion | MultiQuestion | InputQuestion | AgendaQuestion | ProfileQuestion;

const isSingleQuestion = (question: Question): question is SingleQuestion =>
  question.type === "single";

const isMultiQuestion = (question: Question): question is MultiQuestion =>
  question.type === "multi";

export default function OnboardingDiagnosisPage() {
  const {
    decisionStructure,
    setDecisionStructure,
    decisionConfirmation,
    setDecisionConfirmation,
    deadlockRepeat,
    setDeadlockRepeat,
    deadlockDays,
    setDeadlockDays,
    extraWorkPrinciple,
    setExtraWorkPrinciple,
    extraWorkPriority,
    setExtraWorkPriority,
    motivationChoices,
    setMotivationChoices,
    workType,
    setWorkType,
    boundaryTasks,
    setBoundaryTasks,
    allocationRule,
    setAllocationRule,
    burdenTasks,
    setBurdenTasks,
    conflictRepeat,
    setConflictRepeat,
    conflictWeeks,
    setConflictWeeks,
    agendaOwners,
    setAgendaOwners,
    customAgendaName,
    setCustomAgendaName,
    customAgendaOwner,
    setCustomAgendaOwner,
    exitRecoveryItems,
    setExitRecoveryItems,
    handoverMethod,
    setHandoverMethod,
    exitCleanupHours,
    setExitCleanupHours,
    exitCleanupDays,
    setExitCleanupDays,
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

  const boundaryOptionsMap: Record<string, string[]> = {
    "디지털 제품": [
      "발표자료·소개자료 수정",
      "랜딩페이지/소개 문구 수정",
      "QA 및 최종 점검",
      "고객 문의·오픈채팅 응대",
      "미팅 일정 조율·후속 정리",
      "신청폼·노션·시트 등 운영 관리"
    ],
    운영: [
      "상세페이지·소개 문구 수정",
      "CS 및 문의 대응",
      "주문/예약 확인",
      "운영 공지 업로드",
      "일정 조율·후속 정리",
      "시트·재고·정산 관리"
    ],
    콘텐츠: [
      "제안서·소개자료 수정",
      "콘텐츠 업로드 전 최종 확인",
      "클라이언트/파트너 문의 대응",
      "촬영/제작 일정 조율",
      "운영 문서·피드백 정리",
      "게시물/공지 업로드 관리"
    ],
    공통: [
      "소개 자료·문구 수정",
      "최종 확인 및 점검",
      "고객/외부 문의 대응",
      "일정 조율 및 후속 정리",
      "운영 문서·시트 관리"
    ]
  };

  const boundaryOptions = useMemo(() => {
    if (workType === "디지털 제품을 만들고 있어요") return boundaryOptionsMap["디지털 제품"];
    if (workType === "운영/주문/응대 업무 비중이 커요") return boundaryOptionsMap["운영"];
    if (workType === "콘텐츠/브랜딩 제작 비중이 커요") return boundaryOptionsMap["콘텐츠"];
    return boundaryOptionsMap["공통"];
  }, [workType]);

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
        "중요한 안건이 생겼습니다. 한 사람은 먼저 진행하자고 하고, 다른 사람은 팀 합의가 먼저라고 생각합니다. 결정은 필요하지만, 누가 정리하고 어떻게 확정할지 기준은 아직 없습니다.",
      questions: [
        {
          id: "decisionStructure",
          label: "Q1. 우리 팀의 의사결정은 주로 어떤 구조에 가깝나요?",
          type: "single",
          options: ["직무 담당자 우선형", "공동 논의형", "대표 최종 승인형", "사안별 혼합형"],
          value: decisionStructure,
          onSelect: setDecisionStructure,
          autoNext: true
        },
        {
          id: "decisionConfirmation",
          label: "Q2. 공유된 안건은 보통 어떤 방식으로 확정되나요?",
          type: "single",
          options: [
            "이의 없으면 진행",
            "상대 확인 후 진행",
            "대표 확인 후 진행",
            "정기 회의에서 확정",
            "함께 논의 후 확정",
            "사안별로 다름"
          ],
          value: decisionConfirmation,
          onSelect: setDecisionConfirmation,
          autoNext: true
        },
        {
          id: "deadlock",
          label: "Q3. 반복 논의에도 결론이 나지 않을 때, 언제부터 교착으로 보나요?",
          type: "input"
        }
      ]
    },
    {
      id: "role",
      title: "역할 및 책임",
      scenario:
        "출시가 가까워지자 원래 역할에 없던 자잘한 업무(QA 확인, 고객 문의 대응 등)가 계속 생기고 있습니다. 누군가는 “지금은 다 같이 메워야 할 때”라고 하고, 다른 누군가는 “계속 이런 방식이면 원래 맡은 일이 밀릴 수 있다”고 생각합니다. 역할은 나뉘어 있지만, 추가 업무를 어떻게 나눌지 기준은 아직 분명하지 않습니다.",
      questions: [
        {
          id: "extraWorkPrinciple",
          label: "Q1. 원래 역할에 없던 업무가 생기면, 우리 팀은 어떤 원칙으로 처리하는 것이 적절하다고 보나요?",
          type: "single",
          options: [
            "급한 업무는 우선 함께 메운다",
            "역할과 가까운 사람이 우선 맡는다",
            "기존 업무 우선순위를 먼저 조정한 뒤 나눈다",
            "대표가 최종 정리해 분배한다",
            "상황에 따라 다르게 정한다"
          ],
          value: extraWorkPrinciple,
          onSelect: setExtraWorkPrinciple,
          autoNext: true
        },
        {
          id: "extraWorkPriority",
          label: "Q2. 추가 업무를 나눌 때 무엇을 가장 우선해야 한다고 보나요?",
          type: "single",
          options: [
            "역할과의 연관성",
            "현재 업무량",
            "각자의 역량",
            "급한 일정 여부",
            "공평한 분담"
          ],
          value: extraWorkPriority,
          onSelect: setExtraWorkPriority,
          autoNext: true
        },
        {
          id: "motivation",
          label: "Q3. 다음 중 내가 더 동기부여를 느끼는 업무를 선택해 주세요.",
          type: "multi",
          options: [
            "기획에 참여해 아이디어를 내는 일",
            "문제를 직접 해결하고 실행하는 일",
            "사람과 소통하며 조율하는 일",
            "결과물을 완성도 있게 마무리하는 일",
            "운영 흐름을 정리하고 안정적으로 유지하는 일"
          ],
          value: motivationChoices,
          onSelect: setMotivationChoices,
          min: 1,
          max: 1
        }
      ]
    },
    {
      id: "exit",
      title: "중도 이탈 및 권한 정리",
      scenario:
        "공동창업자 한 명이 팀을 떠나겠다고 말했습니다. 누군가는 “지분과 권한은 이미 나눈 만큼 유지되어야 한다”고 하고, 다른 누군가는 “이탈하면 운영 자산과 권한은 빠르게 정리되어야 한다”고 생각합니다. 이탈 시 무엇을 어떻게 정리할지 기준은 아직 없습니다.",
      questions: [
        {
          id: "exitRecoveryItems",
          label: "Q1. 다음 중 이탈 시 우선적으로 회수하거나 정리해야 한다고 보는 항목을 선택해 주세요.",
          type: "multi",
          options: [
            "이메일·협업툴 계정",
            "소스코드·저장소 접근 권한",
            "디자인 파일·문서 접근 권한",
            "도메인·서버·관리자 권한",
            "고객·파트너 연락처 및 자료",
            "법인 인감·계좌·정산 권한"
          ],
          value: exitRecoveryItems,
          onSelect: setExitRecoveryItems,
          min: 1,
          max: 1
        },
        {
          id: "handoverMethod",
          label: "Q2. 이탈하는 공동창업자가 맡고 있던 업무는 어떻게 넘겨받는 것이 맞다고 보나요?",
          type: "single",
          options: [
            "본인이 마무리한 뒤 넘긴다",
            "인수인계 문서를 남기고 넘긴다",
            "다른 담당자를 먼저 정한 뒤 넘긴다",
            "바로 회수하고 팀이 다시 나눈다",
            "상황에 따라 다르게 정한다"
          ],
          value: handoverMethod,
          onSelect: setHandoverMethod,
          autoNext: true
        },
        {
          id: "exitCleanup",
          label: "Q3. 이탈 후 운영 자산과 접근 권한은 언제까지 정리되어야 한다고 보나요?",
          type: "input"
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
          label: "Q1. 본인의 부서/직책을 선택해 주세요.",
          type: "profile"
        }
      ]
    }
  ];

  const [categoryIndex, setCategoryIndex] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);
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
    if (currentCategory.id === "decision") return q1;
    if (currentCategory.id === "role") return q2;
    if (currentCategory.id === "exit") return q3;
    return null;
  })();
  const isFirstQuestion = categoryIndex === 0 && questionIndex === 0;

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
      case "deadlock":
        return Boolean(deadlockRepeat || deadlockDays);
      case "exitCleanup":
        return Boolean(exitCleanupHours || exitCleanupDays);
      case "motivation":
        return motivationChoices.length >= 1;
      case "exitRecoveryItems":
        return exitRecoveryItems.length >= 1;
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
      decisionConfirmation,
      deadlockRepeat,
      deadlockDays,
      extraWorkPrinciple,
      extraWorkPriority,
      motivationChoices,
      workType,
      boundaryTasks,
      allocationRule,
      burdenTasks,
      conflictRepeat,
      conflictWeeks,
      agendaOwners,
      customAgendaName,
      customAgendaOwner,
      exitRecoveryItems,
      handoverMethod,
      exitCleanupHours,
      exitCleanupDays
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

          {currentCategory.scenario && (
            <div className="scenario-panel">
              {scenarioImage && (
                <div className="scenario-media">
                  <img src={scenarioImage.src} alt={`${currentCategory.title} 시나리오`} />
                </div>
              )}
              <div className="info-box">
                <p>{currentCategory.scenario}</p>
              </div>
            </div>
          )}

          <div className="diag-section">
            <h4>{currentQuestion.label}</h4>

            {isSingleQuestion(currentQuestion) && (
              <div className="chip-grid">
                {currentQuestion.options.map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={`chip ${currentQuestion.value === option ? "active" : ""}`}
                    onClick={() => {
                      currentQuestion.onSelect(option);
                      if (currentQuestion.autoNext) {
                        goNext();
                      }
                    }}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}

            {isMultiQuestion(currentQuestion) && (
              <>
                <div className="chip-grid">
                  {currentQuestion.options.map((option) => (
                    <button
                      key={option}
                      type="button"
                      className={`chip ${currentQuestion.value.includes(option) ? "active" : ""}`}
                      onClick={() => {
                        const nextValue = toggleMulti(
                          currentQuestion.value,
                          option,
                          currentQuestion.max
                        );
                        currentQuestion.onSelect(nextValue);
                        if (currentQuestion.max === 1 && nextValue.length > 0) {
                          goNext();
                        }
                      }}
                    >
                      {option}
                    </button>
                  ))}
                </div>
                {currentQuestion.max && currentQuestion.max > 1 && (
                  <p className="hint">최대 {currentQuestion.max}개까지 선택할 수 있습니다.</p>
                )}
              </>
            )}

            {currentQuestion.id === "deadlock" && (
              <div className="input-row">
                <span>동일 안건</span>
                <input
                  className="chip-input"
                  type="number"
                  min="0"
                  value={deadlockRepeat}
                  onChange={(event) => setDeadlockRepeat(event.target.value)}
                  placeholder="0"
                />
                <span>회 논의 시</span>
                <span>또는</span>
                <input
                  className="chip-input"
                  type="number"
                  min="0"
                  value={deadlockDays}
                  onChange={(event) => setDeadlockDays(event.target.value)}
                  placeholder="0"
                />
                <span>일 경과 시</span>
              </div>
            )}

            {currentQuestion.id === "conflictThreshold" && (
              <div className="input-row">
                <span>동일한 문제</span>
                <input
                  className="chip-input"
                  type="number"
                  min="0"
                  value={conflictRepeat}
                  onChange={(event) => setConflictRepeat(event.target.value)}
                  placeholder="0"
                />
                <span>회 반복 시</span>
                <span>또는</span>
                <input
                  className="chip-input"
                  type="number"
                  min="0"
                  value={conflictWeeks}
                  onChange={(event) => setConflictWeeks(event.target.value)}
                  placeholder="0"
                />
                <span>주 이상 개선 없음</span>
              </div>
            )}

            {currentQuestion.id === "exitCleanup" && (
              <div className="input-row">
                <span>이탈 확정 후</span>
                <input
                  className="chip-input"
                  type="number"
                  min="0"
                  value={exitCleanupHours}
                  onChange={(event) => setExitCleanupHours(event.target.value)}
                  placeholder="0"
                />
                <span>시간 이내</span>
                <span>또는</span>
                <input
                  className="chip-input"
                  type="number"
                  min="0"
                  value={exitCleanupDays}
                  onChange={(event) => setExitCleanupDays(event.target.value)}
                  placeholder="0"
                />
                <span>일 이내</span>
              </div>
            )}

            {currentQuestion.id === "agendaOwners" && (
              <div className="agenda-table">
                <div className="agenda-row head">
                  <span>안건 유형</span>
                  <span>진행 담당자</span>
                  <span>최종 승인자</span>
                </div>
                {Object.entries(agendaOwners).map(([key, value]) => (
                  <div className="agenda-row" key={key}>
                    <span>{key}</span>
                    <select
                      className="input select"
                      value={value.lead}
                      onChange={(event) =>
                        setAgendaOwners({
                          ...agendaOwners,
                          [key]: { ...value, lead: event.target.value }
                        })
                      }
                    >
                      {ownersOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    <select
                      className="input select"
                      value={value.approver}
                      onChange={(event) =>
                        setAgendaOwners({
                          ...agendaOwners,
                          [key]: { ...value, approver: event.target.value }
                        })
                      }
                    >
                      {ownersOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
                <div className="agenda-row">
                  <input
                    className="input"
                    placeholder="기타 안건명"
                    value={customAgendaName}
                    onChange={(event) => setCustomAgendaName(event.target.value)}
                  />
                  <select
                    className="input select"
                    value={customAgendaOwner.lead}
                    onChange={(event) =>
                      setCustomAgendaOwner({ ...customAgendaOwner, lead: event.target.value })
                    }
                  >
                    {ownersOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  <select
                    className="input select"
                    value={customAgendaOwner.approver}
                    onChange={(event) =>
                      setCustomAgendaOwner({ ...customAgendaOwner, approver: event.target.value })
                    }
                  >
                    {ownersOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
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
            questionIndex === currentCategory.questions.length - 1 ? (
              <button
                className="btn btn-primary"
                type="button"
                onClick={handleFinish}
                disabled={!canProceed()}
              >
                다음 단계로 →
              </button>
            ) : (
              <button
                className="btn btn-primary"
                type="button"
                onClick={goNext}
                disabled={!canProceed()}
              >
                다음 →
              </button>
            )}
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
