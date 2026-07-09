"use server";

import { adminDb } from "../../lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export async function confirmAgreementServer(teamId: string, agreementId: string, uid: string) {
  if (!teamId || !agreementId || !uid) {
    throw new Error("Missing parameters");
  }

  try {
    await adminDb.runTransaction(async (tx: any) => {
      // 1. Get real team members
      const teamRef = adminDb.collection("teams").doc(teamId);
      const teamDoc = await tx.get(teamRef);
      if (!teamDoc.exists) throw new Error("Team not found");
      const memberUids: string[] = teamDoc.data()?.members || [];

      if (!memberUids.includes(uid)) {
        throw new Error("User is not a member of this team");
      }

      // 2. Update agreement
      const agreementRef = adminDb.collection("teams").doc(teamId).collection("agreements").doc(agreementId);
      const snap = await tx.get(agreementRef);
      if (!snap.exists) throw new Error("Agreement not found");

      const cur = snap.data() || {};
      const confirmed = new Set(Object.keys(cur.confirmations || {}));
      confirmed.add(uid);
      
      const allConfirmed = memberUids.every((m) => confirmed.has(m));
      
      tx.update(agreementRef, {
        [`confirmations.${uid}`]: FieldValue.serverTimestamp(),
        ...(allConfirmed ? { status: "confirmed" } : {}),
      });
    });
    return { success: true };
  } catch (error) {
    console.error("Error confirming agreement:", error);
    throw new Error("합의안 확정 중 오류가 발생했습니다.");
  }
}
