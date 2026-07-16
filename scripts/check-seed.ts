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
