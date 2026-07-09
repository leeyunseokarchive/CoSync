"use server";

import { adminDb } from "../../lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export async function joinTeam(userId: string, teamId: string, inviteCode: string) {
  if (!userId || !teamId || !inviteCode) {
    throw new Error("Missing required parameters");
  }

  // 1. Verify invite code
  const inviteCodeDoc = await adminDb.collection("inviteCodes").doc(inviteCode).get();

  if (!inviteCodeDoc.exists || inviteCodeDoc.data()?.teamId !== teamId) {
    throw new Error("유효하지 않은 초대 코드입니다.");
  }

  // 2. Perform transaction to add user to team and update user profile
  try {
    await adminDb.runTransaction(async (transaction: any) => {
      const teamRef = adminDb.collection("teams").doc(teamId);
      const userRef = adminDb.collection("users").doc(userId);

      const teamDoc = await transaction.get(teamRef);
      if (!teamDoc.exists) {
        throw new Error("팀을 찾을 수 없습니다.");
      }

      transaction.update(teamRef, {
        members: FieldValue.arrayUnion(userId),
      });

      transaction.update(userRef, {
        teamIds: FieldValue.arrayUnion(teamId),
        lastActiveTeamId: teamId,
      });
    });
    return { success: true };
  } catch (error) {
    console.error("Error joining team:", error);
    throw new Error("팀 가입 중 오류가 발생했습니다.");
  }
}
