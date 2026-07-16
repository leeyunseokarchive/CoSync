# CoSync 소개 영상 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** CoSync(팀 협업 갭 분석/합의 SaaS)의 실제 화면을 캡처해 Remotion으로 30초 세로(9:16) 소셜미디어 소개 영상을 만든다.

**Architecture:** Firebase 에뮬레이터에 가짜 시나리오 데이터를 시딩 → 로컬 dev 서버를 에뮬레이터에 연결 → 브라우저로 6개 화면 스크린샷 캡처 → 별도 Remotion 프로젝트에서 스크린샷+한글 타이포 자막+BGM을 6개 씬으로 합성 → mp4 렌더.

**Tech Stack:** Next.js(CoSync 기존 앱), firebase-admin + firebase(JS SDK) 에뮬레이터, Remotion(React), `@remotion/media`, `@remotion/google-fonts/NotoSansKR`.

## Global Constraints

- 최종 영상: 1080x1920, 30fps, 900프레임(정확히 30초).
- 자막은 한국어 텍스트 타이포그래피만 사용, 내레이션/TTS 없음, 배경음악만.
- 프로덕션 Firestore(`cosync-d7dd7`)는 절대 쓰지 않는다 — 모든 시딩/캡처는 Firebase 에뮬레이터(Firestore:8080, Auth:9099)에서만 수행.
- Remotion 프로젝트는 CoSync 레포와 분리된 새 폴더 `~/Desktop/Projects/CoSync-intro-video/`에 만든다. CoSync 레포에는 `lib/firebase.ts`와 `scripts/seed.ts`만 수정한다.
- 아웃트로 슬로건 문구는 정확히: "CoSync — 창업은 신뢰가 아니라 실전입니다."
- BGM은 로열티프리 트랙만 사용하고, 다운로드 전 반드시 사용자에게 후보를 보여주고 승인받는다.
- 결제/구독 연동 화면, 영문 버전, TTS 내레이션은 이번 범위에 포함하지 않는다.

---

### Task 1: Firebase 에뮬레이터 연결 배선 (CoSync 클라이언트)

**Files:**
- Modify: `/Users/leeyunseok/Desktop/Projects/CoSync/lib/firebase.ts`

**Interfaces:**
- Produces: `NEXT_PUBLIC_USE_FIREBASE_EMULATOR` 환경변수가 `"1"`일 때 `auth`/`db`가 `127.0.0.1:9099`, `127.0.0.1:8080` 에뮬레이터에 연결됨. 변수가 없으면 기존과 동일하게 프로덕션에 연결(회귀 없음).

- [ ] **Step 1: `lib/firebase.ts`에 에뮬레이터 연결 분기 추가**

```ts
import { initializeApp, getApps } from "firebase/app";
import { connectAuthEmulator, getAuth } from "firebase/auth";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";

const firebaseConfig = {
  apiKey: "AIzaSyDIJw3leCw1Ay1wYBgB7jTgLj8lwZkHuOs",
  authDomain: "cosync-d7dd7.firebaseapp.com",
  projectId: "cosync-d7dd7",
  storageBucket: "cosync-d7dd7.firebasestorage.app",
  messagingSenderId: "542201096247",
  appId: "1:542201096247:web:864ef9700f0491e92377b2"
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app);

declare global {
  // eslint-disable-next-line no-var
  var __cosyncEmulatorConnected: boolean | undefined;
}

if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === "1" && !globalThis.__cosyncEmulatorConnected) {
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
  globalThis.__cosyncEmulatorConnected = true;
}
```

- [ ] **Step 2: 검증 — 에뮬레이터 기동 후 dev 서버가 실제로 에뮬레이터를 바라보는지 확인**

```bash
cd "/Users/leeyunseok/Desktop/Projects/CoSync"
export JAVA_HOME="/opt/homebrew/opt/openjdk@21"
export PATH="$JAVA_HOME/bin:$PATH"
firebase emulators:start --only firestore,auth &
sleep 5
NEXT_PUBLIC_USE_FIREBASE_EMULATOR=1 npm run dev &
sleep 5
curl -s http://127.0.0.1:4000/firestore 2>&1 | head -5
```

Expected: 에뮬레이터 UI(4000 포트)가 응답하고, `npm run dev` 콘솔에 에러 없음. (브라우저에서 `http://localhost:3000`을 열어 개발자도구 Network 탭에 `127.0.0.1:8080`/`127.0.0.1:9099` 요청이 찍히면 배선 성공 — Task 3 캡처 단계에서 최종 확인.)

- [ ] **Step 3: Commit**

```bash
cd "/Users/leeyunseok/Desktop/Projects/CoSync"
git add lib/firebase.ts
git commit -m "feat: add opt-in Firebase emulator connection for local demo capture"
```

---

### Task 2: 시나리오 시드 스크립트 확장

**Files:**
- Modify: `/Users/leeyunseok/Desktop/Projects/CoSync/scripts/seed.ts`

