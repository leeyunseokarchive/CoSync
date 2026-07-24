# Task 6 Report: Playwright 인앱 캡쳐

## Status: DONE

Commit: `029f04a` — "chore: add in-app screenshot capture script and capture questions/consensus/document pages"

## Commands run

1. `npm i -D playwright` — installed (2 packages added).
2. `npx playwright install chromium` — no-op, chromium 1223/1228 + headless_shell already cached in `~/Library/Caches/ms-playwright/`.
3. Wrote `scripts/capture-screenshots.mjs`.
4. `export JAVA_HOME="/opt/homebrew/opt/openjdk@21"; export PATH="$JAVA_HOME/bin:$PATH"; firebase emulators:start --only firestore,auth > /tmp/emu.log 2>&1 &` — emulators up (Auth :9099, Firestore :8080) in ~10s.
5. `npx tsx scripts/seed.ts` — "Seeding complete: demo-team-a (진행중), demo-team-b (확정 v1.0)". (A harmless `MetadataLookupWarning` from firebase-admin's GCP metadata probe appeared but seeding succeeded.)
6. `NEXT_PUBLIC_USE_FIREBASE_EMULATOR=1 npm run dev > /tmp/dev.log 2>&1 &` — Next.js 16 / Turbopack ready in 842ms.
7. `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/login` → `200` on first attempt.
8. `node scripts/capture-screenshots.mjs` — first run failed (see Deviation below), second run succeeded: `captured questions` / `captured consensus` / `captured agreement-document`.
9. Verified all 3 PNGs by opening them (Read tool, image view) — see "What each PNG shows" below.
10. `pkill -f "firebase emulators"; pkill -f "next dev"` — cleaned up.

## Deviations from the brief (both required, both verified before applying)

**1. `waitUntil: "networkidle"` timeout on shot pages.**
First capture run failed with `page.goto: Timeout 30000ms exceeded` navigating to `/questions?teamId=demo-team-b`. Root cause: Firestore's `onSnapshot` realtime listeners keep an open long-poll/websocket connection, so the network never goes idle — `networkidle` was never going to resolve on any authenticated page in this app. Fixed in the script: shot navigations now use `waitUntil: "load"` with the post-nav wait bumped from 1200ms → 2500ms to give the realtime subscriptions time to render. Login navigation (before Firestore listeners attach) still uses `networkidle`, which worked fine there.

**2. `questions.png` uses `teamId=demo-team-a`, not `demo-team-b`.**
Capturing `/questions?teamId=demo-team-b` produced a real page render (HTTP 200, no error) but with an *intentionally empty* state: "아직 심층 대화가 필요한 항목이 없어요. 팀원 2명 이상이 진단을 마치면 여기에 표시됩니다." I read `scripts/seed.ts`: `TEAM_B_ANSWERS` gives all 4 demo members identical answers (`{...BASE}`, every field `"1"`) — team B is deliberately the "fully matched, confirmed v1 agreement" demo team, so it has zero gaps by design, not by a seeding bug. `TEAM_A_ANSWERS` is the team seeded with 5 deliberately conflicting/differing fields (`extraWorkPriority`, `equityStructure`, `decisionFailure`, `growthStrategy`, `fundingRunway`), which is what actually exercises the deep-questions feature. I probed `/questions?teamId=demo-team-a` with a throwaway script and confirmed it renders exactly what the brief's Step 5 checklist asks for — cards sorted 충돌→차이, conversation-starter quotes, "정하기 팁" boxes. Updated `scripts/capture-screenshots.mjs` so only the `questions` shot points at `demo-team-a` (with a `ponytail:` comment explaining why); `consensus` and `agreement-document` stay on `demo-team-b` since that's the only team with a confirmed `v1` agreement (`/agreement/document` has nothing to show for team A — `seedTeamA()` never writes an `agreements` doc).

Both fixes are reflected in the committed `scripts/capture-screenshots.mjs`.

## What each PNG shows (docs/captures/2026-07-24/)

- **questions.png** (2880×6798, `teamId=demo-team-a`): "지금 꼭 맞춰봐야 할 대화" — 5 deep-question cards in 충돌/차이 order (회색지대 업무 배정, 런웨이 위기 대응, 실패 후 반응, 지분 구조 철학, 성장 전략), each with a badge (충돌/차이), a conversation-starter quote bubble, numbered discussion steps with per-member framing bullets, and a "정하기 팁" tip box. Matches Step 5's expectation of "충돌→차이 순으로 렌더, 대화 스크립트/팁 표시."
- **consensus.png** (2880×5782, `teamId=demo-team-b`): "팀 합의 세션" — all 6 chapters (역할&책임 … 지분&보상) with every clause row showing a green "자동 합의" badge (all 4 members' answers matched, so every item auto-resolved), rendered in the enlarged label/body font from Task 4.
- **agreement-document.png** (2880×4392, `teamId=demo-team-b`): "창업 팀 간 구조적 합의안" — full confirmed v1 document, 6 chapters with numbered clauses in the enlarged 1.05rem body text from Task 5, all 6 previously-blank template fields filled with concrete demo values, signer list (4 members, all confirmed 2026년 7월 24일), and the green "본문 합의안은 팀원 전원의 합의를 통해 확정되었습니다" banner. Print-width preserved (centered card layout).

All three are non-trivial, fully-rendered, data-populated screenshots — no blank/error states.

## Cleanup

`pkill -f "firebase emulators"` and `pkill -f "next dev"` both ran successfully after capture. No lingering background processes. `next-env.d.ts` was not regenerated/modified. `package.json`/`package-lock.json` picked up the `playwright` devDependency from `npm i -D playwright` but were intentionally left uncommitted per the task's explicit `git add` file list (only `scripts/capture-screenshots.mjs` and `docs/captures/2026-07-24`). `firestore-debug.log` also picked up noise from the emulator run but was likewise left out of the commit.

## Commit

```
029f04a chore: add in-app screenshot capture script and capture questions/consensus/document pages
 4 files changed, 43 insertions(+)
 create mode 100644 docs/captures/2026-07-24/agreement-document.png
 create mode 100644 docs/captures/2026-07-24/consensus.png
 create mode 100644 docs/captures/2026-07-24/questions.png
 create mode 100644 scripts/capture-screenshots.mjs
```
