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

  const resolved: Record<string, { option: "1"; source: "match"; text?: string }> = Object.fromEntries(
    QUESTION_CONFIGS.map((q) => [q.field, { option: "1" as const, source: "match" as const }])
  );
  // 템플릿에 빈칸([ ])이 있는 6개 필드는 데모용 실제 값으로 채워 넣는다.
  resolved.extraWorkPriority = {
    option: "1",
    source: "match",
    text: "담당이 정해지지 않은 업무가 발생한 경우, 이를 발견한 사람이 우선 직접 처리하되 24시간 이내에 처리 결과를 팀에 공유하기로 한다.",
  };
  resolved.extraWorkPrinciple = {
    option: "1",
    source: "match",
    text: "초기 3개월 동안은 업무 외 시간의 협업 요청에도 적극적으로 대응하는 것을 원칙으로 한다.",
  };
  resolved.exitDisputeResolution = {
    option: "1",
    source: "match",
    text: "구성원 이탈 시 지분 정리는 등기된 지분을 그대로 인정하는 것을 원칙으로 한다. 다만 중대한 귀책 사유가 있는 경우에는 예외로 한다.",
  };
  resolved.pivotCriteria = {
    option: "1",
    source: "match",
    text: "사업 방향 전환(피벗) 또는 중단 논의는 런웨이 3개월 이하가 되는 시점에 시작하기로 한다.",
  };
  resolved.deadlockTolerance = {
    option: "1",
    source: "match",
    text: "의견이 교착 상태에 이른 경우, 7일 이내에 해당 안건 담당 영역 책임자의 결정을 존중하기로 한다.",
  };
  resolved.profitDistribution = {
    option: "1",
    source: "match",
    text: "흑자 전환 시 이익은 전액 재투자하는 것을 원칙으로 하되, 창업자 최소 생계비로 300만 원은 우선 지급한다.",
  };
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
