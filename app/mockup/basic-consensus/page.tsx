"use client";
import React, { useState, useRef, useLayoutEffect } from "react";
import { Check, ArrowLeft, ArrowRight, FileText, PenLine, X, Info } from "lucide-react";
import { TopNav } from "../../../components/TopNav";

// ─── types ───────────────────────────────────────────────────────────────────
type SubChip = { key: string; label: string; opts: string[]; hasCustom?: boolean };
type Opt = { id: string; label: string; desc: string; subChips?: SubChip[] };
type Q = {
  id: string; group: string; sideLabel: string; topic: string;
  title: string; desc: string; opts: Opt[]; hasCustom?: boolean;
  tip?: { title: string; body: string };
  scenario?: string;
  clause: (opt: string, chips: Record<string, string>, custom: string) => string;
};
type Answer = { opt: string; chips: Record<string, string>; custom: string; memo: string };

// ─── groups ──────────────────────────────────────────────────────────────────
const GROUPS = [
  { id: "role",   ko: "역할 & 책임",     en: "Roles & Responsibilities" },
  { id: "vision", ko: "비전 & 가치관",   en: "Vision & Values" },
  { id: "fund",   ko: "자금조달 & 운용", en: "Finance & Operations" },
];

// ─── questions ───────────────────────────────────────────────────────────────
const QUESTIONS: Q[] = [
  // ── 역할 & 책임 ──────────────────────────────────────────────────────────
  {
    id: "grayArea", group: "role", sideLabel: "회색지대",
    topic: "역할 & 책임",
    title: "명확한 담당자 없는 업무, 어떻게 처리하나요?",
    scenario: "출시 일주일 전, 고객 문의 담당자가 없었고 둘 다 서로가 맡을 줄 알고 있었습니다.",
    desc: "스타트업에서 회색지대는 반드시 생깁니다. 감정이 없는 지금 처리 원칙을 정해둡니다.",
    opts: [
      { id: "1", label: "순번제 (로테이션)",         desc: "팀원이 돌아가며 처리합니다. 누군가에게 쏠리지 않도록 공평하게 분담합니다." },
      { id: "2", label: "발생 즉시 담당자 고정",     desc: "생기는 즉시 담당자를 정하고, 이후 동일 업무는 그 사람 몫으로 합니다." },
      { id: "3", label: "대표가 기본 처리",           desc: "명확한 담당이 없는 업무는 기본적으로 대표가 책임지고 처리합니다." },
      { id: "4", label: "외부 인력에 위임",             desc: "인턴·파트타임·프리랜서를 활용해 잡무를 외부에 맡깁니다. 창업자가 직접 소모되지 않도록 합니다." },
    ],
    hasCustom: true,
    clause: (opt, _, custom) => {
      if (opt === "custom") return custom ? `담당이 정해지지 않은 업무가 발생한 경우, ${custom}` : "";
      return ({
        "1": "담당이 정해지지 않은 업무가 발생한 경우, 팀원이 순번에 따라 번갈아 처리하기로 한다.",
        "2": "담당이 정해지지 않은 업무가 발생한 경우, 즉시 담당자를 지정하여 이후 동일 업무의 기준으로 삼기로 한다.",
        "3": "담당이 정해지지 않은 업무가 발생한 경우, 기본적으로 대표가 처리하기로 한다.",
        "4": "담당이 정해지지 않은 업무는 인턴·파트타임 등 외부 인력을 활용하여 처리하기로 한다.",
      }[opt] ?? "");
    },
  },
  {
    id: "underperform", group: "role", sideLabel: "성과 조치",
    topic: "역할 & 책임",
    title: "성과 부진이 지속될 때 어떻게 대응하나요?",
    scenario: "파트너가 맡은 영업 목표를 3개월째 절반도 못 채우고 있습니다. 어떻게 말을 꺼내야 할지 모르겠습니다.",
    desc: "역할 조정 기준과 타이밍을 미리 합의해 감정 소모 없이 대화를 시작할 수 있습니다.",
    opts: [
      { id: "1", label: "즉시 역할 조정", desc: "성과 부진 확인 즉시 역할을 조정해 실행 속도를 유지합니다." },
      {
        id: "2", label: "기간·기준 설정 후 조정", desc: "기간과 기준을 정해두고 미달 시 역할 조정을 논의합니다.",
        subChips: [
          { key: "months",   label: "기간", opts: ["1개월", "2개월", "3개월"], hasCustom: true },
          { key: "criteria", label: "기준", opts: ["OKR 달성률", "월 매출 목표", "주요 마일스톤"] },
        ],
      },
      { id: "3", label: "원인 파악 후 지원", desc: "원인을 먼저 파악하고 필요한 지원을 제공한 후 조치를 결정합니다." },
      { id: "4", label: "역할 구조 재설계", desc: "역할 구조 자체를 재검토하는 근본적 해결을 우선합니다." },
    ],
    hasCustom: true,
    clause: (opt, chips, custom) => {
      if (opt === "custom") return custom ? `구성원의 성과 부진이 지속되는 경우, ${custom}` : "";
      return ({
        "1": "구성원의 성과 부진이 지속되는 경우, 즉시 역할을 조정하여 팀 전체의 실행 속도를 유지하기로 한다.",
        "2": `구성원의 성과 부진이 지속되는 경우, ${chips.months ?? "__"}간 ${chips.criteria ?? "__"} 미달 시 역할 조정을 논의하기로 한다.`,
        "3": "구성원의 성과 부진이 지속되는 경우, 원인을 먼저 파악하고 필요한 지원을 제공한 후 조치를 결정하기로 한다.",
        "4": "구성원의 성과 부진이 지속되는 경우, 역할 구조 자체의 변경을 포함한 근본적 해결 방안을 함께 논의하기로 한다.",
      }[opt] ?? "");
    },
  },
  {
    id: "commitment", group: "role", sideLabel: "헌신 기대치",
    topic: "역할 & 책임",
    title: "파트너에게 기대하는 헌신 수준이 어느 정도인가요?",
    scenario: "파트너가 부업 프로젝트를 시작했다는 걸 SNS에서 우연히 알게 됐습니다. 직접 말해준 적은 없었습니다.",
    desc: "시간보다 성과인지, 전업 수준의 투입인지 — 서로의 기대치를 솔직하게 맞춰둡니다.",
    opts: [
      { id: "1", label: "전업 수준 헌신", desc: "이 사업에 온전히 집중하는 전업 수준의 투입을 기대합니다." },
      { id: "2", label: "성과 중심, 시간 무관", desc: "투입 시간보다 책임지는 성과를 내는 것이 더 중요합니다." },
      { id: "3", label: "역할별 기대치 별도 합의", desc: "담당 영역에 따라 기대하는 투입 수준을 따로 정합니다." },
      { id: "4", label: "정기 점검으로 유연하게 조율", desc: "고정 기준 없이 상황에 따라 정기적으로 기대치를 함께 맞춰갑니다." },
    ],
    hasCustom: true,
    clause: (opt, _, custom) => {
      if (opt === "custom") return custom ? `헌신 기대치 기준은 ${custom}으로 한다.` : "";
      return ({
        "1": "파트너 모두 전업 수준의 투입을 원칙으로 하기로 한다.",
        "2": "투입 시간보다 각자 책임지는 성과를 우선 기준으로 하기로 한다.",
        "3": "담당 역할별로 기대하는 투입 수준을 별도로 합의하기로 한다.",
        "4": "헌신 기대치는 고정하지 않고, 정기적으로 함께 점검하며 조율하기로 한다.",
      }[opt] ?? "");
    },
  },
  {
    id: "decisionAuth", group: "role", sideLabel: "결정 권한",
    topic: "역할 & 책임",
    title: "혼자 결정할 것과 같이 의논할 것, 어떻게 나눌까요?",
    scenario: "파트너가 내 동의 없이 외주 개발사와 300만원짜리 계약을 체결했습니다. '빠르게 결정해야 했다'고 합니다.",
    desc: "결정 권한이 불명확하면 실행이 느려지거나 파트너 신뢰가 깨집니다. 기준을 미리 정해둡니다.",
    tip: { title: "DRI라는 방식도 있어요", body: "DRI(Directly Responsible Individual, 직접책임자)는 애플이 도입한 의사결정 구조로, 국내 일부 스타트업도 이 방식을 참고합니다. 직급·연차 대신 '그 문제를 가장 깊이 고민한 사람'이 DRI를 맡고, 의견을 충분히 수렴한 뒤 최종 결정을 내리는 방식이에요. 결정권자를 명확히 두면 실행 속도와 책임 소재가 동시에 분명해지는 효과가 있다고 알려져 있습니다." },
    opts: [
      { id: "1", label: "담당 영역 내 완전 단독", desc: "각자의 담당 영역 안에서는 모든 결정을 완전히 단독으로 합니다." },
      { id: "2", label: "단독 결정 + 사후 공유",  desc: "단독으로 결정하되, 실행 후 24시간 내 팀 채널에 공유합니다." },
      { id: "3", label: "큰 결정만 사전 공동 논의", desc: "일정 금액·영향도 이상 결정은 파트너와 사전 논의 후 진행합니다." },
      { id: "4", label: "모든 주요 결정 공동 논의", desc: "영역과 무관하게 주요 결정은 파트너와 사전 논의를 원칙으로 합니다." },
    ],
    hasCustom: true,
    clause: (opt, _, custom) => {
      if (opt === "custom") return custom ? `단독 결정과 공동 논의의 기준은 ${custom}으로 한다.` : "";
      return ({
        "1": "각 구성원은 자신의 담당 영역 내 모든 결정을 단독으로 하기로 한다.",
        "2": "각 구성원은 담당 영역 내 결정을 단독으로 하되, 실행 후 24시간 이내 팀 채널에 공유하기로 한다.",
        "3": "담당 영역 내에서도 일정 기준 이상의 결정은 파트너와 사전 논의를 거쳐 진행하기로 한다.",
        "4": "주요 의사결정은 담당 영역과 무관하게 파트너와 사전 논의 후 진행하는 것을 원칙으로 한다.",
      }[opt] ?? "");
    },
  },
  {
    id: "roleEvolution", group: "role", sideLabel: "역할 진화",
    topic: "역할 & 책임",
    title: "회사가 성장하면 창업자의 역할은 어떻게 바뀌어야 할까요?",
    scenario: "시리즈A 투자 미팅에서 투자자가 'CEO를 외부 전문가로 교체할 생각이 있냐'고 물었습니다.",
    desc: "스케일업 단계에서 역할 이전에 대한 기대를 맞춰두면 훗날 감정 소모 없이 대화할 수 있습니다.",
    tip: { title: "이런 시각도 있어요", body: "스타트업이 성장할수록 창업자의 역할이 바뀌는 경우가 많습니다. First Round Capital은 이를 '레고 넘겨주기'라고 표현하는데, 자신이 쌓은 역할을 전문가에게 건네는 과정을 성장의 신호로 보는 시각이에요. 국내 한 커머스 스타트업에서는 공동대표 중 한 명이 사업 확장 시점에 CSO로 역할을 전환한 사례도 있습니다." },
    opts: [
      { id: "1", label: "창업자가 계속 성장하며 맡는다",    desc: "전문 경영인 영입보다 창업자 스스로 역할을 키워가며 운영을 이어갑니다." },
      { id: "2", label: "전략·이사회 역할로 자연스럽게 이동", desc: "필요 시 외부 전문가를 영입하고, 창업자는 전략 및 거버넌스 역할로 전환합니다." },
      {
        id: "3", label: "이전 조건을 사전에 합의", desc: "특정 규모·지표 달성 시 역할 이전을 사전에 합의해두고 그에 따릅니다.",
        subChips: [{ key: "condition", label: "이전 기준", opts: ["시리즈A 투자 완료", "직원 20인 이상", "연 매출 10억 이상"], hasCustom: true }],
      },
      { id: "4", label: "이사회·투자자와 함께 결정",         desc: "역할 변화는 회사 성장 단계에서 이사회 및 투자자와 공동으로 결정합니다." },
    ],
    hasCustom: true,
    clause: (opt, chips, custom) => {
      if (opt === "custom") return custom ? `회사 성장에 따른 창업자 역할 변화는 ${custom}을 기준으로 한다.` : "";
      return ({
        "1": "창업자는 회사 성장에 맞춰 스스로 역할을 발전시켜 나가며, 전문 경영인 교체보다 창업자의 지속적인 성장을 우선한다.",
        "2": "회사 스케일업 과정에서 외부 전문 인재 영입이 필요한 경우, 창업자는 전략 및 이사회 역할로 전환하는 것을 원칙으로 한다.",
        "3": `${chips.condition ?? "__"} 달성 시 창업자의 역할 이전을 진행하기로 한다.`,
        "4": "창업자 역할의 변화는 이사회 및 주요 투자자와 함께 논의하여 결정하기로 한다.",
      }[opt] ?? "");
    },
  },
  {
    id: "externalActivity", group: "role", sideLabel: "외부 활동",
    topic: "역할 & 책임",
    title: "창업 외에 자문·겸직·외부 투자 활동은 어디까지 괜찮나요?",
    scenario: "파트너가 우리와 유사한 분야 스타트업의 기술 자문을 맡겠다고 합니다. 월 100만원 보수라고 합니다.",
    desc: "단순 부업과 달리 타 스타트업 자문이나 투자는 이해충돌 또는 시간 배분 문제가 생길 수 있습니다.",
    opts: [
      { id: "1", label: "전면 금지",          desc: "재직 중 외부 자문·투자·겸직은 어떤 형태로도 하지 않습니다." },
      { id: "2", label: "사전 공유 후 허용",  desc: "파트너에게 미리 공유하고, 이해충돌이 없는 경우에 한해 허용합니다." },
      { id: "3", label: "경쟁사만 제한",      desc: "직접 경쟁사 관련 활동만 금지하고, 나머지는 자율에 맡깁니다." },
      { id: "4", label: "전면 자율",          desc: "개인 활동은 각자 판단에 맡기되, 이해충돌 발생 시 즉시 공개 논의합니다." },
    ],
    hasCustom: true,
    clause: (opt, _, custom) => {
      if (opt === "custom") return custom ? `외부 자문·투자·겸직 활동은 ${custom}을 원칙으로 한다.` : "";
      return ({
        "1": "재직 기간 중 외부 자문, 투자, 겸직 활동은 어떤 형태로도 하지 않기로 한다.",
        "2": "외부 자문·투자·겸직 활동은 파트너에게 사전에 공유하고, 이해충돌이 없는 경우에 한해 허용하기로 한다.",
        "3": "직접 경쟁사 관련 자문·투자·겸직 활동만 금지하며, 그 외 활동은 개인 자율에 맡기기로 한다.",
        "4": "외부 활동은 각자의 판단에 맡기되, 이해충돌이 발생하는 경우 즉시 공개 논의하기로 한다.",
      }[opt] ?? "");
    },
  },
  // ── 비전 & 가치관 ─────────────────────────────────────────────────────────
  {
    id: "exitVision", group: "vision", sideLabel: "출구 전략",
    topic: "비전 & 가치관",
    title: "이 회사의 이상적인 결말이 무엇인가요?",
    scenario: "대기업에서 인수 제안이 들어왔습니다. 한 명은 지금이 기회라고 하고, 한 명은 아직 너무 이르다고 합니다.",
    desc: "출구 전략이 다르면 투자·채용·제품 방향이 모두 달라집니다. 각자의 그림을 지금 맞춰둡니다.",
    tip: { title: "부자가 될 것인가, 왕이 될 것인가", body: "하버드 경영대학원 Noam Wasserman 교수는 창업자가 '통제권(왕)'과 '재정적 성공(부자)' 사이에서 선택의 순간을 맞이하는 경우가 많다고 분석합니다. 두 가지를 동시에 유지하는 경우는 드물다는 연구 결과가 있어요. 공동창업자 간 이 가치관이 다르면 투자 유치나 엑싯 시점에서 서로 다른 기대가 부딪히는 경우도 있다고 합니다." },
    opts: [
      { id: "1", label: "M&A 엑싯",         desc: "좋은 조건에 매각하는 것을 중장기 목표로 합니다." },
      { id: "2", label: "IPO",               desc: "기업공개(상장)를 장기 목표로 합니다." },
      { id: "3", label: "수익성 독립 운영", desc: "외부 의존 없이 수익 기반으로 독립 운영합니다." },
      { id: "4", label: "정기 점검 후 결정", desc: "방향을 고정하지 않고 정기적으로 함께 재점검합니다." },
    ],
    hasCustom: true,
    clause: (opt, _, custom) => {
      if (opt === "custom") return custom ? `회사의 중장기 출구 전략은 ${custom}을 지향하기로 한다.` : "";
      return ({
        "1": "회사의 중장기 목표로 M&A를 통한 엑싯을 지향하기로 한다.",
        "2": "회사의 중장기 목표로 IPO(기업공개)를 지향하기로 한다.",
        "3": "회사의 중장기 목표로 수익성 기반의 독립 운영을 지향하기로 한다.",
        "4": "특정 출구 전략을 확정하지 않고, 정기적으로 회사의 방향을 함께 재점검하기로 한다.",
      }[opt] ?? "");
    },
  },
  {
    id: "pivot", group: "vision", sideLabel: "피벗 기준",
    topic: "비전 & 가치관",
    title: "피벗이나 중단, 언제 논의하기로 할까요?",
    scenario: "반년째 MAU가 제자리고 투자금 60%가 소진된 상황에서, 투자자가 방향 재검토를 요청했습니다.",
    desc: "감정이 없는 지금, 대화를 시작할 트리거를 미리 정해두면 나중에 충돌을 막습니다.",
    tip: { title: "피벗 기준을 미리 정해두는 팀도 있어요", body: "린 스타트업의 Eric Ries는 피벗을 '포기가 아닌 방향 전환'으로 정의합니다. 일부 팀은 피벗 논의의 트리거를 미리 합의해두기도 해요. 예시 기준으로는 ① 런웨이 3개월 이하 도달, ② 핵심 지표 2분기 연속 정체, ③ 창업자 팀 과반 동의 등이 있습니다. 어떤 기준을 쓸지는 팀마다 다릅니다." },
    opts: [
      {
        id: "1", label: "런웨이 기준", desc: "자금이 일정 기간 이하로 줄면 논의를 시작합니다.",
        subChips: [{ key: "runway", label: "런웨이 기준", opts: ["3개월", "6개월", "9개월"], hasCustom: true }],
      },
      {
        id: "2", label: "핵심 지표 정체 기준", desc: "일정 기간 핵심 지표에 변화가 없으면 논의합니다.",
        subChips: [
          { key: "period", label: "기간",  opts: ["2개월", "3개월", "6개월"], hasCustom: true },
          { key: "metric", label: "지표", opts: ["MAU", "매출", "고객 수"] },
        ],
      },
      { id: "3", label: "핵심 멤버 이탈", desc: "공동창업자를 포함한 핵심 멤버가 이탈했을 때 논의를 시작합니다." },
      { id: "4", label: "창업자 간 방향성 장기 불일치", desc: "창업자 간 핵심 방향성 불일치가 일정 기간 해소되지 않을 때 논의합니다." },
    ],
    hasCustom: true,
    clause: (opt, chips, custom) => {
      if (opt === "custom") return custom ? `사업 방향 전환(피벗) 또는 중단 논의는 ${custom} 시작하기로 한다.` : "";
      return ({
        "1": `사업 방향 전환(피벗) 또는 중단 논의는 런웨이 ${chips.runway ?? "__"} 이하가 되는 시점에 시작하기로 한다.`,
        "2": `사업 방향 전환(피벗) 또는 중단 논의는 ${chips.period ?? "__"}간 ${chips.metric ?? "__"} 지표에 유의미한 변화가 없을 때 시작하기로 한다.`,
        "3": "사업 방향 전환(피벗) 또는 중단 논의는 공동창업자를 포함한 핵심 멤버 이탈이 발생했을 때 시작하기로 한다.",
        "4": "사업 방향 전환(피벗) 또는 중단 논의는 창업자 간 핵심 방향성 불일치가 일정 기간 해소되지 않을 때 시작하기로 한다.",
      }[opt] ?? "");
    },
  },
  {
    id: "conflictProcess", group: "vision", sideLabel: "갈등 해결",
    topic: "비전 & 가치관",
    title: "창업자 간 갈등이 생겼을 때, 어떻게 풀기로 할까요?",
    scenario: "채용 문제로 언성이 높아졌고, 이후 사흘째 둘 다 먼저 말을 걸지 않고 있습니다.",
    desc: "감정이 없는 지금 절차를 미리 합의해두면, 갈등이 격화됐을 때 기댈 수 있는 기준이 됩니다.",
    opts: [
      {
        id: "1", label: "48시간 내 직접 대화",
        desc: "갈등 발생 후 48시간 내에 당사자 간 직접 대화로 해결합니다. 미루지 않는 것을 원칙으로 합니다.",
      },
      {
        id: "2", label: "냉각기 후 별도 자리",
        desc: "충분히 감정이 가라앉은 뒤 별도 시간을 잡아 대화합니다. 즉각 대화보다 준비된 대화를 우선합니다.",
        subChips: [
          { key: "cooldown", label: "냉각 시간", opts: ["3시간", "12시간", "24시간"], hasCustom: true },
        ],
      },
      {
        id: "3", label: "글 정리 후 대면",
        desc: "감정이 아닌 내용으로 소통하기 위해, 각자 생각을 글로 정리해 공유한 뒤 대면으로 마무리합니다.",
      },
      {
        id: "4", label: "단계별 프로세스",
        desc: "직접 대화 시도 → 냉각기 후 재시도 → 공동 멘토·제3자 중재 순서로 단계별로 진행합니다.",
      },
    ],
    hasCustom: true,
    clause: (opt, chips, custom) => {
      if (opt === "custom") return custom ? `창업자 간 갈등 발생 시 ${custom}을 원칙으로 한다.` : "";
      return ({
        "1": "창업자 간 갈등이 발생한 경우, 48시간 이내에 당사자 간 직접 대화로 해결하는 것을 원칙으로 한다.",
        "2": `창업자 간 갈등이 발생한 경우, ${chips.cooldown ?? "__"} 이상의 냉각기를 가진 뒤 별도 자리를 마련하여 대화로 해결하기로 한다.`,
        "3": "창업자 간 갈등이 발생한 경우, 각자 생각을 글로 정리해 공유한 뒤 대면 대화로 마무리하는 것을 원칙으로 한다.",
        "4": "창업자 간 갈등이 발생한 경우, 직접 대화 시도 → 냉각기 후 재시도 → 공동으로 신뢰하는 제3자 중재 순서의 단계별 절차를 따르기로 한다.",
      }[opt] ?? "");
    },
  },
  {
    id: "dealbreaker", group: "vision", sideLabel: "딜브레이커",
    topic: "비전 & 가치관",
    title: "팀에서 절대 용납 못하는 것이 무엇인가요?",
    scenario: "파트너가 내 동의 없이 투자자에게 지분 일부를 약속했다는 걸 제3자에게서 먼저 들었습니다.",
    desc: "각자의 레드라인을 솔직하게 공유합니다. 위 보기에 없으면 직접 씁니다.",
    opts: [
      { id: "1", label: "파트너 몰래 독단 결정", desc: "주요 사안을 합의 없이 혼자 결정·실행하는 것을 용납하지 않습니다." },
      { id: "2", label: "재무·지분의 불투명 처리", desc: "돈·지분 관련 내용을 공유하지 않거나 임의로 처리하는 것을 용납하지 않습니다." },
      { id: "3", label: "경쟁사 동시 관여",       desc: "팀 동의 없이 경쟁 관계 프로젝트·회사에 관여하는 것을 용납하지 않습니다." },
      { id: "4", label: "법·윤리 위반",           desc: "법적 또는 윤리적 기준을 어기는 행동을 용납하지 않습니다." },
    ],
    hasCustom: true,
    clause: (opt, _, custom) => {
      if (opt === "custom") return custom ? `팀 운영에서 ${custom}을(를) 가장 경계하며, 해당 상황 발생 시 즉시 대화를 통해 해소하기로 한다.` : "";
      return ({
        "1": "팀 운영에서 주요 사안을 파트너와 합의 없이 독단으로 결정·실행하는 것을 가장 경계하며, 해당 상황 발생 시 즉시 대화를 통해 해소하기로 한다.",
        "2": "팀 운영에서 재무·지분 관련 사항을 파트너에게 공유하지 않거나 임의로 처리하는 것을 가장 경계하며, 해당 상황 발생 시 즉시 대화를 통해 해소하기로 한다.",
        "3": "팀 운영에서 팀 동의 없이 경쟁 관계에 있는 프로젝트나 회사에 관여하는 것을 가장 경계하며, 해당 상황 발생 시 즉시 대화를 통해 해소하기로 한다.",
        "4": "팀 운영에서 법적·윤리적 기준을 어기는 행동을 가장 경계하며, 해당 상황 발생 시 즉시 대화를 통해 해소하기로 한다.",
      }[opt] ?? "");
    },
  },
  {
    id: "growthModel", group: "vision", sideLabel: "성장 방식",
    topic: "비전 & 가치관",
    title: "초기에 어떤 방식으로 성장할 건가요?",
    scenario: "투자자는 급성장을, 파트너는 수익 구조 우선을 주장합니다. 다음 달 투자 미팅이 잡혔습니다.",
    desc: "성장 방식에 대한 관점이 다르면 투자 판단, 채용 기준, 제품 방향이 모두 달라집니다.",
    opts: [
      { id: "1", label: "사용자·시장 점유 우선", desc: "초기엔 수익성보다 성장 지표와 시장 점유를 최우선으로 합니다." },
      { id: "2", label: "수익 구조 먼저",        desc: "초기부터 수익 구조를 명확히 하며 지속 가능한 방식으로 성장합니다." },
      { id: "3", label: "좁은 타깃 장악 후 확장", desc: "핵심 기능 하나로 특정 타깃을 완전히 장악한 뒤 인접 시장으로 단계적으로 확장합니다." },
      { id: "4", label: "조기 흑자 기반 성장",   desc: "외부 투자 없이 자체 수익으로 성장 속도를 통제합니다. 수익이 나야 다음 단계로 갑니다." },
    ],
    hasCustom: true,
    clause: (opt, _, custom) => {
      if (opt === "custom") return custom ? `초기 성장 방식은 ${custom}을 우선 기준으로 한다.` : "";
      return ({
        "1": "초기 성장 단계에서는 수익성보다 사용자 수 확대와 시장 점유를 최우선 목표로 하기로 한다.",
        "2": "초기부터 수익 구조를 명확히 하며 지속 가능한 방식의 성장을 우선하기로 한다.",
        "3": "핵심 기능으로 특정 타깃을 완전히 장악한 뒤 인접 시장으로 단계적으로 확장하기로 한다.",
        "4": "외부 투자에 의존하지 않고 자체 수익 기반으로 성장하되, 흑자 달성 후 다음 단계로 전환하기로 한다.",
      }[opt] ?? "");
    },
  },
  {
    id: "hiringCriteria", group: "vision", sideLabel: "팀 확장",
    topic: "비전 & 가치관",
    title: "새로운 팀원 합류 결정은 어떻게 하나요?",
    scenario: "파트너가 친한 지인을 CTO로 데려오고 싶다고 합니다. 나는 함께 일해본 적 없어서 확신이 서지 않습니다.",
    desc: "채용 결정 방식이 불명확하면 속도와 팀 신뢰 사이에서 마찰이 생깁니다.",
    opts: [
      { id: "1", label: "창업자 전원 합의", desc: "모든 팀 합류는 창업자 양쪽 모두의 동의가 있어야 합니다." },
      { id: "2", label: "담당 창업자 주도 + 거부권", desc: "해당 역할 담당 창업자가 주도하고, 다른 창업자가 거부권을 가집니다." },
      { id: "3", label: "시범 협업 후 결정", desc: "팀 합류 전 짧은 시범 협업 기간을 두고, 이후 창업자 전원이 합류 여부를 함께 판단합니다." },
      { id: "4", label: "대표가 최종 결정 + 사전 공유", desc: "채용 결정은 대표가 최종적으로 하되, 파트너에게 사전 공유합니다." },
    ],
    hasCustom: true,
    clause: (opt, chips, custom) => {
      if (opt === "custom") return custom ? `신규 팀원 합류 결정은 ${custom}을 원칙으로 한다.` : "";
      return ({
        "1": "신규 팀원 합류는 창업자 전원의 동의를 원칙으로 한다.",
        "2": "신규 팀원 합류는 해당 역할 담당 창업자가 주도하되, 다른 창업자의 거부권을 인정하기로 한다.",
        "3": "신규 팀원 합류는 시범 협업 기간을 거친 뒤 창업자 전원의 합의로 결정하기로 한다.",
        "4": "신규 팀원 합류의 최종 결정은 대표가 하되, 파트너에게 사전 공유하기로 한다.",
      }[opt] ?? "");
    },
  },
  // ── 자금조달 & 운용 ───────────────────────────────────────────────────────
  {
    id: "runway", group: "fund", sideLabel: "자금 위기",
    topic: "자금조달 & 운용",
    title: "자금 위기가 왔을 때, 가장 먼저 무엇을 해야 할까요?",
    scenario: "이대로면 두 달 안에 통장이 바닥납니다. 직원 월급을 못 줄 수도 있는 상황입니다.",
    desc: "위기 상황에서 판단 기준이 다르면 갈등이 커집니다. 각자의 우선순위를 지금 맞춰둡니다.",
    opts: [
      { id: "1", label: "비용 절감 우선",    desc: "인원 감축 포함 전면적 비용 절감을 최우선으로 합니다." },
      { id: "2", label: "브릿지 투자 유치",  desc: "브릿지 투자 유치를 최우선으로 추진합니다." },
      { id: "3", label: "매출로 자체 생존",  desc: "매출 확대를 통한 자체 생존을 최우선으로 합니다." },
      { id: "4", label: "창업자 보수 유예",  desc: "창업자 보수 유예를 통해 런웨이를 확보합니다." },
    ],
    hasCustom: true,
    clause: (opt, _, custom) => {
      if (opt === "custom") return custom ? `자금 위기 시 ${custom}을 최우선 대응으로 한다.` : "";
      return ({
        "1": "런웨이 위기 시 인원 감축을 포함한 전면적 비용 절감을 최우선 대응으로 한다.",
        "2": "런웨이 위기 시 브릿지 투자 유치를 최우선 대응으로 추진하기로 한다.",
        "3": "런웨이 위기 시 매출 확대를 통한 자체 생존을 최우선 대응으로 한다.",
        "4": "런웨이 위기 시 창업자 보수 유예를 통한 런웨이 확보를 최우선 대응으로 한다.",
      }[opt] ?? "");
    },
  },
  {
    id: "spending", group: "fund", sideLabel: "지출 기준",
    topic: "자금조달 & 운용",
    title: "단독 지출 결정, 어디까지 할 수 있을까요?",
    scenario: "파트너가 '기회가 사라질 것 같아서' 동의 없이 에이전시에 500만원을 선결제했습니다.",
    desc: "지출 기준이 명확하면 실행 속도와 팀 신뢰를 동시에 지킬 수 있습니다.",
    opts: [
      { id: "1", label: "역할 범위 내 단독", desc: "담당 역할 범위 내 지출은 단독으로 결정할 수 있습니다." },
      {
        id: "2", label: "금액 기준 협의", desc: "일정 금액 초과 지출은 사전 협의를 거칩니다.",
        subChips: [{ key: "amount", label: "협의 기준 금액", opts: ["10만원", "30만원", "50만원", "100만원", "500만원"], hasCustom: true }],
      },
      { id: "3", label: "항목별 구분 운영", desc: "자율 집행 항목과 협의 항목을 사전에 구분하여 운영합니다." },
      { id: "4", label: "전원 공동 승인",   desc: "금액과 무관하게 전원 공동 승인을 원칙으로 합니다." },
    ],
    hasCustom: true,
    clause: (opt, chips, custom) => {
      if (opt === "custom") return custom ? `지출 결정 기준은 ${custom}으로 한다.` : "";
      return ({
        "1": "지출 집행은 각자의 역할 범위 내에서 단독으로 결정할 수 있는 것을 원칙으로 한다.",
        "2": `${chips.amount ?? "__"}을 초과하는 지출은 사전 협의를 거쳐 집행하기로 한다.`,
        "3": "지출 항목별로 자율 집행 항목과 협의 필요 항목을 구분하여 운영하기로 한다.",
        "4": "지출 집행은 금액과 무관하게 전원 공동 승인을 원칙으로 한다.",
      }[opt] ?? "");
    },
  },
  {
    id: "investment", group: "fund", sideLabel: "투자 기준",
    topic: "자금조달 & 운용",
    title: "투자 제안을 판단하는 최우선 기준이 무엇인가요?",
    scenario: "'네트워크 좋은 저밸류 투자자 A' vs '밸류 높지만 전략 없는 투자자 B' — 하나를 선택해야 합니다.",
    desc: "투자자 앞에서 의견이 갈리지 않도록 판단 기준을 미리 맞춥니다. 지금은 최우선 1개만 선택합니다.",
    opts: [
      { id: "1", label: "밸류에이션 최우선", desc: "회사 가치 평가가 최우선 수락 기준입니다." },
      { id: "2", label: "전략적 가치 우선",  desc: "투자자의 네트워크·경험이 최우선 기준입니다." },
      { id: "3", label: "런웨이 확보 기준",  desc: "충분한 런웨이 확보 여부가 최우선 기준입니다." },
      { id: "4", label: "지분 희석 최소화",  desc: "지분 희석을 최소화하는 조건이 최우선 기준입니다." },
    ],
    hasCustom: true,
    clause: (opt, _, custom) => {
      if (opt === "custom") return custom ? `투자 제안 판단의 최우선 기준은 ${custom}으로 한다.` : "";
      return ({
        "1": "투자 수락 여부 판단의 최우선 기준을 밸류에이션으로 한다.",
        "2": "투자 수락 여부 판단의 최우선 기준을 투자자의 전략적 가치(네트워크·경험)로 한다.",
        "3": "투자 수락 여부 판단의 최우선 기준을 런웨이 확보 여부로 한다.",
        "4": "투자 수락 여부 판단의 최우선 기준을 지분 희석 최소화로 한다.",
      }[opt] ?? "");
    },
  },
  {
    id: "account", group: "fund", sideLabel: "계좌 관리",
    topic: "자금조달 & 운용",
    title: "법인 계좌와 카드를 어떻게 관리하나요?",
    scenario: "법인카드 내역을 처음으로 같이 들여다봤는데, 서로 설명이 안 되는 지출 항목이 몇 개 보입니다.",
    desc: "재무 관리 주체를 명확히 해두면 투명성과 신뢰를 함께 지킬 수 있습니다.",
    opts: [
      { id: "1", label: "대표 단독 관리",       desc: "법인 계좌·카드는 대표가 단독으로 관리합니다." },
      { id: "2", label: "대표 주도 + 월간 공유", desc: "대표가 주도적으로 관리하되, 월간 내역을 전원과 공유합니다." },
      { id: "3", label: "역할별 분리 관리",     desc: "담당 역할에 따라 분리하여 각자 관리합니다." },
      { id: "4", label: "공동 관리",             desc: "구성원 공동으로 관리하며, 일정 금액 이상은 공동 서명합니다." },
    ],
    hasCustom: true,
    clause: (opt, _, custom) => {
      if (opt === "custom") return custom ? `법인 계좌 및 법인카드 관리는 ${custom}을 원칙으로 한다.` : "";
      return ({
        "1": "법인 계좌 및 법인카드는 대표가 단독으로 관리하기로 한다.",
        "2": "법인 계좌 및 법인카드는 대표가 주도적으로 관리하되, 월간 내역을 구성원 전원과 공유하기로 한다.",
        "3": "법인 계좌 및 법인카드는 담당 역할에 따라 분리하여 각자 관리하기로 한다.",
        "4": "법인 계좌 및 법인카드는 구성원 공동으로 관리하되, 일정 금액 이상의 지출은 공동 서명을 원칙으로 한다.",
      }[opt] ?? "");
    },
  },
  {
    id: "founderSalary", group: "fund", sideLabel: "창업자 보수",
    topic: "자금조달 & 운용",
    title: "창업 초기에 각자 보수를 어떻게 운영할 건가요?",
    scenario: "투자금이 들어왔습니다. 한 명은 생활비가 급하고, 한 명은 최대한 회사에 재투자하자는 입장입니다.",
    desc: "보수 불균형은 팀 갈등의 핵심 원인입니다. 초기 기준을 솔직하게 맞춰둡니다.",
    opts: [
      { id: "1", label: "무보수 (투자 전까지)", desc: "창업자 간 합의로 외부 투자를 받기 전까지는 무보수로 운영합니다." },
      {
        id: "2", label: "최소 생활비 균등 지급", desc: "생활 가능한 최소 수준의 균등 보수를 지급합니다.",
        subChips: [{ key: "amount", label: "월 보수", opts: ["50만원", "100만원", "150만원", "200만원"], hasCustom: true }],
      },
      { id: "3", label: "역할·기여 비례 차등", desc: "역할과 기여도에 따라 차등 보수를 지급합니다." },
      {
        id: "4", label: "조건 달성 시 보수 기준 설정", desc: "사전에 합의한 조건을 달성하면 보수 수준을 함께 정합니다.",
        subChips: [{ key: "trigger", label: "보수 시작 기준", opts: ["투자 유치 완료", "월 매출 500만원 이상", "손익분기점 달성"], hasCustom: true }],
      },
    ],
    hasCustom: true,
    clause: (opt, chips, custom) => {
      if (opt === "custom") return custom ? `창업 초기 창업자 보수는 ${custom}으로 한다.` : "";
      return ({
        "1": "외부 투자를 받기 전까지는 창업자 전원 무보수로 운영하기로 한다.",
        "2": `창업 초기 창업자 보수는 월 ${chips.amount ?? "__"}씩 균등 지급하기로 한다.`,
        "3": "창업 초기 창업자 보수는 역할과 기여도에 따라 차등 지급하기로 한다.",
        "4": `${chips.trigger ?? "__"} 조건 달성 시 창업자 보수 수준을 함께 정하기로 한다.`,
      }[opt] ?? "");
    },
  },
  {
    id: "profitPolicy", group: "fund", sideLabel: "수익 정책",
    topic: "자금조달 & 운용",
    title: "수익이 생기면 어떻게 쓸 건가요?",
    scenario: "첫 흑자를 냈는데, 이 돈을 어디에 쓸지를 두고 처음으로 진지한 의견 차이가 생겼습니다.",
    desc: "흑자 전환 이후 어떻게 돈을 쓸지를 미리 맞춰두면 불필요한 마찰을 줄입니다.",
    opts: [
      { id: "1", label: "전액 재투자", desc: "수익은 전액 사업 성장에 재투자하는 것을 원칙으로 합니다." },
      {
        id: "2", label: "일부 재투자 + 나머지 배분", desc: "수익의 일정 비율을 재투자하고 나머지를 창업자에게 배분합니다.",
        subChips: [{ key: "ratio", label: "재투자 비율", opts: ["재투자 20% / 배분 80%", "재투자 50% / 배분 50%", "재투자 80% / 배분 20%"] }],
      },
      { id: "3", label: "보수 현실화 우선", desc: "흑자 전환 즉시 창업자 보수 현실화를 최우선으로 합니다." },
      { id: "4", label: "흑자 전환 후 함께 논의", desc: "흑자 전환 시점에 상황에 맞게 함께 구체적 정책을 정합니다." },
    ],
    hasCustom: true,
    clause: (opt, chips, custom) => {
      if (opt === "custom") return custom ? `수익 발생 시 ${custom}을 원칙으로 한다.` : "";
      return ({
        "1": "수익 발생 시 전액 사업 성장에 재투자하는 것을 원칙으로 한다.",
        "2": `수익 발생 시 ${chips.ratio ?? "합의된 비율"}에 따라 재투자와 창업자 배분을 병행하기로 한다.`,
        "3": "흑자 전환 즉시 창업자 보수 현실화를 최우선으로 진행하기로 한다.",
        "4": "흑자 전환 시점에 상황에 맞게 창업자 전원이 함께 구체적인 수익 배분 정책을 정하기로 한다.",
      }[opt] ?? "");
    },
  },
];