**Interfaces:**
- Consumes: `lib/gap.ts`의 `QUESTION_CONFIGS`, `lib/agreementClauses.ts`의 `buildClauses`, `CLAUSE_TEMPLATES` (import 가능, 순수 함수 — Firebase 불필요).
- Produces: 에뮬레이터에 두 팀 생성 —
  - `demo-team-a` (문서 ID 고정): 온보딩 답변에 일치/차이/충돌 혼재, 합의 세션 진행 중(1개 해결, 1개 투표중, 3개 미제안).
  - `demo-team-b` (문서 ID 고정): 전원 답변 일치, 확정된 합의서 v1.0 (`status: "confirmed"`).
  - 로그인 계정: `owner@demo.local` / `demopass123!` (uid `demo-owner`), 두 팀 모두에 소속.

- [ ] **Step 1: `scripts/seed.ts` 전체를 아래로 교체**

```ts
import { initializeApp } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { buildClauses } from "../lib/agreementClauses";
import { QUESTION_CONFIGS, computeGapSummary, type OnboardingAnswers } from "../lib/gap";

process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";
process.env.FIREBASE_AUTH_EMULATOR_HOST = "127.0.0.1:9099";

const app = initializeApp({ projectId: "cosync-d7dd7" });
const db = getFirestore(app);
const auth = getAuth(app);

const MEMBER_UIDS = ["demo-owner", "demo-member-2", "demo-member-3", "demo-member-4"];
const MEMBER_NAMES: Record<string, string> = {
  "demo-owner": "태오",
  "demo-member-2": "민서",
  "demo-member-3": "재윤",
  "demo-member-4": "하은",
};

// 필드별 4명 응답. 기본은 전원 "1"(일치), 아래 5개 필드만 의도적으로 차이/충돌을 만든다.
const BASE: OnboardingAnswers = Object.fromEntries(
  QUESTION_CONFIGS.map((q) => [q.field, "1"])
) as unknown as OnboardingAnswers;

const TEAM_A_ANSWERS: Record<string, OnboardingAnswers> = {
  "demo-owner": { ...BASE, extraWorkPriority: "3", equityStructure: "2", decisionFailure: "2", growthStrategy: "3", fundingRunway: "1" },
  "demo-member-2": { ...BASE, extraWorkPriority: "4", equityStructure: "4", decisionFailure: "3", growthStrategy: "4", fundingRunway: "3" },
  "demo-member-3": { ...BASE, extraWorkPriority: "3", equityStructure: "2", decisionFailure: "2", growthStrategy: "3", fundingRunway: "1" },
  "demo-member-4": { ...BASE, extraWorkPriority: "3", equityStructure: "2", decisionFailure: "2", growthStrategy: "3", fundingRunway: "1" },
};

const TEAM_B_ANSWERS: Record<string, OnboardingAnswers> = {
  "demo-owner": { ...BASE },
  "demo-member-2": { ...BASE },
  "demo-member-3": { ...BASE },
  "demo-member-4": { ...BASE },
};

async function ensureUsers() {
  for (const uid of MEMBER_UIDS) {
    const email = uid === "demo-owner" ? "owner@demo.local" : `${uid}@demo.local`;
    try {
      await auth.getUser(uid);
    } catch {
      await auth.createUser({ uid, email, password: "demopass123!", displayName: MEMBER_NAMES[uid] });
    }
    await db.collection("users").doc(uid).set(
      {
        name: MEMBER_NAMES[uid],
        email,
        plan: "premium",
        subscriptionStatus: "active",
        teamIds: ["demo-team-a", "demo-team-b"],
        lastActiveTeamId: "demo-team-a",
      },
      { merge: true }
    );
  }
}

async function seedTeamA() {
  const answersList = MEMBER_UIDS.map((uid) => TEAM_A_ANSWERS[uid]);
  const { gapCount, gapScore } = computeGapSummary(answersList);

  await db.collection("teams").doc("demo-team-a").set({
    name: "노트펀치 팀",
    industry: "SaaS",
    memberCount: "3-5명",
    stage: "MVP 단계",
    inviteCode: "DEM-OTE-AMA",
    createdBy: "demo-owner",
    members: MEMBER_UIDS,
    createdAt: Timestamp.now(),
    progress: 100,
    gapCount,
    gapScore,
  });

  for (const uid of MEMBER_UIDS) {
    await db
      .collection("teams").doc("demo-team-a")
      .collection("members").doc(uid)
      .set({
        name: MEMBER_NAMES[uid],
        role: uid === "demo-owner" ? "OWNER" : "MEMBER",
        department: "",
        status: "active",
        progress: 100,
        answers: TEAM_A_ANSWERS[uid],
      });
  }

  // extraWorkPriority: 전원 동의로 해결됨
  await db.collection("teams").doc("demo-team-a").collection("consensus").doc("extraWorkPriority").set({
    status: "resolved",
    proposal: {
      byUid: "demo-owner",
      byName: "태오",
      option: "3",
      clauseText: "담당이 정해지지 않은 업무가 발생한 경우, 기존 업무의 우선순위를 유지하며 신규 업무는 별도 논의를 거쳐 배정하기로 한다.",
      proposedAt: Timestamp.now(),
    },
    votes: { "demo-owner": "approve", "demo-member-2": "approve", "demo-member-3": "approve", "demo-member-4": "approve" },
    resolvedOption: "3",
    resolvedClause: "담당이 정해지지 않은 업무가 발생한 경우, 기존 업무의 우선순위를 유지하며 신규 업무는 별도 논의를 거쳐 배정하기로 한다.",
  });

  // equityStructure: 투표 진행 중 (4명 중 2명만 승인)
  await db.collection("teams").doc("demo-team-a").collection("consensus").doc("equityStructure").set({
    status: "voting",
    proposal: {
      byUid: "demo-member-2",
      byName: "민서",
      option: "2",
      clauseText: "지분 구조는 초기 합의된 등기 비율을 유지하되, 이후 기여도에 따라 [ ] 시점에 재조정 여부를 논의하기로 한다.",
      proposedAt: Timestamp.now(),
    },
    votes: { "demo-owner": "approve", "demo-member-2": "approve" },
  });
}

async function seedTeamB() {
  const answersList = MEMBER_UIDS.map((uid) => TEAM_B_ANSWERS[uid]);
  const { gapCount, gapScore } = computeGapSummary(answersList);

  await db.collection("teams").doc("demo-team-b").set({
    name: "얼리버드 팀",
    industry: "커머스",
    memberCount: "3-5명",
    stage: "PMF 단계",
    inviteCode: "DEM-OTE-BMB",
    createdBy: "demo-owner",
    members: MEMBER_UIDS,
    createdAt: Timestamp.now(),
    progress: 100,
    gapCount,
    gapScore,
  });

  for (const uid of MEMBER_UIDS) {
    await db
      .collection("teams").doc("demo-team-b")
      .collection("members").doc(uid)
      .set({
        name: MEMBER_NAMES[uid],
        role: uid === "demo-owner" ? "OWNER" : "MEMBER",
        department: "",
        status: "active",
        progress: 100,
        answers: TEAM_B_ANSWERS[uid],
      });
  }

  const resolved = Object.fromEntries(
    QUESTION_CONFIGS.map((q) => [q.field, { option: "1" as const, source: "match" as const }])
  );
  const clauses = buildClauses(resolved);

  await db.collection("teams").doc("demo-team-b").collection("agreements").doc("v1").set({
    version: 1,
    createdAt: Timestamp.now(),
    createdBy: "demo-owner",
    createdByName: "태오",
    status: "confirmed",
    confirmations: Object.fromEntries(MEMBER_UIDS.map((uid) => [uid, Timestamp.now()])),
    clauses,
  });
}

async function seed() {
  console.log("Seeding demo scenario...");
  await ensureUsers();
  await seedTeamA();
  await seedTeamB();
  console.log("Seeding complete: demo-team-a (진행중), demo-team-b (확정 v1.0)");
}

seed().then(() => process.exit(0)).catch((e) => {
  console.error(e);
  process.exit(1);
});
```

