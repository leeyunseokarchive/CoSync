# Task 3 Report: 화면 캡처

## Summary

All 6 steps from the brief were completed. One bug was found and fixed in Step 4 (the brief's `networkidle` wait condition never resolves against this app because Firestore's realtime SDK long-polls continuously — see "Concerns" below). All other steps worked exactly as specified in the brief.

## Step 1: Playwright install (CoSync-intro-video)

```
$ npm i -D playwright
added 2 packages, and audited 318 packages in 2s
...

$ npx playwright install chromium
Downloading Chrome for Testing 149.0.7827.55 (playwright chromium v1228) ... downloaded to /Users/leeyunseok/Library/Caches/ms-playwright/chromium-1228
Downloading Chrome Headless Shell 149.0.7827.55 ... downloaded to /Users/leeyunseok/Library/Caches/ms-playwright/chromium_headless_shell-1228
```

Both completed cleanly.

## Step 2: `scripts/capture-screenshots.mjs`

Created at `/Users/leeyunseok/Desktop/Projects/CoSync-intro-video/scripts/capture-screenshots.mjs` per the brief, verbatim, with one fix applied after Step 4 failed on the first run (see below): the `page.goto(shot.url, { waitUntil: "networkidle" })` calls were changed to `waitUntil: "load"` plus a longer settle timeout (800ms → 1500ms).

## Step 3: Emulators + seed + dev server (CoSync repo)

```
$ firebase emulators:start --only firestore,auth
i  emulators: Starting emulators: auth, firestore
✔  firestore: Firestore Emulator UI websocket is running on 9150.
┌─────────────────────────────────────────────────────────────┐
│ ✔  All emulators ready! It is now safe to connect your app. │
└─────────────────────────────────────────────────────────────┘

$ npx tsx scripts/seed.ts
Seeding demo scenario...
Seeding complete: demo-team-a (진행중), demo-team-b (확정 v1.0)

$ NEXT_PUBLIC_USE_FIREBASE_EMULATOR=1 npm run dev
▲ Next.js 16.1.6 (Turbopack)
✓ Ready in 646ms

$ curl -s http://localhost:3000/login -o /dev/null -w "%{http_code}\n"
200
```

Matches expected `200`.

## Step 4: Capture script

**First run failed:**
```
page.goto: Timeout 30000ms exceeded.
  - navigating to "http://localhost:3000/onboarding/diagnosis", waiting until "networkidle"
```
Login itself succeeded (the script got past `waitForURL(.../workspace)` fine — dev server logs show `GET /workspace 200`, `GET /onboarding/diagnosis 200`). The page loaded and rendered correctly server-side; the failure was purely Playwright's `networkidle` condition never firing, because the Firestore JS SDK keeps a long-polling connection open once a page mounts realtime listeners — there is never a stretch with zero in-flight network activity. This is a known Playwright + Firestore interaction issue, not an app bug.

**Fix:** changed `waitUntil: "networkidle"` → `waitUntil: "load"` and bumped the settle delay from 800ms to 1500ms in the script.

**Second run (after fix) succeeded:**
```
saved /Users/leeyunseok/Desktop/Projects/CoSync-intro-video/public/screenshots/02-diagnosis.png
saved /Users/leeyunseok/Desktop/Projects/CoSync-intro-video/public/screenshots/03-gap-report.png
saved /Users/leeyunseok/Desktop/Projects/CoSync-intro-video/public/screenshots/04-consensus.png
saved /Users/leeyunseok/Desktop/Projects/CoSync-intro-video/public/screenshots/05-agreement-document.png
```
4 lines, no errors — matches expected output.

## Step 5: Verification

```
$ file public/screenshots/*.png
02-diagnosis.png:          PNG image data, 1280 x 800, 8-bit/color RGB, non-interlaced
03-gap-report.png:         PNG image data, 1280 x 800, 8-bit/color RGB, non-interlaced
04-consensus.png:          PNG image data, 1280 x 800, 8-bit/color RGB, non-interlaced
05-agreement-document.png: PNG image data, 1280 x 800, 8-bit/color RGB, non-interlaced
```
All 4 are 1280x800 and non-zero size (57KB, 181KB, 210KB, 169KB respectively).

**Visual inspection (opened each PNG):**

- **02-diagnosis.png** — Onboarding diagnosis flow, "역할 & 책임" (Role & Responsibility) section, "QUESTION 1 / 20", progress bar at 5%, a Korean scenario question about unassigned CS duties with 4 multiple-choice answers. Korean renders cleanly, no encoding issues.
- **03-gap-report.png** — Gap Report page for `demo-team-a`. Logged-in header (CoSync logo, user avatar, 로그아웃), "GAP REPORT" hero title, team member names (민서·재윤·태오·하은), status cards ("공식 합의: 미확정", "버전 기록: 없음"), a circular 81% "인식 일치율" gauge, and a written insight summary. This is real rendered data, not an empty/error state.
- **04-consensus.png** — Consensus session page for `demo-team-a` ("노트펀치 팀"). "팀 합의 세션" title, progress "합의 진행 1/5", chapter "제1장. 역할 & 책임" with three agenda items showing status badges ("합의 완료", "자동 합의" x2).
- **05-agreement-document.png** — Final agreement document for `demo-team-b`. "최종 확정됨 · v1" badge, title "창업 팀 간 구조적 합의안" ("Structural Founding Team Agreement"), team name "얼리버드 팀", "v1 Final", date "2026년 7월 16일", "PDF 내보내기" button, and chapters 1–3 of agreement clauses in readable Korean prose.

All 4 screens show the correct, expected content — no blank pages, no error screens, no login redirects.

## Step 6: Cleanup + commit

```
$ pkill -f "firebase emulators" || true
$ pkill -f "next dev" || true
```
Both processes confirmed stopped (no matching processes in `ps aux` afterward).

```
$ git add package.json package-lock.json scripts/capture-screenshots.mjs public/screenshots
$ git commit -m "feat: capture live app screenshots via Playwright for video scenes"
[main 4c6f133] feat: capture live app screenshots via Playwright for video scenes
 7 files changed, 92 insertions(+)
 create mode 100644 public/screenshots/02-diagnosis.png
 create mode 100644 public/screenshots/03-gap-report.png
 create mode 100644 public/screenshots/04-consensus.png
 create mode 100644 public/screenshots/05-agreement-document.png
 create mode 100644 scripts/capture-screenshots.mjs
```

**Commit hash (CoSync-intro-video repo):** `4c6f133a55fcfda04067f86779d85828929c1086`

## Concerns

- The brief's exact script (verbatim `networkidle` wait) does **not** work against this app due to Firestore's long-polling realtime SDK. I fixed it in the delivered script (`waitUntil: "load"` + 1500ms settle, marked with a `ponytail:` comment explaining why). Anyone re-running this script exactly as written in the brief will hit the same 30s timeout.
- The CoSync repo (not CoSync-intro-video) had pre-existing uncommitted local changes on `feature/intro-video-capture` before I started (modified `app/actions/consensus.ts` deletion, `app/workspace/page.tsx`, `firestore.rules`, etc.) — these predate this task and were left untouched; I did not commit anything in the CoSync repo, only ran the emulator/dev server against the working tree as instructed.
- No other issues; screenshots are clean and ready for use as video backgrounds.
