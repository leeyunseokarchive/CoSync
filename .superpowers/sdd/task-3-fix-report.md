# Task 3 fix report — unfilled template blanks in demo-team-b agreement

## What changed

`scripts/seed.ts`, `seedTeamB()`: the `resolved` object previously set every field to
`{ option: "1", source: "match" }` with no `text` override, so `buildClauses` fell back
to the raw `CLAUSE_TEMPLATES[field]["1"]` strings verbatim — including six fields whose
option `"1"` template contains a literal `[ ]` blank meant for user input.

Added explicit `text` overrides (verbatim template text with the blank filled by a
concrete demo value) for the six affected fields:

- `extraWorkPriority`: `[ ]시간` → `24시간`
- `extraWorkPrinciple`: `[ ]개월` → `3개월`
- `exitDisputeResolution`: `다만 [ ]에는 예외로 한다` → `다만 중대한 귀책 사유가 있는 경우에는 예외로 한다`
- `pivotCriteria`: `런웨이 [ ]개월` → `런웨이 3개월`
- `deadlockTolerance`: `[ ]일 이내에` → `7일 이내에`
- `profitDistribution`: `[ ]만 원` → `300만 원`

The remaining 14 fields are unchanged (`{option: "1", source: "match"}`, no `text`).

## Verification — seed + check-seed

Ran against a fresh Firebase emulator (firestore + auth):

```
$ npx tsx scripts/seed.ts
Seeding demo scenario...
Seeding complete: demo-team-a (진행중), demo-team-b (확정 v1.0)

$ npx tsx scripts/check-seed.ts
OK: seed data verified
```

(The `MetadataLookupWarning` in both runs is the usual GCE-metadata-probe noise from
firebase-admin against the emulator — unrelated and expected.)

## Visual confirmation

Regenerated all 4 screenshots via `CoSync-intro-video/scripts/capture-screenshots.mjs`
against the dev server pointed at the emulator. Diffed only
`public/screenshots/05-agreement-document.png` in git status — the other three
(`02-diagnosis.png`, `03-gap-report.png`, `04-consensus.png`) came out byte-identical
to before, confirming no regression from the seed change.

Viewed `05-agreement-document.png` directly: it shows the "창업 팀 간 구조적 합의안"
document (v1 Final, confirmed) for 얼리버드 팀. Visible clauses under 제1장 (역할 & 책임)
read:

- "담당이 정해지지 않은 업무가 발생한 경우, 이를 발견한 사람이 우선 직접 처리하되
  **24시간** 이내에 처리 결과를 팀에 공유하기로 한다."
- "초기 **3개월** 동안은 업무 외 시간의 협업 요청에도 적극적으로 대응하는 것을
  원칙으로 한다."

and under 제2장 (이탈 & 회수):

- "구성원 이탈 시 지분 정리는 등기된 지분을 그대로 인정하는 것을 원칙으로 한다.
  다만 **중대한 귀책 사유가 있는 경우**에는 예외로 한다."

No literal `[ ]` appears anywhere in the visible clause text. The capture is a fixed
1280x800 viewport screenshot (not full-page), so the other three filled fields
(`pivotCriteria`, `deadlockTolerance`, `profitDistribution`) scroll below the fold and
aren't in frame — but they use the same fixed template text with the blank filled, so
they're consistent with what's shown.

## Commits

- CoSync: `cf9f15339fa6c2f1183bef7f8a6666c49e31e664` — "fix: fill template blanks in
  demo-team-b agreement clauses for video capture"
- CoSync-intro-video: `7572ace07ee06c59435f5d206e0ebd0707a667ef` — "fix: re-capture
  screenshots with filled-in agreement clause text"

## Concerns

- The screenshot only shows 3 of the 20 clauses in frame (viewport, not full-page
  capture), so the fix for the other 3 blanked fields (`pivotCriteria`,
  `deadlockTolerance`, `profitDistribution`) isn't visually verifiable from this single
  screenshot — verified instead by reading `buildClauses` output logic and the seed
  data directly. If the video ever scrolls or crops differently, worth a spot-check.
- Filled-in values (24시간, 3개월, 300만 원, etc.) are arbitrary but realistic demo
  numbers — not tied to any real business logic, per the task's own instruction.
- Emulator and dev server were both fresh/stateless for this task and were killed
  after capture; no persistent state was expected or preserved.