- [ ] **Step 2: 에뮬레이터 기동 후 시드 실행**

```bash
cd "/Users/leeyunseok/Desktop/Projects/CoSync"
export JAVA_HOME="/opt/homebrew/opt/openjdk@21"
export PATH="$JAVA_HOME/bin:$PATH"
firebase emulators:start --only firestore,auth &
sleep 5
npx tsx scripts/seed.ts
```

Expected: `Seeding complete: demo-team-a (진행중), demo-team-b (확정 v1.0)` 출력, 에러 없음.

- [ ] **Step 3: 검증 스크립트로 시드 결과 확인**

`scripts/check-seed.ts` 생성:

```ts
// 시드 결과 확인: npx tsx scripts/check-seed.ts
import assert from "node:assert";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";
const app = initializeApp({ projectId: "cosync-d7dd7" });
const db = getFirestore(app);

async function main() {
  const teamA = await db.collection("teams").doc("demo-team-a").get();
  assert(teamA.exists, "demo-team-a missing");
  assert((teamA.data()!.gapCount as number) > 0, "demo-team-a should have gaps");

  const resolved = await db.collection("teams").doc("demo-team-a").collection("consensus").doc("extraWorkPriority").get();
  assert.equal(resolved.data()!.status, "resolved");

  const voting = await db.collection("teams").doc("demo-team-a").collection("consensus").doc("equityStructure").get();
  assert.equal(voting.data()!.status, "voting");

  const agreement = await db.collection("teams").doc("demo-team-b").collection("agreements").doc("v1").get();
  assert.equal(agreement.data()!.status, "confirmed");
  assert.equal((agreement.data()!.clauses as unknown[]).length, 20);

  console.log("OK: seed data verified");
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
```

```bash
cd "/Users/leeyunseok/Desktop/Projects/CoSync"
npx tsx scripts/check-seed.ts
```

Expected: `OK: seed data verified`

- [ ] **Step 4: Commit**

```bash
cd "/Users/leeyunseok/Desktop/Projects/CoSync"
git add scripts/seed.ts scripts/check-seed.ts
git commit -m "feat: seed full demo scenario (gap + consensus + confirmed agreement) for video capture"
```

---

### Task 3: 화면 캡처

**Files:**
- Create: `/Users/leeyunseok/Desktop/Projects/CoSync-intro-video/scripts/capture-screenshots.mjs`
- Create: `/Users/leeyunseok/Desktop/Projects/CoSync-intro-video/public/screenshots/02-diagnosis.png`
- Create: `/Users/leeyunseok/Desktop/Projects/CoSync-intro-video/public/screenshots/03-gap-report.png`
- Create: `/Users/leeyunseok/Desktop/Projects/CoSync-intro-video/public/screenshots/04-consensus.png`
- Create: `/Users/leeyunseok/Desktop/Projects/CoSync-intro-video/public/screenshots/05-agreement-document.png`

