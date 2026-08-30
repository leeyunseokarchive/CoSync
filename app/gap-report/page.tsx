"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useMemo, useState, Suspense, type CSSProperties } from "react";
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
import { CAT_LABELS, CAT_WEIGHTS, QUESTION_CONFIGS, computeGapSummary, getIssueStatus, type IssueStatus, type OnboardingAnswers } from "../../lib/gap";
import { QUESTION_DEFS, SCRIPTS, generateInsight, josa, splitPointsFor, type QuestionDef } from "../../lib/deepQuestions";
import { AlertTriangle, TrendingUp, MessageCircle, Lock, ShieldAlert, Compass, FileText, RefreshCw, Star, Scale, Lightbulb } from "lucide-react";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useAppState } from "../../components/AppState";

const WARN_WORDS = ["경영권 분쟁","신뢰 문제","신뢰를 잃","법적 분쟁","팀 해체","파산","소송","수억 원","계약을 철회","지분 분쟁","의사결정 교착","실행력 자체","동업 해지","감정 싸움","책임 전가","독단으로","갈등이 자주 터","폭발에 가깝","방어로 끝","피해자가 됩니다"];
const hlBody = (stake: string, dispute: string) => {
  let t = stake + " " + dispute;
  t = t.replace(/'([^']+)'/g, '<mark style="background:#fef9c3;color:#854d0e;border-radius:3px;padding:1px 4px;font-weight:600">$1</mark>');
  for (const w of WARN_WORDS) {
    t = t.replace(new RegExp(`(${w}[가-힣]*)`, "g"), `<strong style="color:#b45309;font-weight:700">$1</strong>`);
  }
  return t;
};

type ClauseDef = {
  title: string;
  lead: string;
  items: string[];
  blurItems: string[];
  btnLabel: string;
};

const CLAUSE_DEFS: Record<string, ClauseDef> = {
  "역할 & 책임": {
    title: "역할 분담 및 미이행 책임",
    lead: "각 당사자의 역할과 담당 업무를 구체적으로 정하고, 미이행 시 책임 기준을 합의한다.",
    items: ["각자 단독으로 결정할 수 있는 업무 범위", "회색지대 업무 발생 시 우선 담당자 지정 기준", "근속의무 및 성과 부진 시 역할 재조정 조건"],
    blurItems: ["지식재산권(IP) 귀속 기준 (창업 전 개발 포함)", "역할 미이행 시 주식 강제매각 청구권(콜옵션) 발동 조건"],
    btnLabel: "팀 맞춤 합의안 생성하기",
  },
  "이탈 & 회수": {
    title: "주식 처분 제한(Lock-up) 및 이탈 처리",
    lead: "당사자 이탈 시 주식 처리 절차와 권한 회수 기준을 합의한다.",
    items: ["베스팅(Vesting) 기간 및 클리프(Cliff) 조건", "주식 처분 제한(Lock-up) 기간 및 예외 조건", "이탈 시 주식 정산 기준 (액면가 vs 시가)"],
    blurItems: ["주식 강제매각 청구권(콜옵션) 발동 사유 및 절차", "법인 인감·계좌·시스템 접근권 반환 기한"],
    btnLabel: "팀 맞춤 합의안 생성하기",
  },
  "비전 & 가치관": {
    title: "계약해지 및 교착상태 해소(Deadlock)",
    lead: "사업 방향 전환 기준과 계약 해지 사유, Deadlock 발생 시 처리 절차를 합의한다.",
    items: ["피벗·사업 중단 트리거 기준 및 해지 사유", "교착상태(Deadlock) 지속 시 처리 방식", "당사자 전원 서면 합의 시 계약 해지 절차"],
    blurItems: ["엑싯 방향(M&A / IPO / 독립 운영) 우선순위 합의", "Deadlock 해소를 위한 우선매수권(ROFR) 발동 조건"],
    btnLabel: "팀 맞춤 합의안 생성하기",
  },
  "조달 & 운용": {
    title: "자금 집행 승인권 및 신주인수우선권",
    lead: "단독 집행 가능한 지출 한도, 투자 유치 조건, 신주 발행 시 기존 주주 보호 기준을 합의한다.",
    items: [],
    blurItems: ["자금 집행 승인권 — 단독 결정 한도 금액 기준", "신주인수우선권 — 신주 발행 시 기존 지분율 보호", "런웨이 위기 시 대응 우선순위 (삭감 순서)", "우선매수권(ROFR) / 동반매도참여권(Tag-along) / 동반매도청구권(Drag-along) 발동 조건", "투자 조건 거부권 행사 기준 및 지분 희석 한도"],
    btnLabel: "팀 맞춤 합의안 생성하기",
  },
  "의사결정 & 실행": {
    title: "의사결정 구조 및 경업금지의무",
    lead: "단독 결정 범위와 공동 결정 사안, 퇴사 후 경업금지 기준을 합의한다.",
    items: ["단독 결정 가능 사안 기준 (금액·영향 범위)", "공동 결정 필요 사안 및 Deadlock 시 처리 방식", "경업금지의무 — 재직 중 및 퇴사 후 적용 기간"],
    blurItems: ["결정 번복 가능 조건 및 재논의 절차", "비밀유지의무(NDA) — 대상 정보 범위 및 위반 시 위약벌"],
    btnLabel: "팀 맞춤 합의안 생성하기",
  },
  "지분 & 보상": {
    title: "지분 배분 및 손해배상·위약벌",
    lead: "지분 구조, 창업자 보상 기준, 계약 위반 시 손해배상 조건을 합의한다.",
    items: [],
    blurItems: ["파트너 간 급여 차등 기준 및 흑자 전환 시 재논의 트리거", "베스팅(Vesting) 기간 및 이탈 시 지분 회수 가격 기준", "손해배상 및 위약벌 — 위반 유형별 책임 한도", "동반매도참여권(Tag-along) / 동반매도청구권(Drag-along) 행사 조건", "분쟁해결 — 관할 법원 및 중재 절차"],
    btnLabel: "팀 맞춤 합의안 생성하기",
  },
};


const SOLO_CATEGORIES: Array<{ label: string; fields: (keyof OnboardingAnswers)[]; why: string }> = [
  { label: "역할 & 책임",     fields: ["extraWorkPriority", "extraWorkPrinciple", "underperformanceAction"],               why: "'이건 내가 해야 해, 네가 해야 해?' — 이 질문이 자주 나온다면 역할 기준이 없는 거예요. 기준이 맞으면 마찰 대신 실행에 에너지를 씁니다." },
  { label: "이탈 & 회수",    fields: ["exitRecoveryPriority", "exitCleanupTiming", "exitDisputeResolution"],               why: "팀에서 누군가 떠나는 건 드문 일이 아니에요. 기준이 있으면 그때가 와도 원칙대로 처리할 수 있지만, 없으면 감정이 개입되고 법적 분쟁으로 번질 수 있습니다." },
  { label: "비전 & 가치관",   fields: ["exitVision", "pivotCriteria", "dealbreaker"],                                      why: "좋은 인수 제안이 들어왔을 때, 팀이 같은 답을 할까요? 비전은 평소엔 맞는 것 같다가, 결정적인 순간에 갈립니다." },
  { label: "조달 & 운용",    fields: ["fundingRunway", "spendingApproval", "investmentCriteria"],                          why: "런웨이 2개월, 투자도 없고 매출도 없다면 — 팀의 첫 번째 결정이 뭔지 지금 말할 수 있나요? 위기가 오기 전에만 이 대화가 쉽습니다." },
  { label: "의사결정 & 실행", fields: ["decisionStructure", "decisionFailure", "actionVsConsensus", "deadlockTolerance"],  why: "빠른 사람과 신중한 사람이 함께 일하면, 둘 다 상대가 문제라고 느껴요. 결정 방식을 맞춰본 팀과 그렇지 않은 팀은 실행 속도부터 달라집니다." },
  { label: "지분 & 보상",     fields: ["salaryStructure", "equityStructure", "profitDistribution", "growthStrategy"],      why: "말 안 해도 서로 기대하고 있는 게 지분과 보상이에요. 초기에 맞춰두지 않으면 매출이 나고 규모가 커질수록 이해관계가 벌어져, 나중엔 조율 비용이 훨씬 더 커집니다." },
];
const FIELD_TO_DEF: Record<string, QuestionDef> = Object.fromEntries(QUESTION_DEFS.map(d => [d.field, d]));
const FIELD_TO_CAT: Record<string, number> = Object.fromEntries(QUESTION_CONFIGS.map(q => [q.field, q.cat]));

const statusRank = (s: IssueStatus): number => {
  if (s === "conflict") return 3;
  if (s === "diff") return 2;
  if (s === "match") return 1;
  return 0;
};

