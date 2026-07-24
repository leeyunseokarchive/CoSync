# CoSync 문서화 + 심층질문 페이지 + UI 폴리시 + 인웹 캡쳐 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 리포트 산출 로직·주주간계약서 양식을 md로 정리하고, 진단 후 심층질문 페이지를 신설하며, 합의·문서생성 페이지 텍스트를 키우고, 세 페이지를 Playwright로 인웹 캡쳐한다.

**Architecture:** 문서 2건은 `docs/`에 외부 리서치 포함 마크다운으로 작성한다. 심층질문 페이지는 `gap-report/page.tsx`에 이미 존재하는 대화 스크립트(`QUESTION_DEFS`, `SCRIPTS`)를 `lib/deepQuestions.ts`로 추출해 DRY하게 재사용하고, 갈등/차이 문항만 골라 전용 페이지(`/questions`)로 노출한다. UI 폴리시는 각 페이지의 인라인 `<style>` 블록 안 하드코딩 `font-size`를 한 단계씩 키우는 점진적 작업이다. 캡쳐는 firebase 에뮬레이터 + 시드 + `next dev` 위에서 Playwright 헤드리스 Chromium으로 로그인 플로우를 거쳐 PNG를 저장한다.

**Tech Stack:** Next.js 16 (app router), React 18 client components, plain CSS-in-JS(`<style dangerouslySetInnerHTML>`, Tailwind 아님), Firebase/Firestore(에뮬레이터), 테스트는 Node 내장 `node:test`, 캡쳐는 Playwright.

## Global Constraints