// ─── component ───────────────────────────────────────────────────────────────
export default function BasicConsensusMockup() {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [memoOpen, setMemoOpen] = useState<Record<string, boolean>>({});
  const gridRef = useRef<HTMLDivElement>(null);
  const [tipOpen, setTipOpen] = useState<Record<string, boolean>>({});
  const [customChipVals, setCustomChipVals] = useState<Record<string, string>>({});

  useLayoutEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    const equalize = () => {
      const cards = Array.from(grid.querySelectorAll<HTMLElement>(".cq-choice"));
      cards.forEach(c => { c.style.minHeight = ""; });
      // 1열 레이아웃(모바일)에서는 높이 맞춤 불필요
      if (getComputedStyle(grid).gridTemplateColumns.split(" ").length < 2) return;
      const max = Math.max(...cards.map(c => c.offsetHeight));
      cards.forEach(c => { c.style.minHeight = `${max}px`; });
    };
    equalize();
    window.addEventListener("resize", equalize);
    return () => window.removeEventListener("resize", equalize);
  }, [index]);

  const q = QUESTIONS[index];
  const ans: Answer = answers[q.id] ?? { opt: "", chips: {}, custom: "", memo: "" };

  const setOpt = (opt: string) =>
    setAnswers(prev => ({ ...prev, [q.id]: { opt, chips: {}, custom: "", memo: ans.memo } }));
  const setChip = (key: string, val: string) =>
    setAnswers(prev => ({ ...prev, [q.id]: { ...ans, chips: { ...ans.chips, [key]: val } } }));
  const setCustom = (val: string) =>
    setAnswers(prev => ({ ...prev, [q.id]: { ...ans, custom: val } }));
  const setMemo = (val: string) =>
    setAnswers(prev => ({ ...prev, [q.id]: { ...ans, memo: val } }));
  const toggleMemo = () =>
    setMemoOpen(prev => ({ ...prev, [q.id]: !prev[q.id] }));
  const isMemoOpen = memoOpen[q.id] || !!ans.memo;

  const jump = (i: number) => {
    setIndex(Math.min(QUESTIONS.length - 1, Math.max(0, i)));
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const answered = QUESTIONS.filter(q => answers[q.id]?.opt).length;
  const progress = Math.round((answered / QUESTIONS.length) * 100);
  const canNext = !!ans.opt && (ans.opt !== "custom" || ans.custom.trim().length > 0);

  const selectedOpt = q.opts.find(o => o.id === ans.opt);
  const subChips = selectedOpt?.subChips ?? [];
  const resolvedChips = Object.fromEntries(
    Object.entries(ans.chips).map(([k, v]) => [
      k,
      v === "__custom__" ? (customChipVals[`${q.id}__${k}`] || "__") : v,
    ])
  );
  const clauseText = ans.opt ? q.clause(ans.opt, resolvedChips, ans.custom) : "";
  const clauseFinal = clauseText + (ans.memo?.trim() ? `\n(단, ${ans.memo.trim()})` : "");

  return (
    <div className="cq-page">
      <TopNav
        links={[
          { label: "대시보드", href: "/workspace" },
          { label: "합의 히스토리", href: "#" },
          { label: "설정", href: "#" },
        ]}
        active="합의 히스토리"
      />
      <div className="cq-shell">
        {/* ── sidebar ── */}
        <aside className="cq-sidebar">
          <div className="cq-sidebar-label">CoSync</div>
          <nav className="cq-sidebar-nav" aria-label="질문 목록">
            {GROUPS.map(g => {
              const inGroup = QUESTIONS.filter(x => x.group === g.id);
              const done = inGroup.filter(x => answers[x.id]?.opt).length;
              const active = q.group === g.id;
              const firstIdx = QUESTIONS.findIndex(x => x.group === g.id);
              return (
                <div key={g.id} className={`cq-side-group ${active ? "active" : ""}`}>
                  <button type="button" className="cq-side-head" onClick={() => jump(firstIdx)}>
                    <span className="cq-side-ko">
                      {g.ko}
                      {done === inGroup.length
                        ? <span className="bc-side-done" aria-hidden="true"><Check size={9} strokeWidth={3.5} /></span>
                        : <span className="cq-side-dot" aria-hidden="true" />
                      }
                    </span>
                    <span className="cq-side-en">{g.en}</span>
                    <span className="cq-side-count">{done}/{inGroup.length}</span>
                  </button>
                  <ul className="cq-side-list">
                    {inGroup.map(item => {
                      const idx = QUESTIONS.indexOf(item);
                      const isDone = !!answers[item.id]?.opt;
                      return (
                        <li key={item.id}>
                          <button
                            type="button"
                            className={`cq-side-q ${idx === index ? "current" : ""}`}
                            aria-current={idx === index ? "step" : undefined}
                            onClick={() => jump(idx)}
                          >
                            <span className={`cq-side-mark ${isDone ? "done" : ""}`} aria-hidden="true">
                              {isDone ? <Check size={11} strokeWidth={3.5} /> : idx + 1}
                            </span>
                            <span className="cq-side-q-text">{item.sideLabel}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </nav>
        </aside>

        {/* ── main ── */}
        <main className="cq-main">
          <article className="cq-card" key={q.id}>
            <header className="cq-card-head">
              <div className="cq-eyebrow-row">
                <span className="cq-eyebrow-bar" />
                <span className="cq-eyebrow">{q.topic}</span>
                <span className="bc-step">{index + 1} / {QUESTIONS.length}</span>
              </div>
              <div className="bc-title-row">
                <h1 className="cq-title">{q.title}</h1>
                {q.tip && (
                  <button
                    type="button"
                    className={`bc-tip-btn ${tipOpen[q.id] ? "active" : ""}`}
                    onClick={() => setTipOpen(p => ({ ...p, [q.id]: !p[q.id] }))}
                    aria-label="참고 정보 보기"
                  >
                    <Info size={18} strokeWidth={2} />
                  </button>
                )}
              </div>
              {q.scenario ? (
                <div className="bc-scenario">
                  <span className="bc-scenario-badge">합의가 없다면?</span>
                  <span>{q.scenario}</span>
                </div>
              ) : (
                <p className="cq-desc">{q.desc}</p>
              )}
              {q.tip && tipOpen[q.id] && (
                <div className="bc-tip-panel">
                  <img src="/images/mascot-knoty.png" className="bc-tip-knoty" alt="Knoty" />
                  <div className="bc-tip-content">
                    <div className="bc-tip-head">
                      <span className="bc-tip-badge">사례</span>
                      <span>{q.tip.title}</span>
                    </div>
                    <p className="bc-tip-body">{q.tip.body}</p>
                  </div>
                </div>
              )}
            </header>

            {/* choice grid */}
            <div className="cq-input-zone">
              <div className="cq-choice-grid" ref={gridRef}>
                {q.opts.map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    className={`cq-choice ${ans.opt === opt.id ? "on" : ""}`}
                    onClick={() => setOpt(opt.id)}
                  >
                    <div className="cq-choice-body">
                      <span className="cq-choice-label">{opt.label}</span>
                      <span className="cq-choice-desc">{opt.desc}</span>
                    </div>
                    {ans.opt === opt.id && (
                      <span className="cq-choice-check"><Check size={16} strokeWidth={3} /></span>
                    )}
                  </button>
                ))}
                {q.hasCustom && (
                  <button
                    type="button"
                    className={`cq-choice bc-choice-custom ${ans.opt === "custom" ? "on" : ""}`}
                    onClick={() => setOpt("custom")}
                  >
                    <div className="cq-choice-body">
                      <span className="cq-choice-label">기타 (직접 입력)</span>
                      <span className="cq-choice-desc">위 보기 외 우리 팀만의 기준을 직접 씁니다</span>
                    </div>
                    {ans.opt === "custom" && (
                      <span className="cq-choice-check"><Check size={16} strokeWidth={3} /></span>
                    )}
                  </button>
                )}
              </div>

              {/* sub-chips: blank filling */}
              {subChips.length > 0 && (
                <div className="bc-subchips">
                  {subChips.map(sc => {
                    const isCustom = ans.chips[sc.key] === "__custom__";
                    return (
                      <div key={sc.key} className="bc-subchip-group">
                        <span className="bc-subchip-label">{sc.label}</span>
                        <div className="cq-chips">
                          {sc.opts.map(o => (
                            <button
                              key={o}
                              type="button"
                              className={`cq-chip ${ans.chips[sc.key] === o ? "on" : ""}`}
                              onClick={() => setChip(sc.key, o)}
                            >
                              {o}
                            </button>
                          ))}
                          {sc.hasCustom && (
                            <button
                              type="button"
                              className={`cq-chip ${isCustom ? "on" : ""}`}
                              onClick={() => setChip(sc.key, "__custom__")}
                            >
                              기타
                            </button>
                          )}
                        </div>
                        {sc.hasCustom && isCustom && (
                          <input
                            type="text"
                            className="bc-chip-custom-input"
                            placeholder="직접 입력"
                            value={customChipVals[`${q.id}__${sc.key}`] ?? ""}
                            onChange={e => setCustomChipVals(prev => ({ ...prev, [`${q.id}__${sc.key}`]: e.target.value }))}
                            autoFocus
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* custom input */}
              {ans.opt === "custom" && (
                <div className="bc-custom">
                  <textarea
                    className="cq-textarea"
                    placeholder="우리 팀의 기준을 직접 입력하세요"
                    value={ans.custom}
                    onChange={e => setCustom(e.target.value)}
                    rows={3}
                  />
                </div>
              )}
            </div>

            {/* 세부 조건 메모 */}
            {ans.opt && (
              <div className="bc-memo-zone">
                {!isMemoOpen ? (
                  <button type="button" className="bc-memo-btn" onClick={toggleMemo}>
                    <PenLine size={13} />
                    세부 조건 추가
                  </button>
                ) : (
                  <div className="bc-memo-open">
                    <div className="bc-memo-header">
                      <span className="bc-memo-label">세부 조건 메모</span>
                      <button
                        type="button" className="bc-memo-close"
                        onClick={() => { setMemoOpen(prev => ({ ...prev, [q.id]: false })); if (!ans.memo) setMemo(""); }}
                      >
                        <X size={13} />
                      </button>
                    </div>
                    <textarea
                      className="cq-textarea"
                      placeholder="예: 3개월마다, 50만원 이상은 공동 승인 필요, 매달 말일 등 구체적 조건을 메모하세요"
                      value={ans.memo}
                      onChange={e => setMemo(e.target.value)}
                      rows={2}
                    />
                    <p className="bc-memo-hint">조항 끝에 「단, …」 형태로 자동 추가됩니다</p>
                  </div>
                )}
              </div>
            )}

            {/* clause preview */}
            {clauseFinal && (
              <div className="cq-preview">
                <div className="cq-preview-head">
                  <FileText size={13} />
                  합의 조항 미리보기
                  <span className="bc-clause-badge">
                    <Check size={10} strokeWidth={3.5} /> 조항 생성됨
                  </span>
                </div>
                <div className="cq-paper">
                  {clauseFinal.split("\n").map((line, i) => (
                    <p key={i} className={`cq-paper-para ${i > 0 ? "bc-clause-note" : ""}`}>{line}</p>
                  ))}
                </div>
              </div>
            )}
          </article>
        </main>
      </div>

      {/* ── footer ── */}
      <footer className="cq-footer">
        <button
          type="button" className="cq-back"
          onClick={() => jump(index - 1)} disabled={index === 0}
        >
          <ArrowLeft size={16} /> 이전
        </button>
        <div className="cq-footer-right">
          <div className="cq-progress">
            <div className="cq-progress-meta">
              <span className="cq-progress-label">{answered}/{QUESTIONS.length} 완료</span>
              <span className="cq-progress-pct">{progress}%</span>
            </div>
            <div className="cq-progress-bar"><span style={{ width: `${progress}%` }} /></div>
          </div>
          {index < QUESTIONS.length - 1 ? (
            <button
              type="button" className="cq-cta"
              onClick={() => jump(index + 1)} disabled={!canNext}
            >
              다음 <ArrowRight size={16} />
            </button>
          ) : (
            <button type="button" className="cq-cta" disabled={!canNext}>
              합의 완료 <Check size={16} />
            </button>
          )}
        </div>
      </footer>

      <style dangerouslySetInnerHTML={{ __html: `
        .cq-page { min-height: 100vh; min-height: 100dvh; display: flex; flex-direction: column; font-size: 16px;
          background:
            radial-gradient(at 0% 0%, rgba(79,70,229,0.12) 0px, transparent 50%),
            radial-gradient(at 100% 0%, rgba(16,185,129,0.08) 0px, transparent 50%),
            radial-gradient(at 100% 100%, rgba(79,70,229,0.08) 0px, transparent 50%),
            radial-gradient(at 0% 100%, rgba(16,185,129,0.08) 0px, transparent 50%),
            #F8FAFC; }
        .cq-shell { flex: 1; display: flex; flex-wrap: wrap; align-items: stretch; max-width: 1680px;
          width: calc(100% - 56px); margin: 28px auto 132px;
          background: #fff; border: 1px solid #e2e8f0; border-radius: 28px;
          box-shadow: 0 24px 60px -34px rgba(15,23,42,0.18); }

        .cq-sidebar { width: 268px; flex-shrink: 0; padding: 26px 0; border-right: 1px solid #eef2f7; border-radius: 28px 0 0 28px; overflow: hidden; }
        .cq-sidebar-label { padding: 0 20px; margin-bottom: 20px; font-size: 10px; font-weight: 900; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.25em; }
        .cq-sidebar-nav { display: flex; flex-direction: column; gap: 2px; }
        .cq-side-group { position: relative; padding-bottom: 8px; }
        .cq-side-head { width: 100%; display: grid; grid-template-columns: 1fr auto; grid-template-areas: "ko count" "en count"; align-items: center; gap: 0 8px; padding: 12px 16px 8px 20px; background: none; border: none; font: inherit; text-align: left; cursor: pointer; border-radius: 0 12px 12px 0; }
        .cq-side-head:hover { background: rgba(79,70,229,0.04); }
        .cq-side-head:focus-visible { outline: 2px solid #4F46E5; outline-offset: -2px; }
        .cq-side-ko { grid-area: ko; font-size: 14px; font-weight: 700; color: #94a3b8; display: inline-flex; align-items: center; gap: 6px; }
        .cq-side-en { grid-area: en; font-size: 10px; font-weight: 500; color: rgba(148,163,184,0.6); text-transform: uppercase; letter-spacing: 0.08em; }
        .cq-side-count { grid-area: count; font-size: 12px; font-weight: 800; color: #cbd5e1; font-variant-numeric: tabular-nums; }
        .cq-side-dot { width: 6px; height: 6px; border-radius: 999px; background: #F59E0B; }
        .cq-side-group.active .cq-side-ko { font-weight: 800; color: #0f172a; }
        .cq-side-group.active .cq-side-en { color: rgba(79,70,229,0.7); }
        .cq-side-group.active .cq-side-count { color: #4F46E5; }
        .cq-side-group.active::before { content: ""; position: absolute; left: 0; top: 14px; width: 4px; height: 26px; background: #4F46E5; border-radius: 0 999px 999px 0; }
        .cq-side-list { list-style: none; display: flex; flex-direction: column; }
        .cq-side-q { width: 100%; display: flex; align-items: center; gap: 9px; padding: 7px 14px 7px 20px; background: none; border: none; font: inherit; text-align: left; cursor: pointer; border-radius: 0 12px 12px 0; }
        .cq-side-q:hover { background: rgba(79,70,229,0.05); }
        .cq-side-q:focus-visible { outline: 2px solid #4F46E5; outline-offset: -2px; }
        .cq-side-q.current { background: rgba(79,70,229,0.09); }
        .cq-side-mark { width: 17px; height: 17px; flex-shrink: 0; border-radius: 999px; border: 1px solid #e2e8f0; background: #fff; color: #94a3b8; font-size: 9px; font-weight: 900; display: inline-flex; align-items: center; justify-content: center; font-variant-numeric: tabular-nums; }
        .cq-side-mark.done { background: #10B981; border-color: #10B981; color: #fff; }
        .cq-side-q.current .cq-side-mark:not(.done) { border-color: #4F46E5; color: #4F46E5; }
        .cq-side-q-text { font-size: 12px; font-weight: 600; color: #94a3b8; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .cq-side-q.current .cq-side-q-text { color: #3730A3; font-weight: 800; }

        .cq-main { flex: 1 1 520px; min-width: 0; padding: 34px 40px 48px; }
        .cq-card { max-width: 880px; margin: 0 auto; display: flex; flex-direction: column; gap: 28px; }
        .cq-card-head { display: flex; flex-direction: column; gap: 14px; }
        .cq-eyebrow-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .cq-eyebrow-bar { height: 3px; width: 32px; background: #4F46E5; border-radius: 999px; }
        .cq-eyebrow { color: #4F46E5; font-weight: 900; font-size: 13px; letter-spacing: -0.01em; }
        .cq-title { font-size: 30px; font-weight: 900; line-height: 1.25; color: #0f172a; letter-spacing: -0.02em; }
        .cq-desc { font-size: 15px; color: #64748b; font-weight: 500; line-height: 1.7; max-width: 42rem; }
        .bc-title-row { display: flex; align-items: flex-start; gap: 12px; }
        .bc-title-row .cq-title { flex: 1; }
        .bc-tip-btn { flex-shrink: 0; margin-top: 7px; width: 32px; height: 32px; border-radius: 10px; border: 1.5px solid #e2e8f0; background: #fff; color: #94a3b8; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; transition: all 0.15s; }
        .bc-tip-btn:hover { border-color: #a5b4fc; color: #6366f1; background: #f5f3ff; }
        .bc-tip-btn.active { border-color: #6366f1; color: #6366f1; background: #f5f3ff; }
        .bc-scenario { display: flex; align-items: center; gap: 10px; padding: 4px 0; font-size: 15px; color: #64748b; font-weight: 500; line-height: 1.5; }
        .bc-scenario-badge { flex-shrink: 0; font-size: 10px; font-weight: 900; color: #6366f1; background: #e0e7ff; border-radius: 6px; padding: 2px 7px; letter-spacing: 0.04em; white-space: nowrap; }
        .bc-tip-panel { background: #fff; border: 1.5px solid #e0e7ff; border-radius: 18px; display: flex; flex-direction: row; align-items: center; gap: 4px; padding-left: 12px; }
        .bc-tip-knoty { width: 108px; flex-shrink: 0; object-fit: contain; object-position: center bottom; }
        .bc-tip-content { flex: 1; padding: 18px 20px; display: flex; flex-direction: column; gap: 8px; }
        .bc-tip-head { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 700; color: #1e1b4b; }
        .bc-tip-badge { flex-shrink: 0; font-size: 10px; font-weight: 900; color: #6366f1; background: #e0e7ff; border-radius: 6px; padding: 2px 7px; letter-spacing: 0.06em; }
        .bc-tip-body { font-size: 13.5px; color: #3730a3; font-weight: 500; line-height: 1.75; white-space: pre-line; margin: 0; }

        .cq-input-zone { border-top: 1px solid #f1f5f9; border-bottom: 1px solid #f1f5f9; padding: 28px 0; display: flex; flex-direction: column; gap: 20px; }
        .cq-choice-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px; }
        .cq-choice { position: relative; display: flex; align-items: flex-start; gap: 14px; text-align: left; padding: 20px 44px 20px 22px; border-radius: 24px; border: 2px solid #e2e8f0; background: #fff; cursor: pointer; font: inherit; transition: border-color 0.15s, background 0.15s, box-shadow 0.15s; }
        .cq-choice:hover { border-color: #c7d2fe; }
        .cq-choice:focus-visible { outline: 2px solid #4F46E5; outline-offset: 2px; }
        .cq-choice.on { border-color: #4F46E5; background: rgba(79,70,229,0.04); box-shadow: 0 16px 30px -12px rgba(79,70,229,0.25); }
        .cq-choice-body { display: flex; flex-direction: column; gap: 6px; }
        .cq-choice-label { font-size: 16px; font-weight: 900; color: #0f172a; }
        .cq-choice-desc { font-size: 13px; color: #64748b; font-weight: 500; line-height: 1.5; }
        .cq-choice-check { position: absolute; top: 18px; right: 18px; color: #10B981; }
        .bc-choice-custom { border-style: dashed; }
        .bc-choice-custom.on { border-style: solid; }

        .cq-chips { display: flex; flex-wrap: wrap; gap: 10px; }
        .cq-chip { position: relative; min-height: 44px; padding: 0 18px; border-radius: 16px; border: 2px solid #e2e8f0; background: #fff; font: inherit; font-size: 14px; font-weight: 700; color: #475569; cursor: pointer; transition: border-color 0.15s, background 0.15s, color 0.15s; }
        .cq-chip:hover { border-color: #c7d2fe; }
        .cq-chip:focus-visible { outline: 2px solid #4F46E5; outline-offset: 2px; }
        .cq-chip.on { border-color: #4F46E5; background: rgba(79,70,229,0.06); color: #4338CA; }

        .bc-subchips { display: flex; flex-direction: column; gap: 14px; padding: 20px 22px; border-radius: 20px; background: rgba(79,70,229,0.03); border: 1px solid rgba(79,70,229,0.1); }
        .bc-subchip-group { display: flex; flex-direction: column; gap: 8px; }
        .bc-subchip-label { font-size: 11px; font-weight: 900; color: #4F46E5; letter-spacing: 0.12em; text-transform: uppercase; }
        .bc-chip-custom-input { margin-top: 4px; width: 100%; max-width: 320px; padding: 8px 14px; border-radius: 12px; border: 1.5px solid #a5b4fc; background: #fff; font: inherit; font-size: 14px; color: #1e1b4b; outline: none; transition: border-color 0.15s; }
        .bc-chip-custom-input:focus { border-color: #4F46E5; }
        .bc-chip-custom-input::placeholder { color: #94a3b8; }
        .bc-custom { display: flex; flex-direction: column; gap: 8px; }
        .cq-textarea { width: 100%; min-height: 88px; resize: vertical; background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px 14px; font: inherit; font-size: 14px; font-weight: 500; line-height: 1.7; color: #1e293b; }
        .cq-textarea:focus-visible { outline: 2px solid #4F46E5; outline-offset: 1px; }
        .cq-textarea::placeholder { color: #cbd5e1; }

        .cq-preview { background: rgba(241,245,249,0.5); border: 1px solid #f1f5f9; border-radius: 24px; padding: 20px; display: flex; flex-direction: column; gap: 14px; }
        .cq-preview-head { display: inline-flex; align-items: center; gap: 8px; padding-left: 6px; font-size: 11px; font-weight: 900; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.15em; }
        .cq-preview-head svg { color: #4F46E5; }
        .cq-paper { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 1px 3px rgba(15,23,42,0.04); padding: 36px 40px; display: flex; flex-direction: column; gap: 14px; }
        .cq-paper-para { font-size: 13.5px; line-height: 2.05; color: #1e293b; word-break: keep-all; }

        .cq-footer { position: fixed; bottom: 0; left: 0; width: 100%; height: 96px; display: flex; align-items: center; justify-content: space-between; padding: 0 48px; background: rgba(255,255,255,0.9); backdrop-filter: blur(24px); border-top: 1px solid rgba(226,232,240,0.5); z-index: 100; }
        .cq-back { display: inline-flex; align-items: center; gap: 10px; padding: 10px 20px; min-height: 44px; border-radius: 16px; border: none; background: none; color: #94a3b8; font: inherit; font-size: 15px; font-weight: 700; cursor: pointer; }
        .cq-back:hover:not(:disabled) { color: #4F46E5; background: #f8fafc; }
        .cq-back:disabled { opacity: 0.4; cursor: not-allowed; }
        .cq-footer-right { display: flex; align-items: center; gap: 32px; }
        .cq-progress { display: flex; flex-direction: column; align-items: flex-end; gap: 8px; }
        .cq-progress-meta { display: flex; align-items: center; gap: 14px; }
        .cq-progress-label { font-size: 11px; font-weight: 900; color: #94a3b8; letter-spacing: 0.1em; font-variant-numeric: tabular-nums; }
        .cq-progress-pct { font-size: 14px; font-weight: 900; color: #4F46E5; font-variant-numeric: tabular-nums; }
        .cq-progress-bar { width: 224px; height: 8px; background: rgba(241,245,249,0.8); border-radius: 999px; overflow: hidden; }
        .cq-progress-bar span { display: block; height: 100%; background: #4F46E5; border-radius: 999px; transition: width 0.2s; }
        .cq-cta { height: 56px; padding: 0 40px; background: #4F46E5; color: #fff; font: inherit; font-size: 16px; font-weight: 900; border: none; border-radius: 20px; box-shadow: 0 15px 35px rgba(79,70,229,0.3); cursor: pointer; display: inline-flex; align-items: center; gap: 10px; transition: all 0.2s; }
        .cq-cta:hover:not(:disabled) { background: #4338CA; }
        .cq-cta:disabled { background: #cbd5e1; box-shadow: none; cursor: not-allowed; }

        /* ── 질문 전환 애니메이션 ── */
        .cq-card { animation: bcCardIn 0.28s cubic-bezier(0.16,1,0.3,1); }
        @keyframes bcCardIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }

        /* ── subchips 슬라이드 다운 ── */
        .bc-subchips { animation: bcSlide 0.2s ease; }
        @keyframes bcSlide { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: none; } }

        /* ── step 카운터 ── */
        .bc-step { margin-left: auto; font-size: 12px; font-weight: 800; color: #cbd5e1; font-variant-numeric: tabular-nums; letter-spacing: 0; }

        /* ── 사이드바 그룹 완료 체크 ── */
        .bc-side-done { width: 14px; height: 14px; border-radius: 999px; background: #10B981; color: #fff;
          display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; }

        /* ── 세부 조건 메모 ── */
        .bc-memo-zone { display: flex; flex-direction: column; }
        .bc-memo-btn { align-self: flex-start; display: inline-flex; align-items: center; gap: 7px;
          min-height: 36px; padding: 0 14px; border-radius: 12px; border: 1px dashed #cbd5e1;
          background: none; font: inherit; font-size: 13px; font-weight: 700; color: #94a3b8; cursor: pointer;
          transition: border-color 0.15s, color 0.15s, background 0.15s; }
        .bc-memo-btn:hover { border-color: #a5b4fc; color: #4338CA; background: rgba(79,70,229,0.03); }
        .bc-memo-btn:focus-visible { outline: 2px solid #4F46E5; outline-offset: 2px; }
        .bc-memo-open { display: flex; flex-direction: column; gap: 10px; padding: 18px 20px;
          border-radius: 18px; border: 1px solid #e2e8f0; background: rgba(248,250,252,0.8);
          animation: bcSlide 0.18s ease; }
        .bc-memo-header { display: flex; align-items: center; justify-content: space-between; }
        .bc-memo-label { font-size: 11px; font-weight: 900; color: #4F46E5; letter-spacing: 0.1em; text-transform: uppercase; }
        .bc-memo-close { display: inline-flex; align-items: center; justify-content: center;
          width: 28px; height: 28px; border-radius: 8px; border: none; background: none;
          color: #94a3b8; cursor: pointer; font: inherit; }
        .bc-memo-close:hover { background: #f1f5f9; color: #475569; }
        .bc-memo-hint { font-size: 12px; font-weight: 600; color: #94a3b8; }

        /* ── 조항 생성됨 뱃지 ── */
        .cq-preview-head { justify-content: flex-start; }
        .bc-clause-badge { margin-left: auto; display: inline-flex; align-items: center; gap: 5px;
          padding: 3px 10px; border-radius: 999px; background: rgba(16,185,129,0.1);
          color: #047857; font-size: 11px; font-weight: 900; }
        .bc-clause-note { color: #6366f1; font-size: 13px; font-style: italic; margin-top: 4px; }

        /* ── 태블릿 이하: 사이드바 제거, 카드 풀블리드 ── */
        @media (max-width: 900px) {
          .cq-sidebar { display: none; }
          .cq-shell { width: calc(100% - 24px); margin: 12px auto 116px; border-radius: 20px; }
          .cq-main { padding: 24px 20px 32px; }
          .cq-title { font-size: 22px; }
          .cq-card { gap: 22px; }
          .cq-input-zone { padding: 22px 0; }
          .cq-choice { padding: 16px 40px 16px 18px; border-radius: 18px; }
          .cq-paper { padding: 22px 20px; }
          .cq-preview { padding: 16px; border-radius: 18px; }
          .bc-scenario { align-items: flex-start; }
          .bc-scenario-badge { margin-top: 3px; }
          .cq-footer { padding: 0 20px; }
        }

        /* ── 모바일: 풀블리드 + 컴팩트 푸터 ── */
        @media (max-width: 640px) {
          .cq-shell { width: 100%; margin: 0 0 104px; border-radius: 0; border-left: none; border-right: none; }
          .cq-main { padding: 20px 16px 28px; }
          .cq-title { font-size: 20px; }
          .bc-tip-knoty { width: 72px; align-self: flex-end; }
          .bc-tip-content { padding: 14px 14px 14px 8px; }
          .cq-footer { height: 80px; padding: 0 12px; gap: 8px; }
          .cq-back { padding: 8px 10px; font-size: 14px; gap: 6px; }
          .cq-footer-right { gap: 12px; flex: 1; justify-content: flex-end; min-width: 0; }
          .cq-progress { gap: 5px; }
          .cq-progress-meta { gap: 8px; }
          .cq-progress-label { font-size: 10px; letter-spacing: 0.04em; }
          .cq-progress-pct { font-size: 12px; }
          .cq-progress-bar { width: 84px; height: 6px; }
          .cq-cta { height: 48px; padding: 0 20px; font-size: 15px; border-radius: 16px; }
        }

        /* ── 초소형 화면: 진행률 텍스트만 ── */
        @media (max-width: 360px) {
          .cq-progress-bar { display: none; }
        }

        @media (prefers-reduced-motion: reduce) {
          .cq-card, .bc-subchips, .bc-memo-open { animation: none; }
        }
      `}} />
    </div>
  );
}
