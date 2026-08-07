# 계약서 질문 템플릿 목업 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 주주간계약서의 15개 합의 항목을 7종 입력 템플릿으로 묻는 위저드 목업 페이지(`/mockup/contract-questions`)를 만든다.

**Architecture:** 질문 15개를 `lib/contractQuestions.ts`의 배열 하나로 선언하고, 각 질문이 `template.type`으로 렌더러를 지정한다. `components/ContractQuestionInputs.tsx`가 타입별 입력 UI를 렌더하고, `app/mockup/contract-questions/page.tsx`가 사이드바·미리보기·푸터를 감싼다. 상태는 페이지의 `useState` 하나. Firestore·localStorage를 쓰지 않는 정적 목업이다.

**Tech Stack:** Next.js 16 (App Router), React 18, TypeScript 5.5, lucide-react 아이콘, `node --test` 자체 점검. 스타일은 리포 관례대로 `<style dangerouslySetInnerHTML>` 인라인 CSS.

**설계 문서:** [docs/superpowers/specs/2026-08-07-contract-question-templates-design.md](../specs/2026-08-07-contract-question-templates-design.md)

## Global Constraints

- 클래스 프리픽스는 `cq-`. 기존 `qm-*`(`app/mockup/questions/page.tsx`)를 참조하되 재사용하지 않고 복제한다 — 두 목업이 독립적으로 수정될 수 있어야 한다.
- 색 토큰: Primary `#4F46E5`, Accent `#10B981`, Warning `#F59E0B`, 텍스트 `#0F172A`/`#64748B`/`#94A3B8`, 배경 `#F8FAFC` + 4방향 radial gradient.
- Radius: 카드 40px, 표·블록 24px, 버튼 16px, 입력 8px.
- 아이콘은 `lucide-react`만. 이모지 금지.
- 모든 입력·칩의 최소 높이 44px.
- `제안` 배지는 색만이 아니라 항상 `제안` 텍스트를 포함한다.
- 금액·비율 표시에 `font-variant-numeric: tabular-nums`.
- 조문 원문은 [reference/계약서 샘플/최종 계약서 샘플.md](../../../reference/계약서%20샘플/최종%20계약서%20샘플.md)에서 그대로 인용하고 임의로 고치지 않는다.
- 팀원 샘플 데이터는 김민준(나)·이서연·박도윤 3인 고정.
- 테스트 실행: `node --test lib/contractQuestions.test.ts` (Node 24 네이티브 TS 스트립, 별도 설정 불필요).
- 커밋 메시지는 영문 Conventional Commits. 본문은 한국어 허용.

---

### Task 1: 질문 데이터와 검증 로직

질문 15개 데이터와 순수 함수 2개(지분 합계 검증, 5조 정합성 경고, 미리보기 치환)를 만든다. UI가 없으므로 이 작업만으로 `node --test`가 통과해야 한다.

**Files:**
- Create: `lib/contractQuestions.ts`
- Test: `lib/contractQuestions.test.ts`

**Interfaces:**
- Consumes: 없음
- Produces:
  - `type QuestionTemplate` (판별 유니온, `type` 필드로 분기)
  - `type ContractQuestion`
  - `const CONTRACT_QUESTIONS: ContractQuestion[]` — 길이 15
  - `const QUESTION_GROUPS: { id: string; ko: string; en: string }[]` — 길이 5
  - `const MOCK_MEMBERS: { id: string; name: string; role: string; self: boolean }[]` — 길이 3
  - `function validateAllocation(values: Record<string, number>): { total: number; ok: boolean; remaining: number }`
  - `function tenureWarning(years: number): string | null`
  - `function fillPreview(template: string, values: (string | null)[]): { text: string; filled: boolean }[]`

---

- [ ] **Step 1: 실패하는 테스트 작성**

`lib/contractQuestions.test.ts` 생성:

```ts
import assert from "node:assert/strict";
import test from "node:test";
import {
  CONTRACT_QUESTIONS,
  QUESTION_GROUPS,
  MOCK_MEMBERS,
  validateAllocation,
  tenureWarning,
  fillPreview,
} from "./contractQuestions.ts";

test("질문은 15개이고 id가 중복되지 않는다", () => {
  assert.equal(CONTRACT_QUESTIONS.length, 15);
  const ids = CONTRACT_QUESTIONS.map((q) => q.id);
  assert.equal(new Set(ids).size, ids.length);
});

test("확정 8개 / 제안 7개로 나뉜다", () => {
  const proposed = CONTRACT_QUESTIONS.filter((q) => q.proposed);
  assert.equal(proposed.length, 7);
  assert.equal(CONTRACT_QUESTIONS.length - proposed.length, 8);
});

test("모든 질문의 group이 QUESTION_GROUPS에 존재한다", () => {
  const groupIds = new Set(QUESTION_GROUPS.map((g) => g.id));
  for (const q of CONTRACT_QUESTIONS) {
    assert.ok(groupIds.has(q.group), `알 수 없는 그룹: ${q.id} -> ${q.group}`);
  }
});

test("모든 질문은 최소 한 줄의 미리보기 원문을 가진다", () => {
  for (const q of CONTRACT_QUESTIONS) {
    assert.ok(q.preview.length >= 1, `미리보기 없음: ${q.id}`);
    assert.ok(
      q.preview.some((line) => /\{\d\}/.test(line)),
      `치환 자리 없음: ${q.id}`
    );
  }
});

test("7종 템플릿이 모두 최소 한 번씩 쓰인다", () => {
  const used = new Set(CONTRACT_QUESTIONS.map((q) => q.template.type));
  for (const t of ["amount", "duration", "percent", "choice", "matrix", "fields", "composite"]) {
    assert.ok(used.has(t as never), `쓰이지 않은 템플릿: ${t}`);
  }
});

test("지분 합계가 100이면 통과한다", () => {
  const r = validateAllocation({ a: 50, b: 30, c: 20 });
  assert.equal(r.total, 100);
  assert.equal(r.ok, true);
  assert.equal(r.remaining, 0);
});

test("지분 합계가 모자라면 남은 양을 알려준다", () => {
  const r = validateAllocation({ a: 50, b: 30, c: 10 });
  assert.equal(r.ok, false);
  assert.equal(r.remaining, 10);
});

test("지분 합계가 넘치면 remaining이 음수가 된다", () => {
  const r = validateAllocation({ a: 60, b: 30, c: 20 });
  assert.equal(r.ok, false);
  assert.equal(r.remaining, -10);
});

test("빈 값은 0으로 세어 초기 상태에서 통과하지 않는다", () => {
  assert.equal(validateAllocation({}).ok, false);
});

test("계속근무 3년 미만이면 5조② 정합성 경고를 낸다", () => {
  const w = tenureWarning(2);
  assert.ok(w);
  assert.match(w, /3년/);
});

test("계속근무 3년 이상이면 경고가 없다", () => {
  assert.equal(tenureWarning(3), null);
  assert.equal(tenureWarning(5), null);
});

test("미리보기는 값이 들어간 조각을 filled로 표시한다", () => {
  const parts = fillPreview("주주들은 {0}일간 협의한다.", ["7"]);
  assert.deepEqual(parts, [
    { text: "주주들은 ", filled: false },
    { text: "7", filled: true },
    { text: "일간 협의한다.", filled: false },
  ]);
});

test("값이 없으면 빈칸 기호를 남기고 filled가 아니다", () => {
  const parts = fillPreview("주주들은 {0}일간 협의한다.", [null]);
  assert.equal(parts[1].text, "[  ]");
  assert.equal(parts[1].filled, false);
});

test("같은 자리를 여러 번 참조해도 모두 치환된다", () => {
  const parts = fillPreview("각 {0}원. 손해액이 {0}원을 초과하면", ["1억"]);
  const filled = parts.filter((p) => p.filled);
  assert.equal(filled.length, 2);
  assert.equal(filled[0].text, "1억");
  assert.equal(filled[1].text, "1억");
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

Run: `node --test lib/contractQuestions.test.ts`
Expected: FAIL — `Cannot find module '.../lib/contractQuestions.ts'`

- [ ] **Step 3: 타입과 순수 함수 구현**

`lib/contractQuestions.ts` 생성. 먼저 타입과 함수부터:

```ts
// 주주간계약서 합의 항목 질문 정의.
// 조문 원문은 reference/계약서 샘플/최종 계약서 샘플.md 인용 — 임의 수정 금지.

export type QuestionTemplate =
  | { type: "amount"; presets: { label: string; value: number }[]; defaultValue?: number }
  | { type: "duration"; unit: "일" | "개월" | "년"; presets: number[]; baseValue?: number; defaultValue?: number }
  | { type: "percent"; marks: { value: number; label: string }[]; defaultValue?: number }
  | { type: "choice"; variant?: "person"; options: { id: string; label: string; desc: string }[] }
  | { type: "matrix"; variant: "text" | "allocation"; chips?: string[] }
  | { type: "fields"; fields: { key: string; label: string; placeholder: string; kind?: "text" | "date" | "number" }[] }
  | { type: "composite"; parts: { key: string; label: string; template: QuestionTemplate }[] };

