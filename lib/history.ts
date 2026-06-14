import { arrayUnion, doc, updateDoc } from "firebase/firestore";
import { db } from "./firebase";
import type { OnboardingAnswers } from "./gap";

export async function appendDiagnosisHistory(
  teamId: string,
  userId: string,
  answers: OnboardingAnswers,
  progress: number
) {
  const entry = {
    answeredAt: new Date().toISOString(),
    answers,
    progress,
  };
  await updateDoc(doc(db, "teams", teamId, "members", userId), {
    diagnosisHistory: arrayUnion(entry),
  });
}
