"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useMemo, useState, type CSSProperties } from "react";
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
import { AlertTriangle, TrendingUp, MessageCircle, Lock, ShieldAlert, Compass, FileText, RefreshCw, Star, Scale, Lightbulb } from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";

type QuestionDef = {
  id: string;
  label: string;
  field: keyof OnboardingAnswers;
  toxicPairs: [string, string][];
  optionLabels: Record<string, string>;
  question: string;
};

function generateInsight(def: QuestionDef): string {
  const stake = SCRIPTS[def.id]?.stake;
  const question = `지금 맞춰볼 질문: ${def.question}`;
  return stake ? `${stake} ${question}` : question;
}

// Q1~Q12: 기본 진단 (역할3 + 이탈3 + 비전3 + 조달3)
// Q13~Q20: 심화 진단 (의사결정4 + 지분4)
const QUESTION_DEFS: QuestionDef[] = [
  { id: "q1",  label: "회색지대 업무 배정",   field: "extraWorkPriority",    toxicPairs: [["3","4"]],          optionLabels: {"1":"일단 직접 처리","2":"담당자 정해 역할 나눔","3":"현재 우선순위 유지","4":"구조적으로 해결"}, question: "회색지대 업무를 누가 어떤 기준으로 결정할지 정해둔 게 있나요?" },
  { id: "q2",  label: "업무 몰입 시간 기대",   field: "extraWorkPrinciple",   toxicPairs: [["1","3"],["1","4"]], optionLabels: {"1":"초기엔 당연히 해야지","2":"하되 미리 알려줘야","3":"개인 시간은 지켜야","4":"업무 외 시간 요청은 거절"}, question: "서로에게 기대하는 '최소 가용 시간' 기준이 말로 맞춰진 적 있나요?" },
  { id: "q3",  label: "퍼포먼스 조치",         field: "underperformanceAction",toxicPairs: [["1","4"],["3","4"]], optionLabels: {"1":"즉시 역할 조정","2":"기준·타임라인 설정","3":"원인 파악 후 지원","4":"구조 변경 논의"}, question: "성과 부진이 몇 달 지속될 때 역할 조정을 논의하기로 할까요?" },
  { id: "q4",  label: "우선 정리 권한",         field: "exitRecoveryPriority", toxicPairs: [["1","2"],["2","4"]], optionLabels: {"1":"시스템 권한 회수 우선","2":"고객 관계 인수인계 우선","3":"운영 문서 정리 우선","4":"법적 처리 우선"}, question: "이탈 발생 시 첫 24시간 안에 처리할 권한 회수 순서가 정해져 있나요?" },
  { id: "q5",  label: "권한 차단 타이밍",       field: "exitCleanupTiming",    toxicPairs: [["1","3"],["1","4"]], optionLabels: {"1":"즉시 모든 권한 차단","2":"인수인계 후 단계적 차단","3":"2~4주 순차 처리","4":"절차 완료 후 차단"}, question: "퇴사 의사 확인 시점부터 권한 단계별 차단 절차가 문서로 있나요?" },
  { id: "q6",  label: "이탈 시 지분 정리",      field: "exitDisputeResolution",toxicPairs: [["1","4"],["2","4"]], optionLabels: {"1":"등기 지분 그대로 인정","2":"기여도 기준 재산정","3":"제3자 통해 결정","4":"직접 협의"}, question: "이탈 시 지분 정리의 최우선 기준이 지금 당장 합의되어 있나요?" },
  { id: "q7",  label: "회사 출구 전략",          field: "exitVision",           toxicPairs: [["1","3"]],          optionLabels: {"1":"M&A 엑싯","2":"IPO","3":"수익성 독립 운영","4":"아직 미정"}, question: "3~5년 후 이 회사의 이상적인 결말을 한 번이라도 맞춰본 적 있나요?" },
  { id: "q8",  label: "피벗/중단 기준",          field: "pivotCriteria",        toxicPairs: [["1","2"]],          optionLabels: {"1":"자금 고갈 시","2":"시장 반응 없을 때","3":"핵심 팀원 이탈 시","4":"파트너 합의 불가 시"}, question: "방향 전환 또는 중단을 논의하는 기준이 지금 합의되어 있나요?" },
  { id: "q9",  label: "절대 용납 못하는 것",     field: "dealbreaker",          toxicPairs: [["1","4"]],          optionLabels: {"1":"결정 미루거나 느리게 움직임","2":"말한 것 지키지 않음","3":"결과 없이 이유만 댐","4":"방향 불일치 시 맞추지 않음"}, question: "서로가 절대 용납 못하는 것을 한 번이라도 직접 말한 적 있나요?" },
  { id: "q10", label: "런웨이 위기 대응",         field: "fundingRunway",        toxicPairs: [["1","4"],["2","3"]], optionLabels: {"1":"인원 감축 포함 비용 절감","2":"브릿지 투자 유치","3":"매출로 자체 생존","4":"급여 유예로 버팀"}, question: "런웨이 X개월 이하가 되면 어떤 순서로 대응할지 기준이 있나요?" },
  { id: "q11", label: "지출 승인 기준",           field: "spendingApproval",     toxicPairs: [["1","4"]],          optionLabels: {"1":"역할 범위 내 단독 결정","2":"금액 기준 사전 협의","3":"항목별 자율/협의 구분","4":"금액 무관 공동 승인"}, question: "단독 집행 가능한 금액 기준이 지금 합의되어 있나요?" },
  { id: "q12", label: "투자 조건 수락 기준",      field: "investmentCriteria",   toxicPairs: [["1","4"],["1","2"]], optionLabels: {"1":"밸류에이션 최우선","2":"투자자 전략적 가치 우선","3":"런웨이 확보 여부 기준","4":"속도 우선"}, question: "투자 수락/거절의 최우선 기준이 맞춰진 적 있나요?" },
  { id: "q13", label: "단독 결정권 범위",         field: "decisionStructure",    toxicPairs: [["1","3"]],          optionLabels: {"1":"내 영역이면 바로 실행","2":"알림만 보내고 진행","3":"의견 맞추고 진행","4":"함께 검토 후 결정"}, question: "각자 단독으로 최종 결정할 수 있는 범위나 기준이 있나요?" },
  { id: "q14", label: "실패 후 반응",             field: "decisionFailure",      toxicPairs: [["1","4"]],          optionLabels: {"1":"즉시 전략 변경","2":"원인 분석 후 논의","3":"데이터 더 수집 후 판단","4":"전략 유지 방식만 수정"}, question: "실패 후 다음 결정까지 최소한 어떤 과정을 거치기로 할까요?" },
  { id: "q15", label: "반대 의견 처리",           field: "actionVsConsensus",    toxicPairs: [["1","2"]],          optionLabels: {"1":"결정된 이상 최선","2":"계속 재검토 요청","3":"실행하되 이견 기록","4":"언급 않고 결과 지켜봄"}, question: "결정 후 반대 의견을 다시 꺼낼 수 있는 조건이 있나요?" },
  { id: "q16", label: "결정 속도 vs 확신",        field: "deadlockTolerance",    toxicPairs: [["1","2"]],          optionLabels: {"1":"담당 영역 결정 존중","2":"실험으로 데이터 판단","3":"외부 멘토 판단 위임","4":"완전한 설득 후 진행"}, question: "중요한 결정에서 '충분한 확신'의 기준이 맞춰진 적 있나요?" },
  { id: "q17", label: "급여 구조",                field: "salaryStructure",      toxicPairs: [["1","2"]],          optionLabels: {"1":"스톡옵션으로 유치","2":"성과 기반 현금 인센티브","3":"안정 후 보상 구조 설정","4":"급여만으로 운영"}, question: "파트너 간 급여 차등 기준이 지금 합의되어 있나요?" },
  { id: "q18", label: "지분 구조 철학",           field: "equityStructure",      toxicPairs: [["1","2"]],          optionLabels: {"1":"시장 관행 구조","2":"기여도·역할 비례","3":"핵심인력 외 최소화","4":"비슷한 비율로 나눔"}, question: "지분 조정 가능성에 대해 서로 입장을 명확히 말한 적 있나요?" },
  { id: "q19", label: "창업자 보상 기준",         field: "profitDistribution",   toxicPairs: [["1","2"],["2","4"]], optionLabels: {"1":"전액 재투자","2":"보상이 먼저","3":"재투자·인상 병행","4":"투자 전까지 현금 절약"}, question: "흑자 전환 시 창업자 급여 인상 기준이 미리 합의되어 있나요?" },
  { id: "q20", label: "성장 전략",                field: "growthStrategy",       toxicPairs: [["1","2"]],          optionLabels: {"1":"외부 투자로 빠른 성장","2":"수익으로 지분 지킴","3":"선택적 투자 유치","4":"비희석 자금 우선"}, question: "외부 투자와 지분 희석에 대한 입장이 맞춰진 적 있나요?" },
];