export type ContractQuestion = {
  id: string;
  group: string;
  article: string;      // 화면 표시용 조문 번호
  articleTag: string;   // eyebrow 영문 태그
  proposed: boolean;    // true면 `제안` 배지
  consensus: boolean;   // false면 합의 대상 아닌 사실정보
  title: string;
  desc: string;
  template: QuestionTemplate;
  preview: string[];    // 조문 원문. {0} {1} 이 치환 자리
  reference?: { advice?: string; lowRisk?: string; highRisk?: string };
};

export const QUESTION_GROUPS = [
  { id: "basics", ko: "계약 기본", en: "Contract Basics" },
  { id: "decision", ko: "의사결정", en: "Decision & Deadlock" },
  { id: "equity", ko: "역할·지분", en: "Roles & Equity" },
  { id: "tenure", ko: "근무·이탈", en: "Tenure & Exit" },
  { id: "transfer", ko: "처분·제재", en: "Transfer & Penalty" },
];

export const MOCK_MEMBERS = [
  { id: "m1", name: "김민준", role: "나 (본인)", self: true },
  { id: "m2", name: "이서연", role: "공동창업자", self: false },
  { id: "m3", name: "박도윤", role: "공동창업자", self: false },
];

// 지분 배분 합계 검증. 빈 값은 0으로 센다.
export function validateAllocation(values: Record<string, number>) {
  const total = Object.values(values).reduce((sum, v) => sum + (Number(v) || 0), 0);
  return { total, ok: total === 100, remaining: 100 - total };
}

// 베이스 5조②가 "3년 이내 퇴사" 기준이라, 5조① 근무 의무가 3년 미만이면 두 항이 어긋난다.
// 차단하지 않고 알리기만 한다.
export function tenureWarning(years: number): string | null {
  if (!years || years >= 3) return null;
  return "제5조 ②항은 3년 기준으로 작성되어 있습니다. 3년 미만으로 정하면 두 항의 기준이 달라집니다.";
}

