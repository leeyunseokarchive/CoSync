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