function GapReportPageInner() {
  const [showSubscribe, setShowSubscribe] = useState(false);
  const router = useRouter();
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const { teams } = useTeams();
  const [teamName, setTeamName] = useState("격차 리포트");
  const [teamCreator, setTeamCreator] = useState<string | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<string | null>(null);
  const [openGuides, setOpenGuides] = useState<Set<string>>(new Set());
  const [earlyBirdEmail, setEarlyBirdEmail] = useState("");
  const [earlyBirdSubmitted, setEarlyBirdSubmitted] = useState(false);
  const [earlyBirdError, setEarlyBirdError] = useState("");
  const toggleGuide = (id: string) => setOpenGuides(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  const searchParams = useSearchParams();
  const queryTeamId = searchParams ? searchParams.get("teamId") : null;
  const activeTeamId = queryTeamId || profile?.lastActiveTeamId || profile?.teamIds?.[0] || teams[0]?.id;
  const { members, loading: membersLoading } = useTeamMembers(activeTeamId);

  const {
    extraWorkPriority, extraWorkPrinciple, underperformanceAction,
    exitRecoveryPriority, exitCleanupTiming, exitDisputeResolution,
    exitVision, pivotCriteria, dealbreaker,
    fundingRunway, spendingApproval, investmentCriteria,
    decisionStructure, decisionFailure, actionVsConsensus, deadlockTolerance,
    salaryStructure, equityStructure, profitDistribution, growthStrategy
  } = useAppState();
  const [firestoreSoloAnswers, setFirestoreSoloAnswers] = useState<Partial<OnboardingAnswers>>({});
  useEffect(() => {
    if (!user || activeTeamId) return;
    getDoc(doc(db, "users", user.uid)).then(snap => {
      if (snap.exists()) {
        const data = snap.data() as { soloAnswers?: Partial<OnboardingAnswers> };
        if (data.soloAnswers) setFirestoreSoloAnswers(data.soloAnswers);
      }
    }).catch(() => {});
  }, [user, activeTeamId]);

  const appStateSoloAnswers: Partial<OnboardingAnswers> = {
    extraWorkPriority, extraWorkPrinciple, underperformanceAction,
    exitRecoveryPriority, exitCleanupTiming, exitDisputeResolution,
    exitVision, pivotCriteria, dealbreaker,
    fundingRunway, spendingApproval, investmentCriteria,
    decisionStructure, decisionFailure, actionVsConsensus, deadlockTolerance,
    salaryStructure, equityStructure, profitDistribution, growthStrategy
  };
  const myMemberAnswers: Partial<OnboardingAnswers> = useMemo(() => {
    if (!user || members.length !== 1) return {};
    const me = members.find(m => m.id === user.uid);
    return (me?.answers as Partial<OnboardingAnswers>) ?? {};
  }, [user, members]);

  const soloAnswers: Partial<OnboardingAnswers> = Object.values(appStateSoloAnswers).some(Boolean)
    ? appStateSoloAnswers
    : Object.values(myMemberAnswers).some(Boolean)
    ? myMemberAnswers
    : firestoreSoloAnswers;
  const hasSoloAnswers = members.length < 2 && Object.values(soloAnswers).some(Boolean);
  // 팀원 답변 없이도, 내 답이 toxicPair의 한쪽이면 어느 답과 부딪치는지는 지금 말할 수 있다.
  // 선택지의 61%가 toxicPair에 걸려서 그냥 두면 평균 12개가 뜬다. 경고가 12개면 경고가 아니라
  // 배경이 되므로, 카테고리 가중치 상위 3개만 남긴다. 나머지 카테고리는 기존 why 문구를 쓴다.
  // soloAnswers가 매 렌더 새 객체라 useMemo는 안 먹는다. 20문항 루프라 그냥 돈다.
  const soloSplits = splitPointsFor(soloAnswers)
    .sort((a, b) => (CAT_WEIGHTS[FIELD_TO_CAT[b.def.field] ?? 0] ?? 0) - (CAT_WEIGHTS[FIELD_TO_CAT[a.def.field] ?? 0] ?? 0))
    .slice(0, 3);
  const inviteHref = activeTeamId ? `/workspace?teamId=${activeTeamId}` : "/workspace/create";

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

  const isCreator = Boolean(user && teamCreator && user.uid === teamCreator);

  const teamIssues = useMemo(() => {
    if (members.length < 2) return [] as Array<{
      id: string; label: string; status: IssueStatus; conflict: boolean;
      memberValues: Array<{id: string; name: string; value: string}>;
      leftValue: string; rightValue: string; insight: string;
    }>;
    return QUESTION_DEFS.map(def => {
      const memberValues = members.map(m => ({
        id: m.id,
        name: m.name || "팀원",
        value: (m.answers as OnboardingAnswers | undefined)?.[def.field] || "미입력"
      }));
      const anyUnanswered = members.some(m => !(m.answers as OnboardingAnswers | undefined)?.[def.field]);
      let worstStatus: IssueStatus = anyUnanswered ? "unanswered" : "match";
      if (!anyUnanswered) {
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
      }
      return {
        id: def.id,
        label: def.label,
        status: worstStatus,
        conflict: worstStatus === "diff" || worstStatus === "conflict",
        memberValues,
        leftValue: memberValues[0]?.value || "미입력",
        rightValue: memberValues[1]?.value || "미입력",
        insight: generateInsight(def)
      };
    });
  }, [members]);

  // 기본 진단(12문항)을 모두 마치면 리포트 공개. 심화(Q13~Q20)는 선택 사항이며 심화 히트맵에만 영향.
  const BASIC_FIELDS: (keyof OnboardingAnswers)[] = ["extraWorkPriority", "extraWorkPrinciple", "underperformanceAction", "exitRecoveryPriority", "exitCleanupTiming", "exitDisputeResolution", "exitVision", "pivotCriteria", "dealbreaker", "fundingRunway", "spendingApproval", "investmentCriteria"];
  const hasBasicComplete = (m: { answers?: unknown }) =>
    BASIC_FIELDS.every(f => Boolean((m.answers as OnboardingAnswers | undefined)?.[f]));
  const isTeamComplete = members.length >= 2 && members.every(hasBasicComplete);

  const teamInsight = useMemo(() => {
    if (!members.length) {
      return {
        gapCount: 0,
        gapScore: "LOW" as const,
        text: "아직 팀 데이터가 충분하지 않습니다. 온보딩 진단을 완료하면 팀 인사이트가 생성됩니다."
      };
    }
    const memberAnswers = members.map((member) => member.answers ?? {});
    const { gapCount, gapScore, rawScore, categories, overallAlignment } = computeGapSummary(memberAnswers);
    const counts = {
      role: teamIssues.slice(0, 3).filter((issue) => issue.conflict).length,
      exit: teamIssues.slice(3, 6).filter((issue) => issue.conflict).length,
      vision: teamIssues.slice(6, 9).filter((issue) => issue.conflict).length,
      funding: teamIssues.slice(9, 12).filter((issue) => issue.conflict).length,
      decision: teamIssues.slice(12, 16).filter((issue) => issue.conflict).length,
      money: teamIssues.slice(16, 20).filter((issue) => issue.conflict).length,
    };
    const sorted = [
      { key: "decision", label: "의사결정/실행", count: counts.decision },
      { key: "money", label: "지분/보상", count: counts.money },
      { key: "role", label: "역할/책임", count: counts.role },
      { key: "exit", label: "이탈/회수", count: counts.exit },
      { key: "vision", label: "비전/가치관", count: counts.vision },
      { key: "funding", label: "조달/운용", count: counts.funding },
    ].sort((a, b) => b.count - a.count);
    const top = sorted[0];
    const second = sorted[1];

    const diffCount = teamIssues.filter((i) => i.status === "diff" || i.status === "conflict").length;
    const highRiskCount = teamIssues.filter((i) => i.status === "conflict").length;

    const CAT_WEIGHT_BY_ID_TOP: Record<string, number> = {
      q1: 0.11, q2: 0.11, q3: 0.11,
      q4: 0.11, q5: 0.11, q6: 0.11,
      q7: 0.11, q8: 0.11, q9: 0.11,
      q10: 0.17, q11: 0.17, q12: 0.17,
      q13: 0.22, q14: 0.22, q15: 0.22, q16: 0.22,
      q17: 0.28, q18: 0.28, q19: 0.28, q20: 0.28,
    };
    const topPriorityIssuesList = teamIssues
      .filter((i) => i.status === "conflict")
      .sort((a, b) => (CAT_WEIGHT_BY_ID_TOP[b.id] ?? 0) - (CAT_WEIGHT_BY_ID_TOP[a.id] ?? 0));
    const topPriorityConflicts = topPriorityIssuesList.slice(0, 9);
    const topPriorityIssuesArray = topPriorityConflicts.slice(0, 3);
    const topPriorityLabels = topPriorityIssuesArray.length > 0 ? topPriorityIssuesArray.map(i => i.label).join(", ") : "없음";

    const leadSentence = (() => {
      if (gapScore === "CRITICAL") return "현재 팀의 인식 차이는 실행 단계에서 경영권 분쟁으로 전환될 수 있는 수준입니다.";
      if (gapScore === "HIGH") return "지금 정리하지 않으면, 중요한 결정이 생길 때마다 이 차이가 충돌로 터질 가능성이 높습니다.";
      if (gapScore === "MID") return "현재는 큰 문제가 없어 보이지만, 성장 속도가 빨라질수록 이 간극이 실행력을 잠식합니다.";
      return "팀원 간 핵심 기준이 잘 맞춰져 있습니다. 지금 문서화해두면 이후 분쟁 가능성을 크게 낮출 수 있습니다.";
    })();

    const hotAreas = sorted.filter(s => s.count > 0);
    const detailSentence = (() => {
      if (gapScore === "LOW") return "현재 흐름을 유지하면서 주요 합의 항목만 문서로 남겨두세요.";
      if (hotAreas.length === 0) return "세부 운영 기준을 지금 정리해두면 실행 단계에서의 혼선을 줄일 수 있습니다.";
      if (hotAreas.length >= 2 && top.count === second.count) {
        return `특히 ${top.label}과 ${second.label}에서 서로 다른 기준으로 움직이고 있습니다.`;
      }
      return `특히 ${top.label} 영역에서 파트너 간 기준 차이가 가장 두드러집니다.`;
    })();

    const shortAnswer = (v: string) => v.replace(/^\d+\.\s*/, "").slice(0, 30);
    const eunNeun = (name: string) => {
      const code = name.charCodeAt(name.length - 1);
      if (code < 0xAC00 || code > 0xD7A3) return "은(는)";
      return (code - 0xAC00) % 28 === 0 ? "는" : "은";
    };
    const eulReul = (text: string) => {
      const last = text[text.length - 1];
      const code = last?.charCodeAt(0) ?? 0;
      if (code < 0xAC00 || code > 0xD7A3) return "을(를)";
      return (code - 0xAC00) % 28 === 0 ? "를" : "을";
    };

    const topIssue = topPriorityIssuesArray[0] ?? null;
    const scriptEntry = topIssue ? SCRIPTS[topIssue.id] : null;
    const specificSentence = (() => {
      if (!topIssue || !scriptEntry) return { nameCompare: { self: "", others: "" }, stake: "", dispute: "" };
      const mv = topIssue.memberValues;
      const answeredMv = mv.filter(m => m.value !== "미입력");
      const myUid = user?.uid ?? "";
      const me = answeredMv.find(m => m.id === myUid);
      const others = answeredMv.filter(m => m.id !== myUid);
      const mePart = me
        ? (() => { const a = shortAnswer(me.value); return `${me.name}(나)${eunNeun(me.name)} '${a}'${eulReul(a)} 선택했습니다.`; })()
        : "";
      const othersPart = others.length > 0 && answeredMv.length >= 2
        ? "반면, " + others.map(m => { const a = shortAnswer(m.value); return `${m.name}${eunNeun(m.name)} '${a}'${eulReul(a)}`; }).join(", ") + " 선택했습니다."
        : "";
      const nameCompare = { self: mePart, others: othersPart };
      return { nameCompare, stake: scriptEntry.stake, dispute: scriptEntry.dispute };
    })();

    const text = [leadSentence, detailSentence, specificSentence.nameCompare.self, specificSentence.nameCompare.others, specificSentence.stake, specificSentence.dispute]
      .filter(Boolean)
      .join(" ");

    return {
      gapCount,
      gapScore,
      text,
      leadSentence,
      detailSentence,
      specificSentence,
      diffCount,
      highRiskCount,
      topPriorityLabels,
      topPriorityIssuesArray,
      topPriorityConflicts,
      rawScore,
      categories,
      overallAlignment,
    };
  }, [members, teamIssues, user]);

  const alignmentScore = teamInsight.overallAlignment ?? 0;

  const activeIssues = teamIssues;

  const allHaveAdvancedData = useMemo(() => {
    if (members.length < 2) return false;
    const advancedFields: (keyof OnboardingAnswers)[] = ["decisionStructure", "decisionFailure", "actionVsConsensus", "deadlockTolerance", "salaryStructure", "equityStructure", "profitDistribution", "growthStrategy"];
    return members.every(m => advancedFields.every(f => Boolean((m.answers as OnboardingAnswers | undefined)?.[f])));
  }, [members]);

  const showAdvancedHeatmap = allHaveAdvancedData;
  const showReport = isTeamComplete;

  useEffect(() => {
    if (showReport && window.location.hash === "#earlybird-section") {
      document.getElementById("earlybird-section")?.scrollIntoView({ behavior: "smooth" });
    }
  }, [showReport]);

  const slides = [
    { title: "합의 세션", src: "/preview/agreement-confirm.png" },
    { title: "계약서 생성", src: "/preview/document-view.png" },
    { title: "구체적인 질문 리스트", src: "/preview/questions.png" },
    { title: "추천 문구", src: "/preview/version-diff.png" },
    { title: "히스토리 관리", src: "/preview/version-history.png" }
  ];

  return (
    <main className="page gap-page">
      <TopNav links={[{ label: "대시보드", href: "/workspace" }]} active="리포트" />

      <div className="gap-hero-premium">
        <div className="container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div className="gap-breadcrumb-premium">분석 결과 · 인식 격차 리포트</div>
          <h1 className="section-title-premium">GAP REPORT</h1>
          <div className="premium-divider"></div>
          {members.length >= 2 && (
            <div className="gap-pair-label-premium">
              팀 통합 리포트: {members.map(m => m.name).join(" · ")}
            </div>
          )}
        </div>
      </div>

      <section className="container gap-wrap" style={{ position: "relative", zIndex: 10, marginTop: "-40px" }}>
        {/* 솔로 기준 리포트 */}
        {hasSoloAnswers && (
          <div className="card" style={{ width: "100%", maxWidth: "640px", margin: "0 auto", padding: "32px" }}>
            <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#0f172a", marginBottom: "6px" }}>내 창업 기준 요약</h2>
            <p style={{ fontSize: "14px", color: "#64748b", marginBottom: "28px", lineHeight: "1.6" }}>
              {soloSplits.length > 0
                ? `진단에서 선택한 내 기준이에요. 그중 팀원과 정면으로 갈릴 수 있는 지점을 ${CAT_LABELS[FIELD_TO_CAT[soloSplits[0].def.field] ?? 0]}부터 짚었습니다.`
                : "진단에서 선택한 내 기준이에요. 팀원이 완료하면 어떤 항목에서 기준이 다른지 자동으로 분석됩니다."}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "32px" }}>
              {SOLO_CATEGORIES.map(cat => {
                const answeredItems = cat.fields
                  .map(f => ({ field: f, def: FIELD_TO_DEF[f], val: soloAnswers[f] }))
                  .filter(item => Boolean(item.val) && item.def);
                // 안 푼 카테고리를 통째로 지우면 6개 중 5개만 보이는 걸 사용자가 알 방법이 없다.
                // 하필 가중치 1·2위(지분&보상 0.28, 의사결정&실행 0.22)가 추가 진단에 몰려 있다.
                if (answeredItems.length === 0) {
                  return (
                    <div key={cat.label} style={{ border: "1px dashed #e2e8f0", borderRadius: "12px", padding: "14px 16px", display: "flex", alignItems: "center", gap: "8px" }}>
                      <Lock size={13} style={{ flexShrink: 0, color: "#cbd5e1" }} />
                      <span style={{ fontSize: "12px", fontWeight: 700, color: "#94a3b8", letterSpacing: "0.04em" }}>{cat.label}</span>
                      <span style={{ fontSize: "12px", color: "#cbd5e1", marginLeft: "auto" }}>추가 진단 Q13~Q20에서 채워져요</span>
                    </div>
                  );
                }
                const catSplits = soloSplits.filter(sp => (cat.fields as string[]).includes(sp.def.field));
                return (
                  <div key={cat.label} style={{ border: "1px solid #e2e8f0", borderRadius: "12px", overflow: "hidden" }}>
                    <div style={{ background: "#f8fafc", padding: "10px 16px", borderBottom: "1px solid #e2e8f0" }}>
                      <span style={{ fontSize: "12px", fontWeight: "700", color: "#475569", letterSpacing: "0.04em" }}>{cat.label}</span>
                    </div>
                    <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: "6px" }}>
                      {/* 내가 고른 답은 방금 본 내용이라 약하게 둔다. 강조는 아래 갈림 지점이 가져간다. */}
                      {answeredItems.map(item => (
                        <div key={item.field} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
                          <span style={{ fontSize: "12px", color: "#94a3b8" }}>{item.def.label}</span>
                          <span style={{ fontSize: "12px", color: "#94a3b8", textAlign: "right" }}>
                            {/* 저장값은 "1. 일단 내가 직접 처리하며…" 원문이라 optionLabels가 안 걸렸다.
                                아래 갈림 지점과 같은 짧은 라벨로 맞춘다. */}
                            {item.def.optionLabels[item.val![0]] ?? item.val}
                          </span>
                        </div>
                      ))}
                      <div style={{ marginTop: "10px", paddingTop: "12px", borderTop: "1px dashed #e2e8f0" }}>
                        {catSplits.length > 0 ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                            {catSplits.map(sp => (
                              <p key={sp.def.id} style={{ fontSize: "13px", color: "#1e293b", lineHeight: "1.65", margin: 0, display: "flex", gap: "6px" }}>
                                <AlertTriangle size={13} style={{ flexShrink: 0, marginTop: "3px", color: "#b45309" }} />
                                <span>
                                  <strong style={{ fontWeight: 700 }}>{sp.def.label}</strong>에서 나는{" "}
                                  <strong style={{ fontWeight: 700 }}>&lsquo;{sp.def.optionLabels[sp.mine]}&rsquo;</strong>
                                  {josa(sp.def.optionLabels[sp.mine], "을", "를")} 골랐어요. 팀원이{" "}
                                  {sp.theirs.map(t => `‘${sp.def.optionLabels[t]}’`).join(" 또는 ")}
                                  {josa(sp.def.optionLabels[sp.theirs[sp.theirs.length - 1]], "을", "를")} 고르면
                                  이 항목에서 기준이 정면으로 갈립니다.
                                </span>
                              </p>
                            ))}
                          </div>
                        ) : (
                          <p style={{ fontSize: "13px", color: "#1e293b", lineHeight: "1.65", margin: 0, display: "flex", gap: "6px" }}>
                            <MessageCircle size={13} style={{ flexShrink: 0, marginTop: "3px", color: "#64748b" }} />
                            <span>{cat.why}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {/* 위 카드가 말할 수 있는 건 "갈릴 수 있다"까지다. 무엇이 실제로 갈렸는지는
                팀원 답변이 있어야 정해진다. 그 경계를 CTA에서 분명히 한다. */}
            <div style={{ background: "rgba(91,91,231,0.05)", border: "1px solid rgba(91,91,231,0.15)", borderRadius: "12px", padding: "22px 24px" }}>
              <p style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a", margin: "0 0 12px", lineHeight: "1.5", textAlign: "center" }}>
                여기까지는 내 기준 요약이에요
              </p>
              <p style={{ fontSize: "13px", color: "#475569", margin: "0 0 16px", lineHeight: "1.7", textAlign: "center" }}>
                {soloSplits.length > 0
                  ? <>위에서 짚은 갈림 지점은 <strong>&lsquo;그 답을 고른 팀원과 만나면&rsquo;</strong>이라는 가정이에요.<br />실제로 갈렸는지는 팀원이 답해야 정해집니다.</>
                  : <>내가 무엇을 골랐는지까지만 알 수 있어요.<br />어디서 부딪치는지는 팀원 답변이 있어야 나옵니다.</>}
              </p>
              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 18px", display: "flex", flexDirection: "column", gap: "8px" }}>
                {[
                  "20문항을 나란히 놓은 응답 히트맵",
                  "카테고리별 정렬도와 전체 정렬도(%)",
                  "치명적 충돌로 분류된 항목과 그 대화 스크립트",
                ].map(t => (
                  <li key={t} style={{ display: "flex", gap: "8px", alignItems: "flex-start", fontSize: "13px", color: "#334155", lineHeight: "1.6" }}>
                    <Lock size={13} style={{ flexShrink: 0, marginTop: "3px", color: "#8b8bf0" }} />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
              <div style={{ textAlign: "center" }}>
                <Link href={inviteHref} className="btn btn-primary" style={{ display: "inline-flex" }}>
                  팀원 초대하고 갭 리포트 열기 →
                </Link>
                <p style={{ fontSize: "12px", color: "#94a3b8", margin: "10px 0 0", lineHeight: "1.5" }}>
                  팀원이 진단을 마치는 즉시 이 페이지가 팀 리포트로 바뀝니다. 추가 비용 없음.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 팀 통합 보기 - 미완료 */}
        {!isTeamComplete && members.length >= 2 && (
          <div className="card gap-summary" style={{ width: "100%", maxWidth: "600px", margin: "0 auto", textAlign: "center", padding: "40px 32px" }}>
            <div style={{ marginBottom: "16px", display: "flex", justifyContent: "center" }}><Lock size={32} color="#94a3b8" /></div>
            <h3 style={{ fontSize: "17px", fontWeight: 700, marginBottom: "8px" }}>모든 팀원이 기본 진단을 완료해야 리포트를 볼 수 있어요</h3>
            <p style={{ color: "#64748b", fontSize: "14px", lineHeight: 1.6, marginBottom: "24px" }}>
              {members.filter(m => !hasBasicComplete(m)).map(m => (
                <span key={m.id}><strong>{m.name}</strong>의 진단 진행률: {m.progress ?? 0}%<br /></span>
              ))}
              <br />
              전원이 기본 진단(12문항)을 마치면 통합 리포트가 열립니다.
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

              {/* 2열 그리드 */}
              <div className="insight-grid">

                {/* 상단 좌: 게이지 + 단계 뱃지 */}
                <div className="insight-gauge-col" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", paddingBottom: "28px" }}>
                  <div className="gauge-shell">
                    <div className="gauge-fill" style={{ "--fill": `${alignmentScore}` } as CSSProperties} />
                    <div className="gauge-core">
                      <div className="gauge-value">{alignmentScore}%</div>
                      <div className="gauge-label">인식 일치율</div>
                    </div>
                  </div>
                  <div className={`score-pill ${teamInsight.gapScore.toLowerCase()}`}>
                    {teamInsight.gapScore === "CRITICAL" && "위험 단계"}
                    {teamInsight.gapScore === "HIGH" && "주의 단계"}
                    {teamInsight.gapScore === "MID" && "점검 단계"}
                    {teamInsight.gapScore === "LOW" && "안정 단계"}
                  </div>
                </div>

                {/* 상단 우: 인사이트 텍스트 */}
                <div className="insight-text-col" style={{ display: "flex", flexDirection: "column", gap: "8px", paddingBottom: "28px" }}>
                  <p style={{ fontSize: "15px", lineHeight: "1.7", color: "#0f172a", fontWeight: "700", margin: 0 }}>
                    {teamInsight.leadSentence}
                  </p>
                  {teamInsight.detailSentence && (
                    <p style={{ fontSize: "14px", lineHeight: "1.7", color: "#475569", fontWeight: "500", margin: 0 }}>
                      {teamInsight.detailSentence}
                    </p>
                  )}
                  {(teamInsight.specificSentence?.nameCompare.self || teamInsight.specificSentence?.nameCompare.others) && (
                    <div style={{ borderLeft: "3px solid #e2e8f0", paddingLeft: "12px", display: "flex", flexDirection: "column", gap: "4px" }}>
                      {teamInsight.specificSentence.nameCompare.self && (
                        <p style={{ fontSize: "13px", lineHeight: "1.65", color: "#64748b", fontWeight: "500", margin: 0 }}>
                          {teamInsight.specificSentence.nameCompare.self}
                        </p>
                      )}
                      {teamInsight.specificSentence.nameCompare.others && (
                        <p style={{ fontSize: "13px", lineHeight: "1.65", color: "#64748b", fontWeight: "500", margin: 0 }}>
                          {teamInsight.specificSentence.nameCompare.others}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* 구분선 */}
                <div style={{ gridColumn: "1 / -1", borderTop: "1px solid #e2e8f0", marginBottom: "28px" }} />

                {/* 하단 좌: 총 차이 + 고위험 박스 */}
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", alignSelf: "center" }}>
                  <div style={{ background: "#e8edf4", borderRadius: "12px", padding: "14px 16px" }}>
                    <span style={{ fontSize: "11px", color: "#64748b", fontWeight: "700", display: "block", marginBottom: "6px", letterSpacing: "0.04em", textTransform: "uppercase" }}>총 차이 항목</span>
                    <span style={{ fontSize: "26px", fontWeight: "800", color: "#0f172a" }}>{teamInsight.diffCount ?? 0}</span>
                    <span style={{ fontSize: "13px", fontWeight: "600", color: "#94a3b8", marginLeft: "4px" }}>개</span>
                  </div>
                  <div style={{ background: "rgba(239,68,68,0.13)", borderRadius: "12px", padding: "14px 16px" }}>
                    <span style={{ fontSize: "11px", color: "#ef4444", fontWeight: "700", display: "block", marginBottom: "6px", letterSpacing: "0.04em", textTransform: "uppercase" }}>고위험 충돌</span>
                    <span style={{ fontSize: "26px", fontWeight: "800", color: "#ef4444" }}>{teamInsight.highRiskCount ?? 0}</span>
                    <span style={{ fontSize: "13px", fontWeight: "600", color: "rgba(239,68,68,0.4)", marginLeft: "4px" }}>개</span>
                  </div>
                </div>

                {/* 하단 우: 카테고리별 진단 */}
                {teamInsight.categories && teamInsight.categories.length > 0 && (
                  <div className="category-breakdown" style={{ alignSelf: "center" }}>
                    {teamInsight.categories.map(cat => (
                      <div key={cat.label} className="cat-bar">
                        <div className="cat-bar-top">
                          <span className="cat-bar-label">{cat.label}</span>
                          {cat.alignment === null ? (
                            <span className="cat-bar-status unanswered">미진단</span>
                          ) : (
                            <span className={`cat-bar-status ${cat.gapScore!.toLowerCase()}`}>
                              {cat.gapScore === "LOW" && "안정"}
                              {cat.gapScore === "MID" && "점검"}
                              {cat.gapScore === "HIGH" && "주의"}
                              {cat.gapScore === "CRITICAL" && "위험"}
                            </span>
                          )}
                        </div>
                        <div className="cat-bar-track">
                          {cat.alignment === null ? (
                            <div className="cat-bar-fill unanswered" style={{ width: "100%" }} />
                          ) : (
                            <div className={`cat-bar-fill ${cat.gapScore!.toLowerCase()}`} style={{ width: `${cat.alignment}%` }} />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="card gap-heatmap-card">
              <div className="heatmap-header">
                <div className="heatmap-title-row">
                  <h2 className="heatmap-title">
                    영역별 상세 데이터 시각화 <span className="heatmap-subtitle">(Heatmap)</span>
                  </h2>
                </div>
                <div className="heatmap-help-box" style={{ marginTop: "16px" }}>
                  <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginBottom: "10px" }}>
                    {[
                      { color: "#20c997", label: "일치" },
                      { color: "#fdba74", label: "차이" },
                      { color: "#f97316", label: "충돌" },
                      { color: "#e2e8f0", label: "미응답" },
                    ].map(({ color, label }) => (
                      <span key={label} style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "#374151" }}>
                        <span style={{ width: "12px", height: "12px", borderRadius: "3px", background: color, display: "inline-block", flexShrink: 0 }} />
                        {label}
                      </span>
                    ))}
                  </div>
                  <div style={{ fontSize: "13px", color: "#6366f1", fontWeight: 600, display: "flex", alignItems: "center", gap: "6px" }}>
                    <MessageCircle size={13} /> 충돌·차이 셀을 클릭하면 실제 응답 비교와 갈등 분석을 바로 볼 수 있어요
                  </div>
                </div>
              </div>

              {/* 카테고리=행, 질문=열 히트맵 */}
              <div style={{ overflowX: "auto", textAlign: "center" }}>
              <div className="hm-inline-grid" style={{ display: "inline-grid", gridTemplateColumns: "140px repeat(4, 72px)", gap: "8px", alignItems: "center" }}>

                {/* 기본 진단 4개 행 */}
                {[
                  { label: "역할 & 책임", indices: [0, 1, 2] },
                  { label: "이탈 & 회수",  indices: [3, 4, 5] },
                  { label: "비전 & 가치관", indices: [6, 7, 8] },
                  { label: "조달 & 운용",  indices: [9, 10, 11] },
                ].map((cat) => (
                  <React.Fragment key={cat.label}>
                    <div className="hm-row-label" style={{ fontSize: "12px", fontWeight: "700", color: "#334155", textAlign: "right", paddingRight: "8px", lineHeight: "1.3" }}>{cat.label}</div>
                    {cat.indices.map((idx) => (
                      <button key={idx} type="button" className={`hm-cell hm-item ${activeIssues[idx].status}`} onClick={() => setSelectedIssue(activeIssues[idx].id)} style={{ width: "72px", height: "72px" }}>
                        Q{idx + 1}
                      </button>
                    ))}
                    <div className="hm-empty-cell" style={{ width: "72px", height: "72px" }} />
                  </React.Fragment>
                ))}

                {/* 심화 구분선 */}
                {showAdvancedHeatmap && (
                  <>
                    <div style={{ gridColumn: "1 / -1", height: "1px", background: "#e2e8f0", margin: "8px 0" }} />
                    <div style={{ gridColumn: "1 / -1", display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                      <span style={{ fontSize: "0.72rem", fontWeight: "700", color: "#6366f1", background: "rgba(99,102,241,0.08)", padding: "3px 10px", borderRadius: "999px", letterSpacing: "0.5px" }}>추가 진단</span>
                    </div>

                    {/* 심화 2개 행 */}
                    {[
                      { label: "의사결정 & 실행", indices: [12, 13, 14, 15] },
                      { label: "지분 & 보상",     indices: [16, 17, 18, 19] },
                    ].map((cat) => (
                      <React.Fragment key={cat.label}>
                        <div className="hm-row-label" style={{ fontSize: "12px", fontWeight: "700", color: "#334155", textAlign: "right", paddingRight: "8px", lineHeight: "1.3" }}>{cat.label}</div>
                        {cat.indices.map((idx) => (
                          <button key={idx} type="button" className={`hm-cell hm-item ${activeIssues[idx].status}`} onClick={() => setSelectedIssue(activeIssues[idx].id)} style={{ width: "72px", height: "72px" }}>
                            Q{idx + 1}
                          </button>
                        ))}
                      </React.Fragment>
                    ))}
                  </>
                )}
              </div>
              </div>


            </div>

            {/* 대화 흐름 섹션 — conflict만 */}
            {(() => {

              const CAT_WEIGHT_BY_ID: Record<string, number> = {
                q1: 0.11, q2: 0.11, q3: 0.11,
                q4: 0.11, q5: 0.11, q6: 0.11,
                q7: 0.11, q8: 0.11, q9: 0.11,
                q10: 0.17, q11: 0.17, q12: 0.17,
                q13: 0.22, q14: 0.22, q15: 0.22, q16: 0.22,
                q17: 0.28, q18: 0.28, q19: 0.28, q20: 0.28,
              };
              const scriptIssues = teamIssues
                .filter(i => i.status === "conflict")
                .sort((a, b) => (CAT_WEIGHT_BY_ID[b.id] ?? 0) - (CAT_WEIGHT_BY_ID[a.id] ?? 0))
                .slice(0, 3);

              if (scriptIssues.length === 0) return null;

              return (
                <div style={{ width: "100%", margin: "48px 0 0" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {scriptIssues.map((issue) => {
                    const script = SCRIPTS[issue.id];
                    if (!script) return null;
                    const memberVals = (issue as typeof teamIssues[number]).memberValues ?? [];
                    const statMatch = script.stat.match(/(\d[\d.,]*%)/);
                    const statNum = statMatch ? statMatch[0] : null;
                    const statParts = script.stat.split("—");
                    const statSentence = statParts[0].trim();
                    const statSource = statParts[1] ? statParts[1].trim() : "";

                    const rankIdx = scriptIssues.indexOf(issue);
                    return (
                      <div key={issue.id} style={{ background: "#fff", borderRadius: "20px", overflow: "hidden", boxShadow: "0 12px 28px rgba(29,35,63,0.08)" }}>

                        {/* 헤더 */}
                        <div style={{ padding: "24px 28px 20px", borderBottom: "1px solid #f1f3f9", display: "flex", alignItems: "center", gap: "20px" }}>
                          <span style={{ fontSize: "36px", fontWeight: "900", color: "#5b5be7", lineHeight: 1, letterSpacing: "-2px", flexShrink: 0 }}>0{rankIdx + 1}</span>
                          <div>
                            <span style={{ fontSize: "11px", fontWeight: "700", color: "#dc2626", display: "block", marginBottom: "5px" }}>고위험 충돌</span>
                            <p style={{ fontSize: "17px", fontWeight: "800", color: "#1f2430", margin: 0, lineHeight: "1.35" }}>{script.topic}</p>
                          </div>
                        </div>

                        <div style={{ padding: "32px", display: "flex", flexDirection: "column", gap: "32px" }}>

                          {/* 통계 — 전체 문장 + 출처 */}
                          {/* 구성원 전체 답변 */}
                          {memberVals.length >= 2 && memberVals.every(mv => mv.value !== "미입력") && (
                            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                              {memberVals.map((mv, i) => (
                                <div key={i} style={{ flex: "1 1 140px", background: "#e8edf4", borderRadius: "12px", padding: "14px 18px" }}>
                                  <span style={{ fontSize: "12px", fontWeight: "700", color: "#6366f1", display: "block", marginBottom: "6px" }}>{mv.name}</span>
                                  <span style={{ fontSize: "14px", color: "#1e293b", lineHeight: "1.6" }}>{mv.value}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* 왜 중요한가 + 분쟁 위험 — 한 문단 */}
                          <p
                            style={{ fontSize: "14px", color: "#374151", lineHeight: "1.85", margin: 0 }}
                            dangerouslySetInnerHTML={{ __html: hlBody(script.stake, script.dispute) }}
                          />

                          {/* 통계 근거 — 항상 표시 */}
                          {statSentence && (
                            <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                              <TrendingUp size={14} color="#9ca3af" style={{ flexShrink: 0, marginTop: "2px" }} />
                              <p style={{ fontSize: "13px", color: "#9ca3af", fontWeight: "500", margin: 0, lineHeight: "1.6" }}>
                                {statSentence}
                              </p>
                            </div>
                          )}

                          {/* 대화 가이드 아코디언 */}
                          <div style={{ border: "1.5px solid #ddddf5", borderRadius: "12px", overflow: "hidden" }}>
                            <button
                              type="button"
                              onClick={() => toggleGuide(issue.id)}
                              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", background: "#f0f0fc", border: "none", cursor: "pointer", padding: "12px 18px", color: "#4a4ad6", fontSize: "14px", fontWeight: "700", width: "100%" }}
                            >
                              <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <MessageCircle size={16} />
                                대화 가이드 보기
                              </span>
                              <span style={{ fontSize: "16px", transition: "transform 0.2s", display: "inline-block", transform: openGuides.has(issue.id) ? "rotate(180deg)" : "rotate(0deg)" }}>▾</span>
                            </button>
                            {openGuides.has(issue.id) && (
                              <div style={{ padding: "16px 18px 18px", borderTop: "1px solid #e8e8f8", display: "flex", flexDirection: "column", gap: "12px", background: "#f8f8fe" }}>
                                <p style={{ fontSize: "14px", color: "#6b7280", lineHeight: "1.8", margin: 0, paddingLeft: "24px" }}>{script.guide}</p>
                                <p style={{ fontSize: "14px", color: "#4f46e5", fontWeight: "600", margin: 0, lineHeight: "1.65", paddingLeft: "23px" }}>&#8594; {script.steps[2].qs[0]}</p>
                              </div>
                            )}
                          </div>

                        </div>
                      </div>
                    );
                  })}
                  </div>
                </div>
              );
            })()}

            {/* Scenario + Reviews — 가로 배치 */}
            <style dangerouslySetInnerHTML={{__html: `
              .scenario-review-wrapper {
                display: flex;
                flex-direction: column;
                gap: 72px;
                width: 100%;
                margin: 60px 0 0;
              }
              @media (min-width: 860px) {
                .scenario-review-wrapper {
                  flex-direction: row;
                  align-items: flex-start;
                  gap: 72px;
                }
                .scenario-comic-col {
                  flex: 0 0 380px;
                }
                .reviews-scroll-col {
                  flex: 1;
                  min-width: 0;
                }
              }
              .scenario-comic-col {
                display: flex;
                flex-direction: column;
              }
              .reviews-scroll-col {
                display: flex;
                flex-direction: column;
                min-width: 0;
                width: 100%;
              }
              /* 세로 무한 스크롤 */
              .reviews-scroll-window {
                overflow: hidden;
                height: 520px;
                position: relative;
                width: 100%;
              }
              .reviews-scroll-window::after {
                content: "";
                position: absolute;
                bottom: 0; left: 0; right: 0;
                height: 80px;
                background: linear-gradient(to bottom, transparent, #f8f9fb);
                pointer-events: none;
              }
              .reviews-scroll-track {
                display: flex;
                flex-direction: column;
                gap: 16px;
                animation: scroll-up 10s linear infinite;
              }
              .reviews-scroll-track:hover {
                animation-play-state: paused;
              }
              @keyframes scroll-up {
                from { transform: translateY(0); }
                to { transform: translateY(-50%); }
              }
              .review-card {
                background: #fff;
                border: 1px solid #ede9fe;
                border-radius: 16px;
                padding: 22px 24px;
                display: flex;
                flex-direction: column;
                gap: 10px;
                box-shadow: 0 4px 16px rgba(99,102,241,0.06);
                position: relative;
                overflow: hidden;
                width: 100%;
                box-sizing: border-box;
              }
              .review-card::before {
                content: "\\201C";
                position: absolute;
                top: -8px; right: 16px;
                font-size: 80px;
                color: #ede9fe;
                font-family: Georgia, serif;
                line-height: 1;
                pointer-events: none;
              }
              .review-stars { color: #f59e0b; font-size: 13px; letter-spacing: 3px; }
              .review-text { font-size: 13.5px; line-height: 1.7; color: #374151; word-break: keep-all; }
              .review-text strong { font-weight: 700; color: #4f46e5; }
              .review-author-row { display: flex; align-items: center; gap: 8px; margin-top: 4px; }
              .review-avatar {
                width: 28px; height: 28px; border-radius: 50%;
                background: linear-gradient(135deg, #6366f1, #a78bfa);
                color: #fff; font-size: 11px; font-weight: 700;
                display: flex; align-items: center; justify-content: center;
                flex-shrink: 0;
              }
              .review-author { font-size: 12px; color: #9ca3af; }
            `}} />

            <div className="scenario-review-wrapper">
              {/* 만화 */}
              <div className="scenario-comic-col">
                <div className="teaser-header">
                  <h2 style={{ color: "#000" }}>발생할 수 있는 최악의 시나리오</h2>
                  <p>구두 합의만으로 시작한 동업의 결말입니다.</p>
                </div>
                <img src="/comic_ip_new.jpg" alt="최악의 시나리오 만화" className="scenario-comic-img" style={{ maxHeight: "520px", width: "auto", display: "block" }} />
              </div>

              {/* 리뷰 세로 스크롤 */}
              <div className="reviews-scroll-col">
                <div className="teaser-header">
                  <h2 style={{ color: "#000" }}>REVIEWS</h2>
                  <p>이미 수많은 초기 창업팀이 CoSync로 합의 준비를 시작했습니다.</p>
                </div>
                <div className="reviews-scroll-window">
                  <div className="reviews-scroll-track">
                    {[...Array(2)].map((_, pass) =>
                      [
                        { stars: "★★★★★", bold: "결정 기준과 최종 책임자를 정한 뒤에는 비슷한 안건도 1시간 이내에 결론", pre: "전에는 기능 우선순위 하나에도 2~3시간씩 끝장토론을 했지만, ", post: "을 낼 수 있었습니다. 실행 속도가 확연히 달라졌어요.", author: "초기 스타트업 CEO · 31세", initial: "C" },
                        { stars: "★★★★★", bold: "객관적인 데이터로 대화의 물꼬를 트니 감정 상할 일 없이", pre: "친한 선배라 돈이나 지분 문제를 먼저 꺼내기 어려웠는데, ", post: " 운영 기준을 정리할 수 있었습니다. 진짜 꼭 필요했던 서비스예요.", author: "기창업(2y) 공동창업 준비 중 · 23세", initial: "기" },
                        { stars: "★★★★★", bold: "우리가 어떤 부분에서 동상이몽을 하고 있었는지", pre: "대화는 많이 했지만 늘 겉도는 느낌이었어요. CoSync로 진단해보니 ", post: " 한눈에 보였습니다. 덕분에 갈등 없이 지분 구조의 합의 기준을 잡았어요.", author: "초기 스타트업 공동창업자 · 29세", initial: "공" },
                      ].map((r, i) => (
                        <div key={`${pass}-${i}`} className="review-card">
                          <div className="review-stars">{r.stars}</div>
                          <p className="review-text">{r.pre}<strong>{r.bold}</strong>{r.post}</p>
                          <div className="review-author-row">
                            <div className="review-avatar">{r.initial}</div>
                            <div className="review-author">{r.author}</div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>

            <section id="earlybird-section" style={{ margin: "64px 0 0", padding: "48px 24px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: "20px", textAlign: "center" }}>
              <div style={{ maxWidth: "480px", margin: "0 auto" }}>
                <div style={{ marginBottom: "24px" }}>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", marginBottom: "16px" }}>
                    <span style={{ color: "#d97706", fontSize: "16px" }}>★</span>
                    <span style={{ fontSize: "14px", fontWeight: "800", color: "#d97706", letterSpacing: "0.04em" }}>선착순 50팀 얼리버드</span>
                    <span style={{ color: "#d97706", fontSize: "16px" }}>★</span>
                  </div>
                  <h2 className="section-title" style={{ fontSize: "clamp(18px, 3.5vw, 22px)", wordBreak: "keep-all", marginBottom: "12px" }}>팀 맞춤 합의안 서비스, 가장 먼저 만나보세요</h2>
                  <p className="section-sub">출시 즉시 알림을 받고 얼리버드 혜택을 누리세요.</p>
                </div>
                <ul style={{ listStyle: "none", padding: 0, margin: "0 0 32px", display: "flex", flexDirection: "column", gap: "6px", alignItems: "center" }}>
                  <li className="section-sub" style={{ display: "flex", alignItems: "center", gap: "8px", margin: 0 }}>
                    <span style={{ color: "#6366f1", fontWeight: "800", flexShrink: 0 }}>✓</span>
                    <span>정식 출시가 <strong>30% 할인</strong></span>
                  </li>
                  <li className="section-sub" style={{ display: "flex", alignItems: "center", gap: "8px", margin: 0 }}>
                    <span style={{ color: "#6366f1", fontWeight: "800", flexShrink: 0 }}>✓</span>
                    <span>AI 에이전트 크레딧 <strong>20회 무료 제공</strong></span>
                  </li>
                </ul>
                {earlyBirdSubmitted ? (
                  <div style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: "12px", padding: "20px 24px" }}>
                    <p style={{ fontSize: "16px", fontWeight: "700", color: "#6366f1", margin: "0 0 4px" }}>신청 완료!</p>
                    <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>출시 시 가장 먼저 안내드릴게요.</p>
                  </div>
                ) : (
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (!earlyBirdEmail) return;
                      setEarlyBirdError("");
                      try {
                        await setDoc(doc(db, "earlybird", earlyBirdEmail), {
                          email: earlyBirdEmail,
                          createdAt: serverTimestamp(),
                          source: "gap-report",
                        });
                        setEarlyBirdSubmitted(true);
                      } catch (err) {
                        console.error("얼리버드 저장 실패:", err);
                        setEarlyBirdError("신청에 실패했습니다. 잠시 후 다시 시도해주세요.");
                      }
                    }}
                    style={{ display: "flex", gap: "10px", flexDirection: "column", width: "100%", maxWidth: "480px", margin: "0 auto" }}
                  >
                    <input
                      type="email"
                      required
                      placeholder="신청할 이메일 입력"
                      value={earlyBirdEmail}
                      onChange={(e) => setEarlyBirdEmail(e.target.value)}
                      style={{ width: "100%", padding: "16px", border: "1.5px solid #e2e8f0", borderRadius: "999px", fontSize: "15px", outline: "none", color: "#1f2430", textAlign: "center", boxSizing: "border-box" }}
                    />
                    <button type="submit" className="btn btn-primary" style={{ width: "100%", padding: "18px", fontSize: "16px" }}>
                      출시 알림 받기
                    </button>
                    {earlyBirdError && <p style={{ fontSize: "12px", color: "#ef4444", margin: 0 }}>{earlyBirdError}</p>}
                    <p style={{ fontSize: "11px", color: "#94a3b8", margin: 0 }}>스팸 없이 출시 소식만 보내드려요.</p>
                  </form>
                )}
              </div>
            </section>

            <div className="premium-cards-section" style={{ marginTop: "80px" }}>
              {/* 합의안 완성 일러스트 — 갭 공백이 곧 합의안 조항이 된다 */}
              <div className="teaser-header">
                <div className="badge-legal" style={{ marginBottom: "16px" }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline", verticalAlign: "middle", marginRight: "6px" }}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  동업계약서 전문 변호사 감수 완료
                </div>
                <h2>합의 공백을 지금 채우세요</h2>
                <p style={{ wordBreak: "keep-all" }}>갭 리포트로 공백을 확인하고, 본 서비스의 정교한 6가지 카테고리 질문들로 서로 입장을 맞춰 계약서 작성 시 검토할 수 있는 합의안으로 완성합니다.</p>
              </div>
              <div className="agreement-flow-stage">
                {/* 배경: 흐릿한 합의안 문서 */}
                <div className="agreement-doc-mock" aria-hidden="true">
                  <div className="agreement-doc-title">합의안</div>
                  <div className="agreement-doc-lines">
                    <i style={{ width: "42%" }} />
                    <i style={{ width: "88%" }} />
                    <i style={{ width: "80%" }} />
                    <i style={{ width: "84%" }} />
                    <i style={{ width: "38%", marginTop: "12px" }} />
                    <i style={{ width: "76%" }} />
                    <i style={{ width: "90%" }} />
                    <i style={{ width: "64%" }} />
                    <i style={{ width: "40%", marginTop: "12px" }} />
                    <i style={{ width: "86%" }} />
                    <i style={{ width: "82%" }} />
                    <i style={{ width: "78%" }} />
                    <i style={{ width: "58%" }} />
                    <i style={{ width: "70%" }} />
                  </div>
                </div>

                {/* 플로팅 카드 A — 우상단 (충돌 1위 카테고리) */}
                {(() => {
                  const cats = teamInsight.categories ?? [];
                  const sorted = [...cats].filter(c => c.alignment !== null).sort((a, b) => (a.alignment ?? 100) - (b.alignment ?? 100));
                  const topCat = sorted[0];
                  const clause = topCat ? CLAUSE_DEFS[topCat.label] : null;
                  if (!clause) return null;
                  return (
                    <div className="clause-float clause-float--top">
                      <div className="clause-callout">
                        현재 가장 치명적인 합의 공백은{" "}
                        <span className="clause-callout-em">
                          [{teamInsight.topPriorityIssuesArray?.[0]?.label ?? topCat.label}]
                        </span>{" "}
                        입니다!
                      </div>
                      <div className="clause-card clause-card--danger">
                        <div className="clause-card-badge">주주간계약서 기반</div>
                        <div className="clause-card-title">
                          <span className="clause-dot danger" /> {clause.title}
                        </div>
                        <p className="clause-card-lead">{clause.lead}</p>
                        {clause.items.length > 0 && (
                          <ul className="clause-card-list">
                            {clause.items.map((item, i) => <li key={i}>{item}</li>)}
                          </ul>
                        )}
                        <div className="clause-blur">
                          <ul className="clause-card-list">
                            {clause.blurItems.map((item, i) => <li key={i}>{item}</li>)}
                          </ul>
                        </div>
                        <button className="btn btn-primary unlock-btn" onClick={() => router.push(`/agreement/preview?teamId=${activeTeamId}`)}>
                          {clause.btnLabel}
                        </button>
                      </div>
                    </div>
                  );
                })()}

                {/* 플로팅 카드 B — 좌하단 (충돌 2위 카테고리) */}
                {(() => {
                  const cats = teamInsight.categories ?? [];
                  const sorted = [...cats].filter(c => c.alignment !== null).sort((a, b) => (a.alignment ?? 100) - (b.alignment ?? 100));
                  const secondCat = sorted[1];
                  const clause = secondCat ? CLAUSE_DEFS[secondCat.label] : null;
                  if (!clause) return null;
                  return (
                    <div className="clause-float clause-float--bottom">
                      <div className="clause-callout">
                        팀 구성 문제로 실패하는 스타트업,<br />
                        CB Insights 분석 기준 <span className="clause-callout-em">23%</span>에 달합니다.
                      </div>
                      <div className="clause-card clause-card--brand">
                        <div className="clause-card-badge">주주간계약서 기반</div>
                        <div className="clause-card-title">
                          <span className="clause-dot brand" /> {clause.title}
                        </div>
                        <p className="clause-card-lead">{clause.lead}</p>
                        {clause.items.length > 0 && (
                          <ul className="clause-card-list">
                            {clause.items.map((item, i) => <li key={i}>{item}</li>)}
                          </ul>
                        )}
                        <div className="clause-blur">
                          <ul className="clause-card-list">
                            {clause.blurItems.map((item, i) => <li key={i}>{item}</li>)}
                          </ul>
                        </div>
                        <button className="btn btn-primary unlock-btn" onClick={() => router.push(`/agreement/preview?teamId=${activeTeamId}`)}>
                          팀 맞춤 합의안 생성하기
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div className="teaser-header" style={{ marginTop: "72px" }}>
                <div className="badge-legal" style={{ marginBottom: "20px" }}>
                  <Scale size={14} /> 실제 분쟁 판례 반영
                </div>
                <h2>심층 리포트</h2>
                <p>합의안 서비스 결제 시 무료로 제공됩니다.</p>
              </div>
              
              <div className="premium-card-list">

                {/* Card: 나머지 고위험 충돌 대화세트 */}
                {(() => {
                  const remaining = (teamInsight.topPriorityConflicts ?? []).slice(3);
                  if (remaining.length === 0) return null;
                  const renderItemPeek = (issue: typeof remaining[number], rankIdx: number) => {
                    const script = SCRIPTS[issue.id];
                    if (!script) return null;
                    return (
                      <div key={issue.id} style={{ background: "#fff", borderRadius: "16px", border: "1px solid #e8edf4", overflow: "hidden", marginBottom: "10px" }}>
                        <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f3f9", display: "flex", alignItems: "center", gap: "14px" }}>
                          <span style={{ fontSize: "28px", fontWeight: "900", color: "#5b5be7", lineHeight: 1, letterSpacing: "-1px", flexShrink: 0 }}>0{rankIdx + 1}</span>
                          <div>
                            <span style={{ fontSize: "11px", fontWeight: "700", color: "#dc2626", display: "block", marginBottom: "4px" }}>고위험 충돌</span>
                            <p style={{ fontSize: "17px", fontWeight: "800", color: "#1f2430", margin: 0 }}>{script.topic}</p>
                          </div>
                        </div>
                        <div style={{ padding: "14px 20px" }}>
                          <p style={{ fontSize: "13px", color: "#374151", lineHeight: "1.7", margin: 0 }}>{script.stake}</p>
                        </div>
                      </div>
                    );
                  };
                  const renderItemFull = (issue: typeof remaining[number], rankIdx: number) => {
                    const script = SCRIPTS[issue.id];
                    if (!script) return null;

                    const statSentence = script.stat.split("—")[0].trim();
                    return (
                      <div key={issue.id} style={{ background: "#fff", borderRadius: "20px", overflow: "hidden", boxShadow: "0 12px 28px rgba(29,35,63,0.08)", marginBottom: "10px" }}>
                        {/* 헤더 — 무료 아이템과 동일 */}
                        <div style={{ padding: "24px 28px 20px", borderBottom: "1px solid #f1f3f9", display: "flex", alignItems: "center", gap: "20px" }}>
                          <span style={{ fontSize: "36px", fontWeight: "900", color: "#5b5be7", lineHeight: 1, letterSpacing: "-2px", flexShrink: 0 }}>0{rankIdx + 1}</span>
                          <div>
                            <span style={{ fontSize: "11px", fontWeight: "700", color: "#dc2626", display: "block", marginBottom: "5px" }}>고위험 충돌</span>
                            <p style={{ fontSize: "17px", fontWeight: "800", color: "#1f2430", margin: 0, lineHeight: "1.35" }}>{script.topic}</p>
                          </div>
                        </div>
                        <div style={{ padding: "32px", display: "flex", flexDirection: "column", gap: "32px" }}>
                          {/* 팀원별 답변 — 무료 아이템과 동일 */}
                          {(() => {
                            const memberVals = (issue as typeof teamIssues[number]).memberValues ?? [];
                            if (memberVals.length < 2 || memberVals.every(mv => mv.value === "미입력")) return null;
                            return (
                              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                                {memberVals.map((mv, i) => (
                                  <div key={i} style={{ flex: "1 1 140px", background: "#e8edf4", borderRadius: "12px", padding: "14px 18px" }}>
                                    <span style={{ fontSize: "12px", fontWeight: "700", color: "#6366f1", display: "block", marginBottom: "6px" }}>{mv.name}</span>
                                    <span style={{ fontSize: "14px", color: "#1e293b", lineHeight: "1.6" }}>{mv.value}</span>
                                  </div>
                                ))}
                              </div>
                            );
                          })()}
                          {/* stake + dispute 하이라이트 — 무료 아이템과 동일 로직 */}
                          <p
                            style={{ fontSize: "14px", color: "#374151", lineHeight: "1.85", margin: 0 }}
                            dangerouslySetInnerHTML={{ __html: hlBody(script.stake, script.dispute) }}
                          />
                          {/* 통계 — TrendingUp + 회색 텍스트 */}
                          {statSentence && (
                            <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                              <TrendingUp size={14} color="#9ca3af" style={{ flexShrink: 0, marginTop: "2px" }} />
                              <p style={{ fontSize: "13px", color: "#9ca3af", fontWeight: "500", margin: 0, lineHeight: "1.6" }}>{statSentence}</p>
                            </div>
                          )}
                          {/* 대화 가이드 아코디언 — 무료 아이템과 동일 스타일, steps 전체 포함 */}
                          <div style={{ border: "1.5px solid #ddddf5", borderRadius: "12px", overflow: "hidden" }}>
                            <button
                              type="button"
                              onClick={() => toggleGuide(issue.id)}
                              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", background: "#f0f0fc", border: "none", cursor: "pointer", padding: "12px 18px", color: "#4a4ad6", fontSize: "14px", fontWeight: "700", width: "100%" }}
                            >
                              <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <MessageCircle size={16} />
                                대화 가이드 보기
                              </span>
                              <span style={{ fontSize: "16px", transition: "transform 0.2s", display: "inline-block", transform: openGuides.has(issue.id) ? "rotate(180deg)" : "rotate(0deg)" }}>▾</span>
                            </button>
                            {openGuides.has(issue.id) && (
                              <div style={{ padding: "16px 18px 18px", borderTop: "1px solid #e8e8f8", display: "flex", flexDirection: "column", gap: "16px", background: "#f8f8fe" }}>
                                <p style={{ fontSize: "14px", color: "#6b7280", lineHeight: "1.8", margin: 0, paddingLeft: "24px" }}>{script.guide}</p>
                                {script.steps.map((step, si) => (
                                  <div key={si}>
                                    <p style={{ fontSize: "12px", fontWeight: "700", color: "#475569", margin: "0 0 6px", paddingLeft: "24px" }}>Step {si + 1}. {step.title}</p>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "6px", paddingLeft: "24px" }}>
                                      {step.qs.map((q, qi) => (
                                        <p key={qi} style={{ fontSize: "14px", color: "#4f46e5", fontWeight: "600", margin: 0, lineHeight: "1.65" }}>&#8594; {q}</p>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  };
                  return (
                    <div className="premium-item-card">
                      <div className="card-header" style={{ marginBottom: "12px" }}>
                        <h3 className="card-emoji-title" style={{ display: "flex", alignItems: "center", gap: "8px" }}><ShieldAlert size={18} color="#dc2626" /> 충돌 안건별 실전 대화 스크립트</h3>
                        <p className="clear-text">상위 3개 외 <strong>{remaining.length}개</strong>의 충돌 안건 대화세트가 더 있습니다.</p>
                      </div>
                      {/* 04번 — stake 전체 + 대화 질문 미리보기 */}
                      <div className="clear-preview">
                        {renderItemFull(remaining[0], 3)}
                      </div>
                      {/* 05번~ 피크: 헤더만 살짝 보이다 페이드로 잘림 */}
                      {remaining.length > 1 && (
                        <div style={{ position: "relative", marginTop: "2px" }}>
                          <div style={{ maxHeight: "86px", overflow: "hidden", pointerEvents: "none" }}>
                            {renderItemPeek(remaining[1], 4)}
                          </div>
                          <div style={{
                            position: "absolute", inset: 0,
                            background: "linear-gradient(to bottom, rgba(248,250,252,0) 10%, rgba(248,250,252,0.92) 58%, #f8fafc 100%)",
                            display: "flex", flexDirection: "column",
                            alignItems: "center", justifyContent: "flex-end",
                            gap: "8px", paddingBottom: "4px"
                          }}>
                            <span style={{
                              fontSize: "12px", fontWeight: "700",
                              background: "#fff", border: "1px solid #e2e8f0",
                              borderRadius: "999px", padding: "4px 14px",
                              color: "#64748b", boxShadow: "0 1px 4px rgba(0,0,0,0.06)"
                            }}>
                              +{remaining.length - 1}개 더 있습니다
                            </span>
                            <button
                              className="btn btn-primary unlock-btn"
                              onClick={() => router.push(`/agreement/preview?teamId=${activeTeamId}`)}
                            >
                              <Lock size={13} style={{ marginRight: "5px", display: "inline", verticalAlign: "middle" }} />
                              심층 리포트 잠금 해제하기
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Card: 사업 단계별 충돌 타임라인 */}
                {(() => {
                  const STAGES = [
                    {
                      name: "팀 결성 직후", period: "창업 ~ 3개월", ids: ["q1","q2","q9"], color: "#6366f1",
                      narrative: "설레고 에너지 넘치는 시기. 모두가 같은 방향을 바라보는 것처럼 느껴진다. 하지만 '당연히 이렇게 하겠지'라는 가정이 조용히 쌓이고 있다. 역할, 업무 시간, 레드라인 — 말하지 않아도 통할 거라 믿는 것들이 첫 번째 균열의 원인이 된다.",
                      trigger: "첫 번째 실무 충돌. \"이건 네 일 아니야?\" 또는 \"왜 나한테 말 안 했어?\"",
                      stat: "스타트업 팀 갈등의 62%가 창업 후 6개월 이내 첫 균열을 경험합니다.",
                    },
                    {
                      name: "제품 개발기", period: "3 ~ 9개월", ids: ["q3","q7","q13","q14","q15","q16"], color: "#f97316",
                      narrative: "야근이 시작되고 기여도 차이가 눈에 보이기 시작한다. 명시된 기준이 없는 상태에서 의사결정 충돌이 반복되면, '이 사람이 나만큼 헌신하고 있나'라는 의심이 쌓인다. 이 시기 감정은 겉으로 드러나지 않고 임계점을 향해 조용히 차오른다.",
                      trigger: "채용, 피버팅, 외주 계약처럼 구체적인 결정 앞에서 방향이 처음 갈릴 때.",
                      stat: "팀 갈등으로 인한 스타트업 실패 비율 23%, 이 단계에서 절반 이상이 발생합니다.",
                    },
                    {
                      name: "자금 압박기", period: "9 ~ 18개월", ids: ["q8","q10","q11","q17"], color: "#ef4444",
                      narrative: "런웨이가 실감된다. 감정의 여유가 사라지고 작은 결정에서도 예민해진다. 이 시기의 대화는 평소보다 훨씬 날카롭다. 자금 위기에서 한 명이 먼저 흔들리면, 상대방은 그것을 '열정 차이'로 읽는다.",
                      trigger: "급여 논의, 추가 출자 요청, 피벗 vs. 지속 결정. 합의 기준 없이 맞닥뜨리면 감정 폭발.",
                      stat: "자금 부족이 폐업 사유 1위(53.2%). 이 시기 투자 위축 체감 창업자 63.2%.",
                    },
                    {
                      name: "투자 유치", period: "18개월 ~", ids: ["q6","q12","q18","q19","q20"], color: "#dc2626",
                      narrative: "외부 자금이 들어오는 순간 팀의 역학이 바뀐다. 지분이 희석되고, 이사회가 생기고, 창업자의 권한이 제한된다. 이 시기는 파트너십을 처음으로 재정의해야 하는 시점이며, 사전 합의 없이 투자 협상 테이블에 앉으면 파트너 간 균열이 처음 수면 위로 드러난다.",
                      trigger: "투자 조건 협상 중 지분 희석 허용 범위, 이사회 구성에서 파트너 간 견해 차이가 노출될 때.",
                      stat: "전체 동업 분쟁의 40%가 지분 문제에서 시작. 투자 유치 전후 팀 분열 빈도 최고조.",
                    },
                    {
                      name: "이탈·분쟁", period: "언제든지", ids: ["q4","q5"], color: "#991b1b",
                      narrative: "이탈은 예고 없이 온다. 그리고 사전 합의 없이 진행되면 24시간 안에 법적 영역으로 들어간다. 계좌, 코드 저장소, 고객 데이터, 법인 인감 — 누가 무엇을 언제 넘기는지 정해두지 않으면 남은 사람이 가장 큰 피해를 입는다.",
                      trigger: "퇴사 의사 표명 직후. 권한 회수 절차가 없으면 분쟁은 그날부터 시작된다.",
                      stat: "이탈 창업자 관련 정산·지분 분쟁 판례 지속 증가. 초기 합의 미비 팀의 60%가 1년 내 분쟁 경험.",
                    },
                  ];
                  const conflictSet = new Set((teamInsight.topPriorityConflicts ?? []).map(c => c.id));
                  const diffSet = new Set(teamIssues.filter(i => i.status === "diff").map(i => i.id));
                  const hasAnyConflict = STAGES.some(s => s.ids.some(id => conflictSet.has(id) || diffSet.has(id)));
                  if (!hasAnyConflict) return null;

                  // 타임라인 전용 단계 카드 — 단계 서사 + 트리거 + 통계 + 우리 팀 노출 안건
                  const renderStageCard = (stage: typeof STAGES[number]) => {
                    const sc = stage.ids.filter(id => conflictSet.has(id));
                    const sd = stage.ids.filter(id => !conflictSet.has(id) && diffSet.has(id));
                    const issueIds = [...sc, ...sd];
                    const riskLevel = sc.length > 0 ? "high" : sd.length > 0 ? "mid" : "ok";

                    return (
                      <div key={stage.name} style={{ background: "#fff", borderRadius: "20px", overflow: "hidden", boxShadow: "0 12px 28px rgba(29,35,63,0.08)", marginBottom: "12px" }}>
                        {/* 헤더 */}
                        <div style={{ padding: "20px 28px 18px", borderBottom: "1px solid #f1f3f9", display: "flex", alignItems: "center", gap: "14px" }}>
                          <div style={{
                            width: "12px", height: "12px", borderRadius: "50%", flexShrink: 0,
                            background: stage.color, boxShadow: `0 0 0 4px ${stage.color}22`
                          }} />
                          <div style={{ flex: 1 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "3px" }}>
                              {riskLevel === "high" && <span style={{ fontSize: "10px", fontWeight: "800", color: "#dc2626", background: "#fff1f2", border: "1px solid #fecaca", borderRadius: "4px", padding: "1px 6px" }}>우리 팀 충돌 {sc.length}건</span>}
                              {riskLevel === "mid" && <span style={{ fontSize: "10px", fontWeight: "700", color: "#c2410c", background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: "4px", padding: "1px 6px" }}>우리 팀 차이 {sd.length}건</span>}
                              <span style={{ fontSize: "10px", color: "#94a3b8", background: "#f1f5f9", padding: "1px 7px", borderRadius: "4px" }}>{stage.period}</span>
                            </div>
                            <p style={{ fontSize: "17px", fontWeight: "800", color: "#1f2430", margin: 0 }}>{stage.name}</p>
                          </div>
                        </div>
                        {/* 바디 */}
                        <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: "20px" }}>
                          {/* 단계 서사 */}
                          <p style={{ fontSize: "14px", color: "#374151", lineHeight: "1.85", margin: 0 }}>{stage.narrative}</p>
                          {/* 충돌 트리거 */}
                          <div style={{ background: "#f8f8fe", borderRadius: "12px", padding: "14px 18px", borderLeft: `3px solid ${stage.color}` }}>
                            <span style={{ fontSize: "10px", fontWeight: "800", color: stage.color, display: "block", marginBottom: "5px", letterSpacing: "0.3px" }}>충돌 트리거</span>
                            <p style={{ fontSize: "13px", color: "#334155", margin: 0, lineHeight: "1.7", fontWeight: "500" }}>{stage.trigger}</p>
                          </div>
                          {/* 통계 */}
                          <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                            <TrendingUp size={14} color="#9ca3af" style={{ flexShrink: 0, marginTop: "2px" }} />
                            <p style={{ fontSize: "13px", color: "#9ca3af", fontWeight: "500", margin: 0, lineHeight: "1.6" }}>{stage.stat}</p>
                          </div>
                          {/* 우리 팀 노출 안건 */}
                          {issueIds.length > 0 && (
                            <div>
                              <span style={{ fontSize: "11px", fontWeight: "700", color: "#475569", display: "block", marginBottom: "8px" }}>우리 팀이 이 시기에 노출된 안건</span>
                              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                                {issueIds.map(id => {
                                  const iss = teamIssues.find(i => i.id === id);
                                  const isC = conflictSet.has(id);
                                  return iss ? (
                                    <span key={id} style={{
                                      fontSize: "12px", fontWeight: "600",
                                      color: isC ? "#dc2626" : "#c2410c",
                                      background: isC ? "#fff1f2" : "#fff7ed",
                                      border: `1px solid ${isC ? "#fecaca" : "#fed7aa"}`,
                                      borderRadius: "8px", padding: "4px 11px"
                                    }}>
                                      {isC ? "⚠ " : "△ "}{iss.label}
                                    </span>
                                  ) : null;
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  };

                  return (
                    <div className="premium-item-card">
                      <h3 className="card-emoji-title" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <TrendingUp size={18} color="#10b981" /> 충돌이 터지는 사업 단계별 위험 타임라인
                      </h3>
                      <p className="clear-text" style={{ marginBottom: "20px" }}>스타트업 성장 단계별로 충돌이 실제로 터지는 시점과 우리 팀 안건을 매핑했습니다.</p>

                      {/* 리스크 커브 그래프 */}
                      {(() => {
                        // 일반적 창업팀 리스크 곡선 Y값 (0=낮음, 100=높음, 위에서 아래로)
                        const riskY = [62, 45, 18, 28, 50]; // 자금압박기 최고위험
                        const W = 480, H = 140, PAD = { top: 18, bottom: 34, left: 8, right: 8 };
                        const chartW = W - PAD.left - PAD.right;
                        const chartH = H - PAD.top - PAD.bottom;
                        const xs = STAGES.map((_, i) => PAD.left + (i / (STAGES.length - 1)) * chartW);
                        const ys = riskY.map(v => PAD.top + (v / 100) * chartH);
                        // 베지어 곡선 path
                        let d = `M ${xs[0]} ${ys[0]}`;
                        for (let i = 1; i < xs.length; i++) {
                          const cpx = (xs[i - 1] + xs[i]) / 2;
                          d += ` C ${cpx} ${ys[i-1]}, ${cpx} ${ys[i]}, ${xs[i]} ${ys[i]}`;
                        }
                        const fillD = `${d} L ${xs[xs.length-1]} ${H} L ${xs[0]} ${H} Z`;
                        return (
                          <div style={{ marginBottom: "20px" }}>
                            <p style={{ fontSize: "10px", fontWeight: "700", color: "#94a3b8", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "6px" }}>창업팀 갈등 리스크 구간</p>
                            <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: "500px", height: "auto", overflow: "visible", display: "block", margin: "0 auto" }}>
                              <defs>
                                <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#6366f1" stopOpacity="0.15" />
                                  <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                                </linearGradient>
                              </defs>
                              {/* 채움 영역 */}
                              <path d={fillD} fill="url(#riskGrad)" />
                              {/* 곡선 */}
                              <path d={d} fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" />
                              {/* 각 스테이지 마커 */}
                              {STAGES.map((stage, idx) => {
                                const hasIssue = stage.ids.some(id => conflictSet.has(id) || diffSet.has(id));
                                const isConflict = stage.ids.some(id => conflictSet.has(id));
                                const conflictCount = stage.ids.filter(id => conflictSet.has(id)).length;
                                const diffCount = stage.ids.filter(id => !conflictSet.has(id) && diffSet.has(id)).length;
                                const x = xs[idx], y = ys[idx];
                                return (
                                  <g key={stage.name}>
                                    {/* 드롭라인 */}
                                    <line x1={x} y1={y} x2={x} y2={H - PAD.bottom + 4} stroke={hasIssue ? "#6366f1" : "#e2e8f0"} strokeWidth="1" strokeDasharray="3 2" />
                                    {/* 마커 원 */}
                                    {isConflict && <circle cx={x} cy={y} r="10" fill="rgba(99,102,241,0.12)" />}
                                    <circle cx={x} cy={y} r="5" fill={hasIssue ? "#6366f1" : "#e2e8f0"} stroke="#fff" strokeWidth="2" />
                                    {/* 뱃지 */}
                                    {(conflictCount > 0 || diffCount > 0) && (
                                      <text x={x} y={y - 14} textAnchor="middle" fontSize="11" fontWeight="800" fill={isConflict ? "#dc2626" : "#c2410c"}>
                                        {isConflict ? `충돌 ${conflictCount}` : `차이 ${diffCount}`}
                                      </text>
                                    )}
                                    {/* 스테이지 라벨 */}
                                    <text x={x} y={H - PAD.bottom + 14} textAnchor="middle" fontSize="11" fontWeight="700" fill={hasIssue ? "#1f2430" : "#94a3b8"}>
                                      {stage.name}
                                    </text>
                                  </g>
                                );
                              })}
                            </svg>
                          </div>
                        );
                      })()}

                      {/* 1단계 헤더만 공개, 본문부터 블러+페이드 */}
                      <div style={{ background: "#fff", borderRadius: "20px", overflow: "hidden", boxShadow: "0 12px 28px rgba(29,35,63,0.08)", marginBottom: "12px" }}>
                        {/* 헤더 — 공개 */}
                        {(() => {
                          const s = STAGES[0];
                          const sc = s.ids.filter(id => conflictSet.has(id));
                          const sd = s.ids.filter(id => !conflictSet.has(id) && diffSet.has(id));
                          return (
                            <div style={{ padding: "20px 28px 18px", borderBottom: "1px solid #f1f3f9", display: "flex", alignItems: "center", gap: "14px" }}>
                              <div style={{ width: "12px", height: "12px", borderRadius: "50%", flexShrink: 0, background: s.color, boxShadow: `0 0 0 4px ${s.color}22` }} />
                              <div style={{ flex: 1 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "3px" }}>
                                  {sc.length > 0 && <span style={{ fontSize: "10px", fontWeight: "800", color: "#dc2626", background: "#fff1f2", border: "1px solid #fecaca", borderRadius: "4px", padding: "1px 6px" }}>우리 팀 충돌 {sc.length}건</span>}
                                  {sc.length === 0 && sd.length > 0 && <span style={{ fontSize: "10px", fontWeight: "700", color: "#c2410c", background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: "4px", padding: "1px 6px" }}>우리 팀 차이 {sd.length}건</span>}
                                </div>
                                <p style={{ fontSize: "17px", fontWeight: "800", color: "#1f2430", margin: 0 }}>{s.name}</p>
                              </div>
                            </div>
                          );
                        })()}
                        {/* 본문 — 고정 높이로 자르고 바로 페이드 */}
                        <div style={{ position: "relative", height: "160px", overflow: "hidden" }}>
                          <div style={{ filter: "blur(3px)", pointerEvents: "none", userSelect: "none", padding: "20px 28px" }}>
                            <p style={{ fontSize: "14px", color: "#374151", lineHeight: "1.85", margin: "0 0 16px" }}>{STAGES[0].narrative}</p>
                            <div style={{ background: "#f8f8fe", borderRadius: "12px", padding: "14px 18px", borderLeft: `3px solid ${STAGES[0].color}` }}>
                              <span style={{ fontSize: "10px", fontWeight: "800", color: STAGES[0].color, display: "block", marginBottom: "5px" }}>충돌 트리거</span>
                              <p style={{ fontSize: "13px", color: "#334155", margin: 0, lineHeight: "1.7", fontWeight: "500" }}>{STAGES[0].trigger}</p>
                            </div>
                          </div>
                          {/* 페이드 */}
                          <div style={{
                            position: "absolute", inset: 0, pointerEvents: "none",
                            background: "linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0.82) 50%, #fff 80%)"
                          }} />
                        </div>
                        {/* 자물쇠 CTA */}
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", padding: "4px 0 24px" }}>
                          <span style={{ fontSize: "12px", fontWeight: "700", background: "#fff", border: "1px solid #e2e8f0", borderRadius: "999px", padding: "4px 14px", color: "#64748b", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                            +{STAGES.length - 1}단계 더 있습니다 · 우리 팀 안건 {STAGES.reduce((acc, s) => acc + s.ids.filter(id => conflictSet.has(id) || diffSet.has(id)).length, 0)}건
                          </span>
                          <button
                            className="btn btn-primary unlock-btn"
                            onClick={() => router.push(`/agreement/preview?teamId=${activeTeamId}`)}
                          >
                            <Lock size={13} style={{ marginRight: "5px", display: "inline", verticalAlign: "middle" }} />
                            심층 리포트 잠금 해제하기
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Card 1 */}
                <div className="premium-item-card">
                  <h3 className="card-emoji-title" style={{ display: "flex", alignItems: "center", gap: "8px" }}><ShieldAlert size={18} color="#ef4444" /> 언제 터질지 모르는 우리 팀 시한폭탄</h3>

                  {/* 공개 — 배지 + 타이틀만 */}
                  <div style={{ padding: "20px 0 20px", borderBottom: "1px solid #f1f3f9", marginBottom: "20px" }}>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "#fff1f2", border: "1px solid #fecaca", borderRadius: "999px", padding: "5px 14px", marginBottom: "14px" }}>
                      <ShieldAlert size={12} color="#dc2626" />
                      <span style={{ fontSize: "11px", fontWeight: "800", color: "#dc2626" }}>1순위 법적 분쟁 위험</span>
                    </div>
                    <p style={{ fontSize: "17px", fontWeight: "800", color: "#1f2430", margin: 0, lineHeight: "1.4" }}>
                      {teamInsight.topPriorityIssuesArray?.[0]?.label ?? "지분/권한 충돌"}
                    </p>
                  </div>

                  {/* 블러+페이드 — 타이틀 아래 전부 블러, 왼쪽 정렬 줄글 */}
                  <div style={{ position: "relative", overflow: "hidden", height: "260px" }}>
                    <div style={{ filter: "blur(4px)", pointerEvents: "none", userSelect: "none", display: "flex", flexDirection: "column", gap: "18px" }}>
                      <p style={{ fontSize: "14px", color: "#374151", lineHeight: "1.9", margin: 0 }}>
                        <strong>상법 제388조</strong>에 따르면 이사의 보수는 정관 또는 주주총회 결의로 정해야 하며, 내부 합의만으로 운영하다 분쟁이 발생하면 법원은 공식 결의 없는 급여 조정을 무효로 판단합니다. 공동창업자가 등기임원으로만 설정된 경우 근로기준법상 근로자에 해당하지 않아 퇴직금·체불임금 청구가 불가능할 수 있는 반면, <strong>대법원 2003다50580 판례</strong>는 등기임원이라도 실질적 근로자 역할 수행 시 근로기준법 적용을 인정해, 급여 지급 형태를 명확히 문서화하지 않으면 어느 방향으로도 분쟁이 발생할 수 있습니다.
                      </p>
                      <p style={{ fontSize: "14px", color: "#374151", lineHeight: "1.9", margin: 0 }}>
                        로톡 법률 상담 데이터에 따르면 공동창업자 급여 분쟁의 68%가 구두 약속에서 비롯됩니다. "수익이 나면 급여를 올리기로 했다", "투자 유치 후 스톡옵션을 주기로 했다"는 식의 합의는 민법 제109조 착오·제110조 사기를 각자 다르게 주장하게 되며, 서면 증거 없이는 어느 쪽도 입증이 어렵습니다. 성과 기반 인센티브를 구두로 약속하고 이행하지 않은 경우 <strong>민법 제741조 부당이득 반환</strong> 또는 제750조 손해배상 청구 대상이 됩니다.
                      </p>
                      <p style={{ fontSize: "14px", color: "#374151", lineHeight: "1.9", margin: 0 }}>
                        2순위 위험 안건인 {teamInsight.topPriorityIssuesArray?.[1]?.label ?? "의사결정 교착"}의 경우, 급여 조정 결정 권한이 불명확한 상태에서 이견이 발생하면 50:50 지분 구조에서 의결 교착(deadlock)으로 이어지고, <strong>상법 제467조</strong>에 따른 법원의 업무집행자 선임 청구 또는 회사 해산 청구로 번질 수 있습니다. 초기 합의 문서화가 이 모든 시나리오를 예방하는 가장 효과적인 수단입니다.
                      </p>
                    </div>
                    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0.7) 40%, #fff 72%)" }} />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", paddingTop: "4px" }}>
                    <span style={{ fontSize: "12px", fontWeight: "700", background: "#fff", border: "1px solid #e2e8f0", borderRadius: "999px", padding: "4px 14px", color: "#64748b", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                      +{Math.max(0, (teamInsight.topPriorityIssuesArray?.length ?? 0) - 1)}개 리스크 분석 더 있습니다
                    </span>
                    <button className="btn btn-primary unlock-btn" onClick={() => router.push(`/agreement/preview?teamId=${activeTeamId}`)}>
                      <Lock size={13} style={{ marginRight: "5px", display: "inline", verticalAlign: "middle" }} /> 심층 리포트 잠금 해제하기
                    </button>
                  </div>
                </div>

                {/* Card 4 */}
                <div className="premium-item-card">
                  <h3 className="card-emoji-title" style={{ display: "flex", alignItems: "center", gap: "8px" }}><Compass size={18} color="#6366f1" /> 실무 기반 합의 가이드</h3>

                  {/* 공개 — 배지 + 타이틀 */}
                  <div style={{ padding: "20px 0 20px", borderBottom: "1px solid #f1f3f9", marginBottom: "20px" }}>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "#ede9fe", border: "1px solid #c4b5fd", borderRadius: "999px", padding: "5px 14px", marginBottom: "14px" }}>
                      <Star size={11} color="#7c3aed" fill="#7c3aed" />
                      <span style={{ fontSize: "11px", fontWeight: "800", color: "#7c3aed" }}>시장 표준 권장 가이드</span>
                    </div>
                    <p style={{ fontSize: "17px", fontWeight: "800", color: "#1f2430", margin: 0, lineHeight: "1.4" }}>
                      {teamInsight.topPriorityIssuesArray?.[0]?.label ?? "주요 안건"}에 대한 합의 기준
                    </p>
                  </div>

                  {/* 블러+페이드 — 타이틀 아래 전부 블러, 줄글 */}
                  <div style={{ position: "relative", overflow: "hidden", height: "260px" }}>
                    <div style={{ filter: "blur(4px)", pointerEvents: "none", userSelect: "none", display: "flex", flexDirection: "column", gap: "18px" }}>
                      <p style={{ fontSize: "14px", color: "#374151", lineHeight: "1.9", margin: 0 }}><strong>베스팅(Vesting) 구조 도입</strong>이 국내 스타트업 법률 자문에서 가장 많이 권장되는 방식입니다. 통상 4년 베스팅에 1년 클리프(cliff)를 적용하여, 창업 후 1년 내 이탈 시 지분이 전혀 확정되지 않고 이후 월 단위로 1/36씩 확정되는 구조입니다. 이 방식은 국내 상법상 주주간계약서(SHA)에 명시하고, 이탈 시 잔여 지분을 액면가 또는 취득가로 강제 매수할 수 있는 콜옵션(call option) 조항과 함께 설계해야 법적 효력이 생깁니다.</p>
                      <p style={{ fontSize: "14px", color: "#374151", lineHeight: "1.9", margin: 0 }}>{teamInsight.topPriorityIssuesArray?.[1]?.label ?? "의사결정 방식"} 안건에 대해서는 역할 기반 단독 결정 한도를 금액으로 명시하는 방식이 실무에서 가장 효과적입니다. 로톡 변호사 상담 사례 분석에 따르면, "월 100만 원 이하 지출은 각자 단독 결정, 그 이상은 공동 승인"처럼 금액 기준을 명시한 팀은 의사결정 분쟁 발생률이 그렇지 않은 팀 대비 72% 낮은 것으로 나타났습니다. 금액 기준 외에도 인사, 투자, 제품 방향 등 카테고리별 최종 결정권자를 사전에 지정해두는 것이 교착 상태를 방지하는 핵심입니다.</p>
                      <p style={{ fontSize: "14px", color: "#374151", lineHeight: "1.9", margin: 0 }}>{teamInsight.topPriorityIssuesArray?.[2]?.label ?? "퍼포먼스 기준"} 관련해서는 OKR(목표·핵심결과) 또는 KPI를 분기 단위로 문서화하고, 기준 미달 시 역할 조정 프로세스를 미리 합의해두는 것이 표준입니다. 특히 국내 법원은 성과 부진을 이유로 한 역할 조정이 근로계약 위반에 해당하는지 여부를 판단할 때, 사전에 합의된 성과 기준 문서의 존재 여부를 핵심 증거로 활용합니다(서울중앙지법 2021가합 참조). 구체적 기준 없이 구두로 "3개월 뒤 보자"고 한 약속은 법적 구속력이 없습니다.</p>
                      <p style={{ fontSize: "14px", color: "#374151", lineHeight: "1.9", margin: 0 }}>{teamInsight.topPriorityIssuesArray?.[3]?.label ?? "비밀유지·겸업금지"} 조항은 반드시 별도 서면으로 체결해야 합니다. 주주간계약서 내 포함하는 것만으로는 부족하며, 대상 정보의 범위·유효 기간·위반 시 손해배상 기준을 구체적으로 명시해야 법적 효력이 인정됩니다. 공정거래위원회 가이드라인 및 부정경쟁방지법 제2조에 따라, 겸업금지 기간은 통상 퇴직 후 1~2년 이내, 지역적 범위는 국내로 한정할 때 유효성이 가장 높습니다.</p>
                    </div>
                    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0.7) 40%, #fff 72%)" }} />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", paddingTop: "4px" }}>
                    <span style={{ fontSize: "12px", fontWeight: "700", background: "#fff", border: "1px solid #e2e8f0", borderRadius: "999px", padding: "4px 14px", color: "#64748b", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                      안건별 합의 가이드 {(teamInsight.topPriorityIssuesArray?.length ?? 0)}개 더 있습니다
                    </span>
                    <button className="btn btn-primary unlock-btn" onClick={() => router.push(`/agreement/preview?teamId=${activeTeamId}`)}>
                      <Lock size={13} style={{ marginRight: "5px", display: "inline", verticalAlign: "middle" }} /> 심층 리포트 잠금 해제하기
                    </button>
                  </div>
                </div>


              </div>
            </div>
          </>
        )}
      </section>

      {/* 데모평가 섹션 — 리포트가 열린 팀에게만 표시 */}
      {showReport && <section style={{ padding: "56px 20px", background: "#f8fafc", textAlign: "center", borderTop: "1px solid #e2e8f0" }}>
        <div style={{ maxWidth: "480px", margin: "0 auto" }}>
          <p style={{ fontSize: "11px", fontWeight: "700", color: "#6366f1", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "12px" }}>FEEDBACK</p>
          <h2 style={{ fontSize: "22px", fontWeight: "800", color: "#1f2430", marginBottom: "10px", lineHeight: "1.35" }}>리포트가 도움이 되셨나요?</h2>
          <p style={{ fontSize: "14px", color: "#64748b", marginBottom: "28px", lineHeight: "1.7", wordBreak: "keep-all" }}>3분 데모 평가에 참여해 CoSync를 함께 만들어 주세요. <br />여러분의 의견이 서비스를 만들어갑니다.</p>
          <a href="https://forms.gle/h4Xyp7GD4jcicqpM8" target="_blank" rel="noopener noreferrer" className="btn" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", width: "100%", maxWidth: "480px", padding: "18px 28px", fontSize: "16px", border: "1.5px solid #6366f1", color: "#6366f1", background: "transparent", fontWeight: 700, borderRadius: "999px", margin: "0 auto" }}>
            데모 평가 참여하기 →
          </a>
        </div>
      </section>}


      <Footer />

      {showSubscribe && (
        <div className="subscribe-backdrop" role="dialog" aria-modal="true" aria-labelledby="subscribe-title">
          <div className="subscribe-card">
            <button
              className="close"
              type="button"
              autoFocus
              onClick={() => setShowSubscribe(false)}
              aria-label="닫기"
            >
              ✕
            </button>
            <h3 id="subscribe-title">팀이 작을 때 하는 합의가 가장 쉽습니다</h3>
            <p>
              기업이 성장할수록, 같은 문제의 갈등 비용도 커집니다. <br />
              사전신청 팀에게 먼저 열립니다.
            </p>
            <div className="preview-slider">
              <Swiper
                modules={[Autoplay, Pagination, Keyboard]}
                autoplay={
                  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches 
                    ? false 
                    : { delay: 2400, disableOnInteraction: false }
                }
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
              <button
                className="btn btn-primary"
                type="button"
                onClick={() => {
                  setShowSubscribe(false);
                  document.getElementById("earlybird-section")?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                사전신청하기 →
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
              <div className="modal-grid">
                {[...(activeIssue as typeof teamIssues[number]).memberValues]
                  .sort((a, b) => (a.id === user?.uid ? -1 : b.id === user?.uid ? 1 : 0))
                  .map((mv) => (
                  <div key={mv.id} className="modal-user">
                    <div className="user-head">
                      <div className="avatar">{mv.name?.[0] ?? "?"}</div>
                      <div className="user-name">{mv.name}{mv.id === user?.uid ? " (나)" : ""}</div>
                    </div>
                    <div className="quote">{mv.value}</div>
                  </div>
                ))}
              </div>
              <div className="insight">
                <span className="spark"><Lightbulb size={18} /></span>
                <div>
                  <p>{activeIssue.insight.split("지금 맞춰볼 질문:")[0].trim()}</p>
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
                    if (profile?.plan === 'premium' && profile?.subscriptionStatus === 'active') {
                      router.push(`/consensus${activeTeamId ? `?teamId=${activeTeamId}` : ""}`);
                    } else {
                      setShowSubscribe(true);
                    }
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

export default function GapReportPage() {
  return (
    <Suspense>
      <GapReportPageInner />
    </Suspense>
  );
}