// "{0}" 자리를 값으로 치환하고, 하이라이트할 조각을 filled로 표시한다.
// 값이 없으면 빈칸 기호를 남긴다.
export function fillPreview(template: string, values: (string | null)[]) {
  const parts: { text: string; filled: boolean }[] = [];
  let last = 0;
  const re = /\{(\d)\}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(template))) {
    if (m.index > last) parts.push({ text: template.slice(last, m.index), filled: false });
    const v = values[Number(m[1])];
    parts.push(v ? { text: v, filled: true } : { text: "[  ]", filled: false });
    last = m.index + m[0].length;
  }
  if (last < template.length) parts.push({ text: template.slice(last), filled: false });
  return parts;
}
```

- [ ] **Step 4: 질문 15개 데이터 작성**

같은 파일에 이어서. 조문 순서대로 배열에 넣는다.

```ts
export const CONTRACT_QUESTIONS: ContractQuestion[] = [
  {
    id: "basics",
    group: "basics",
    article: "전문 · 말미",
    articleTag: "PREAMBLE",
    proposed: true,
    consensus: false,
    title: "회사와 계약의 기본 정보를 알려주세요",
    desc: "계약서 첫 줄과 마지막 줄에 그대로 들어갑니다. 합의가 필요한 값이 아니라 사실 기재입니다.",
    template: {
      type: "fields",
      fields: [
        { key: "company", label: "회사명", placeholder: "코싱크", kind: "text" },
        { key: "date", label: "계약 체결일", placeholder: "", kind: "date" },
        { key: "copies", label: "계약서 부수", placeholder: "3", kind: "number" },
      ],
    },
    preview: [
      "주식회사 {0}(이하 \"회사\"라 한다)의 주주(회사가 성립되기 전에는 주주가 될 발기인이나 동업자를 포함한다)는 회사의 경영 및 주주의 지위 등에 관하여 다음과 같이 계약을 체결한다.",
      "본 주주간계약(이하 \"본 계약\")은 다음 당사자들 사이에 {1}(이하 \"체결일\")로 체결되었다.",
      "계약 당사자들은 이상과 같이 본 계약을 체결하고 이를 증명하기 위하여 본 계약서 {2}부를 작성하여 각각 서명 또는 기명 날인한 후 각 1부씩 보관한다.",
    ],
  },
  {
    id: "identity",
    group: "basics",
    article: "전문 · 서명란",
    articleTag: "PARTIES",
    proposed: true,
    consensus: false,
    title: "본인의 신원 정보를 입력해 주세요",
    desc: "서명란에 들어갑니다. 다른 팀원의 정보는 각자 입력합니다.",
    template: {
      type: "fields",
      fields: [
        { key: "name", label: "이름", placeholder: "김민준", kind: "text" },
        { key: "rrn", label: "주민등록번호", placeholder: "000000-0000000", kind: "text" },
        { key: "address", label: "주소", placeholder: "서울특별시 ...", kind: "text" },
      ],
    },
    preview: ["{0} ({1})      (인)", "주소 {2}"],
  },
  {
    id: "shareType",
    group: "basics",
    article: "전문 · 제3의 3조",
    articleTag: "SHARE TYPE",
    proposed: true,
    consensus: true,
    title: "어떤 종류의 주식을 발행하나요?",
    desc: "전문과 제3의 3조의 지분 표에 들어갑니다. 초기 공동창업 단계에서는 대부분 보통주식입니다.",
    template: {
      type: "choice",
      options: [
        { id: "common", label: "보통주식", desc: "의결권과 배당이 동일한 일반 주식. 초기 창업팀의 기본값입니다." },
        { id: "preferred", label: "종류주식", desc: "우선배당·의결권 제한 등 조건이 붙는 주식. 투자 유치 단계에서 주로 씁니다." },
      ],
    },
    preview: ["| 김민준 | {0} | [주식수] | [비율]% |"],
    reference: {
      advice: "설립 단계 공동창업자 간 계약에서는 보통주식이 일반적입니다. 종류주식은 투자자와의 계약에서 등장합니다.",
    },
  },
  {
    id: "decisionAmount",
    group: "decision",
    article: "제2조 ① 7호",
    articleTag: "SPEND THRESHOLD",
    proposed: false,
    consensus: true,
    title: "얼마를 넘는 투자부터 전원 합의가 필요한가요?",
    desc: "이 금액을 넘는 투자는 주주 전원이 합의해야 진행할 수 있습니다. 낮으면 실행이 느려지고, 높으면 통제가 약해집니다.",
    template: {
      type: "amount",
      presets: [
        { label: "5천만 원", value: 50000000 },
        { label: "1억 원", value: 100000000 },
        { label: "3억 원", value: 300000000 },
      ],
      defaultValue: 100000000,
    },
    preview: ["7. 회사가 {0}을 초과하여 투자하는 행위"],
    reference: {
      advice: "베이스 계약서는 1억 원으로 작성되어 있습니다.",
      lowRisk: "금액이 낮으면 일상적인 지출까지 전원 합의를 거쳐야 해 실행 속도가 떨어집니다.",
      highRisk: "금액이 높으면 큰 규모의 지출이 견제 없이 집행될 수 있습니다.",
    },
  },
  {
    id: "deadlock",
    group: "decision",
    article: "제2조 ③ (신설)",
    articleTag: "DEADLOCK",
    proposed: false,
    consensus: true,
    title: "합의가 안 되면 며칠 협의하고, 누가 결정하나요?",
    desc: "전원 합의 구조는 한 명만 반대해도 멈춥니다. 특히 투자 유치가 걸린 결정이 막히면 사업 자체가 정지합니다. 언젠가는 끝나는 구조가 필요합니다.",
    template: {
      type: "composite",
      parts: [
        {
          key: "days",
          label: "협의 기간",
          template: { type: "duration", unit: "일", presets: [7, 14, 30], defaultValue: 7 },
        },
        {
          key: "decider",
          label: "최종 결정권자",
          template: {
            type: "choice",
            variant: "person",
            options: [
              { id: "m1", label: "김민준", desc: "나 (본인)" },
              { id: "m2", label: "이서연", desc: "공동창업자" },
              { id: "m3", label: "박도윤", desc: "공동창업자" },
            ],
          },
        },
      ],
    },
    preview: [
      "③ 제1항 각 호의 사항에 관하여 주주 전원의 합의가 이루어지지 아니하는 경우, 주주들은 {0}일간 성실히 협의한다. 위 협의 기간 내에도 합의에 이르지 못한 경우, 해당 사항은 {1}의 의사에 따라 결정하는 것으로 하고, 주주들은 그 결정에 따라 주주총회 또는 이사회에서 의결권을 행사하여야 한다.",
    ],
    reference: {
      advice: "변호사 예시는 협의 기간 일주일, 최종 결정권자는 대표자입니다.",
      lowRisk: "협의 기간이 너무 짧으면 충분한 논의 없이 한 사람의 결정으로 넘어갑니다.",
      highRisk: "협의 기간이 길면 그 기간 동안 투자 유치나 사업 결정이 멈춥니다.",
    },
  },
  {
    id: "roles",
    group: "equity",
    article: "제3의 2조",
    articleTag: "ROLES",
    proposed: false,
    consensus: true,
    title: "각자 무엇을 맡나요?",
    desc: "회사 설립 시까지 각자가 담당할 역할과 업무입니다. 본인 역할뿐 아니라 다른 팀원에게 기대하는 역할도 적어 주세요. 기대가 어긋나는 지점이 여기서 드러납니다.",
    template: {
      type: "matrix",
      variant: "text",
      chips: ["대표이사", "제품 총괄", "개발 총괄", "영업·마케팅", "재무·운영", "디자인"],
    },
    preview: ["| 김민준 | {0} |", "| 이서연 | {1} |", "| 박도윤 | {2} |"],
  },
  {
    id: "equity",
    group: "equity",
    article: "전문 · 제3의 3조",
    articleTag: "EQUITY SPLIT",
    proposed: false,
    consensus: true,
    title: "지분을 어떻게 나누나요?",
    desc: "회사 설립 시 발행하는 총 주식의 배분입니다. 합계가 정확히 100%가 되어야 합니다.",
    template: { type: "matrix", variant: "allocation" },
    preview: ["| 김민준 | 보통주식 | [주식수] | {0}% |", "| 이서연 | 보통주식 | [주식수] | {1}% |", "| 박도윤 | 보통주식 | [주식수] | {2}% |"],
    reference: {
      advice: "50:50 구조는 의사결정 교착을 만들기 쉽습니다. 제2조 ③항의 데드락 해소 조항과 함께 보세요.",
    },
  },
  {
    id: "noncompete",
    group: "tenure",
    article: "제4조 ②",
    articleTag: "NON-COMPETE",
    proposed: true,
    consensus: true,
    title: "퇴사 후 몇 년간 경업을 금지하나요?",
    desc: "주주와 임직원 지위를 모두 잃은 날부터 동종 사업을 하지 못하는 기간입니다.",
    template: { type: "duration", unit: "년", presets: [1, 2, 3], baseValue: 1, defaultValue: 1 },
    preview: [
      "② 주주는 주주의 지위와 회사의 임직원으로서의 지위를 갖지 않게 된 날로부터 {0}의 기간 동안, 다른 주주들 전원의 사전 서면 동의가 없는 한, 자기 또는 제3자의 계산으로 회사의 영업부류에 속하거나 동종 또는 유사한 영업부류에 속하는 회사나 사업을 경영하거나 (이하 생략)",
    ],
    reference: {
      advice: "베이스 계약서는 1년으로 작성되어 있습니다.",
      highRisk: "기간이 지나치게 길면 직업 선택의 자유를 과도하게 제한한다고 보아 법원이 효력을 제한할 수 있습니다.",
    },
  },
  {
    id: "tenure",
    group: "tenure",
    article: "제5조 ①",
    articleTag: "TENURE",
    proposed: false,
    consensus: true,
    title: "최소 몇 년간 근무 의무를 지나요?",
    desc: "이 기간 안에는 다른 주주 전원의 서면 동의 없이 퇴사할 수 없습니다. 본인 책임이 아닌 비자발적 퇴사는 제외됩니다.",
    template: { type: "duration", unit: "년", presets: [1, 2, 3, 5], defaultValue: 3 },
    preview: [
      "① 주주는 본 계약 체결일로부터 사유를 불문하고 {0}간 다른 주주들 전원의 사전 서면 동의 없이 회사에서 퇴사하여서는 아니된다. 단, 해당 주주에게 책임 없는 사유로 인한 비자발적 퇴사에 대하여는 본 조의 적용을 배제한다.",
    ],
    reference: {
      advice: "베이스 계약서 제5조 ②항이 \"3년 이내 퇴사\"를 기준으로 액면가 매수권을 규정합니다. 3년으로 맞추면 두 항이 자연스럽게 이어집니다.",
    },
  },
  {
    id: "vesting",
    group: "tenure",
    article: "제5조 (강화)",
    articleTag: "VESTING",
    proposed: true,
    consensus: true,
    title: "지분을 시간에 따라 단계적으로 확정하나요?",
    desc: "베스팅은 근무 기간에 비례해 지분을 확정하는 장치입니다. 클리프는 그 전에 나가면 한 주도 확정되지 않는 최소 기간입니다. 조기 이탈자가 지분을 그대로 가져가는 상황을 막습니다.",
    template: {
      type: "composite",
      parts: [
        {
          key: "apply",
          label: "베스팅 적용 여부",
          template: {
            type: "choice",
            options: [
              { id: "yes", label: "적용한다", desc: "근무 기간에 비례해 지분이 단계적으로 확정됩니다." },
              { id: "no", label: "적용하지 않는다", desc: "베이스 계약서 제5조 ②항의 액면가 매수권만으로 처리합니다." },
            ],
          },
        },
        {
          key: "vestingYears",
          label: "베스팅 기간",
          template: { type: "duration", unit: "년", presets: [3, 4, 5], defaultValue: 4 },
        },
        {
          key: "cliffYears",
          label: "클리프 기간",
          template: { type: "duration", unit: "년", presets: [1, 2], defaultValue: 1 },
        },
      ],
    },
    preview: [
      "주주가 보유한 주식은 본 계약 체결일로부터 {1}에 걸쳐 매월 균등하게 확정되며, 최초 {2}이 경과하기 전에 퇴사하는 경우 확정된 주식이 없는 것으로 본다.",
    ],
    reference: {
      advice: "통상 4년 베스팅 / 1년 클리프 구조를 씁니다.",
    },
  },
  {
    id: "buybackPrice",
    group: "tenure",
    article: "제5조 ② · 제9조 ③",
    articleTag: "BUYBACK",
    proposed: true,
    consensus: true,
    title: "퇴사하는 사람의 주식을 얼마에 되사나요?",
    desc: "베이스 계약서는 사유를 가리지 않고 액면가로 매수합니다. 사정이 있어 나가는 경우와 문제를 일으키고 나가는 경우를 다르게 볼지 정해야 합니다.",
    template: {
      type: "choice",
      options: [
        { id: "par", label: "사유 불문 액면가", desc: "베이스 계약서 그대로. 계산이 단순하고 분쟁 여지가 적습니다." },
        { id: "split", label: "귀책 여부에 따라 차등", desc: "일반 퇴사는 시가 또는 평가액, 배임·경쟁사 이직 등 귀책 퇴사는 액면가로 낮춥니다." },
      ],
    },
    preview: [
      "② 제1항에도 불구하고 주주가 3년 이내에 회사에서 퇴사하는 경우, 다른 주주는 퇴사하는 주주가 보유하고 있는 주식 전부 또는 일부를 퇴사일 당시의 각 지분율에 따라 퇴사하는 주주로부터 {0}로 매수할 수 있는 권리를 가진다.",
    ],
    reference: {
      advice: "변호사는 귀책 유무에 따라 회수 가격을 다르게 두는 방식을 권고합니다.",
      lowRisk: "일괄 액면가는 단순하지만, 오래 기여하고 정당하게 떠나는 사람에게 가혹할 수 있습니다.",
      highRisk: "차등 구조는 \"귀책\"의 정의를 두고 다툼이 생길 수 있어 사유를 구체적으로 열거해야 합니다.",
    },
  },
  {
    id: "lockup",
    group: "transfer",
    article: "제6조",
    articleTag: "LOCK-UP",
    proposed: false,
    consensus: true,
    title: "몇 년간 주식을 팔 수 없나요?",
    desc: "이 기간에는 다른 주주 전원의 서면 동의 없이 주식을 양도·담보 설정할 수 없습니다. 우선매수권과 공동매도요구권에 따른 처분은 예외입니다.",
    template: { type: "duration", unit: "년", presets: [3, 5, 7, 10], baseValue: 5, defaultValue: 5 },
    preview: [
      "주주는 본 계약의 체결일로부터 {0} 간, 다른 주주 전원의 사전 서면 동의가 없으면, 보유하고 있는 회사의 주식 또는 신주인수권의 전부 또는 일부를 제3자에게 양도 매각하거나 담보를 설정하는 등의 처분행위를 하여서는 아니된다. 단, 제7조 및 제7의 2조에 따른 처분행위는 그러하지 아니하다.",
    ],
    reference: {
      advice: "베이스 계약서는 5년입니다. 통상 5~10년 사이에서 정합니다.",
      highRisk: "기간이 길수록 엑싯 경로가 좁아집니다. 제7의 2조 공동매도요구권이 유일한 안전판입니다.",
    },
  },
  {
    id: "dragAlong",
    group: "transfer",
    article: "제7의 2조 ① (신설)",
    articleTag: "DRAG-ALONG",
    proposed: false,
    consensus: true,
    title: "몇 % 이상이 동의하면 전원이 함께 팔아야 하나요?",
    desc: "이 비율 이상을 가진 주주가 매각을 결정하면 나머지 주주도 같은 조건으로 함께 팔아야 합니다. 소수 한 명의 반대로 M&A가 막히는 상황을 푸는 장치입니다.",
    template: {
      type: "percent",
      marks: [
        { value: 50, label: "과반" },
        { value: 67, label: "특별결의" },
        { value: 75, label: "" },
        { value: 100, label: "전원" },
      ],
      defaultValue: 67,
    },
    preview: [
      "① 제6조 및 제7조에도 불구하고, 회사 발행주식총수의 {0}% 이상을 보유한 주주(수인의 주주가 합산하여 위 비율에 이르는 경우를 포함하며, 이하 '매도요구주주'라고 한다)가 보유 주식 전부를 제3자에게 양도하고자 하는 경우, 매도요구주주는 다른 주주들에게 동일한 조건으로 그 보유 주식 전부 또는 일부를 함께 양도할 것을 요구할 수 있는 권리를 가진다.",
    ],
    reference: {
      lowRisk: "비율이 낮으면 소수 주주가 원치 않는 매각에 끌려 들어갑니다.",
      highRisk: "비율이 높으면 한 명의 반대로 엑싯이 막혀 이 조항을 넣은 의미가 사라집니다.",
    },
  },
  {
    id: "penalty",
    group: "transfer",
    article: "제8조",
    articleTag: "PENALTY",
    proposed: false,
    consensus: true,
    title: "계약을 어기면 얼마를 무나요?",
    desc: "기준 금액과 비율 두 값을 정하면 제8조의 네 항에 모두 반영됩니다. 제재가 적히지 않은 계약은 선언에 불과합니다.",
    template: {
      type: "composite",
      parts: [
        {
          key: "base",
          label: "위약벌 기준 금액",
          template: {
            type: "amount",
            presets: [
              { label: "3천만 원", value: 30000000 },
              { label: "1억 원", value: 100000000 },
              { label: "5억 원", value: 500000000 },
            ],
            defaultValue: 100000000,
          },
        },
        {
          key: "rate",
          label: "처분 금액 대비 비율",
          template: {
            type: "percent",
            marks: [
              { value: 10, label: "" },
              { value: 30, label: "통상" },
              { value: 50, label: "" },
              { value: 100, label: "전액" },
            ],
            defaultValue: 30,
          },
        },
      ],
    },
    preview: [
      "① 제3조를 위반하는 경우 위반 당사자는 다른 주주들에게 손해배상과 별도로 위약벌로서 각 {0}원을 지급하여야 한다.",
      "② 제4조 및 제5조를 위반하는 경우 위반 당사자는 다른 주주들에게 손해배상과 별도로 위약벌로서 해당 주식 처분 금액의 {1}%에 해당하는 금액을 지급하여야 한다.",
      "③ 제3조 또는 제4조 및 제5조를 위반하는 경우 위반 당사자는 다른 주주들에게 손해배상예정액으로써 각 {0}원을 지급하여야 한다. 단, 손해액이 {0}원을 초과하는 경우에는 다른 주주들은 초과하는 손해액을 입증하여 손해배상을 청구할 수 있다.",
      "⑤ 제6조 또는 제7조를 위반하여 처분행위를 한 경우 위반 당사자는 다른 주주들에게 손해배상과 별도로 위약벌로서 해당 처분 금액의 {1}%에 해당하는 금액 또는 각 {0}원 중 큰 금액을 지급하여야 하며, 해당 처분행위로써 다른 주주들에게 대항할 수 없다.",
    ],
    reference: {
      advice: "통상 1억 원을 기준으로 삼고, 실제 사례는 1천만 원에서 10억 원까지 분포합니다.",
      lowRisk: "금액이 낮으면 어기는 편이 이득인 구조가 되어 제재가 작동하지 않습니다.",
      highRisk: "금액이 지나치게 높으면 법원이 과다하다고 보아 감액할 수 있습니다.",
    },
  },
  {
    id: "jurisdiction",
    group: "transfer",
    article: "제16조 ②",
    articleTag: "JURISDICTION",
    proposed: true,
    consensus: true,
    title: "분쟁이 생기면 어느 법원에서 다투나요?",
    desc: "제1심 관할법원입니다. 보통 회사 소재지나 주주들의 거주지 관할 법원으로 정합니다.",
    template: {
      type: "choice",
      options: [
        { id: "seoul", label: "서울중앙지방법원", desc: "베이스 계약서 기본값. 수도권 소재 회사에서 가장 흔합니다." },
        { id: "local", label: "회사 본점 소재지 관할 법원", desc: "본점이 옮겨가도 자동으로 따라갑니다." },
        { id: "arbitration", label: "대한상사중재원 중재", desc: "비공개로 빠르게 끝나지만 단심제라 불복할 수 없습니다." },
      ],
    },
    preview: ["② 본 계약에 따라 발생한 모든 분쟁의 제1심 관할법원은 {0}으로 지정한다."],
    reference: {
      advice: "베이스 계약서의 \"서울지방법원\"은 현존하지 않는 명칭이라 서울중앙지방법원으로 정정했습니다.",
    },
  },
];
```

- [ ] **Step 5: 테스트 통과 확인**

Run: `node --test lib/contractQuestions.test.ts`
Expected: PASS — 14 tests, 0 fail

- [ ] **Step 6: 타입 체크**

Run: `npx tsc --noEmit`
Expected: 에러 없음. `contractQuestions.ts` 관련 에러가 나오면 고친 뒤 다시 실행한다.

- [ ] **Step 7: 커밋**

```bash
git add lib/contractQuestions.ts lib/contractQuestions.test.ts
git commit -m "feat: add contract question data and validation helpers

