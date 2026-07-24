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