- **CSS 방식:** 이 앱은 Tailwind를 쓰지 않는다. 스타일은 각 페이지 하단의 `<style dangerouslySetInnerHTML={{ __html: \`...\` }} />` 안 순수 CSS다. reference의 `code.html`은 Tailwind CDN이지만 **레이아웃/색/크기 감(感)만 참고**하고 클래스는 그대로 옮기지 않는다.
- **브랜드 색:** 기존 인디고 `#5858e2`(진한 `#4338ca`, 연한 `#f5f5ff`)를 유지한다. reference의 `#4F46E5`로 바꾸지 않는다.
- **테스트 러너:** `node --test <경로>`. 기존 패턴은 소스 파일을 문자열로 읽어 `assert.match`하는 방식과, 순수 함수를 import해 값 검증하는 방식 둘 다 허용. 신규 로직은 순수 함수 import 방식으로 검증한다.
- **문서 언어:** 마크다운 문서 2건은 한국어로 작성한다. 저장 위치는 `docs/`.
- **폰트 크기 규칙(UI 폴리시):** 본문·라벨·노트 텍스트의 최소 크기는 `1rem`. 기존 값이 그보다 작으면 한 단계 키운다(아래 태스크에 정확한 매핑 명시).
- **에뮬레이터 실행 전제(캡쳐):** `export JAVA_HOME="/opt/homebrew/opt/openjdk@21"` 후 `firebase emulators:start --only firestore,auth`. 포트: auth `9099`, firestore `8080`, UI `4000`. `next dev`가 에뮬레이터를 쓰려면 환경변수 `NEXT_PUBLIC_USE_FIREBASE_EMULATOR=1` 필요([lib/firebase.ts:26](../../../lib/firebase.ts#L26)).
- **시드 계정:** `owner@demo.local` / `demopass123!` (uid `demo-owner`). 팀 `demo-team-a`, `demo-team-b` 소속. `demo-team-b`가 진단→갭→합의→확정 합의서까지 채워진 full 시나리오다(캡쳐용). 시드는 `npx tsx scripts/seed.ts`.
- **reference 자산:** `reference/CoSync UI/{Questions,consensus,DocumentView}/screen.png`(목업 이미지)와 `code.html`(마크업). 캡쳐 결과물과 육안 비교 대상.

---

## File Structure

- `docs/report-logic-and-references.md` — **신규**. 리포트(갭) 산출 로직 + 근거/법률 리서치.
- `docs/shareholder-agreement-template-analysis.md` — **신규**. 주주간 계약서 표준 양식·필수 조항 분석 + 우리 조항 매핑.
- `lib/deepQuestions.ts` — **신규**. `gap-report/page.tsx`에서 옮겨온 `QuestionDef`/`ScriptEntry` 타입, `QUESTION_DEFS`, `SCRIPTS`, `generateInsight` + 신규 `selectDeepQuestions` 셀렉터.
- `lib/deepQuestions.test.ts` — **신규**. `selectDeepQuestions` 단위 테스트.
- `app/gap-report/page.tsx` — **수정**. 위 심볼들을 인라인 정의 대신 `lib/deepQuestions.ts`에서 import.
- `app/questions/page.tsx` — **신규**. 심층질문 페이지.
- `app/consensus/page.tsx` — **수정**. 인라인 `<style>` 폰트 크기 상향.
- `app/agreement/document/page.tsx` — **수정**. 인라인 `<style>` 폰트 크기 상향.
- `scripts/capture-screenshots.mjs` — **신규**. Playwright 캡쳐 스크립트.
- `docs/captures/2026-07-24/{questions,consensus,agreement-document}.png` — **신규(산출물)**.

---

## Task 1: 리포트 산출 로직 + 근거/법률 정리 문서

문서 리서치 태스크. TDD 대상 아님(단위 테스트 불가한 산문 산출물) — 검증은 아래 콘텐츠 체크리스트로 대신한다.

**Files:**
- Create: `docs/report-logic-and-references.md`

**참고 소스(작성 전 반드시 읽을 것):**
- [lib/gap.ts](../../../lib/gap.ts) — 갭 산출 알고리즘 전체(`pairGap`, `computeGapSummary`, `CAT_WEIGHTS`, `toGapScore`, alignment 정규화 공식).
- [docs/AI_기반_공동창업팀_운영_합의_진단_및_합의안_생성_플랫폼CoSync_보고서.md](../../AI_기반_공동창업팀_운영_합의_진단_및_합의안_생성_플랫폼CoSync_보고서.md) — 기존 서비스 근거 서술.
- [app/gap-report/page.tsx](../../../app/gap-report/page.tsx)의 `SCRIPTS` 내 `stat`/`stake` 필드 — 이미 인용된 통계·법 조항(예: "민법 제718조", "하버드 와서만 교수 65%", "동업 분쟁 40%").

- [ ] **Step 1: 갭 산출 로직 섹션 초안 작성**

`gap.ts`의 실제 코드를 근거로 다음을 서술한다(추상적 요약 금지, 실제 공식·상수 기입):
- 문항→카테고리 매핑과 카테고리 가중치 `CAT_WEIGHTS`(코드에서 그대로 옮김).
- 한 문항의 두 답변 갭 정의: 같으면 0, toxicPair면 3, 아니면 `|옵션차|`.
- 문항 갭 = 모든 멤버 쌍 중 **최악(max)** 갭.
- 카테고리 갭 `G_i` = 답변된 문항 평균, `rawScore = Σ W'_i × G_i`.
- 정합도 `overallAlignment = round((1 − rawScore / (answeredWeight × 3)) × 100)`, 미진단 카테고리는 가중치 정규화에서 제외.
- `toGapScore` 구간: ≥85 LOW / ≥65 MID / ≥45 HIGH / else CRITICAL.

- [ ] **Step 2: 근거/법률 리서치 섹션 작성(외부 리서치 포함)**

`SCRIPTS`에 이미 인용된 통계·판례를 1차 출처로 삼고, **웹 리서치로 원출처를 확인·보강**한다(WebSearch/WebFetch 사용). 각 주장에 출처를 붙인다:
- 동업/지분 분쟁 관련 통계(예: 동업 분쟁 발생률, 지분 문제 비중).
- 관련 법 조항(민법 제718조 등 이탈·정산 관련), 주주간 계약의 법적 성격.
- 스타트업 실패 원인 통계(인적 갈등, 비전 불일치 비중).
확인 불가한 수치는 "출처 미확인"으로 표기하고 삭제하지 말 것(신뢰도 관리).

- [ ] **Step 3: 문서 구조 확정**

문서는 다음 목차를 갖는다:
```markdown
# CoSync 리포트 산출 로직 및 근거 자료

## 1. 개요 — 무엇을 산출하는가
## 2. 진단 문항 구조 (20문항 · 카테고리 · 가중치)
## 3. 갭/정합도 산출 공식 (코드 기준)
## 4. 갭 등급(LOW~CRITICAL) 및 해석
## 5. 근거 통계 및 법률 리서치 (출처 포함)
## 6. 한계 및 향후 고도화 (LLM 기반 근거 제시형 확장)
```

- [ ] **Step 4: 콘텐츠 체크리스트 검증**

다음을 모두 만족하는지 자가 점검:
- `CAT_WEIGHTS` 값이 `gap.ts` 코드와 일치.
- 정합도 공식이 코드와 일치(정규화 항 포함).
- 5장 각 주장에 출처(링크 또는 "미확인") 표기.
- 파일이 `docs/report-logic-and-references.md`에 존재.

Run: `test -f docs/report-logic-and-references.md && grep -c "출처" docs/report-logic-and-references.md`
Expected: 파일 존재, "출처" 1회 이상 매치.

- [ ] **Step 5: Commit**

```bash
git add docs/report-logic-and-references.md
git commit -m "docs: report scoring logic and legal/statistical references"
```

---

## Task 2: 주주간 계약서 양식 분석 문서

문서 리서치 태스크. TDD 대상 아님 — 검증은 콘텐츠 체크리스트.

**Files:**
- Create: `docs/shareholder-agreement-template-analysis.md`

**참고 소스:**
- [lib/agreementClauses.ts](../../../lib/agreementClauses.ts) — 현재 20문항 × 4옵션 조항 템플릿(`CLAUSE_TEMPLATES`)과 카테고리(`CAT_LABELS`). 우리가 이미 커버하는 항목 파악용.
- 웹 리서치: 실제 주주간 계약서(SHA, Shareholders' Agreement)·동업 계약서 표준 양식.

- [ ] **Step 1: 외부 표준 양식 리서치(외부 리서치 포함)**

WebSearch/WebFetch로 주주간 계약서의 공통 필수 조항을 조사한다. 최소 다음 항목의 유무·표준 문구를 정리:
- 당사자/주식 보유 현황, 지분 구조.
- 이사회 구성·의결 정족수, 주요 경영사항 사전동의(reserved matters).
- 지분 양도 제한(우선매수권 ROFR, 동반매도권 tag-along, 동반매각요구권 drag-along).
- 이탈/퇴사 시 지분 처리(good leaver / bad leaver, 매수청구·강제매도).
- 베스팅(vesting)·클리프(cliff), 경업금지, 비밀유지.
- 교착(deadlock) 해소, 분쟁 해결(중재/관할).

- [ ] **Step 2: 우리 조항과의 매핑 표 작성**

`CLAUSE_TEMPLATES`/`CAT_LABELS`(agreementClauses.ts)를 열어 우리가 **이미 커버 / 부분 커버 / 미커버**하는 표준 조항을 표로 매핑한다:
```markdown
| 표준 필수 조항 | 우리 커버 여부 | 대응 문항/카테고리 | 보완 제안 |
|---|---|---|---|
```

- [ ] **Step 3: 문서 구조 확정**

```markdown
# 주주간 계약서 표준 양식 분석 및 CoSync 조항 매핑

## 1. 주주간 계약서란 (법적 성격·목적)
## 2. 공통 필수 조항 목록 (표준 문구 포함)
## 3. CoSync 현재 조항 ↔ 표준 조항 매핑 표
## 4. 완성도 향상을 위한 보완 필수 정보 목록
## 5. 출처
```

- [ ] **Step 4: 콘텐츠 체크리스트 검증**

- 2장에 ROFR/tag-along/drag-along/vesting/good-bad leaver/deadlock 항목 모두 포함.
- 3장 매핑 표가 실제 `CAT_LABELS` 카테고리를 참조.
- 5장에 출처 링크.

Run: `test -f docs/shareholder-agreement-template-analysis.md && grep -Eic "tag-along|drag-along|vesting|우선매수" docs/shareholder-agreement-template-analysis.md`
Expected: 파일 존재, 매치 수 1 이상.

- [ ] **Step 5: Commit**

```bash
git add docs/shareholder-agreement-template-analysis.md
git commit -m "docs: shareholder agreement standard clauses analysis and clause mapping"
```

---

## Task 3: 심층질문 로직 추출 + 페이지 신설

`gap-report/page.tsx`에 인라인으로 있는 심층질문 데이터를 `lib/deepQuestions.ts`로 옮기고, 갈등/차이 문항만 고르는 순수 셀렉터를 추가한 뒤, 전용 페이지로 노출한다.

**Files:**
- Create: `lib/deepQuestions.ts`
- Create: `lib/deepQuestions.test.ts`
- Modify: `app/gap-report/page.tsx` (인라인 정의 제거 → import)
- Create: `app/questions/page.tsx`

**Interfaces:**
- Consumes: `lib/gap.ts`의 `OnboardingAnswers`, `IssueStatus`, `getIssueStatus(v1?, v2?, toxicPairs)`.
- Produces:
  - `type QuestionDef = { id: string; label: string; field: keyof OnboardingAnswers; toxicPairs: [string,string][]; optionLabels: Record<string,string>; question: string }`
  - `type ScriptEntry = { topic: string; open: string; steps: { title: string; qs: string[] }[]; keywords: string[]; stat: string; stake: string; dispute: string; guide: string }`
  - `const QUESTION_DEFS: QuestionDef[]`
  - `const SCRIPTS: Record<string, ScriptEntry>`
  - `function generateInsight(def: QuestionDef): string`
  - `type DeepQuestionItem = { def: QuestionDef; script: ScriptEntry; status: "conflict" | "diff" }`
  - `function selectDeepQuestions(members: OnboardingAnswers[]): DeepQuestionItem[]`

- [ ] **Step 1: `selectDeepQuestions` 실패 테스트 작성**

Create `lib/deepQuestions.test.ts`:

```ts
import assert from "node:assert/strict";
import test from "node:test";
import { selectDeepQuestions } from "./deepQuestions.ts";
import type { OnboardingAnswers } from "./gap.ts";

test("멤버 1명 이하면 빈 배열", () => {
  assert.deepEqual(selectDeepQuestions([]), []);
  assert.deepEqual(selectDeepQuestions([{ extraWorkPriority: "1" }]), []);
});

test("일치 문항은 제외, 차이/충돌 문항만 선택하고 충돌을 앞에 둔다", () => {
  // q1 extraWorkPriority toxicPairs [["3","4"]] -> 3 vs 4 = conflict
  // q7 exitVision toxicPairs [["1","3"]]; 1 vs 2 = diff(비독성)
  // extraWorkPrinciple 동일값 -> match(제외)
  const a: OnboardingAnswers = { extraWorkPriority: "3", exitVision: "1", extraWorkPrinciple: "2" };
  const b: OnboardingAnswers = { extraWorkPriority: "4", exitVision: "2", extraWorkPrinciple: "2" };
  const items = selectDeepQuestions([a, b]);
  const fields = items.map((i) => i.def.field);
  assert.ok(fields.includes("extraWorkPriority"));
  assert.ok(fields.includes("exitVision"));
  assert.ok(!fields.includes("extraWorkPrinciple"));
  assert.equal(items[0].status, "conflict"); // 충돌이 맨 앞
  assert.equal(items[0].def.field, "extraWorkPriority");
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `node --test lib/deepQuestions.test.ts`
Expected: FAIL — `Cannot find module './deepQuestions.ts'`.

- [ ] **Step 3: `lib/deepQuestions.ts` 생성 — 데이터 이동 + 셀렉터**

[app/gap-report/page.tsx](../../../app/gap-report/page.tsx)에서 다음 심볼을 **원문 그대로 잘라내(verbatim)** 새 파일로 옮긴다:
- `type QuestionDef` (현재 gap-report의 지역 타입)
- `const QUESTION_DEFS: QuestionDef[]` (q1~q20 전체)
- `type ScriptEntry`
- `const SCRIPTS: Record<string, ScriptEntry>` (q1~q20 전체)
- `function generateInsight(def: QuestionDef): string`

파일 상단 import와 하단 신규 셀렉터를 추가한다(이동한 블록은 아래 `... (원문 그대로) ...` 위치에 붙여넣기):

```ts
import { getIssueStatus, type IssueStatus, type OnboardingAnswers } from "./gap";

export type QuestionDef = {
  id: string;
  label: string;
  field: keyof OnboardingAnswers;
  toxicPairs: [string, string][];
  optionLabels: Record<string, string>;
  question: string;
};

export const QUESTION_DEFS: QuestionDef[] = [
  // ... gap-report/page.tsx의 QUESTION_DEFS 배열 원문 그대로 (q1~q20) ...
];

export type ScriptEntry = { topic: string; open: string; steps: { title: string; qs: string[] }[]; keywords: string[]; stat: string; stake: string; dispute: string; guide: string };

export const SCRIPTS: Record<string, ScriptEntry> = {
  // ... gap-report/page.tsx의 SCRIPTS 객체 원문 그대로 (q1~q20) ...
};

export function generateInsight(def: QuestionDef): string {
  const stake = SCRIPTS[def.id]?.stake;
  const question = `지금 맞춰볼 질문: ${def.question}`;
  return stake ? `${stake} ${question}` : question;
}

export type DeepQuestionItem = { def: QuestionDef; script: ScriptEntry; status: "conflict" | "diff" };

// 두 명 이상이 답한 문항 중, 어떤 멤버 쌍이라도 conflict/diff면 심층질문 대상.
// 각 문항의 status는 모든 쌍 중 최악(conflict > diff). conflict를 앞으로 정렬.
export function selectDeepQuestions(members: OnboardingAnswers[]): DeepQuestionItem[] {
  if (members.length < 2) return [];
  const items: DeepQuestionItem[] = [];
  for (const def of QUESTION_DEFS) {
    let worst: IssueStatus = "match";
    for (let i = 0; i < members.length; i++) {
      for (let j = i + 1; j < members.length; j++) {
        const s = getIssueStatus(members[i][def.field], members[j][def.field], def.toxicPairs);
        if (s === "conflict") worst = "conflict";
        else if (s === "diff" && worst !== "conflict") worst = "diff";
      }
    }
    if (worst === "conflict" || worst === "diff") {
      const script = SCRIPTS[def.id];
      if (script) items.push({ def, script, status: worst });
    }
  }
  return items.sort((a, b) =>
    a.status === b.status ? 0 : a.status === "conflict" ? -1 : 1
  );
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `node --test lib/deepQuestions.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: `gap-report/page.tsx`에서 import로 교체**

[app/gap-report/page.tsx](../../../app/gap-report/page.tsx)에서 Step 3에 옮긴 지역 정의(`type QuestionDef`, `QUESTION_DEFS`, `type ScriptEntry`, `SCRIPTS`, `generateInsight`)를 삭제하고, 파일 상단 import 블록에 다음을 추가한다:

```ts
import { QUESTION_DEFS, SCRIPTS, generateInsight, type QuestionDef, type ScriptEntry } from "../../lib/deepQuestions";
```

기존에 `SCRIPTS`/`QUESTION_DEFS`/`generateInsight`/`QuestionDef`/`ScriptEntry`를 참조하던 코드는 그대로 둔다(이름 동일). 만약 `ScriptEntry`/`QuestionDef`가 gap-report 내부에서만 쓰여 미사용이면 import에서 뺀다.

- [ ] **Step 6: 기존 gap-report 회귀 테스트 + 빌드 확인**

Run: `node --test app/gap-report/earlybird-scroll.test.js && npm run build`
Expected: 기존 테스트 PASS, 빌드 성공(타입 에러 없음).

- [ ] **Step 7: Commit (로직 추출)**

```bash
git add lib/deepQuestions.ts lib/deepQuestions.test.ts app/gap-report/page.tsx
git commit -m "refactor: extract deep-question defs/scripts to lib/deepQuestions with selectDeepQuestions"
```

- [ ] **Step 8: `app/questions/page.tsx` 생성 — 심층질문 페이지**

기존 페이지 관례(`TopNav`, `Footer`, `useUserProfile`, `useTeams`, `useTeamMembers`, `.container`/`.card`, 하단 인라인 `<style>`)를 따른다. 멤버 답변으로 `selectDeepQuestions`를 돌려 갈등/차이 문항의 대화 스크립트를 카드로 노출하고 `/consensus`로 유도한다.

`useTeamMembers`가 반환하는 멤버 객체의 답변 필드 이름은 [components/useTeamMembers](../../../components/useTeamMembers.tsx) 및 gap-report에서 멤버 답변을 어떻게 읽는지 확인해 맞춘다(gap-report가 `computeGapSummary(members.map(...))`에 넘기는 형태와 동일하게 매핑). 아래 코드의 `memberAnswers` 매핑은 gap-report와 동일한 접근자를 사용하도록 맞출 것.

```tsx
"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import React, { Suspense, useMemo } from "react";
import { TopNav } from "../../components/TopNav";
import { Footer } from "../../components/Footer";
import { useUserProfile } from "../../components/useUserProfile";
import { useTeams } from "../../components/useTeams";
import { useTeamMembers } from "../../components/useTeamMembers";
import { selectDeepQuestions } from "../../lib/deepQuestions";
import type { OnboardingAnswers } from "../../lib/gap";
import { MessageCircle, ArrowRight, Target } from "lucide-react";

function QuestionsInner() {
  const searchParams = useSearchParams();
  const { profile } = useUserProfile();
  const { teams } = useTeams();
  const queryTeamId = searchParams ? searchParams.get("teamId") : null;
  const teamId = queryTeamId || profile?.lastActiveTeamId || profile?.teamIds?.[0] || teams[0]?.id;
  const { members } = useTeamMembers(teamId);

  // gap-report와 동일한 방식으로 멤버 답변을 추출(각 멤버의 onboardingAnswers).
  const memberAnswers = useMemo<OnboardingAnswers[]>(
    () => members.map((m) => (m.onboardingAnswers ?? {}) as OnboardingAnswers),
    [members]
  );
  const items = useMemo(() => selectDeepQuestions(memberAnswers), [memberAnswers]);

  return (
    <main className="page questions-page">
      <TopNav
        links={[{ label: "갭 리포트", href: `/gap-report${teamId ? `?teamId=${teamId}` : ""}` }, { label: "합의 세션", href: `/consensus${teamId ? `?teamId=${teamId}` : ""}` }]}
        active="심층 질문"
      />

      <section className="container questions-body">
        <header className="questions-head">
          <div className="questions-eyebrow"><Target size={16} /> 진단 후 심층 대화</div>
          <h1 className="questions-title">지금 꼭 맞춰봐야 할 대화</h1>
          <p className="questions-sub">진단에서 서로 답이 갈린 항목입니다. 아래 순서대로 대화하면 합의가 쉬워집니다.</p>
        </header>

        {items.length === 0 && (
          <div className="card questions-empty">
            아직 심층 대화가 필요한 항목이 없어요. 팀원 2명 이상이 진단을 마치면 여기에 표시됩니다.
          </div>
        )}

        <div className="questions-list">
          {items.map(({ def, script, status }) => (
            <article key={def.id} className="card question-card">
              <div className="question-card-head">
                <span className={`question-badge ${status}`}>{status === "conflict" ? "충돌" : "차이"}</span>
                <h2 className="question-card-title">{def.label}</h2>
              </div>
              <p className="question-topic">{script.topic}</p>
              <div className="question-open">
                <MessageCircle size={16} />
                <span>“{script.open}”</span>
              </div>
              <ol className="question-steps">
                {script.steps.map((s, i) => (
                  <li key={i} className="question-step">
                    <div className="question-step-title">{i + 1}. {s.title}</div>
                    <ul className="question-step-qs">
                      {s.qs.map((q, j) => <li key={j}>{q}</li>)}
                    </ul>
                  </li>
                ))}
              </ol>
              <div className="question-guide"><strong>정하기 팁</strong> {script.guide}</div>
            </article>
          ))}
        </div>

        {items.length > 0 && (
          <div className="questions-cta">
            <Link href={`/consensus${teamId ? `?teamId=${teamId}` : ""}`} className="btn btn-primary questions-cta-btn">
              합의 세션으로 <ArrowRight size={18} />
            </Link>
          </div>
        )}
      </section>

      <Footer />

      <style dangerouslySetInnerHTML={{ __html: `
        .questions-body { padding: 40px 0 80px; display: flex; flex-direction: column; gap: 24px; }
        .questions-head { text-align: center; display: flex; flex-direction: column; gap: 10px; align-items: center; }
        .questions-eyebrow { display: inline-flex; align-items: center; gap: 6px; font-size: 0.95rem; font-weight: 700; color: #5858e2; background: #f5f5ff; padding: 6px 14px; border-radius: 999px; }
        .questions-title { font-size: clamp(1.6rem, 4vw, 2.2rem); font-weight: 800; color: #0f172a; }
        .questions-sub { font-size: 1.05rem; color: #475569; line-height: 1.7; max-width: 560px; }
        .questions-empty { padding: 40px; text-align: center; color: #64748b; font-size: 1.05rem; }
        .questions-list { display: flex; flex-direction: column; gap: 20px; }
        .question-card { padding: 28px; display: flex; flex-direction: column; gap: 16px; }
        .question-card-head { display: flex; align-items: center; gap: 12px; }
        .question-badge { font-size: 0.85rem; font-weight: 700; padding: 5px 12px; border-radius: 999px; }
        .question-badge.conflict { background: #fee2e2; color: #b91c1c; }
        .question-badge.diff { background: #fef3c7; color: #b45309; }
        .question-card-title { font-size: 1.25rem; font-weight: 800; color: #0f172a; }
        .question-topic { font-size: 1.05rem; color: #475569; font-weight: 600; }
        .question-open { display: flex; align-items: flex-start; gap: 8px; background: #f5f5ff; border-radius: 12px; padding: 14px 18px; color: #4338ca; font-size: 1.05rem; line-height: 1.6; font-weight: 600; }
        .question-steps { display: flex; flex-direction: column; gap: 14px; list-style: none; }
        .question-step-title { font-size: 1.05rem; font-weight: 700; color: #0f172a; margin-bottom: 6px; }
        .question-step-qs { list-style: disc; padding-left: 20px; display: flex; flex-direction: column; gap: 6px; }
        .question-step-qs li { font-size: 1rem; color: #334155; line-height: 1.7; }
        .question-guide { font-size: 1rem; color: #334155; line-height: 1.7; background: #f8fafc; border-left: 3px solid #5858e2; border-radius: 8px; padding: 14px 18px; }
        .question-guide strong { color: #4338ca; display: block; margin-bottom: 4px; }
        .questions-cta { text-align: center; padding-top: 8px; }
        .questions-cta-btn { display: inline-flex; align-items: center; gap: 8px; padding: 16px 40px; font-size: 1.1rem; font-weight: 700; border-radius: 14px; }
      `}} />
    </main>
  );
}

export default function QuestionsPage() {
  return (
    <Suspense fallback={<div className="page questions-page"><div className="container" style={{ padding: "48px 0", textAlign: "center", color: "#64748b" }}>로딩 중...</div></div>}>
      <QuestionsInner />
    </Suspense>
  );
}
```

- [ ] **Step 9: 멤버 답변 접근자 정합성 확인 후 빌드**

[app/gap-report/page.tsx](../../../app/gap-report/page.tsx)에서 멤버 배열을 `OnboardingAnswers`로 변환하는 실제 코드를 찾아, Step 8의 `memberAnswers` 매핑(`m.onboardingAnswers`)을 그와 **동일한 접근자**로 맞춘다(필드명이 다르면 수정). 그 후:

Run: `npm run build`
Expected: 빌드 성공. `/questions` 라우트가 빌드 출력에 포함됨.

- [ ] **Step 10: Commit (페이지)**

```bash
git add app/questions/page.tsx
git commit -m "feat: add deep-question page surfacing conflict/diff discussion scripts"
```

---

## Task 4: 합의 페이지 UI 폴리시 (텍스트 상향)

[app/consensus/page.tsx](../../../app/consensus/page.tsx) 하단 인라인 `<style>`의 본문 폰트를 한 단계씩 키운다. 로직/구조 변경 없음. reference `reference/CoSync UI/consensus/screen.png`와 육안 비교.

**Files:**
- Modify: `app/agreement/../consensus/page.tsx` → 실제 경로 `app/consensus/page.tsx` (인라인 `<style>` 블록만)

- [ ] **Step 1: 폰트 크기 매핑대로 수정**

아래 각 셀렉터의 `font-size`를 좌→우로 바꾼다(값만 교체, 나머지 속성 유지). 각 항목은 고유 문자열이라 `Edit`로 정확히 치환 가능:

| 셀렉터 | 기존 | 신규 |
|---|---|---|
| `.consensus-cat-title` | `1.25rem` | `1.4rem` |
| `.consensus-item-label` | `1.05rem` | `1.15rem` |
| `.position-name` | `0.85rem` | `0.95rem` |
| `.position-answer` | `0.95rem` | `1.05rem` |
| `.consensus-note` | `0.95rem` | `1.05rem` |
| `.consensus-clause-preview` | `0.95rem` | `1.05rem` |
| `.vote-proposal-meta` | `0.95rem` | `1.05rem` |
| `.vote-pill` | `0.85rem` | `0.95rem` |
| `.propose-option` | `0.9rem` | `1rem` |
| `.propose-textarea` | `0.95rem` | `1.05rem` |
| `.propose-madlibs` | `0.95rem` | `1.05rem` |
| `.comment-text` | `0.9rem` | `1rem` |
| `.comment-input` | `0.9rem` | `1rem` |
| `.consensus-finalize-hint` | `0.9rem` | `1rem` |

예시(Edit): `.position-answer { font-size: 0.95rem;` → `.position-answer { font-size: 1.05rem;` (해당 규칙 블록 내 `font-size` 한 곳만).

- [ ] **Step 2: 빌드 확인**

Run: `npm run build`
Expected: 빌드 성공(CSS만 바뀌어 타입/컴파일 영향 없음).

- [ ] **Step 3: Commit**

```bash
git add app/consensus/page.tsx
git commit -m "style: enlarge body text on consensus page for readability"
```

> 최종 육안 검증(글자가 실제로 커졌는지, reference와 톤 일치)은 Task 6 캡쳐 결과로 확인한다.

---

## Task 5: 문서 생성 페이지 UI 폴리시 (텍스트 상향)

[app/agreement/document/page.tsx](../../../app/agreement/document/page.tsx) 하단 인라인 `<style>`의 조항 본문·제목 폰트를 키운다. 조항 본문(`.doc-chapter li`)이 핵심.

**Files:**
- Modify: `app/agreement/document/page.tsx` (인라인 `<style>` 블록만)

- [ ] **Step 1: 폰트 크기 매핑대로 수정**

| 셀렉터 | 기존 | 신규 |
|---|---|---|
| `.doc-header h1` | `clamp(1.5rem, 4vw, 2rem)` | `clamp(1.7rem, 4.5vw, 2.4rem)` |
| `.doc-meta` | `0.85rem` | `0.95rem` |
| `.doc-chapter h2` | `1.05rem` | `1.2rem` |
| `.doc-chapter li` | `0.92rem` | `1.05rem` |
| `.doc-party` | `0.9rem` | `1rem` |
| `.doc-parties-label` | `0.78rem` | `0.85rem` |
| `.doc-confirmed-note` | `0.88rem` | `1rem` |

예시(Edit): `.doc-chapter li { font-size: 0.92rem;` → `.doc-chapter li { font-size: 1.05rem;`.

- [ ] **Step 2: 인쇄(PDF) 레이아웃 회귀 확인**

`@media print` 블록은 폰트 크기를 재정의하지 않으므로 상향값이 그대로 인쇄에 반영된다. `.agreement-doc`의 `max-width: 820px`는 유지 — A4 인쇄 시 조항이 잘리지 않는지 육안 확인 대상(Task 6 이후).

Run: `npm run build`
Expected: 빌드 성공.

- [ ] **Step 3: Commit**

```bash
git add app/agreement/document/page.tsx
git commit -m "style: enlarge clause and heading text on agreement document page"
```

---

## Task 6: Playwright 인웹 캡쳐

에뮬레이터 + 시드 + `next dev` 위에서 `/questions`, `/consensus`, `/agreement/document` 세 페이지를 로그인 플로우로 캡쳐한다. 이전 intro-video 계획의 검증된 패턴을 그대로 따른다.

**Files:**
- Create: `scripts/capture-screenshots.mjs`
- Create(산출물): `docs/captures/2026-07-24/{questions,consensus,agreement-document}.png`

**Consumes:** Task 3(‎`/questions` 라우트), Task 4·5(폴리시된 페이지), 시드 데이터(`demo-team-b`, `owner@demo.local`/`demopass123!`).

- [ ] **Step 1: Playwright 설치**

```bash
npm i -D playwright
npx playwright install chromium
```
Expected: chromium 다운로드 완료.

- [ ] **Step 2: 캡쳐 스크립트 작성**

로그인 페이지 입력 셀렉터는 이전 계획에서 확인된 `getByPlaceholder("example@cosync.com")`(이메일)을 재사용하되, 실제 [app/login/page.tsx](../../../app/login/page.tsx)의 placeholder/버튼 텍스트를 열어 확인 후 맞춘다.

Create `scripts/capture-screenshots.mjs`:

```js
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const BASE_URL = "http://localhost:3000";
const TEAM = "demo-team-b";
const OUT = "docs/captures/2026-07-24";

const SHOTS = [
  { name: "questions", path: `/questions?teamId=${TEAM}` },
  { name: "consensus", path: `/consensus?teamId=${TEAM}` },
  { name: "agreement-document", path: `/agreement/document?teamId=${TEAM}` },
];

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });

  // 로그인
  await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle" });
  await page.getByPlaceholder("example@cosync.com").fill("owner@demo.local");
  await page.getByPlaceholder(/비밀번호|password/i).fill("demopass123!");
  await page.getByRole("button", { name: /로그인/ }).click();
  await page.waitForLoadState("networkidle");

  for (const shot of SHOTS) {
    await page.goto(`${BASE_URL}${shot.path}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1200); // 실시간 구독 데이터 렌더 대기
    await page.screenshot({ path: `${OUT}/${shot.name}.png`, fullPage: true });
    console.log(`captured ${shot.name}`);
  }

  await browser.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
```

- [ ] **Step 3: 에뮬레이터 + 시드 + dev 서버 기동**

별도 터미널/백그라운드로:
```bash
export JAVA_HOME="/opt/homebrew/opt/openjdk@21"
export PATH="$JAVA_HOME/bin:$PATH"
firebase emulators:start --only firestore,auth > /tmp/emu.log 2>&1 &
npx tsx scripts/seed.ts
NEXT_PUBLIC_USE_FIREBASE_EMULATOR=1 npm run dev > /tmp/dev.log 2>&1 &
```
Run(준비 확인): `sleep 8 && curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/login`
Expected: `200`.

- [ ] **Step 4: 캡쳐 실행**

Run: `node scripts/capture-screenshots.mjs`
Expected: 콘솔에 `captured questions` / `captured consensus` / `captured agreement-document` 3줄. `docs/captures/2026-07-24/`에 PNG 3개 생성.

- [ ] **Step 5: 캡쳐 육안 검증**

세 PNG를 열어 확인:
- `questions.png`: 심층질문 카드가 충돌→차이 순으로 렌더, 대화 스크립트/팁 표시.
- `consensus.png`: 본문 글자가 이전보다 큼(라벨/조항 프리뷰 가독성).
- `agreement-document.png`: 조항 본문 `1.05rem`으로 확대, 제목 강조, 인쇄 폭 유지.
`demo-team-b`에 데이터가 비어 캡쳐가 빈 화면이면 `scripts/seed.ts`가 해당 팀에 진단/합의/확정 합의서를 채우는지 확인하고 재시드.

- [ ] **Step 6: 정리 + Commit**

```bash
pkill -f "firebase emulators" || true
pkill -f "next dev" || true
git add scripts/capture-screenshots.mjs docs/captures/2026-07-24
git commit -m "chore: add in-app screenshot capture script and capture questions/consensus/document pages"
```

---

## Self-Review

**1. Spec coverage:**
- TODO 리포트 로직/법률 md → Task 1 ✅
- TODO 주주간 계약서 양식 md → Task 2 ✅
- TODO 심층 질문 페이지 제작 + 캡쳐 → Task 3(제작) + Task 6(캡쳐) ✅
- TODO 합의 페이지 UI 개선 + 캡쳐 → Task 4 + Task 6 ✅
- TODO 문서 생성 페이지 UI 개선 + 캡쳐 → Task 5 + Task 6 ✅
- "텍스트 크게" → Task 4·5 폰트 매핑 ✅
- "reference/CoSync UI 참고" → Global Constraints + Task 4·5·6 육안 비교 ✅

**2. Placeholder scan:** 문서 태스크(1·2)는 외부 리서치 산문이라 완전한 최종 텍스트를 사전 확정할 수 없으므로 목차·소스·체크리스트로 구체화했다(TDD 미적용을 명시). 코드 태스크(3·4·5·6)는 실제 코드/정확한 치환값 포함.

**3. Type consistency:** `selectDeepQuestions(members: OnboardingAnswers[]) → DeepQuestionItem[]`, `QuestionDef.field: keyof OnboardingAnswers`, `SCRIPTS: Record<string, ScriptEntry>` — Task 3 인터페이스·테스트·페이지·import 전반에서 이름 일치. `getIssueStatus` 반환 `IssueStatus`("match"|"diff"|"conflict"|"unanswered") 기준으로 셀렉터 분기 일관.

**주의(실행 시 확인 필요):**
- Task 3 Step 8/9: `useTeamMembers` 멤버 객체의 답변 필드명(`onboardingAnswers` 가정)은 gap-report의 실제 접근자와 맞춰야 함 — 다르면 매핑 수정.
- Task 6 Step 2: 로그인 placeholder/버튼 텍스트는 `app/login/page.tsx` 실제 값으로 확정.
- Task 6: `/agreement/document`는 프로필 `plan === "premium"`이 아니면 `/agreement/preview`로 리다이렉트됨 — 시드의 `owner` 프로필이 premium인지 확인(아니면 시드에서 설정).