15 questions mapped to shareholder agreement articles, 7 template types,
equity-sum validation, article 5 tenure consistency warning, and preview
placeholder substitution.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: 입력 템플릿 렌더러 7종

질문 하나의 `template`을 받아 알맞은 입력 UI를 그리는 컴포넌트. 페이지가 없으므로 이 단계에서는 타입 체크와 빌드로만 검증한다.

**Files:**
- Create: `components/ContractQuestionInputs.tsx`

**Interfaces:**
- Consumes: `QuestionTemplate`, `MOCK_MEMBERS`, `validateAllocation` (Task 1)
- Produces:
  - `export function QuestionInput(props: { template: QuestionTemplate; value: unknown; onChange: (v: unknown) => void; keyPrefix: string }): JSX.Element`
  - `export function formatKoreanAmount(n: number): string` — `100000000` → `"1억 원"`, `150000000` → `"1억 5,000만 원"`
  - `export function formatNumber(n: number): string` — `100000000` → `"100,000,000"`

값 형태는 템플릿 타입별로 다르다. 페이지가 이 규약에 맞춰 상태를 저장한다:

| 템플릿 | value 타입 | 예시 |
|---|---|---|
| `amount` | `number` | `100000000` |
| `duration` | `number` | `3` |
| `percent` | `number` | `67` |
| `choice` | `string` (option id) | `"common"` |
| `matrix/text` | `Record<string, string>` (멤버 id → 값) | `{ m1: "제품 총괄" }` |
| `matrix/allocation` | `Record<string, number>` | `{ m1: 50, m2: 30, m3: 20 }` |
| `fields` | `Record<string, string>` | `{ company: "코싱크" }` |
| `composite` | `Record<string, unknown>` (part key → 하위 value) | `{ days: 7, decider: "m1" }` |

---

- [ ] **Step 1: 금액 포맷 함수 두 개 작성**

`components/ContractQuestionInputs.tsx` 생성. 파일 상단:

```tsx
"use client";

import React from "react";
import { Check } from "lucide-react";
import type { QuestionTemplate } from "../lib/contractQuestions";
import { MOCK_MEMBERS, validateAllocation } from "../lib/contractQuestions";

export function formatNumber(n: number): string {
  return Number(n || 0).toLocaleString("ko-KR");
}

// 자릿수 오입력을 막기 위해 숫자 아래에 한글 금액을 병기한다.
const UNITS = [
  { v: 1_0000_0000_0000, label: "조" },
  { v: 1_0000_0000, label: "억" },
  { v: 1_0000, label: "만" },
];

export function formatKoreanAmount(n: number): string {
  let rest = Math.floor(Number(n) || 0);
  if (rest <= 0) return "";
  const parts: string[] = [];
  for (const u of UNITS) {
    const q = Math.floor(rest / u.v);
    if (q > 0) {
      parts.push(`${formatNumber(q)}${u.label}`);
      rest -= q * u.v;
    }
  }
  if (rest > 0) parts.push(formatNumber(rest));
  return `${parts.join(" ")} 원`;
}
```

- [ ] **Step 2: amount / duration / percent 렌더러 작성**

같은 파일에 이어서. 세 템플릿 모두 「프리셋 칩 + 직접 입력」 구조를 공유한다.