**Interfaces:**
- Consumes: Task 1(에뮬레이터 배선), Task 2(시드 데이터 — `demo-team-a`, `demo-team-b`, 로그인 `owner@demo.local` / `demopass123!`), Task 4(스캐폴딩된 `CoSync-intro-video` 프로젝트 — 이미 완료됨, 이 태스크는 그 뒤에 실행).
- Produces: 1280x800 PNG 스크린샷 4장.

캡처 방식: 대화형 브라우저 도구는 스크린샷을 화면에 인라인으로만 보여주고 디스크에 파일로 저장하지 않는다 — 확인됨. 대신 Playwright(헤드리스 Chromium)로 실제 로그인 플로우를 거쳐 PNG 파일을 직접 저장한다. 에뮬레이터 계정(`owner@demo.local`)은 이번 시드 스크립트가 만든 테스트 픽스처이며 실제 사용자 자격증명이 아니다.

- [ ] **Step 1: Playwright 설치 (CoSync-intro-video 프로젝트)**

```bash
cd "/Users/leeyunseok/Desktop/Projects/CoSync-intro-video"
npm i -D playwright
npx playwright install chromium
```

- [ ] **Step 2: `scripts/capture-screenshots.mjs` 작성**

```js
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const BASE_URL = "http://localhost:3000";
const OUT_DIR = path.resolve(import.meta.dirname, "..", "public", "screenshots");

const SHOTS = [
  { url: `${BASE_URL}/onboarding/diagnosis`, file: "02-diagnosis.png" },
  { url: `${BASE_URL}/gap-report?teamId=demo-team-a`, file: "03-gap-report.png" },
  { url: `${BASE_URL}/consensus?teamId=demo-team-a`, file: "04-consensus.png" },
  { url: `${BASE_URL}/agreement/document?teamId=demo-team-b`, file: "05-agreement-document.png" },
];

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  await page.goto(`${BASE_URL}/login`);
  await page.getByPlaceholder("example@cosync.com").fill("owner@demo.local");
  await page.getByPlaceholder("••••••••").fill("demopass123!");
  await page.getByRole("button", { name: "로그인하기 →" }).click();
  await page.waitForURL(`${BASE_URL}/workspace`, { timeout: 15000 });

  for (const shot of SHOTS) {
    await page.goto(shot.url, { waitUntil: "networkidle" });
    await page.waitForTimeout(800);
    const outPath = path.join(OUT_DIR, shot.file);
    await page.screenshot({ path: outPath });
    console.log(`saved ${outPath}`);
  }

  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

- [ ] **Step 3: 에뮬레이터 + dev 서버 기동 (CoSync 레포)**

```bash
cd "/Users/leeyunseok/Desktop/Projects/CoSync"
export JAVA_HOME="/opt/homebrew/opt/openjdk@21"
export PATH="$JAVA_HOME/bin:$PATH"
firebase emulators:start --only firestore,auth > /tmp/emu.log 2>&1 &
sleep 8
npx tsx scripts/seed.ts
NEXT_PUBLIC_USE_FIREBASE_EMULATOR=1 npm run dev > /tmp/dev.log 2>&1 &
sleep 8
curl -s http://localhost:3000/login -o /dev/null -w "%{http_code}\n"
```

Expected: `200` 출력.

- [ ] **Step 4: 캡처 스크립트 실행**

```bash
cd "/Users/leeyunseok/Desktop/Projects/CoSync-intro-video"
node scripts/capture-screenshots.mjs
```

Expected: `saved .../02-diagnosis.png` ~ `saved .../05-agreement-document.png` 4줄 출력, 에러 없음.

- [ ] **Step 5: 검증**

```bash
file /Users/leeyunseok/Desktop/Projects/CoSync-intro-video/public/screenshots/*.png
```

Expected: 4개 파일 모두 `PNG image data, 1280 x 800`, 파일 크기 0바이트 아님. 스크린샷 이미지를 열어 각각 온보딩 진단/갭 리포트/합의 세션/합의서 문서 화면이 맞는지, 한글 텍스트가 깨지지 않았는지 육안 확인.

- [ ] **Step 6: 서버 정리 + Commit**

```bash
pkill -f "firebase emulators" || true
pkill -f "next dev" || true
cd "/Users/leeyunseok/Desktop/Projects/CoSync-intro-video"
git add package.json package-lock.json scripts/capture-screenshots.mjs public/screenshots
git commit -m "feat: capture live app screenshots via Playwright for video scenes"
```

---

### Task 4: Remotion 프로젝트 스캐폴딩 + 정적 에셋 준비

**Files:**
- Create: `/Users/leeyunseok/Desktop/Projects/CoSync-intro-video/` (전체 프로젝트)
- Create: `/Users/leeyunseok/Desktop/Projects/CoSync-intro-video/public/logo.png`
- Create: `/Users/leeyunseok/Desktop/Projects/CoSync-intro-video/public/mascot.png`

**Interfaces:**
- Produces: `npx remotion studio`로 열리는 blank Remotion 프로젝트, `@remotion/media`·`@remotion/google-fonts` 설치 완료.

- [ ] **Step 1: 스캐폴딩**

```bash
cd "/Users/leeyunseok/Desktop/Projects"
npx create-video@latest --yes --blank --no-tailwind CoSync-intro-video
cd CoSync-intro-video
npm i
npx remotion add @remotion/media
npx remotion add @remotion/google-fonts
```

- [ ] **Step 2: 브랜드 에셋 복사**

```bash
mkdir -p "/Users/leeyunseok/Desktop/Projects/CoSync-intro-video/public/screenshots"
cp "/Users/leeyunseok/Desktop/Projects/CoSync/logo.png" "/Users/leeyunseok/Desktop/Projects/CoSync-intro-video/public/logo.png"
cp "/Users/leeyunseok/Desktop/Projects/CoSync/mascot.png" "/Users/leeyunseok/Desktop/Projects/CoSync-intro-video/public/mascot.png"
```

(Task 3에서 캡처한 스크린샷 4장도 `public/screenshots/`에 이미 위치해 있어야 한다.)

- [ ] **Step 3: 검증**

```bash
cd "/Users/leeyunseok/Desktop/Projects/CoSync-intro-video"
ls public/logo.png public/mascot.png public/screenshots/*.png
npx remotion studio --no-open
```

Expected: 5개 파일 경로 모두 출력, Remotion Studio 서버 URL이 에러 없이 출력됨.

- [ ] **Step 4: Commit**

```bash
cd "/Users/leeyunseok/Desktop/Projects/CoSync-intro-video"
git init
git add -A
git commit -m "chore: scaffold Remotion project with brand assets and screenshots"
```

---

### Task 5: 공용 컴포넌트 (Caption, ScreenshotFrame, ScreenScene)

**Files:**
- Create: `src/components/Caption.tsx`
- Create: `src/components/ScreenshotFrame.tsx`
- Create: `src/components/ScreenScene.tsx`

**Interfaces:**
- Produces:
  - `Caption({ text: string, delayFrames?: number })` — 화면 하단 타이포 자막.
  - `ScreenshotFrame({ src: string })` — 브라우저 목업 프레임 안에 스크린샷 렌더.
  - `ScreenScene({ screenshot: string, caption: string, durationInFrames: number })` — Task 6에서 4개 씬이 재사용.
- Consumes: `staticFile`, `Img`(remotion), `@remotion/google-fonts/NotoSansKR`.

- [ ] **Step 1: `src/components/Caption.tsx` 작성**

```tsx
import { useCurrentFrame, interpolate, Easing } from "remotion";
import { loadFont } from "@remotion/google-fonts/NotoSansKR";

const { fontFamily } = loadFont("normal", { weights: ["700", "900"], subsets: ["latin"] });

export const Caption: React.FC<{ text: string; delayFrames?: number }> = ({ text, delayFrames = 0 }) => {
  const frame = useCurrentFrame();
  const local = frame - delayFrames;
  const opacity = interpolate(local, [0, 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const translateY = interpolate(local, [0, 15], [30, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  return (
    <div
      style={{
        position: "absolute",
        bottom: 220,
        left: 60,
        right: 60,
        textAlign: "center",
        opacity,
        translate: `0px ${translateY}px`,
      }}
    >
      <span
        style={{
          fontFamily,
          fontSize: 60,
          fontWeight: 800,
          color: "white",
          lineHeight: 1.35,
          textShadow: "0px 4px 24px rgba(0,0,0,0.55)",
        }}
      >
        {text}
      </span>
    </div>
  );
};
```

- [ ] **Step 2: `src/components/ScreenshotFrame.tsx` 작성**

```tsx
import { Img, staticFile } from "remotion";

export const ScreenshotFrame: React.FC<{ src: string }> = ({ src }) => {
  return (
    <div
      style={{
        position: "absolute",
        top: 160,
        left: 60,
        right: 60,
        bottom: 420,
        borderRadius: 28,
        overflow: "hidden",
        boxShadow: "0px 30px 80px rgba(0,0,0,0.45)",
        border: "6px solid rgba(255,255,255,0.15)",
      }}
    >
      <div style={{ height: 36, background: "#e8e8ec", display: "flex", alignItems: "center", gap: 8, paddingLeft: 16 }}>
        <div style={{ width: 12, height: 12, borderRadius: 6, background: "#ff5f57" }} />
        <div style={{ width: 12, height: 12, borderRadius: 6, background: "#febc2e" }} />
        <div style={{ width: 12, height: 12, borderRadius: 6, background: "#28c840" }} />
      </div>
      <Img src={staticFile(src)} style={{ width: "100%", display: "block" }} />
    </div>
  );
};
```

- [ ] **Step 3: `src/components/ScreenScene.tsx` 작성**

```tsx
import { AbsoluteFill, useCurrentFrame, interpolate, Easing } from "remotion";
import { ScreenshotFrame } from "./ScreenshotFrame";
import { Caption } from "./Caption";

export const ScreenScene: React.FC<{ screenshot: string; caption: string; durationInFrames: number }> = ({
  screenshot,
  caption,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const zoom = interpolate(frame, [0, durationInFrames], [1, 1.06], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.4, 0, 0.2, 1),
  });
  const slideIn = interpolate(frame, [0, 14], [40, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const opacity = interpolate(frame, [0, 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: "#0b0b0f" }}>
      <div style={{ position: "absolute", inset: 0, scale: zoom, translate: `0px ${slideIn}px`, opacity }}>
        <ScreenshotFrame src={screenshot} />
      </div>
      <Caption text={caption} delayFrames={10} />
    </AbsoluteFill>
  );
};
```

- [ ] **Step 4: 렌더 확인 (한 프레임 스틸)**

`src/scenes/Scene2Diagnosis.tsx`가 아직 없으므로, 임시로 `src/Root.tsx`의 기존 blank composition에 `ScreenScene`을 붙여 스틸 렌더로 컴파일 에러가 없는지만 확인한다:

```bash
cd "/Users/leeyunseok/Desktop/Projects/CoSync-intro-video"
npx tsc --noEmit
```

Expected: 타입 에러 없이 종료.

- [ ] **Step 5: Commit**

```bash
cd "/Users/leeyunseok/Desktop/Projects/CoSync-intro-video"
git add src/components
git commit -m "feat: add Caption, ScreenshotFrame, ScreenScene shared components"
```

---

### Task 6: 씬 구현 (6개)

**Files:**
- Create: `src/scenes/Scene1Hook.tsx`
- Create: `src/scenes/Scene2Diagnosis.tsx`
- Create: `src/scenes/Scene3GapReport.tsx`
- Create: `src/scenes/Scene4Consensus.tsx`
- Create: `src/scenes/Scene5Agreement.tsx`
- Create: `src/scenes/Scene6Outro.tsx`

**Interfaces:**
- Consumes: `src/components/ScreenScene.tsx`(Task 5).
- Produces: 각 씬은 프레임 길이가 정해진 독립 컴포넌트 — Task 7의 `IntroVideo`가 이 6개를 순서대로 이어붙인다. 프레임 길이: Scene1=120, Scene2=150, Scene3=150, Scene4=180, Scene5=150, Scene6=150 (합계 900 = 30초 @30fps).

- [ ] **Step 1: `src/scenes/Scene1Hook.tsx` 작성**

```tsx
import { AbsoluteFill, Sequence, useCurrentFrame, interpolate, Easing } from "remotion";
import { loadFont } from "@remotion/google-fonts/NotoSansKR";

const { fontFamily } = loadFont("normal", { weights: ["800", "900"], subsets: ["latin"] });

const LINES = [
  { text: "팀 만들 땐 신났는데...", duration: 35, fontSize: 56 },
  { text: "지분은?", duration: 28, fontSize: 96 },
  { text: "역할은?", duration: 28, fontSize: 96 },
  { text: "그만두면?", duration: 29, fontSize: 96 },
];

const HookLine: React.FC<{ text: string; fontSize: number; durationInFrames: number }> = ({
  text,
  fontSize,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(
    frame,
    [0, 8, durationInFrames - 8, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const scale = interpolate(frame, [0, 10], [0.85, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <div
        style={{
          opacity,
          scale,
          fontFamily,
          fontSize,
          fontWeight: 900,
          color: "white",
          textAlign: "center",
          padding: "0 80px",
          lineHeight: 1.3,
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
};

export const Scene1Hook: React.FC = () => {
  let cursor = 0;
  return (
    <AbsoluteFill style={{ backgroundColor: "#0b0b0f" }}>
      {LINES.map((line) => {
        const from = cursor;
        cursor += line.duration;
        return (
          <Sequence key={line.text} from={from} durationInFrames={line.duration} layout="none">
            <HookLine text={line.text} fontSize={line.fontSize} durationInFrames={line.duration} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
```

- [ ] **Step 2: `src/scenes/Scene2Diagnosis.tsx` 작성**

```tsx
import { ScreenScene } from "../components/ScreenScene";

export const Scene2Diagnosis: React.FC = () => (
  <ScreenScene
    screenshot="screenshots/02-diagnosis.png"
    caption="막연한 약속 대신, 20개 질문으로 먼저 확인하세요"
    durationInFrames={150}
  />
);
```

- [ ] **Step 3: `src/scenes/Scene3GapReport.tsx` 작성**

```tsx
import { ScreenScene } from "../components/ScreenScene";

export const Scene3GapReport: React.FC = () => (
  <ScreenScene
    screenshot="screenshots/03-gap-report.png"
    caption="누가 어디서 다르게 생각하는지 한눈에"
    durationInFrames={150}
  />
);
```

- [ ] **Step 4: `src/scenes/Scene4Consensus.tsx` 작성**

```tsx
import { ScreenScene } from "../components/ScreenScene";

export const Scene4Consensus: React.FC = () => (
  <ScreenScene
    screenshot="screenshots/04-consensus.png"
    caption="차이 나는 부분만, 팀원 전원 합의로 좁혀갑니다"
    durationInFrames={180}
  />
);
```

- [ ] **Step 5: `src/scenes/Scene5Agreement.tsx` 작성**

```tsx
import { ScreenScene } from "../components/ScreenScene";

export const Scene5Agreement: React.FC = () => (
  <ScreenScene
    screenshot="screenshots/05-agreement-document.png"
    caption="합의된 내용은 문서로, 버전까지 관리"
    durationInFrames={150}
  />
);
```

- [ ] **Step 6: `src/scenes/Scene6Outro.tsx` 작성**

```tsx
import { AbsoluteFill, Img, staticFile, useCurrentFrame, interpolate, Easing } from "remotion";
import { loadFont } from "@remotion/google-fonts/NotoSansKR";

const { fontFamily } = loadFont("normal", { weights: ["700", "900"], subsets: ["latin"] });

export const Scene6Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const logoOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const logoScale = interpolate(frame, [0, 20], [0.7, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const textOpacity = interpolate(frame, [20, 35], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: "#0b0b0f", justifyContent: "center", alignItems: "center", flexDirection: "column", gap: 40 }}>
      <Img src={staticFile("logo.png")} style={{ width: 220, opacity: logoOpacity, scale: logoScale }} />
      <div style={{ opacity: textOpacity, fontFamily, fontSize: 44, fontWeight: 800, color: "white", textAlign: "center", padding: "0 90px", lineHeight: 1.4 }}>
        CoSync — 창업은 신뢰가 아니라 실전입니다.
      </div>
    </AbsoluteFill>
  );
};
```

- [ ] **Step 7: 타입 체크**

```bash
cd "/Users/leeyunseok/Desktop/Projects/CoSync-intro-video"
npx tsc --noEmit
```

Expected: 에러 없음.

- [ ] **Step 8: Commit**

```bash
cd "/Users/leeyunseok/Desktop/Projects/CoSync-intro-video"
git add src/scenes
git commit -m "feat: implement 6 scenes (hook, 4 screenshot scenes, outro)"
```

---

### Task 7: Root 컴포지션 조립 + 프레임 검증

**Files:**
- Modify: `src/Root.tsx`
- Create: `src/IntroVideo.tsx`

**Interfaces:**
- Consumes: Task 6의 6개 씬 컴포넌트.
- Produces: `Composition id="CoSyncIntro"`, `durationInFrames=900`, `fps=30`, `width=1080`, `height=1920`.

- [ ] **Step 1: `src/IntroVideo.tsx` 작성**

```tsx
import { AbsoluteFill, Sequence } from "remotion";
import { Scene1Hook } from "./scenes/Scene1Hook";
import { Scene2Diagnosis } from "./scenes/Scene2Diagnosis";
import { Scene3GapReport } from "./scenes/Scene3GapReport";
import { Scene4Consensus } from "./scenes/Scene4Consensus";
import { Scene5Agreement } from "./scenes/Scene5Agreement";
import { Scene6Outro } from "./scenes/Scene6Outro";

const SCENES = [
  { Component: Scene1Hook, duration: 120 },
  { Component: Scene2Diagnosis, duration: 150 },
  { Component: Scene3GapReport, duration: 150 },
  { Component: Scene4Consensus, duration: 180 },
  { Component: Scene5Agreement, duration: 150 },
  { Component: Scene6Outro, duration: 150 },
];

export const IntroVideo: React.FC = () => {
  let cursor = 0;
  return (
    <AbsoluteFill>
      {SCENES.map(({ Component, duration }, i) => {
        const from = cursor;
        cursor += duration;
        return (
          <Sequence key={i} from={from} durationInFrames={duration}>
            <Component />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
```

- [ ] **Step 2: `src/Root.tsx`를 아래로 교체**

```tsx
import { Composition } from "remotion";
import { IntroVideo } from "./IntroVideo";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="CoSyncIntro"
      component={IntroVideo}
      durationInFrames={900}
      fps={30}
      width={1080}
      height={1920}
    />
  );
};
```

- [ ] **Step 3: 씬 경계 스틸 렌더로 검증**

```bash
cd "/Users/leeyunseok/Desktop/Projects/CoSync-intro-video"
mkdir -p out/check
npx remotion still CoSyncIntro out/check/frame-0000.png --frame=0
npx remotion still CoSyncIntro out/check/frame-0150.png --frame=150
npx remotion still CoSyncIntro out/check/frame-0300.png --frame=300
npx remotion still CoSyncIntro out/check/frame-0480.png --frame=480
npx remotion still CoSyncIntro out/check/frame-0630.png --frame=630
npx remotion still CoSyncIntro out/check/frame-0899.png --frame=899
file out/check/*.png
```

Expected: 6개 파일 모두 `PNG image data, 1080 x 1920` 출력, 렌더 에러 없음. 각 프레임이 프레임 0=훅, 150=진단, 300=갭리포트, 480=합의세션, 630=합의서, 899=아웃트로 화면인지 스크린샷을 열어 육안 확인.

- [ ] **Step 4: Commit**

```bash
cd "/Users/leeyunseok/Desktop/Projects/CoSync-intro-video"
git add src/Root.tsx src/IntroVideo.tsx
git commit -m "feat: assemble 30s IntroVideo composition from 6 scenes"
```

---

### Task 8: BGM 선정 및 통합

**Files:**
- Create: `public/audio/bgm.mp3`
- Modify: `src/IntroVideo.tsx`

**Interfaces:**
- Produces: `IntroVideo`에 `@remotion/media`의 `Audio` 컴포넌트로 배경음악 추가, 0.35 볼륨, 마지막 20프레임 페이드아웃.

- [ ] **Step 1: 로열티프리 BGM 후보 2~3개를 사용자에게 제시하고 승인받기**

(에이전트 실행 시: 업비트/유튜브 오디오 라이브러리 등에서 라이선스 문제 없는 업템포 코퍼레이트 트랙 후보 2~3개의 이름/링크/라이선스 조건을 사용자에게 제시. 사용자가 선택하고 다운로드를 명시적으로 승인하면 다음 단계 진행. 승인 없이 다운로드하지 않는다.)

- [ ] **Step 2: 승인된 트랙을 `public/audio/bgm.mp3`로 저장**

```bash
mkdir -p "/Users/leeyunseok/Desktop/Projects/CoSync-intro-video/public/audio"
# 승인된 트랙을 public/audio/bgm.mp3 경로에 저장 (30초 이상, mp3)
```

- [ ] **Step 3: `src/IntroVideo.tsx`에 오디오 추가**

```tsx
import { AbsoluteFill, Sequence, useCurrentFrame, interpolate } from "remotion";
import { Audio } from "@remotion/media";
import { staticFile } from "remotion";
import { Scene1Hook } from "./scenes/Scene1Hook";
import { Scene2Diagnosis } from "./scenes/Scene2Diagnosis";
import { Scene3GapReport } from "./scenes/Scene3GapReport";
import { Scene4Consensus } from "./scenes/Scene4Consensus";
import { Scene5Agreement } from "./scenes/Scene5Agreement";
import { Scene6Outro } from "./scenes/Scene6Outro";

const SCENES = [
  { Component: Scene1Hook, duration: 120 },
  { Component: Scene2Diagnosis, duration: 150 },
  { Component: Scene3GapReport, duration: 150 },
  { Component: Scene4Consensus, duration: 180 },
  { Component: Scene5Agreement, duration: 150 },
  { Component: Scene6Outro, duration: 150 },
];

const TOTAL_DURATION = SCENES.reduce((sum, s) => sum + s.duration, 0);

const BackgroundMusic: React.FC = () => {
  const frame = useCurrentFrame();
  const volume = interpolate(frame, [0, 20, TOTAL_DURATION - 20, TOTAL_DURATION], [0, 0.35, 0.35, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return <Audio src={staticFile("audio/bgm.mp3")} volume={volume} />;
};

export const IntroVideo: React.FC = () => {
  let cursor = 0;
  return (
    <AbsoluteFill>
      {SCENES.map(({ Component, duration }, i) => {
        const from = cursor;
        cursor += duration;
        return (
          <Sequence key={i} from={from} durationInFrames={duration}>
            <Component />
          </Sequence>
        );
      })}
      <BackgroundMusic />
    </AbsoluteFill>
  );
};
```

- [ ] **Step 4: 검증**

```bash
cd "/Users/leeyunseok/Desktop/Projects/CoSync-intro-video"
npx tsc --noEmit
file public/audio/bgm.mp3
```

Expected: 타입 에러 없음, `bgm.mp3`가 `Audio file` 또는 `MPEG ADTS` 등으로 인식됨(0바이트 아님).

- [ ] **Step 5: Commit**

```bash
cd "/Users/leeyunseok/Desktop/Projects/CoSync-intro-video"
git add src/IntroVideo.tsx public/audio/bgm.mp3
git commit -m "feat: add background music with fade in/out"
```

---

### Task 9: 최종 렌더 및 검증

**Files:**
- Create: `out/CoSyncIntro.mp4`

**Interfaces:**
- Consumes: Task 7의 `CoSyncIntro` 컴포지션(오디오 포함, Task 8).

- [ ] **Step 1: 렌더**

```bash
cd "/Users/leeyunseok/Desktop/Projects/CoSync-intro-video"
npx remotion render CoSyncIntro out/CoSyncIntro.mp4
```

Expected: 렌더 진행률 100%까지 에러 없이 완료, `out/CoSyncIntro.mp4` 생성.

- [ ] **Step 2: 해상도/길이/오디오 검증**

```bash
ffprobe -v error -show_entries stream=width,height,codec_type -show_entries format=duration -of default=noprint_wrappers=1 out/CoSyncIntro.mp4
```

Expected: `width=1080`, `height=1920`, 비디오/오디오 스트림 모두 존재, `duration`이 30.0 근처(±0.1초).

- [ ] **Step 3: 최종 확인**

산출물 경로 `~/Desktop/Projects/CoSync-intro-video/out/CoSyncIntro.mp4`를 사용자에게 안내하고, 직접 재생해서 6개 씬/자막/BGM이 의도대로 나오는지 확인받는다. 수정 요청이 있으면 해당 Task로 돌아가 반복.

- [ ] **Step 4: Commit**

```bash
cd "/Users/leeyunseok/Desktop/Projects/CoSync-intro-video"
git add -A
git commit -m "chore: render final CoSync intro video (30s, 1080x1920)"
```

---

## Self-Review Notes

- **Spec coverage**: 파이프라인(에뮬레이터→시딩→캡처→합성→렌더) 전체가 Task 1~9로 매핑됨. 스토리보드 6컷 = Scene1~6. BGM 승인 절차 = Task 8 Step 1. 최종 산출물 경로/해상도 = Task 9.
- **Type consistency**: `ScreenScene`의 props(`screenshot`, `caption`, `durationInFrames`)가 Task 6의 4개 스크린샷 씬에서 동일하게 사용됨. `IntroVideo`의 `SCENES` 배열 duration 합계(120+150+150+180+150+150=900)가 `Root.tsx`의 `durationInFrames={900}`와 일치.
- **범위 밖 이슈 발견**: CoSync 클라이언트(`lib/firebase.ts`)에 에뮬레이터 연결 코드가 전혀 없었음 — 시딩만으로는 화면에 데이터가 보이지 않으므로 Task 1로 추가함(스펙에 없던 내용이지만 파이프라인이 실제로 동작하려면 필수).
