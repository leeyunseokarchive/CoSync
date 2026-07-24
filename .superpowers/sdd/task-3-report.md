# Task 3 Report: 심층질문 로직 추출 + 페이지 신설

## Files changed

- Created `lib/deepQuestions.ts` — `QuestionDef`, `QUESTION_DEFS` (q1–q20, verbatim), `ScriptEntry`, `SCRIPTS` (q1–q20, verbatim), `generateInsight`, `DeepQuestionItem`, `selectDeepQuestions`. Imports `getIssueStatus`/`IssueStatus`/`OnboardingAnswers` from `./gap.ts`.
- Created `lib/deepQuestions.test.ts` — verbatim from brief Step 1.
- Modified `app/gap-report/page.tsx` — removed inline `type QuestionDef`, `QUESTION_DEFS`, `type ScriptEntry`, `SCRIPTS`, `generateInsight` (was lines 31–94); added `import { QUESTION_DEFS, SCRIPTS, generateInsight } from "../../lib/deepQuestions";`. `QuestionDef`/`ScriptEntry` type imports were dropped since nothing else in the file references those type names directly (only the value bindings `QUESTION_DEFS`/`SCRIPTS`/`generateInsight` are used, at lines 133, 161, 250, 577, 987, 1005).
- Modified `tsconfig.json` — added `"allowImportingTsExtensions": true` (see Deviations below).
- Created `app/questions/page.tsx` — new page per brief Step 8, with the `m.answers` correction applied (not `m.onboardingAnswers`).

## Test commands + output

Step 2 (failing test, before creating lib/deepQuestions.ts):
```
$ node --test lib/deepQuestions.test.ts
Error [ERR_MODULE_NOT_FOUND]: Cannot find module '.../lib/deepQuestions.ts' imported from lib/deepQuestions.test.ts
✖ tests 1, fail 1
```

Step 4 (after creating lib/deepQuestions.ts):
```
$ node --test lib/deepQuestions.test.ts
✔ 멤버 1명 이하면 빈 배열 (0.827083ms)
✔ 일치 문항은 제외, 차이/충돌 문항만 선택하고 충돌을 앞에 둔다 (0.223083ms)
tests 2, pass 2, fail 0
```

Step 6 (regression, after import swap in gap-report):
```
$ node --test app/gap-report/earlybird-scroll.test.js
✔ waits for the report before scrolling to the earlybird section
✔ keeps the active team when returning from the agreement preview
tests 2, pass 2, fail 0
```

## Build result

`npm run build` succeeded twice (after Step 6 refactor, and again after Step 9 with the new page). Final route list includes `○ /questions` alongside all existing routes. TypeScript check and static generation (22/22 pages) both passed clean, no errors.

## Commits

1. `0a32bb9` — `refactor: extract deep-question defs/scripts to lib/deepQuestions with selectDeepQuestions` (lib/deepQuestions.ts, lib/deepQuestions.test.ts, app/gap-report/page.tsx, tsconfig.json)
2. `9d47aec` — `feat: add deep-question page surfacing conflict/diff discussion scripts` (app/questions/page.tsx)

## Deviations from the brief

1. **`m.answers` not `m.onboardingAnswers`** — applied exactly as instructed in the task prompt's "CRITICAL correction" section. Verified against `components/useTeamMembers.ts:15` (`TeamMember` type has `answers?: OnboardingAnswers`, no `onboardingAnswers` field) and `app/gap-report/page.tsx` usage (`member.answers`, `(m.answers as OnboardingAnswers | undefined)`).

2. **`tsconfig.json`: added `allowImportingTsExtensions: true`** — not in the brief. Root cause: the brief's Step 3 code imports `./gap` (no extension) inside `lib/deepQuestions.ts`, but Node's native TS type-stripping (Node 24, this repo's `"type": "module"`) requires explicit extensions for relative ESM specifiers — `node --test lib/deepQuestions.test.ts` failed with `ERR_MODULE_NOT_FOUND` resolving `lib/gap` when the import had no extension. Adding `.ts` to the import fixes `node --test`, but then `next build`'s TypeScript check fails with "An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled." Enabling that compiler flag is TypeScript's own sanctioned mechanism for exactly this situation (mixing `node --test` native-TS execution with a bundler build); it's a no-op for every other file in the repo since `lib/deepQuestions.ts` is the only file using an explicit `.ts` import. Verified via two full `npm run build` runs, both clean, plus both test commands passing with `import ... from "./gap.ts"`.

3. **Reverted `next-env.d.ts` after each build** — `next build` regenerates this file's `.next/types` vs `.next/dev/types` reference depending on build mode; that churn is unrelated to this task and was excluded from both commits via `git checkout -- next-env.d.ts`.

No other deviations. QUESTION_DEFS/SCRIPTS transcription was diffed line-by-line against the original `app/gap-report/page.tsx` block (pre-edit) and matched verbatim except for the added `export` keywords, confirming no Korean text was altered.