```tsx
function Chips({ items, active, onPick }: {
  items: { label: string; value: number }[];
  active: number | undefined;
  onPick: (v: number) => void;
}) {
  return (
    <div className="cq-chips">
      {items.map((it) => (
        <button
          key={it.value}
          type="button"
          className={`cq-chip ${active === it.value ? "on" : ""}`}
          aria-pressed={active === it.value}
          onClick={() => onPick(it.value)}
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}

function AmountInput({ tpl, value, onChange, id }: {
  tpl: Extract<QuestionTemplate, { type: "amount" }>;
  value: number | undefined;
  onChange: (v: number) => void;
  id: string;
}) {
  const korean = formatKoreanAmount(value ?? 0);
  return (
    <div className="cq-field">
      <Chips items={tpl.presets} active={value} onPick={onChange} />
      <label className="cq-label" htmlFor={id}>금액 직접 입력</label>
      <div className="cq-amount-row">
        <span className="cq-amount-won" aria-hidden="true">₩</span>
        <input
          id={id}
          className="cq-input cq-num"
          inputMode="numeric"
          value={value ? formatNumber(value) : ""}
          placeholder="0"
          onChange={(e) => onChange(Number(e.target.value.replace(/[^0-9]/g, "")))}
        />
      </div>
      <p className="cq-help">{korean || "금액을 입력하면 한글로 확인해 드립니다."}</p>
    </div>
  );
}

function DurationInput({ tpl, value, onChange, id }: {
  tpl: Extract<QuestionTemplate, { type: "duration" }>;
  value: number | undefined;
  onChange: (v: number) => void;
  id: string;
}) {
  const v = value ?? tpl.defaultValue ?? 0;
  return (
    <div className="cq-field">
      <Chips
        items={tpl.presets.map((p) => ({ label: `${p}${tpl.unit}`, value: p }))}
        active={v}
        onPick={onChange}
      />
      <label className="cq-label" htmlFor={id}>직접 입력</label>
      <div className="cq-stepper">
        <button type="button" className="cq-step-btn" aria-label="1 줄이기" onClick={() => onChange(Math.max(0, v - 1))}>−</button>
        <input
          id={id}
          className="cq-input cq-num cq-step-input"
          inputMode="numeric"
          value={v || ""}
          onChange={(e) => onChange(Number(e.target.value.replace(/[^0-9]/g, "")))}
        />
        <button type="button" className="cq-step-btn" aria-label="1 늘리기" onClick={() => onChange(v + 1)}>+</button>
        <span className="cq-unit">{tpl.unit}</span>
      </div>
      {tpl.baseValue !== undefined && (
        <p className="cq-help">베이스 계약서 기본값: {tpl.baseValue}{tpl.unit}</p>
      )}
    </div>
  );
}

function PercentInput({ tpl, value, onChange, id }: {
  tpl: Extract<QuestionTemplate, { type: "percent" }>;
  value: number | undefined;
  onChange: (v: number) => void;
  id: string;
}) {
  const v = value ?? tpl.defaultValue ?? 0;
  return (
    <div className="cq-field">
      <label className="cq-label" htmlFor={id}>비율</label>
      <div className="cq-pct-row">
        <input
          id={id}
          className="cq-input cq-num cq-pct-num"
          inputMode="numeric"
          value={v || ""}
          onChange={(e) => onChange(Math.min(100, Number(e.target.value.replace(/[^0-9]/g, ""))))}
        />
        <span className="cq-unit">%</span>
      </div>
      <input
        type="range"
        className="cq-range"
        min={0}
        max={100}
        step={1}
        value={v}
        aria-label="비율 슬라이더"
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <div className="cq-marks">
        {tpl.marks.map((m) => (
          <button key={m.value} type="button" className="cq-mark" onClick={() => onChange(m.value)}>
            <span className="cq-mark-v">{m.value}%</span>
            {m.label && <span className="cq-mark-l">{m.label}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: choice / matrix / fields 렌더러 작성**

같은 파일에 이어서.

```tsx
function ChoiceInput({ tpl, value, onChange }: {
  tpl: Extract<QuestionTemplate, { type: "choice" }>;
  value: string | undefined;
  onChange: (v: string) => void;
}) {
  return (
    <div className="cq-choice-grid" role="radiogroup">
      {tpl.options.map((o) => {
        const on = value === o.id;
        return (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={on}
            className={`cq-choice ${on ? "on" : ""} ${tpl.variant === "person" ? "person" : ""}`}
            onClick={() => onChange(o.id)}
          >
            {tpl.variant === "person" && <span className="cq-avatar">{o.label.slice(0, 1)}</span>}
            <span className="cq-choice-body">
              <span className="cq-choice-label">{o.label}</span>
              <span className="cq-choice-desc">{o.desc}</span>
            </span>
            {on && <Check size={18} className="cq-choice-check" />}
          </button>
        );
      })}
    </div>
  );
}