type ScriptEntry = { topic: string; open: string; steps: { title: string; qs: string[] }[]; keywords: string[]; stat: string; stake: string; dispute: string; guide: string };

const SCRIPTS: Record<string, ScriptEntry> = {
  q1:  { topic: "애매한 업무 담당", open: "나 요즘 누가 해야 하는 일인지 애매할 때 좀 불편하더라고. 잠깐 얘기해도 될까?", steps: [{ title: "각자 답답했던 순간 꺼내기", qs: ["그 일 네가 해야 한다고 생각했어, 내가 해야 한다고 생각했어?", "그때 왜 그렇게 생각했어?"] }, { title: "공통 전제 찾기", qs: ["우리 둘 다 애매한 일은 누군가 챙겨야 한다는 건 동의하지?"] }, { title: "기준 정하기", qs: ["앞으로 그런 일 생기면 누가 먼저 깃발 꽂기로 할까?", "결정 기한도 같이 정해놓을까?"] }], keywords: ["결정 권한자", "처리 기한"], stat: "스타트업 팀 와해의 65%가 인적 갈등에서 시작됩니다 (하버드 와서만 교수)", stake: "고객 컴플레인 대응, 외주 계약, 긴급 미팅 수락 같은 일상적 결정에서 '이거 네 거야 내 거야'가 불명확하면 실행이 멈춥니다. 특히 담당 영역 바깥 일이 생겼을 때 누가 먼저 움직여야 하는지 기준이 핵심입니다.", dispute: "한 명이 조용히 처리했는데 상대방이 '왜 나한테 말 안 했냐'고 하거나, 반대로 서로 기다리다 일이 터지는 패턴이 반복됩니다. 이게 쌓이면 신뢰 문제로 번집니다.", guide: "금액 또는 영향 범위를 기준으로 '혼자 해도 되는 것 / 공유해야 하는 것'을 먼저 나누세요. 모든 걸 나열할 필요 없이 기준 하나만 합의해도 됩니다." },
  q2:  { topic: "업무 시간 기대치", open: "저녁이나 주말에 서로 기대하는 게 다를 수 있을 것 같아서.", steps: [{ title: "각자 기대치 꺼내기", qs: ["저녁에 카톡 오면 당일에 봐줬으면 해? 아니면 다음날도 괜찮아?", "주말은 어때?"] }, { title: "공통 전제 찾기", qs: ["급한 건 빠르게, 급하지 않은 건 천천히라는 건 동의해?"] }, { title: "기준 정하기", qs: ["그럼 뭘 기준으로 급한 거라고 볼까?", "응답 가능 시간대를 정해놓는 게 나을까?"] }], keywords: ["응답 가능 시간대", "긴급 연락 기준"], stat: "스타트업 재직자의 35%가 근무 환경 불만으로 이탈합니다 (2025 트렌드 리포트)", stake: "저녁 9시에 온 메시지를 한 명은 당일 처리해야 한다고 생각하고, 다른 한 명은 내일 아침에 보면 된다고 생각할 수 있습니다. 이 기대 차이가 '열정 차이'처럼 느껴지기 시작하면 감정이 섞입니다.", dispute: "상대방이 늦게 답장하거나 주말에 연락이 안 닿을 때 '이 사람이 진짜 열심히 하는 건지' 의심하는 상황이 옵니다. 명시된 기준이 없으면 서로 피해자가 됩니다.", guide: "'긴급'의 정의를 먼저 합의하세요. 긴급 기준만 명확하면 나머지는 자연스럽게 따라옵니다. 채널도 나누면 좋습니다 (카톡 = 긴급, 슬랙 = 일반)." },
  q3:  { topic: "성과 부진 대응", open: "뻘쭘하지만 꼭 짚어야 할 것 같아서.", steps: [{ title: "각자 생각하는 기준 꺼내기", qs: ["성과가 얼마나 안 나와야 문제라고 느껴?", "그 기준이 어디서 왔어?"] }, { title: "공통 전제 찾기", qs: ["둘 다 어느 시점엔 대화가 필요하다는 건 동의하지?"] }, { title: "기준 정하기", qs: ["몇 개월을 기준으로 볼까?", "그때 어떤 식으로 얘기 꺼내기로 하자?"] }], keywords: ["부진 인정 기간", "역할 조정 조건"], stat: "팀 갈등으로 완전히 실패하는 스타트업 비율이 23%입니다", stake: "'언제부터 문제인가'에 대한 기준이 없으면, 한 명은 3개월째부터 답답해하는데 상대방은 아직 기다려야 한다고 생각합니다. 역할 조정 타이밍, 보상 차이, 책임 재배분 모두 이 기준에서 출발합니다.", dispute: "한쪽이 오래 참다 감정이 쌓인 상태에서 꺼내면 '평가'처럼 들립니다. 기준 없이 꺼낸 대화는 대부분 방어로 끝납니다.", guide: "기간 + 지표로 기준을 구체화하세요. '3개월 동안 담당 OKR의 50% 미달성이면 대화 시작'처럼 숫자가 있어야 감정이 덜 섞입니다." },
  q4:  { topic: "누군가 나갈 때", open: "혹시라도 생길 수 있으니까 미리 정해두는 게 나을 것 같아.", steps: [{ title: "각자 우선순위 꺼내기", qs: ["나가는 상황 생기면 제일 먼저 챙겨야 할 게 뭐라고 생각해?", "왜 그게 먼저야?"] }, { title: "공통 전제 찾기", qs: ["첫 24시간 안에 처리해야 할 것들이 있다는 건 동의해?"] }, { title: "순서 정하기", qs: ["그럼 순서 한번 같이 적어볼까?", "처리 기한은 어느 정도로 보면 될까?"] }], keywords: ["권한 회수 순서", "인수인계 기한"], stat: "이탈 시 정산금/영업권 분쟁 판례가 지속적으로 발생하고 있습니다 (민법 제718조)", stake: "이탈 상황이 생겼을 때 계좌 접근권, 코드 저장소, 거래처 연락처, 법인 인감 등을 누가 언제 어떻게 넘기는지 미리 정해두지 않으면 첫 24시간이 혼란입니다.", dispute: "이탈 후 남은 쪽이 업무 자료나 고객 데이터에 접근하지 못하거나, 나간 사람이 계속 서비스에 접속할 수 있는 상태가 지속되면 법적 분쟁으로 번집니다.", guide: "업무 인수인계 목록을 먼저 쓰고, 각 항목마다 기한과 담당자를 정하세요. 감정이 없는 지금 만드는 게 가장 합리적입니다." },
  q5:  { topic: "권한 인수인계", open: "나중에 복잡해지면 진짜 힘드니까 지금 정리해두자.", steps: [{ title: "각자 생각하는 타이밍 꺼내기", qs: ["퇴사 의사 밝히면 언제부터 접근 권한 빼는 게 맞다고 생각해?", "왜 그 시점이야?"] }, { title: "공통 전제 찾기", qs: ["단계적으로 빠지는 게 맞다는 건 동의해?"] }, { title: "절차 정하기", qs: ["단계를 어떻게 나눌까?", "각 단계마다 기한도 정해놓을까?"] }], keywords: ["권한 차단 시점", "단계별 절차"], stat: "이탈 창업자가 내부 시스템에 무단 접근한 법적 분쟁이 다수 발생합니다", stake: "AWS 콘솔, 결제 수단, 슬랙 워크스페이스, 도메인 관리자 계정 — 누가 언제 빠지는지 기준이 없으면 퇴사 의사 밝힌 뒤에도 풀 접근 상태가 지속됩니다.", dispute: "감정적으로 나가거나 분쟁 중인 상황에서 내부 데이터를 들고 나가거나 서비스를 손상시키는 사례가 실제로 존재합니다. 단계별 절차가 유일한 방어선입니다.", guide: "퇴사 의사 선언 -> 2주 인수인계 -> 권한 순차 회수 -> 최종 법인 서류 처리 순서로 단계를 합의해두세요. 기한은 각 단계마다 명시합니다." },
  q6:  { topic: "지분 정리 기준", open: "지분 얘기 꺼내기 어렵지만 이게 제일 중요한 것 같아서.", steps: [{ title: "각자 생각하는 기준 꺼내기", qs: ["나가게 됐을 때 지분 어떻게 돼야 한다고 생각해?", "그 기준이 왜 맞다고 봐?"] }, { title: "공통 전제 찾기", qs: ["기여한 만큼 인정받아야 한다는 건 둘 다 동의하지?"] }, { title: "조건 정하기", qs: ["단계적으로 지분을 확정하는 기간은 어느 정도로 볼까?", "최소 몇 개월은 함께해야 지분 확정이 시작된다고 볼까?"] }], keywords: ["단계적 지분 확정 기간", "최소 근속 기간"], stat: "전체 동업 분쟁의 40%가 지분 문제에서 시작됩니다. 동업자간 분쟁 발생률은 30%입니다.", stake: "지분 확정 시기를 정해두지 않으면, 이탈한 창업자가 기여 없이 지분을 그대로 보유하는 경우가 있습니다. 투자 유치 시 투자자가 이 구조를 발견하면 계약이 무산되는 경우가 있습니다. 지분 강제 매입 조건이 잘못 설계되면 주식 소각 후에도 수억 원 지급 의무가 발생한 판례가 있습니다.", dispute: "법인 설립 후 6개월~2년 사이에 기여도 차이가 극명해지며 지분 분쟁이 터집니다. 50:50 구조는 이 상황에서 의사결정 교착까지 동시에 만듭니다.", guide: "단계적 지분 확정 기간(통상 3~4년), 최소 근속 기간(통상 1년), 이탈 시 회수 가격(액면가 vs 시가)을 지금 합의해두면 나중에 훨씬 수월합니다. 불편하다고 미루면 나중엔 훨씬 더 힘든 대화가 됩니다." },
  q7:  { topic: "회사 방향", open: "우리 결국 어디로 가고 싶은지 한 번 맞춰보고 싶어.", steps: [{ title: "각자 그림 꺼내기", qs: ["5년 뒤 이 회사 어떻게 됐으면 좋겠어?", "그게 왜 그 그림이야?"] }, { title: "공통 전제 찾기", qs: ["지금 당장 방향이 다르더라도 단계적으로 맞춰갈 수 있다는 건 동의해?"] }, { title: "이정표 정하기", qs: ["1년 안에 어디까지 가면 잘 된 거라고 볼까?", "그 시점에 다시 방향 점검하기로 하자?"] }], keywords: ["엑싯 방향", "단계별 이정표"], stat: "비전 불일치로 인한 스타트업 실패 비율이 19%입니다. 전략 불안정 불만이 이탈 요인 2위입니다 (35%)", stake: "IPO를 목표로 하는 사람과 수익화 후 매각을 원하는 사람이 같은 결정을 두고 다른 판단을 내립니다. 투자 유치 여부, 채용 속도, 제품 방향 모두 엑싯 그림이 다르면 충돌합니다.", dispute: "핵심 피버팅이나 투자 유치 결정 앞에서 방향이 다르다는 걸 처음 확인하게 되면, 이미 한 명은 오래 답답했던 상태입니다. 이 시점의 대화는 폭발에 가깝습니다.", guide: "5년 그림이 완벽히 같을 필요 없습니다. '언제 다시 방향을 점검할지' 타이밍만 합의해도 즉흥적 충돌을 막을 수 있습니다." },
  q8:  { topic: "언제 멈출 것인가", open: "언제 계속 가고 언제 멈춰야 하는지 기준이 없으면 그때 가서 싸울 것 같아.", steps: [{ title: "각자 기준 꺼내기", qs: ["어느 시점에 피벗이나 중단을 생각해봐야 한다고 봐?", "왜 그 기준이야?"] }, { title: "공통 전제 찾기", qs: ["시장 반응 없이 무한정 가는 건 둘 다 아니라고 봐?"] }, { title: "기준 정하기", qs: ["그럼 어떤 지표가 몇 개월 동안 안 나오면 대화 트리거로 볼까?"] }], keywords: ["피벗 트리거 기간", "중단 판단 기준"], stat: "실패 두려움이 창업 장애 요인 상위권입니다 (45.9%). 피벗 기준 없이 운영하다 늦게 멈추는 사례가 다수입니다.", stake: "한 명은 이미 3개월 전부터 피벗이 필요하다고 느끼는데, 다른 한 명은 조금만 더 해보자고 합니다. 이 기간 동안 소진된 자금과 열정이 갈등의 연료가 됩니다.", dispute: "피벗 결정이 늦어져 자금이 바닥날 때 서로 '진작 말했어야 했는데'라는 감정이 올라옵니다. 책임 전가로 이어지면 팀 해체로 끝납니다.", guide: "수치 기반 트리거를 정하세요. '6개월 동안 MAU 성장률 0% 이하이면 피벗 논의 시작'처럼 감정 개입 없이 작동하는 기준이 필요합니다." },
  q9:  { topic: "절대 못 참는 것", open: "서로 절대 못 참는 게 뭔지 솔직하게 얘기해보자.", steps: [{ title: "각자 레드라인 꺼내기", qs: ["나는 이게 제일 힘들더라. 너는?", "그게 왜 그렇게 힘들어?"] }, { title: "공통 전제 찾기", qs: ["서로 레드라인이 있다는 자체는 이해해?"] }, { title: "약속 정하기", qs: ["그 상황이 생기려 할 때 먼저 말해주기로 할 수 있어?"] }], keywords: ["각자의 레드라인"], stat: "공동창업 중 30%가 심각한 동업 분쟁을 경험합니다. 레드라인 공유 없이 쌓인 불만이 주된 원인입니다.", stake: "한 명에게는 당연한 일이 다른 한 명에게는 절대 안 되는 일일 수 있습니다. 이게 쌓이면 작은 결정도 갈등의 트리거가 됩니다.", dispute: "오래 참다 한 번에 터뜨리면 상대방은 맥락을 모릅니다. 그 시점의 대화는 문제 해결이 아니라 감정 싸움이 됩니다.", guide: "레드라인을 각자 3가지씩 쓴 다음 교환하세요. 논쟁하는 게 아니라 '이런 게 있다'를 알려주는 게 목적입니다. 반응하지 않고 듣는 연습부터 시작하세요." },
  q10: { topic: "자금 위기 대응", open: "돈 줄어들면 감정적으로 결정하게 되니까 미리 정해두자.", steps: [{ title: "각자 생각하는 위기 기준 꺼내기", qs: ["자금이 얼마 남으면 위기라고 느껴?", "그때 제일 먼저 뭘 해야 한다고 생각해?"] }, { title: "공통 전제 찾기", qs: ["감정적으로 결정하지 않으려면 기준이 있어야 한다는 건 동의해?"] }, { title: "트리거와 순서 정하기", qs: ["런웨이 몇 개월 남으면 대화 시작하기로 할까?", "그때 우선순위 순서도 지금 정해놓을까?"] }], keywords: ["런웨이 트리거 기간", "삭감 우선순위"], stat: "자금 부족이 폐업 사유 1위입니다 (53.2%). 투자 위축을 체감하는 창업자 비율은 63.2%입니다.", stake: "런웨이 6개월이 남은 상황에서 한 명은 추가 채용을 주장하고 다른 한 명은 비용 절감을 주장할 수 있습니다. 이 시점에 합의 기준이 없으면 감정적 결정이 나옵니다.", dispute: "자금 위기에서 서로 책임을 전가하거나, 추가 출자 능력 차이가 드러나면 동업 해지 요구로 이어지는 사례가 많습니다.", guide: "런웨이 X개월 이하가 되면 자동으로 비상 회의를 시작하는 트리거를 정하세요. 삭감 순서(외주 > 마케팅 > 급여 순 등)도 지금 합의해두면 그때 가서 감정 소모가 없습니다." },
  q11: { topic: "돈 쓰는 기준", open: "돈 쓰는 기준이 서로 다를 수 있을 것 같아서.", steps: [{ title: "각자 기준 꺼내기", qs: ["얼마까지는 말 안 하고 써도 된다고 생각해?", "왜 그 금액이야?"] }, { title: "공통 전제 찾기", qs: ["어느 선 이상은 같이 보는 게 맞다는 건 동의해?"] }, { title: "한도 정하기", qs: ["단독 결정 한도를 얼마로 할까?", "그 이상은 어떤 방식으로 공유하기로 할까?"] }], keywords: ["단독 결정 한도 금액", "공동 승인 방식"], stat: "의사결정 교착이 발생한 팀의 70%가 사업 마비 상태를 경험합니다", stake: "30만 원짜리 툴 구독, 100만 원짜리 광고 집행, 외주 계약 — 이 중 어디서부터 상대방에게 말해야 하는지 기준이 없으면 작은 지출이 큰 갈등이 됩니다.", dispute: "한 명이 허락 없이 지출했을 때 '왜 나한테 말 안 했냐'가 반복되면 신뢰 문제가 됩니다. 반대로 매번 물어봐야 하면 실행 속도가 너무 느려집니다.", guide: "단독 결정 가능 금액 상한선 하나만 정하세요. 그 이상은 카톡 공유 또는 동의 필요. 금액 기준이 가장 명확하고 실행하기 쉽습니다." },
  q12: { topic: "투자 받는 기준", open: "투자 제안 왔을 때 즉석에서 의견 갈리지 않으려면 미리 맞춰야 할 것 같아.", steps: [{ title: "각자 기준 꺼내기", qs: ["투자 제안 왔을 때 제일 중요하게 보는 게 뭐야?", "안 받는 조건은?"] }, { title: "공통 전제 찾기", qs: ["둘 다 좋은 투자와 나쁜 투자는 구분해야 한다는 건 동의하지?"] }, { title: "조건 정하기", qs: ["최소 어느 조건은 맞아야 받기로 할까?", "한 명이 반대하면 어떻게 하기로 할까?"] }], keywords: ["투자 수락 조건", "거부권 기준"], stat: "자금 확보 어려움이 창업 장애 요인 1위입니다 (53.7%). 투자 조건에 대한 갈등이 팀 분열로 이어지는 사례가 많습니다.", stake: "투자자 조건(밸류, 지분 희석, 이사회 구성)에 대해 한 명은 빠르게 받고 싶어하고, 다른 한 명은 조건이 맞아야 한다고 생각할 수 있습니다. 현장에서 의견이 갈리면 투자자 신뢰도 떨어집니다.", dispute: "한 명이 먼저 투자자와 사전 합의를 잡아두거나, 반대로 한 명이 좋은 제안을 혼자 거절했을 때 분쟁이 생깁니다.", guide: "최소 수락 조건 3가지를 미리 리스트로 만들어두세요. 제안이 왔을 때 그 기준에 맞는지 체크하면 감정 개입 없이 결정할 수 있습니다." },
  q13: { topic: "단독 결정 권한 범위", open: "결정할 때마다 서로 기대가 달라서 한번 맞춰보고 싶어.", steps: [{ title: "각자 기대 꺼내기", qs: ["내가 혼자 결정했을 때 불편했던 적 있어?", "어떤 결정이었어?"] }, { title: "공통 전제 찾기", qs: ["속도도 중요하고 서로 신뢰도 중요하다는 건 동의하지?"] }, { title: "범위 정하기", qs: ["어떤 종류의 결정은 혼자 해도 되고, 어떤 건 꼭 같이 봐야 할까?", "금액이나 영향 범위로 나눠볼까?"] }], keywords: ["단독 결정 범위", "공유 필요 기준"], stat: "의사결정 충돌팀의 70%가 사업 마비를 경험합니다 — 법인설립지원 분쟁 데이터", stake: "외주 계약 체결, 마케팅 예산 집행, 협업 제안 수락 등 일상적 결정마다 '이거 말해야 하나'를 고민하게 됩니다. 이 불확실성이 반복되면 실행력 자체가 떨어집니다.", dispute: "한 명이 담당 영역에서 독단으로 결정했을 때 상대방이 '왜 나한테 안 물어봤냐'고 하는 상황이 반복됩니다. 권한 범위 불명확이 경영권 분쟁의 출발점입니다.", guide: "먼저 영향 범위로 나누세요. '나만 영향받는 결정 vs 팀 전체에 영향 가는 결정'으로 구분하고, 금액 기준도 함께 정하면 대부분의 경우가 커버됩니다." },
  q14: { topic: "실패했을 때", open: "뭔가 안 됐을 때 우리가 반응하는 방식이 좀 다른 것 같아.", steps: [{ title: "각자 방식 꺼내기", qs: ["뭔가 안 됐을 때 제일 먼저 하고 싶은 게 뭐야?", "빨리 다음 거 가고 싶어, 아니면 정리하고 싶어?"] }, { title: "공통 전제 찾기", qs: ["같은 실수 반복 안 하자는 건 둘 다 동의하지?"] }, { title: "약속 정하기", qs: ["그럼 다음 결정 전에 최소한 어떤 걸 같이 해보기로 할까?", "그게 얼마나 걸릴 것 같아?"] }], keywords: ["회고 방식", "다음 결정까지 기간"], stat: "창업 역량 부족과 잘못된 의사결정 실패 대응이 주요 장애요인입니다 (36.7%)", stake: "실패 후 한 명은 빠르게 다음으로 넘어가고 싶어하고, 다른 한 명은 정리가 필요합니다. 이 차이가 맞지 않으면 둘 다 불만이 쌓입니다.", dispute: "실패의 원인을 서로 다르게 해석할 때 자연스럽게 책임 공방이 시작됩니다. '그때 내가 말했는데 네가 무시했잖아'로 번지면 과거 전체가 재심판됩니다.", guide: "실패 직후 1~2일은 감정 안정 시간으로 쓰세요. 그 이후 '무엇이 달랐으면 결과가 달랐을까'를 중심으로 대화하면 비난 없이 학습할 수 있습니다." },
  q15: { topic: "결정 뒤집기", open: "한번 결정된 게 계속 재논의되면 둘 다 지치니까.", steps: [{ title: "각자 불편함 꺼내기", qs: ["결정된 거 다시 꺼내고 싶었던 적 있어?", "왜 그랬어?"] }, { title: "공통 전제 찾기", qs: ["결정된 건 존중하되, 정말 필요할 때는 다시 볼 수 있어야 한다는 건 동의해?"] }, { title: "조건 정하기", qs: ["어떤 상황이면 다시 꺼낼 수 있는 걸로 하자?"] }], keywords: ["재논의 허용 조건"], stat: "결정 번복이 반복되는 팀에서 실행력 저하와 팀 신뢰 손상이 공통적으로 나타납니다", stake: "한 번 결정된 사안이 계속 재논의되면 아무것도 실행되지 않습니다. 반대로 결정된 걸 절대 바꿀 수 없으면 잘못된 방향을 계속 가게 됩니다.", dispute: "한 명이 자꾸 결정을 뒤집으면 상대방은 '합의가 의미 없다'는 느낌을 받습니다. 신뢰가 깨지면 이후 모든 결정이 어려워집니다.", guide: "재논의 가능 조건을 딱 두 가지로 정하세요. '새로운 데이터가 생겼을 때'와 '외부 환경이 크게 바뀌었을 때'. 그 외에는 한 번 결정된 건 실행합니다." },
  q16: { topic: "결정 타이밍", open: "빠르게 가야 할 때랑 더 봐야 할 때 서로 다르게 느끼는 것 같아서.", steps: [{ title: "각자 기준 꺼내기", qs: ["중요한 결정에서 언제 충분히 확인됐다고 느껴?", "더 봐야 한다고 생각할 때 기준이 뭐야?"] }, { title: "공통 전제 찾기", qs: ["너무 빨라도, 너무 늦어도 둘 다 문제라는 건 동의하지?"] }, { title: "기준 정하기", qs: ["그럼 어떤 결정은 데드라인을 정해놓을까?", "의견 차이 날 때 어떻게 처리하기로 할까?"] }], keywords: ["결정 데드라인", "교착 시 처리 방식"], stat: "50:50 지분 구조에서 의사결정 교착으로 사업 중단된 사례가 70%에 달합니다", stake: "투자 유치, 채용, 제품 방향 전환 같은 결정에서 한 명은 지금 당장 결정해야 한다고 보고, 다른 한 명은 더 봐야 한다고 합니다. 이 차이가 기회를 놓치거나 잘못된 방향으로 가는 원인이 됩니다.", dispute: "중요한 결정에서 교착 상태가 반복되면 한 명이 독단으로 처리하기 시작하고, 그게 갈등의 씨앗이 됩니다.", guide: "결정 카테고리마다 데드라인을 정하세요. 예: 채용 결정은 인터뷰 후 3일 이내, 투자 제안은 1주 이내. 교착 상태 시 최종 결정권자를 안건 유형별로 미리 정해두면 더 좋습니다." },
  q17: { topic: "급여 기준", open: "급여 얘기 꺼내기 뻘쭘하지만 지금 안 정하면 나중에 더 힘들 것 같아.", steps: [{ title: "각자 생각 꺼내기", qs: ["지금 급여 구조 어떻게 생각해?", "차이가 있어야 한다고 봐, 없어야 한다고 봐?"] }, { title: "공통 전제 찾기", qs: ["지금 상황과 역할이 반영돼야 한다는 건 동의해?"] }, { title: "기준 정하기", qs: ["어떤 기준으로 차이를 둘까?", "언제 다시 조정하기로 할까?"] }], keywords: ["급여 차등 기준", "재조정 시점"], stat: "스타트업 재직자 보상 불만율이 37%로 이탈 요인 1위입니다. 근무 만족도는 역대 최저인 35%입니다.", stake: "초기에 같은 급여로 시작해도 역할과 기여도가 달라지는 시점이 옵니다. 이때 기준이 없으면 '나는 더 하는데 왜 같냐'는 불만이 쌓입니다.", dispute: "급여 조정을 요구했을 때 기준이 없으면 서로 다른 근거를 들고 싸우게 됩니다. 특히 투자 유치 후 급여 인상 타이밍에서 갈등이 자주 터집니다.", guide: "기준을 역할 또는 수익 기반으로 나누세요. '어떤 지표가 달성되면 급여를 재논의한다'는 트리거를 지금 합의하면, 그때 가서 감정적으로 요구하지 않아도 됩니다." },
  q18: { topic: "지분 구조", open: "처음에 정한 지분, 지금도 맞는지 한번 얘기해보고 싶어.", steps: [{ title: "각자 생각 꺼내기", qs: ["지금 지분 구조 어떻게 생각해?", "기여도 달라지면 바뀔 수 있어야 한다고 봐?"] }, { title: "공통 전제 찾기", qs: ["처음 합의가 출발점이었다는 건 둘 다 동의하지?"] }, { title: "조건 정하기", qs: ["조정이 필요하다면 어떤 상황일 때?", "단계적 지분 확정 기간이랑 최소 근속 기간은 어떻게 볼까?"] }], keywords: ["단계적 지분 확정 기간 & 최소 근속 기간", "조정 트리거"], stat: "전체 동업 분쟁의 40%가 지분 분쟁입니다. 50:50 고집이 가장 큰 원인이고, 지분 확정 기준 없는 구조는 파산급 리스크입니다.", stake: "지분 확정 기준이 없으면 이탈한 창업자가 기여 없이 지분을 그대로 가져가는 경우가 있습니다. 투자 유치 시 이 구조가 드러나면 투자자가 계약을 철회하는 경우가 있습니다. 지분 강제 매입 조건이 잘못 설계되면 주식 소각 후에도 수억 원 지급 의무가 발생한 실제 판례가 있습니다.", dispute: "법인 설립 후 6개월~2년 사이에 기여도 차이가 극명해지며 지분 분쟁이 터집니다. 50:50 구조는 이 시점에 의사결정 교착까지 동시에 만듭니다.", guide: "단계적 지분 확정 기간(통상 3~4년), 최소 근속 기간(통상 1년), 이탈 시 회수 가격(액면가 vs 시가)을 미리 합의해두는 게 좋습니다. 이걸 정하지 않으면 나중에 변호사를 끼고 협상하는 경우가 많습니다." },
  q19: { topic: "수익 나면 급여", open: "흑자 나면 어떻게 할지 지금 안 맞춰두면 그때 가서 싸울 것 같아.", steps: [{ title: "각자 기대 꺼내기", qs: ["돈 벌리기 시작하면 급여 어떻게 됐으면 좋겠어?", "언제부터 올려야 한다고 생각해?"] }, { title: "공통 전제 찾기", qs: ["회사 상황 안정되면 제대로 받아야 한다는 건 동의하지?"] }, { title: "트리거 정하기", qs: ["어떤 숫자나 조건이 충족되면 급여 얘기 꺼내기로 할까?"] }], keywords: ["급여 인상 트리거", "인상 조건"], stat: "보상 불만이 스타트업 핵심 인재 이탈 원인 1위입니다 (37%). 수익 발생 후 보상 갈등이 팀 분열의 전환점이 되는 경우가 많습니다.", stake: "매출이 나기 시작하면 각자 기대하는 급여 인상 타이밍이 다릅니다. 한 명은 지금 당장 올려야 한다고 보고, 다른 한 명은 더 안정될 때까지 기다리자고 합니다.", dispute: "수익이 생겼을 때 급여 기준이 없으면 '회사 돈을 왜 나한테 안 쓰냐'는 갈등이 옵니다. 이익 분배 방식이 불분명하면 세금, 재투자, 급여 비율을 두고 싸웁니다.", guide: "수익 트리거를 구체적으로 정하세요. '월 매출 X원을 3개월 연속 달성하면 급여 재논의 시작'처럼 숫자로 정해두면 감정 소모 없이 자동으로 대화가 시작됩니다." },
  q20: { topic: "투자와 지분 희석", open: "투자 방향에 대해 우리 같은 생각인지 확인하고 싶어.", steps: [{ title: "각자 입장 꺼내기", qs: ["투자 받으면서 지분 줄어드는 거 어떻게 생각해?", "어느 선까지는 괜찮아?"] }, { title: "공통 전제 찾기", qs: ["통제권 잃지 않는 선에서 성장해야 한다는 건 동의해?"] }, { title: "한도 정하기", qs: ["희석 한도를 어느 % 선으로 볼까?", "그 이상 넘어가는 조건은 어떻게 처리하기로 할까?"] }], keywords: ["희석 한도 %", "거부권 조건"], stat: "투자 시장 위축을 체감하는 창업자 비율이 63.2%입니다. 지분 희석 조건에서 파트너 간 이견이 투자 무산으로 이어지는 사례가 많습니다.", stake: "투자를 받을수록 두 사람의 지분이 희석됩니다. 어느 선까지 희석을 감수할 것인지, 창업자 지분이 50% 아래로 떨어지는 걸 허용할 것인지 사전에 합의가 없으면 투자 제안 앞에서 즉흥적 결정이 나옵니다.", dispute: "한 명은 빠른 성장을 위해 더 많은 지분을 내줄 수 있다고 보고, 다른 한 명은 통제권 확보를 최우선으로 합니다. 투자사 앞에서 이 견해 차이가 드러나면 신뢰를 잃습니다.", guide: "창업자 합산 지분 하한선을 먼저 정하세요. '시리즈 A 이후에도 창업팀 합산 지분 51% 이상 유지' 같은 기준 하나로 많은 결정이 쉬워집니다." },
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
    btnLabel: "합의를 위한 대화셋 보기",
  },
  "이탈 & 회수": {
    title: "주식 처분 제한(Lock-up) 및 이탈 처리",
    lead: "당사자 이탈 시 주식 처리 절차와 권한 회수 기준을 합의한다.",
    items: ["베스팅(Vesting) 기간 및 클리프(Cliff) 조건", "주식 처분 제한(Lock-up) 기간 및 예외 조건", "이탈 시 주식 정산 기준 (액면가 vs 시가)"],
    blurItems: ["주식 강제매각 청구권(콜옵션) 발동 사유 및 절차", "법인 인감·계좌·시스템 접근권 반환 기한"],
    btnLabel: "합의를 위한 대화셋 보기",
  },
  "비전 & 가치관": {
    title: "계약해지 및 교착상태 해소(Deadlock)",
    lead: "사업 방향 전환 기준과 계약 해지 사유, Deadlock 발생 시 처리 절차를 합의한다.",
    items: ["피벗·사업 중단 트리거 기준 및 해지 사유", "교착상태(Deadlock) 지속 시 처리 방식", "당사자 전원 서면 합의 시 계약 해지 절차"],
    blurItems: ["엑싯 방향(M&A / IPO / 독립 운영) 우선순위 합의", "Deadlock 해소를 위한 우선매수권(ROFR) 발동 조건"],
    btnLabel: "합의를 위한 대화셋 보기",
  },
  "조달 & 운용": {
    title: "자금 집행 승인권 및 신주인수우선권",
    lead: "단독 집행 가능한 지출 한도, 투자 유치 조건, 신주 발행 시 기존 주주 보호 기준을 합의한다.",
    items: [],
    blurItems: ["자금 집행 승인권 — 단독 결정 한도 금액 기준", "신주인수우선권 — 신주 발행 시 기존 지분율 보호", "런웨이 위기 시 대응 우선순위 (삭감 순서)", "우선매수권(ROFR) / 동반매도참여권(Tag-along) / 동반매도청구권(Drag-along) 발동 조건", "투자 조건 거부권 행사 기준 및 지분 희석 한도"],
    btnLabel: "합의를 위한 대화셋 보기",
  },
  "의사결정 & 실행": {
    title: "의사결정 구조 및 경업금지의무",
    lead: "단독 결정 범위와 공동 결정 사안, 퇴사 후 경업금지 기준을 합의한다.",
    items: ["단독 결정 가능 사안 기준 (금액·영향 범위)", "공동 결정 필요 사안 및 Deadlock 시 처리 방식", "경업금지의무 — 재직 중 및 퇴사 후 적용 기간"],
    blurItems: ["결정 번복 가능 조건 및 재논의 절차", "비밀유지의무(NDA) — 대상 정보 범위 및 위반 시 위약벌"],
    btnLabel: "합의를 위한 대화셋 보기",
  },
  "지분 & 보상": {
    title: "지분 배분 및 손해배상·위약벌",
    lead: "지분 구조, 창업자 보상 기준, 계약 위반 시 손해배상 조건을 합의한다.",
    items: [],
    blurItems: ["파트너 간 급여 차등 기준 및 흑자 전환 시 재논의 트리거", "베스팅(Vesting) 기간 및 이탈 시 지분 회수 가격 기준", "손해배상 및 위약벌 — 위반 유형별 책임 한도", "동반매도참여권(Tag-along) / 동반매도청구권(Drag-along) 행사 조건", "분쟁해결 — 관할 법원 및 중재 절차"],
    btnLabel: "합의를 위한 대화셋 보기",
  },
};

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
  const [selectedIssue, setSelectedIssue] = useState<string | null>(null);
  const [openGuides, setOpenGuides] = useState<Set<string>>(new Set());
  const toggleGuide = (id: string) => setOpenGuides(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
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
    const topPriorityIssuesArray = topPriorityIssuesList.slice(0, 3);
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
          {members.length >= 2 && (
            <div className="gap-pair-label-premium">
              팀 통합 리포트: {members.map(m => m.name).join(" · ")}
            </div>
          )}
        </div>
      </div>

      <section className="container gap-wrap" style={{ position: "relative", zIndex: 10, marginTop: "-40px" }}>
        {/* 팀 통합 보기 - 미완료 */}
        {!isTeamComplete && members.length >= 2 && (
          <div className="card gap-summary" style={{ width: "100%", maxWidth: "600px", margin: "0 auto", textAlign: "center", padding: "40px 32px" }}>
            <div style={{ marginBottom: "16px", display: "flex", justifyContent: "center" }}><Lock size={32} color="#94a3b8" /></div>
            <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "8px" }}>모든 팀원이 기본 진단을 완료해야 리포트를 볼 수 있어요</h3>
            <p style={{ color: "#64748b", fontSize: "14px", lineHeight: 1.6, marginBottom: "24px" }}>
              {members.filter(m => !hasBasicComplete(m)).map(m => (
                <span key={m.id}><strong>{m.name}</strong>의 진단 진행률: {m.progress ?? 0}%<br /></span>
              ))}
              <br />전원이 기본 진단(12문항)을 마치면 통합 리포트가 열립니다.
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
                  <div className="heatmap-legend">
                    <div className="legend-item"><span className="legend-dot alignment"></span> 일치</div>
                    <div className="legend-item"><span className="legend-dot" style={{background:"#fdba74"}}></span> 차이</div>
                    <div className="legend-item"><span className="legend-dot conflict"></span> 충돌</div>
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
                      <span style={{ fontSize: "0.72rem", fontWeight: "700", color: "#6366f1", background: "rgba(99,102,241,0.08)", padding: "3px 10px", borderRadius: "999px", letterSpacing: "0.5px" }}>심화 진단</span>
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

              {/* Help Box */}
              <div className="heatmap-help-box" style={{ marginTop: "32px" }}>
                {/* 범례 */}
                <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginBottom: "14px" }}>
                  {[
                    { color: "#20c997", label: "일치" },
                    { color: "#fdba74", label: "차이" },
                    { color: "#f97316", label: "충돌" },
                    { color: "#e2e8f0", textColor: "#94a3b8", label: "미응답" },
                  ].map(({ color, textColor, label }) => (
                    <span key={label} style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "#374151" }}>
                      <span style={{ width: "12px", height: "12px", borderRadius: "3px", background: color, display: "inline-block", flexShrink: 0 }} />
                      {label}
                    </span>
                  ))}
                </div>
                <div style={{ fontSize: "13px", color: "#6366f1", fontWeight: 600, display: "flex", alignItems: "center", gap: "6px" }}>
                  <MessageCircle size={13} /> 충돌·차이 셀을 클릭하면 실제 응답 비교와 AI 갈등 분석을 바로 볼 수 있어요
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
                    const WARN_WORDS = ["경영권 분쟁","신뢰 문제","신뢰를 잃","법적 분쟁","팀 해체","파산","소송","수억 원","계약을 철회","지분 분쟁","의사결정 교착","실행력 자체","동업 해지","감정 싸움","책임 전가","독단으로","갈등이 자주 터","폭발에 가깝","방어로 끝","피해자가 됩니다"];
                    const hlBody = (stake: string, dispute: string) => {
                      let t = stake + " " + dispute;
                      t = t.replace(/'([^']+)'/g, '<mark style="background:#fef9c3;color:#854d0e;border-radius:3px;padding:1px 4px;font-weight:600">$1</mark>');
                      for (const w of WARN_WORDS) {
                        t = t.replace(new RegExp(w, "g"), `<strong style="color:#b45309;font-weight:700">${w}</strong>`);
                      }
                      return t;
                    };
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
                gap: 40px;
                width: 100%;
                margin: 60px 0 0;
              }
              @media (min-width: 860px) {
                .scenario-review-wrapper {
                  flex-direction: row;
                  align-items: flex-start;
                  gap: 48px;
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
                  <p>이미 수많은 초기 창업팀이 CoSync로 빈틈없는 합의를 마쳤습니다.</p>
                </div>
                <div className="reviews-scroll-window">
                  <div className="reviews-scroll-track">
                    {[...Array(2)].map((_, pass) =>
                      [
                        { stars: "★★★★★", bold: "결정 기준과 최종 책임자를 정한 뒤에는 비슷한 안건도 1시간 이내에 결론", pre: "전에는 기능 우선순위 하나에도 2~3시간씩 끝장토론을 했지만, ", post: "을 낼 수 있었습니다. 실행 속도가 확연히 달라졌어요.", author: "초기 스타트업 CEO · 31세", initial: "C" },
                        { stars: "★★★★★", bold: "객관적인 데이터로 대화의 물꼬를 트니 감정 상할 일 없이", pre: "친한 선배라 돈이나 지분 문제를 먼저 꺼내기 어려웠는데, ", post: " 운영 기준을 문서화할 수 있었습니다. 진짜 꼭 필요했던 서비스예요.", author: "기창업(2y) 공동창업 준비 중 · 23세", initial: "기" },
                        { stars: "★★★★★", bold: "우리가 어떤 부분에서 동상이몽을 하고 있었는지", pre: "대화는 많이 했지만 늘 겉도는 느낌이었어요. CoSync로 진단해보니 ", post: " 한눈에 보였습니다. 덕분에 갈등 없이 안전한 지분 구조를 합의했어요.", author: "초기 스타트업 공동창업자 · 29세", initial: "공" },
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

            <div className="premium-cards-section" style={{ marginTop: "80px" }}>
              {/* 합의안 완성 일러스트 — 갭 공백이 곧 합의안 조항이 된다 */}
              <div className="teaser-header">
                <div className="badge-legal" style={{ marginBottom: "16px" }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline", verticalAlign: "middle", marginRight: "6px" }}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  동업계약서 전문 변호사 협력 템플릿 · 감수 완료
                </div>
                <h2>합의 공백을 기반으로 합의안을 완성하세요</h2>
                <p>리포트에서 확인한 합의 공백은 그대로 우리 팀 합의안의 조항이 됩니다.</p>
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
                        <button className="btn btn-primary unlock-btn" onClick={() => router.push("/agreement/preview")}>
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
                        <button className="btn btn-primary unlock-btn" onClick={() => router.push("/agreement/preview")}>
                          필수 합의 조항 보기
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div className="teaser-header" style={{ marginTop: "72px" }}>
                <div className="badge-legal" style={{ marginBottom: "20px" }}>
                  <Scale size={14} /> 변호사 감수 · 실제 분쟁 판례 반영
                </div>
                <h2>프리미엄 팀 합의 솔루션</h2>
                <p>주주간계약 전 반드시 필요한 맞춤형 운영 및 권리관계 합의서를 완성하세요.</p>
              </div>
              
              <div className="premium-card-list">
                {/* Card 1 */}
                <div className="premium-item-card">
                  <div className="card-header" style={{ marginBottom: "12px" }}>
                    <h3 className="card-emoji-title" style={{ display: "flex", alignItems: "center", gap: "8px" }}><ShieldAlert size={18} color="#ef4444" /> 변호사가 경고하는 치명적 법적 리스크</h3>
                    <p className="clear-text">현재 팀의 가장 위험한 잠재 분쟁 1위는 <strong>[{teamInsight.topPriorityIssuesArray?.[0]?.label ?? "지분/권한 충돌"}]</strong> 입니다.</p>
                  </div>
                  <div className="clear-preview" style={{ marginBottom: "8px" }}>
                    <p style={{ fontSize: "0.95rem", color: "#334155", lineHeight: "1.6" }}>
                      이 안건을 문서화하지 않을 경우, 파트너 이탈 시 지분 회수가 불가능해져 <strong>후속 투자가 전면 무산</strong>될 수 있습니다.
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
                        <Lock size={14} style={{ marginRight: "6px", display: "inline", verticalAlign: "middle" }} /> 우리 팀 맞춤 합의안 완성하기
                      </button>
                    </div>
                  </div>
                </div>

                {/* Card 4 */}
                <div className="premium-item-card">
                  <div className="card-header" style={{ marginBottom: "12px" }}>
                    <h3 className="card-emoji-title" style={{ display: "flex", alignItems: "center", gap: "8px" }}><Compass size={18} color="#6366f1" /> 시장 표준(Market Standard) 기반 합의 가이드</h3>
                    <p className="clear-text">성공한 스타트업들이 채택한 가장 안전하고 검증된 운영 기준은...</p>
                  </div>
                  <div className="clear-preview">
                    <div style={{ background: "#e8edf4", borderRadius: "12px", padding: "14px 18px" }}>
                      <span style={{ fontSize: "12px", fontWeight: "700", color: "#6366f1", display: "flex", alignItems: "center", gap: "5px", marginBottom: "8px" }}>
                        권장 옵션 <Star size={11} color="#f59e0b" fill="#f59e0b" />
                      </span>
                      <p style={{ fontSize: "14px", fontWeight: "700", color: "#0f172a", margin: "0 0 6px", lineHeight: "1.4" }}>{teamInsight.topPriorityIssuesArray?.[0]?.label ?? "주요 안건"}에 대한 명시적 기준 설정</p>
                      <p style={{ color: "#475569", fontSize: "0.875rem", margin: 0, lineHeight: "1.7" }}>성공하는 스타트업은 갈등 확률이 높은 위 안건에 대해 온정주의적 접근을 버리고, 초기부터 명확한 기준과 시장 표준을 적용하여 회사의 존립을 보호합니다.</p>
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
                        <Lock size={14} style={{ marginRight: "6px", display: "inline", verticalAlign: "middle" }} /> 우리 팀 맞춤 합의안 완성하기
                      </button>
                    </div>
                  </div>
                </div>

                {/* Card 5 */}
                <div className="premium-item-card">
                  <div className="card-header" style={{ marginBottom: "12px" }}>
                    <h3 className="card-emoji-title" style={{ display: "flex", alignItems: "center", gap: "8px" }}><FileText size={18} color="#6366f1" /> 주주간계약 전 필수 합의 문서 생성 및 버전 관리</h3>
                    <p className="clear-text">진단 결과와 팀의 합의 내용을 바탕으로, 전문가가 검토한 템플릿에 맞춰 정교한 합의 문서를 작성합니다:</p>
                  </div>
                  <div className="clear-preview doc-style-area">
                    <p style={{ fontWeight: "700", color: "#0f172a", margin: "0 0 8px", fontSize: "0.9rem" }}>제 4조 ({teamInsight.topPriorityIssuesArray?.[0]?.label ?? "핵심 안건"}에 관한 의사결정 및 분쟁 처리)</p>
                    <p style={{ color: "#475569", fontSize: "0.875rem", margin: 0, lineHeight: "1.85" }}>
                      ① 창업 멤버 간 본 안건에 관한 의사결정 불일치 발생 시, 발생일로부터 <span style={{ borderBottom: "1.5px solid #94a3b8", display: "inline-block", minWidth: "36px" }}>&nbsp;&nbsp;&nbsp;&nbsp;</span>일 이내 전원 합의를 우선 시도한다.<br />
                      ② 합의 불성립 시 <span style={{ borderBottom: "1.5px solid #94a3b8", display: "inline-block", minWidth: "80px" }}>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span> 기준으로 결정하며, 이견 지속 시 대표이사의 결정에 따른다.<br />
                      ③ 어느 일방이 본 조항에 관하여 이의를 제기한 경우, <span style={{ borderBottom: "1.5px solid #94a3b8", display: "inline-block", minWidth: "36px" }}>&nbsp;&nbsp;&nbsp;&nbsp;</span>일 이내 제3자 조정 절차를 개시한다.<br />
                      ④ 조정 불성립 시 <span style={{ borderBottom: "1.5px solid #94a3b8", display: "inline-block", minWidth: "100px" }}>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>의 중재에 따르며, 중재 판정은 최종적·구속적 효력을 가진다.
                    </p>
                  </div>
                  <div className="card-blur-area doc-style-area" style={{ marginTop: "12px" }}>
                    <p><strong>제 5조 ({teamInsight.topPriorityIssuesArray?.[1]?.label ?? "후속 조치"} 관련 멤버 이탈 시 처리 기준)</strong> ① 창업 멤버가 자발적으로 이탈하는 경우, 이탈 확정일로부터 ____일 이내 보유 지분에 대해 잔존 멤버에게 우선매수권을 부여한다. ② 매수가액은 ____________ 기준으로 산정하며, 잔존 멤버가 이를 거절하는 경우 제3자 매각을 허용하되 잔존 멤버 전원의 동의를 요한다...</p>
                    <p><strong>제 6조 (주식매수선택권 부여 기준)</strong> ① 임직원에 대한 주식매수선택권의 총 한도는 발행주식 총수의 ____% 이내로 한다. ② 행사 조건은 근속 ____년 이상을 원칙으로 하며, 개인별 부여 한도 및 행사 가격은 이사회 결의로 정한다. ③ 퇴직 시 미행사 옵션의 처리 기준은 ____________ 으로 한다...</p>
                    <p><strong>제 7조 (영업비밀 및 기밀 유지 의무)</strong> ① 창업 멤버는 본 합의서 체결 이후 지득한 회사의 기술·재무·인적 자원·사업 전략 등 일체의 비공개 정보에 대하여 멤버 지위 종료 후 ____년간 비밀을 유지할 의무를 진다. ② 위반 시 손해배상 범위는 ____________ 으로 한다...</p>
                    <p><strong>제 8조 (경업 금지 의무)</strong> ① 창업 멤버는 멤버 지위 종료일로부터 ____년간 회사와 동종의 사업을 영위하는 법인을 설립하거나 임직원으로 종사할 수 없다. ② 지역적 범위는 ____________ 으로 하며, 위반 시 위약벌은 ____________ 으로 한다...</p>
                    <p style={{ marginTop: "12px", borderTop: "1px dashed var(--border)", paddingTop: "12px", color: "var(--primary)", display: "flex", alignItems: "center", gap: "6px" }}><RefreshCw size={13} /><strong>버전 1.0 생성됨 (변경 이력 추적 중)</strong></p>
                    <div className="card-unlock-overlay">
                      <button className="btn btn-primary unlock-btn" onClick={() => router.push("/agreement/preview")}>
                        <Lock size={14} style={{ marginRight: "6px", display: "inline", verticalAlign: "middle" }} /> 우리 팀 맞춤 합의안 완성하기
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