function MatrixInput({ tpl, value, onChange, id }: {
  tpl: Extract<QuestionTemplate, { type: "matrix" }>;
  value: Record<string, string | number> | undefined;
  onChange: (v: Record<string, string | number>) => void;
  id: string;
}) {
  const v = value ?? {};
  const set = (k: string, next: string | number) => onChange({ ...v, [k]: next });

  if (tpl.variant === "allocation") {
    const nums: Record<string, number> = {};
    for (const m of MOCK_MEMBERS) nums[m.id] = Number(v[m.id]) || 0;
    const { total, ok, remaining } = validateAllocation(nums);
    return (
      <div className="cq-field">
        {MOCK_MEMBERS.map((m) => (
          <div key={m.id} className="cq-matrix-row">
            <label className="cq-matrix-name" htmlFor={`${id}-${m.id}`}>
              {m.name} <span className="cq-matrix-role">{m.role}</span>
            </label>
            <div className="cq-pct-row">
              <input
                id={`${id}-${m.id}`}
                className="cq-input cq-num cq-pct-num"
                inputMode="numeric"
                value={nums[m.id] || ""}
                onChange={(e) => set(m.id, Math.min(100, Number(e.target.value.replace(/[^0-9]/g, ""))))}
              />
              <span className="cq-unit">%</span>
            </div>
            <div className="cq-bar"><span style={{ width: `${nums[m.id]}%` }} /></div>
          </div>
        ))}
        <div className={`cq-total ${ok ? "ok" : "warn"}`} aria-live="polite">
          {ok ? (
            <><Check size={16} /> 합계 100% — 배분이 맞습니다.</>
          ) : remaining > 0 ? (
            <>합계 {total}%입니다. {remaining}%를 더 배분하세요.</>
          ) : (
            <>합계 {total}%입니다. {-remaining}%를 줄이세요.</>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="cq-field">
      {MOCK_MEMBERS.map((m) => (
        <div key={m.id} className="cq-matrix-row text">
          <label className="cq-matrix-name" htmlFor={`${id}-${m.id}`}>
            {m.name} <span className="cq-matrix-role">{m.role}</span>
          </label>
          {tpl.chips && (
            <div className="cq-chips small">
              {tpl.chips.map((c) => (
                <button key={c} type="button" className="cq-chip" onClick={() => set(m.id, c)}>{c}</button>
              ))}
            </div>
          )}
          <input
            id={`${id}-${m.id}`}
            className="cq-input"
            placeholder="담당할 역할과 업무를 적어 주세요"
            value={String(v[m.id] ?? "")}
            onChange={(e) => set(m.id, e.target.value)}
          />
        </div>
      ))}
    </div>
  );
}

function FieldsInput({ tpl, value, onChange, id }: {
  tpl: Extract<QuestionTemplate, { type: "fields" }>;
  value: Record<string, string> | undefined;
  onChange: (v: Record<string, string>) => void;
  id: string;
}) {
  const v = value ?? {};
  return (
    <div className="cq-field">
      {tpl.fields.map((f) => (
        <div key={f.key} className="cq-field-row">
          <label className="cq-label" htmlFor={`${id}-${f.key}`}>{f.label}</label>
          <input
            id={`${id}-${f.key}`}
            className="cq-input"
            type={f.kind === "date" ? "date" : "text"}
            inputMode={f.kind === "number" ? "numeric" : undefined}
            placeholder={f.placeholder}
            value={v[f.key] ?? ""}
            onChange={(e) => onChange({ ...v, [f.key]: e.target.value })}
          />
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: composite 렌더러와 디스패처 작성**

같은 파일 마지막. `composite`는 하위 파트를 재귀 렌더하고, 베스팅처럼 첫 파트가 `"no"`면 나머지를 숨긴다.

```tsx
function CompositeInput({ tpl, value, onChange, id }: {
  tpl: Extract<QuestionTemplate, { type: "composite" }>;
  value: Record<string, unknown> | undefined;
  onChange: (v: Record<string, unknown>) => void;
  id: string;
}) {
  const v = value ?? {};
  // 첫 파트가 choice이고 "no"를 골랐으면 이후 파트를 숨긴다 (베스팅 미적용).
  const first = tpl.parts[0];
  const collapsed = first.template.type === "choice" && v[first.key] === "no";
  const visible = collapsed ? [first] : tpl.parts;

  return (
    <div className="cq-composite">
      {visible.map((p) => (
        <div key={p.key} className="cq-part">
          <div className="cq-part-label">{p.label}</div>
          <QuestionInput
            template={p.template}
            value={v[p.key]}
            onChange={(next) => onChange({ ...v, [p.key]: next })}
            keyPrefix={`${id}-${p.key}`}
          />
        </div>
      ))}
    </div>
  );
}

export function QuestionInput({ template, value, onChange, keyPrefix }: {
  template: QuestionTemplate;
  value: unknown;
  onChange: (v: unknown) => void;
  keyPrefix: string;
}) {
  switch (template.type) {
    case "amount":
      return <AmountInput tpl={template} value={value as number} onChange={onChange} id={keyPrefix} />;
    case "duration":
      return <DurationInput tpl={template} value={value as number} onChange={onChange} id={keyPrefix} />;
    case "percent":
      return <PercentInput tpl={template} value={value as number} onChange={onChange} id={keyPrefix} />;
    case "choice":
      return <ChoiceInput tpl={template} value={value as string} onChange={onChange} />;
    case "matrix":
      return <MatrixInput tpl={template} value={value as Record<string, string | number>} onChange={onChange as (v: Record<string, string | number>) => void} id={keyPrefix} />;
    case "fields":
      return <FieldsInput tpl={template} value={value as Record<string, string>} onChange={onChange as (v: Record<string, string>) => void} id={keyPrefix} />;
    case "composite":
      return <CompositeInput tpl={template} value={value as Record<string, unknown>} onChange={onChange as (v: Record<string, unknown>) => void} id={keyPrefix} />;
  }
}
```

- [ ] **Step 5: 타입 체크**

Run: `npx tsc --noEmit`
Expected: 에러 없음

- [ ] **Step 6: 커밋**

```bash
git add components/ContractQuestionInputs.tsx
git commit -m "feat: add 7 contract question input template renderers

amount, duration, percent, choice (with person variant), matrix
(text/allocation), fields, and composite. Amount inputs show a Korean
reading of the number to catch digit-count mistakes.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: 위저드 페이지

사이드바·질문 카드·미리보기·참고정보·푸터를 조립하고 `cq-` CSS를 작성한다. 이 작업이 끝나면 브라우저에서 15문항을 끝까지 진행할 수 있어야 한다.

**Files:**
- Create: `app/mockup/contract-questions/page.tsx`

**Interfaces:**
- Consumes: `CONTRACT_QUESTIONS`, `QUESTION_GROUPS`, `MOCK_MEMBERS`, `validateAllocation`, `tenureWarning`, `fillPreview` (Task 1), `QuestionInput`, `formatKoreanAmount`, `formatNumber` (Task 2), `TopNav` (`components/TopNav.tsx`)
- Produces: 라우트 `/mockup/contract-questions`

---

- [ ] **Step 1: 페이지 셸과 상태 작성**

`app/mockup/contract-questions/page.tsx` 생성:

```tsx
"use client";

import React, { useMemo, useState } from "react";
import { TopNav } from "../../../components/TopNav";
import { QuestionInput, formatKoreanAmount, formatNumber } from "../../../components/ContractQuestionInputs";
import {
  CONTRACT_QUESTIONS,
  QUESTION_GROUPS,
  MOCK_MEMBERS,
  validateAllocation,
  tenureWarning,
  fillPreview,
  type ContractQuestion,
} from "../../../lib/contractQuestions";
import {
  ArrowLeft, ArrowRight, HelpCircle, FileText, ChevronDown, AlertTriangle, Users,
} from "lucide-react";

export default function ContractQuestionsMockup() {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [refOpen, setRefOpen] = useState(false);

  const q = CONTRACT_QUESTIONS[index];
  const value = answers[q.id];
  const setValue = (v: unknown) => setAnswers((prev) => ({ ...prev, [q.id]: v }));

  const previewValues = usePreviewValues(q, value);
  const blocked = isBlocked(q, value);
  const warning = q.id === "tenure" ? tenureWarning(Number(value) || 0) : null;

  const go = (delta: number) => {
    setIndex((i) => Math.min(CONTRACT_QUESTIONS.length - 1, Math.max(0, i + delta)));
    setRefOpen(false);
  };

  const progress = Math.round(((index + 1) / CONTRACT_QUESTIONS.length) * 100);

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
        <aside className="cq-sidebar">
          <div className="cq-sidebar-label">Agreement Draft</div>
          <nav className="cq-sidebar-nav">
            {QUESTION_GROUPS.map((g) => {
              const inGroup = CONTRACT_QUESTIONS.filter((x) => x.group === g.id);
              const done = inGroup.filter((x) => answers[x.id] !== undefined).length;
              const active = q.group === g.id;
              return (
                <div key={g.id} className={`cq-side-item ${active ? "active" : ""}`}>
                  <span className="cq-side-ko">
                    {g.ko}
                    {inGroup.some((x) => x.proposed) && <span className="cq-side-dot" aria-hidden="true" />}
                  </span>
                  <span className="cq-side-en">{g.en}</span>
                  <span className="cq-side-count">{done}/{inGroup.length}</span>
                </div>
              );
            })}
          </nav>
        </aside>

        <main className="cq-main">
          <article className="cq-card">
            <header className="cq-card-head">
              <div className="cq-eyebrow-row">
                <span className="cq-eyebrow-bar" />
                <span className="cq-eyebrow">{q.article} · {q.articleTag}</span>
                {q.proposed && <span className="cq-badge-proposed">제안</span>}
                {!q.consensus && <span className="cq-badge-fact">합의 대상 아님</span>}
                <span className="cq-guide-chip"><HelpCircle size={14} /> 가이드라인</span>
              </div>
              <h1 className="cq-title">{q.title}</h1>
              <p className="cq-desc">{q.desc}</p>
            </header>

            <section className="cq-input-zone">
              <QuestionInput template={q.template} value={value} onChange={setValue} keyPrefix={q.id} />
              {warning && (
                <p className="cq-warning" role="status">
                  <AlertTriangle size={16} /> {warning}
                </p>
              )}
            </section>

            <section className="cq-preview">
              <div className="cq-preview-head"><FileText size={16} /> 계약서 반영 미리보기</div>
              {q.preview.map((line, i) => (
                <p key={i} className="cq-preview-line">
                  {fillPreview(line, previewValues).map((part, j) =>
                    part.filled
                      ? <mark key={j} className="cq-mark-fill">{part.text}</mark>
                      : <span key={j} className={part.text === "[  ]" ? "cq-blank" : ""}>{part.text}</span>
                  )}
                </p>
              ))}
            </section>

            {q.reference && (
              <section className="cq-ref">
                <button
                  type="button"
                  className="cq-ref-toggle"
                  aria-expanded={refOpen}
                  onClick={() => setRefOpen((o) => !o)}
                >
                  <ChevronDown size={16} className={refOpen ? "open" : ""} /> 참고 정보
                </button>
                {refOpen && (
                  <div className="cq-ref-body">
                    {q.reference.advice && <p><strong>참고</strong> {q.reference.advice}</p>}
                    {q.reference.lowRisk && <p><strong>낮게 정하면</strong> {q.reference.lowRisk}</p>}
                    {q.reference.highRisk && <p><strong>높게 정하면</strong> {q.reference.highRisk}</p>}
                  </div>
                )}
              </section>
            )}
          </article>
        </main>
      </div>

      <footer className="cq-footer">
        <button className="cq-back" type="button" disabled={index === 0} onClick={() => go(-1)}>
          <ArrowLeft size={18} /> 이전
        </button>
        <div className="cq-footer-right">
          <div className="cq-team"><Users size={14} /> 3명 중 2명 응답</div>
          <div className="cq-progress">
            <div className="cq-progress-meta">
              <span className="cq-progress-label">{index + 1} / {CONTRACT_QUESTIONS.length}</span>
              <span className="cq-progress-pct">{progress}%</span>
            </div>
            <div className="cq-progress-bar"><span style={{ width: `${progress}%` }} /></div>
          </div>
          <button
            className="cq-cta"
            type="button"
            disabled={blocked || index === CONTRACT_QUESTIONS.length - 1}
            onClick={() => go(1)}
          >
            다음 <ArrowRight size={20} />
          </button>
        </div>
      </footer>
    </div>
  );
}
```

- [ ] **Step 2: 미리보기 값 변환과 차단 조건 헬퍼 작성**

같은 파일 하단. 답변 값을 미리보기 문자열 배열로 바꾼다. 템플릿마다 형태가 다르므로 여기서 흡수한다.

```tsx
// 답변 값을 미리보기 {0} {1} 자리에 넣을 문자열 배열로 바꾼다.
function usePreviewValues(q: ContractQuestion, value: unknown): (string | null)[] {
  return useMemo(() => {
    const t = q.template;
    if (value === undefined || value === null || value === "") return [];

    if (t.type === "amount") return [formatKoreanAmount(Number(value))];
    if (t.type === "duration") return [`${value}${t.unit}`];
    if (t.type === "percent") return [String(value)];
    if (t.type === "choice") {
      const opt = t.options.find((o) => o.id === value);
      return [opt ? opt.label : null];
    }
    if (t.type === "matrix") {
      const v = value as Record<string, string | number>;
      return MOCK_MEMBERS.map((m) => (v[m.id] ? String(v[m.id]) : null));
    }
    if (t.type === "fields") {
      const v = value as Record<string, string>;
      return t.fields.map((f) => v[f.key] || null);
    }
    // composite: 파트 순서대로 각 파트를 자기 규칙으로 변환해 이어 붙인다.
    const v = value as Record<string, unknown>;
    return t.parts.map((p) => {
      const pv = v[p.key];
      if (pv === undefined || pv === null || pv === "") return null;
      if (p.template.type === "amount") return formatNumber(Number(pv));
      if (p.template.type === "duration") return `${pv}${p.template.unit}`;
      if (p.template.type === "percent") return String(pv);
      if (p.template.type === "choice") {
        const opt = p.template.options.find((o) => o.id === pv);
        return opt ? opt.label : null;
      }
      return String(pv);
    });
  }, [q, value]);
}

// 지분 배분만 다음 진행을 막는다. 합계가 100이 아니면 계약서가 성립하지 않는다.
function isBlocked(q: ContractQuestion, value: unknown): boolean {
  if (q.template.type !== "matrix" || q.template.variant !== "allocation") return false;
  const v = (value ?? {}) as Record<string, number>;
  const nums: Record<string, number> = {};
  for (const m of MOCK_MEMBERS) nums[m.id] = Number(v[m.id]) || 0;
  return !validateAllocation(nums).ok;
}
```

- [ ] **Step 3: 스타일 작성**

같은 파일의 컴포넌트 반환값 마지막(`</footer>` 뒤, `</div>` 앞)에 `<style dangerouslySetInnerHTML>` 블록을 추가한다. `app/mockup/questions/page.tsx`의 `qm-*` 값을 그대로 옮기되 프리픽스만 `cq-`로 바꾼다.

```tsx
      <style dangerouslySetInnerHTML={{ __html: `
        .cq-page { min-height: 100vh; display: flex; flex-direction: column;
          background:
            radial-gradient(at 0% 0%, rgba(79,70,229,0.12) 0px, transparent 50%),
            radial-gradient(at 100% 0%, rgba(16,185,129,0.08) 0px, transparent 50%),
            radial-gradient(at 100% 100%, rgba(79,70,229,0.08) 0px, transparent 50%),
            radial-gradient(at 0% 100%, rgba(16,185,129,0.08) 0px, transparent 50%),
            #F8FAFC; }
        .cq-shell { flex: 1; display: flex; max-width: 1600px; margin: 0 auto; width: 100%; }

        .cq-sidebar { width: 272px; flex-shrink: 0; padding: 40px 0; border-right: 1px solid rgba(226,232,240,0.4); }
        .cq-sidebar-label { padding: 0 32px; margin-bottom: 32px; font-size: 10px; font-weight: 900; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.25em; }
        .cq-sidebar-nav { display: flex; flex-direction: column; }
        .cq-side-item { position: relative; display: grid; grid-template-columns: 1fr auto; grid-template-areas: "ko count" "en count"; align-items: center; gap: 0 8px; padding: 16px 32px; }
        .cq-side-ko { grid-area: ko; font-size: 15px; font-weight: 700; color: #94a3b8; display: inline-flex; align-items: center; gap: 6px; }
        .cq-side-en { grid-area: en; font-size: 10px; font-weight: 500; color: rgba(148,163,184,0.6); text-transform: uppercase; letter-spacing: 0.08em; }
        .cq-side-count { grid-area: count; font-size: 12px; font-weight: 800; color: #cbd5e1; font-variant-numeric: tabular-nums; }
        .cq-side-dot { width: 6px; height: 6px; border-radius: 999px; background: #F59E0B; }
        .cq-side-item.active .cq-side-ko { font-weight: 800; color: #0f172a; }
        .cq-side-item.active .cq-side-en { color: rgba(79,70,229,0.7); }
        .cq-side-item.active .cq-side-count { color: #4F46E5; }
        .cq-side-item.active::before { content: ""; position: absolute; left: 0; top: 50%; transform: translateY(-50%); width: 4px; height: 32px; background: #4F46E5; border-radius: 0 999px 999px 0; }

        .cq-main { flex: 1; padding: 32px 64px 140px; }
        .cq-card { max-width: 900px; margin: 0 auto; background: rgba(255,255,255,0.95); backdrop-filter: blur(24px);
          border: 1px solid rgba(255,255,255,0.2); box-shadow: 0 20px 50px rgba(79,70,229,0.05);
          border-radius: 40px; padding: 40px 48px; display: flex; flex-direction: column; gap: 28px; }
        .cq-card-head { display: flex; flex-direction: column; gap: 14px; }
        .cq-eyebrow-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .cq-eyebrow-bar { height: 3px; width: 32px; background: #4F46E5; border-radius: 999px; }
        .cq-eyebrow { color: #4F46E5; font-weight: 900; font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; }
        .cq-badge-proposed { padding: 4px 10px; border-radius: 999px; border: 1px dashed #F59E0B; background: rgba(245,158,11,0.06); color: #B45309; font-size: 11px; font-weight: 900; }
        .cq-badge-fact { padding: 4px 10px; border-radius: 999px; background: #f1f5f9; color: #64748b; font-size: 11px; font-weight: 800; }
        .cq-guide-chip { display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 999px; background: #f8fafc; border: 1px solid #e2e8f0; font-size: 11px; font-weight: 900; color: #475569; cursor: pointer; }
        .cq-guide-chip svg { color: #4F46E5; }
        .cq-title { font-size: 30px; font-weight: 900; line-height: 1.25; color: #0f172a; letter-spacing: -0.02em; }
        .cq-desc { font-size: 15px; color: #64748b; font-weight: 500; line-height: 1.7; max-width: 42rem; }

        .cq-input-zone { border-top: 1px solid #f1f5f9; border-bottom: 1px solid #f1f5f9; padding: 28px 0; }
        .cq-field { display: flex; flex-direction: column; gap: 14px; }
        .cq-field-row { display: flex; flex-direction: column; gap: 8px; }
        .cq-label { font-size: 13px; font-weight: 800; color: #475569; }
        .cq-help { font-size: 13px; color: #94a3b8; font-weight: 600; }
        .cq-input { min-height: 44px; width: 100%; background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 14px; font: inherit; font-size: 15px; font-weight: 600; color: #1e293b; }
        .cq-input:focus-visible { outline: 2px solid #4F46E5; outline-offset: 1px; }
        .cq-num { font-variant-numeric: tabular-nums; }

        .cq-chips { display: flex; flex-wrap: wrap; gap: 10px; }
        .cq-chip { min-height: 44px; padding: 0 18px; border-radius: 16px; border: 1px solid #e2e8f0; background: #fff; font: inherit; font-size: 14px; font-weight: 700; color: #475569; cursor: pointer; transition: all 0.2s; }
        .cq-chip:hover { border-color: #c7d2fe; }
        .cq-chip.on { border: 2px solid #4F46E5; background: rgba(79,70,229,0.06); color: #4338CA; }
        .cq-chips.small .cq-chip { min-height: 36px; padding: 0 12px; font-size: 12px; border-radius: 10px; }

        .cq-amount-row { display: flex; align-items: center; gap: 10px; }
        .cq-amount-won { font-size: 20px; font-weight: 800; color: #94a3b8; }
        .cq-stepper { display: flex; align-items: center; gap: 10px; }
        .cq-step-btn { width: 44px; height: 44px; border-radius: 12px; border: 1px solid #e2e8f0; background: #fff; font-size: 20px; font-weight: 800; color: #475569; cursor: pointer; }
        .cq-step-input { width: 96px; text-align: center; }
        .cq-unit { font-size: 15px; font-weight: 800; color: #475569; }

        .cq-pct-row { display: flex; align-items: center; gap: 8px; }
        .cq-pct-num { width: 96px; text-align: center; }
        .cq-range { width: 100%; accent-color: #4F46E5; height: 44px; }
        .cq-marks { display: flex; justify-content: space-between; gap: 8px; }
        .cq-mark { display: flex; flex-direction: column; align-items: center; gap: 2px; background: none; border: none; cursor: pointer; font: inherit; padding: 6px 8px; border-radius: 10px; }
        .cq-mark:hover { background: #f8fafc; }
        .cq-mark-v { font-size: 12px; font-weight: 800; color: #475569; font-variant-numeric: tabular-nums; }
        .cq-mark-l { font-size: 11px; font-weight: 700; color: #94a3b8; }

        .cq-choice-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px; }
        .cq-choice { position: relative; display: flex; align-items: flex-start; gap: 14px; text-align: left; padding: 20px 22px; border-radius: 24px; border: 1px solid #e2e8f0; background: #fff; cursor: pointer; font: inherit; transition: all 0.2s; }
        .cq-choice:hover { border-color: #c7d2fe; }
        .cq-choice.on { border: 2px solid #4F46E5; background: rgba(79,70,229,0.04); box-shadow: 0 16px 30px -12px rgba(79,70,229,0.25); }
        .cq-choice-body { display: flex; flex-direction: column; gap: 6px; }
        .cq-choice-label { font-size: 16px; font-weight: 900; color: #0f172a; }
        .cq-choice-desc { font-size: 13px; color: #64748b; font-weight: 500; line-height: 1.5; }
        .cq-choice-check { position: absolute; top: 18px; right: 18px; color: #10B981; }
        .cq-avatar { width: 40px; height: 40px; flex-shrink: 0; border-radius: 999px; background: rgba(79,70,229,0.1); color: #4F46E5; display: inline-flex; align-items: center; justify-content: center; font-size: 16px; font-weight: 900; }

        .cq-matrix-row { display: grid; grid-template-columns: 160px 140px 1fr; align-items: center; gap: 14px; padding: 10px 0; border-bottom: 1px solid #f8fafc; }
        .cq-matrix-row.text { grid-template-columns: 160px 1fr; grid-template-areas: "name chips" "name input"; gap: 8px 14px; }
        .cq-matrix-row.text .cq-matrix-name { grid-area: name; }
        .cq-matrix-row.text .cq-chips { grid-area: chips; }
        .cq-matrix-row.text .cq-input { grid-area: input; }
        .cq-matrix-name { font-size: 15px; font-weight: 800; color: #1e293b; }
        .cq-matrix-role { font-size: 12px; font-weight: 600; color: #94a3b8; }
        .cq-bar { height: 8px; background: #f1f5f9; border-radius: 999px; overflow: hidden; }
        .cq-bar span { display: block; height: 100%; background: #4F46E5; border-radius: 999px; transition: width 0.2s; }
        .cq-total { display: inline-flex; align-items: center; gap: 8px; margin-top: 8px; padding: 12px 18px; border-radius: 16px; font-size: 14px; font-weight: 800; }
        .cq-total.ok { background: rgba(16,185,129,0.08); color: #047857; }
        .cq-total.warn { background: rgba(245,158,11,0.08); color: #B45309; }

        .cq-warning { display: flex; align-items: flex-start; gap: 8px; margin-top: 16px; padding: 14px 18px; border-radius: 16px; background: rgba(245,158,11,0.08); color: #B45309; font-size: 14px; font-weight: 700; line-height: 1.6; }

        .cq-preview { background: rgba(248,250,252,0.8); border: 1px solid #f1f5f9; border-radius: 24px; padding: 24px 28px; display: flex; flex-direction: column; gap: 12px; }
        .cq-preview-head { display: inline-flex; align-items: center; gap: 8px; font-size: 11px; font-weight: 900; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.15em; }
        .cq-preview-head svg { color: #4F46E5; }
        .cq-preview-line { font-size: 14px; line-height: 1.9; color: #475569; }
        .cq-mark-fill { background: rgba(79,70,229,0.12); color: #3730A3; font-weight: 900; padding: 2px 6px; border-radius: 6px; font-variant-numeric: tabular-nums; }
        .cq-blank { color: #cbd5e1; border-bottom: 1px dashed #cbd5e1; }

        .cq-ref-toggle { display: inline-flex; align-items: center; gap: 8px; background: none; border: none; font: inherit; font-size: 13px; font-weight: 800; color: #4F46E5; cursor: pointer; padding: 8px 0; }
        .cq-ref-toggle svg { transition: transform 0.2s; }
        .cq-ref-toggle svg.open { transform: rotate(180deg); }
        .cq-ref-body { display: flex; flex-direction: column; gap: 10px; padding: 16px 20px; border-radius: 16px; background: #f8fafc; border-left: 3px solid #4F46E5; }
        .cq-ref-body p { font-size: 14px; line-height: 1.7; color: #334155; }
        .cq-ref-body strong { color: #4338CA; margin-right: 6px; }

        .cq-composite { display: flex; flex-direction: column; gap: 28px; }
        .cq-part-label { font-size: 12px; font-weight: 900; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.15em; margin-bottom: 12px; }

        .cq-footer { position: fixed; bottom: 0; left: 0; width: 100%; height: 96px; display: flex; align-items: center; justify-content: space-between; padding: 0 48px; background: rgba(255,255,255,0.9); backdrop-filter: blur(24px); border-top: 1px solid rgba(226,232,240,0.5); z-index: 100; }
        .cq-back { display: inline-flex; align-items: center; gap: 10px; padding: 10px 20px; min-height: 44px; border-radius: 16px; border: none; background: none; color: #94a3b8; font: inherit; font-size: 15px; font-weight: 700; cursor: pointer; }
        .cq-back:hover:not(:disabled) { color: #4F46E5; background: #f8fafc; }
        .cq-back:disabled { opacity: 0.4; cursor: not-allowed; }
        .cq-footer-right { display: flex; align-items: center; gap: 32px; }
        .cq-team { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 700; color: #94a3b8; }
        .cq-progress { display: flex; flex-direction: column; align-items: flex-end; gap: 8px; }
        .cq-progress-meta { display: flex; align-items: center; gap: 14px; }
        .cq-progress-label { font-size: 11px; font-weight: 900; color: #94a3b8; letter-spacing: 0.1em; font-variant-numeric: tabular-nums; }
        .cq-progress-pct { font-size: 14px; font-weight: 900; color: #4F46E5; font-variant-numeric: tabular-nums; }
        .cq-progress-bar { width: 224px; height: 8px; background: rgba(241,245,249,0.8); border-radius: 999px; overflow: hidden; }
        .cq-progress-bar span { display: block; height: 100%; background: #4F46E5; border-radius: 999px; transition: width 0.2s; }
        .cq-cta { height: 56px; padding: 0 40px; background: #4F46E5; color: #fff; font: inherit; font-size: 16px; font-weight: 900; border: none; border-radius: 20px; box-shadow: 0 15px 35px rgba(79,70,229,0.3); cursor: pointer; display: inline-flex; align-items: center; gap: 10px; transition: all 0.2s; }
        .cq-cta:hover:not(:disabled) { background: #4338CA; }
        .cq-cta:disabled { background: #cbd5e1; box-shadow: none; cursor: not-allowed; }

        @media (max-width: 1100px) {
          .cq-sidebar { display: none; }
          .cq-main { padding: 24px 20px 160px; }
          .cq-card { padding: 28px 24px; border-radius: 28px; }
          .cq-title { font-size: 24px; }
          .cq-matrix-row { grid-template-columns: 1fr; }
          .cq-matrix-row.text { grid-template-columns: 1fr; grid-template-areas: "name" "chips" "input"; }
          .cq-footer { height: auto; padding: 12px 20px; flex-wrap: wrap; gap: 12px; }
          .cq-footer-right { gap: 16px; width: 100%; justify-content: space-between; }
          .cq-progress-bar { width: 120px; }
          .cq-cta { padding: 0 24px; }
        }

        @media (prefers-reduced-motion: reduce) {
          .cq-chip, .cq-choice, .cq-bar span, .cq-progress-bar span, .cq-cta, .cq-ref-toggle svg { transition: none; }
        }
      `}} />
```

- [ ] **Step 4: 빌드 확인**

Run: `npx next build`
Expected: 성공. 출력에 `/mockup/contract-questions` 라우트가 나타난다.

- [ ] **Step 5: 커밋**

```bash
git add app/mockup/contract-questions/page.tsx
git commit -m "feat: add contract question wizard mockup page

15-step wizard with grouped sidebar, live contract-clause preview that
highlights the user's value inside the real article text, collapsible
reference notes, and a blocking equity-sum check.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: 동작 확인과 스크린샷

목업의 목적은 보고 판단하는 것이므로 실제 화면을 확인한다. `playwright`가 이미 devDependency에 있다.

**Files:**
- Create: `docs/captures/2026-08-07/` (스크린샷 저장)

---

- [ ] **Step 1: 개발 서버 실행**

Run: `npx next dev`
백그라운드로 띄우고 `http://localhost:3000/mockup/contract-questions` 를 연다.

- [ ] **Step 2: 15문항 수동 확인**

각 항목을 눈으로 확인한다.

- [ ] 1번(기본정보) — `제안` + `합의 대상 아님` 배지 두 개가 함께 보인다
- [ ] 4번(의사결정 금액) — `1억 원` 칩을 누르면 미리보기의 `[  ]`가 `일억 원`으로 바뀐다
- [ ] 5번(데드락) — 기간과 사람 두 입력이 세로로 쌓이고, 미리보기 한 줄에 두 값이 모두 들어간다
- [ ] 6번(역할) — 칩을 누르면 그 멤버의 입력칸이 채워진다
- [ ] 7번(지분율) — 합계가 100이 아니면 다음 버튼이 비활성이고 잔여량이 표시된다
- [ ] 9번(계속근무) — 2년으로 낮추면 amber 경고가 나타나지만 다음은 눌린다
- [ ] 10번(베스팅) — `적용하지 않는다`를 고르면 하위 기간 입력 두 개가 사라진다
- [ ] 14번(위약벌) — 값 두 개로 미리보기 네 줄이 모두 채워진다
- [ ] 사이드바 — 현재 그룹에 indigo 바, 제안 문항이 있는 그룹에 amber 점, 완료 개수가 올라간다
- [ ] Tab 키로만 전체 입력을 순회할 수 있고 포커스 링이 보인다

문제가 있으면 고치고 커밋한 뒤 이 단계를 다시 실행한다.

- [ ] **Step 3: 스크린샷 촬영**

대표 화면 4장을 담는다.

```bash
mkdir -p docs/captures/2026-08-07
node -e '
const { chromium } = require("playwright");
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1600, height: 1000 } });
  await p.goto("http://localhost:3000/mockup/contract-questions");
  await p.waitForTimeout(1500);
  const shots = [
    { name: "01-basics", clicks: 0 },
    { name: "02-deadlock", clicks: 4 },
    { name: "03-equity", clicks: 2 },
    { name: "04-penalty", clicks: 7 },
  ];
  for (const s of shots) {
    for (let i = 0; i < s.clicks; i++) {
      await p.click(".cq-cta");
      await p.waitForTimeout(250);
    }
    await p.screenshot({ path: `docs/captures/2026-08-07/contract-questions-${s.name}.png` });
  }
  await b.close();
})();
'
```

지분율(3번 샷) 화면은 다음 버튼이 비활성이라 그 뒤로 못 넘어간다. 스크립트가 멈추면 해당 화면에서 지분을 채우는 클릭을 추가하거나, 남은 샷은 수동으로 찍는다.

- [ ] **Step 4: 스크린샷 확인**

`docs/captures/2026-08-07/` 의 PNG 4장을 열어 레이아웃이 깨지지 않았는지 본다. 카드가 잘리거나 푸터가 본문을 가리면 CSS를 고친다.

- [ ] **Step 5: 최종 검증**

```bash
node --test lib/contractQuestions.test.ts
npx tsc --noEmit
npx next build
```

Expected: 테스트 14개 통과, 타입 에러 없음, 빌드 성공.

- [ ] **Step 6: 커밋**

```bash
git add docs/captures/2026-08-07
git commit -m "docs: add contract question wizard mockup screenshots

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

## 완료 후

`제안` 배지가 붙은 7개 문항(기본정보·신원·주식종류·경업금지·베스팅·매수가격·관할법원)을 사용자와 함께 보고 확정하거나 제거한다. 제거는 `CONTRACT_QUESTIONS` 배열에서 해당 항목을 지우는 것으로 끝난다 — 사이드바 개수와 진행률은 배열 길이에서 계산하므로 따라 바뀐다.

갭 비교·합의·계약서 생성은 이 계획의 범위 밖이며, 템플릿이 확정된 뒤 별도로 설계한다.
