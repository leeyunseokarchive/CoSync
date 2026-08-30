import { arrayUnion, doc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "./firebase";
import type { OnboardingAnswers } from "./gap";

// ponytail: 이력을 문서 안 배열에 쌓는다. 엔트리당 약 1KB, Firestore 문서 한도는 1MB라
// 대략 1,000회에서 쓰기가 막힌다. 한 사람이 그만큼 다시 진단할 일은 없어서 그대로 둔다.
// 한도에 닿으면 members/{uid}/history 서브컬렉션으로 옮긴다.
const entryOf = (answers: OnboardingAnswers, progress: number) => ({
  answeredAt: new Date().toISOString(),
  answers,
  progress,
});

export async function appendDiagnosisHistory(
  teamId: string,
  userId: string,
  answers: OnboardingAnswers,
  progress: number
) {
  await updateDoc(doc(db, "teams", teamId, "members", userId), {
    diagnosisHistory: arrayUnion(entryOf(answers, progress)),
  });
}

/**
 * 팀이 없을 때의 이력. 팀 멤버 문서가 없으므로 users/{uid}에 쌓는다.
 * 팀을 만들기 전에 여러 번 풀어보는 사람의 변화가 그동안 통째로 사라지고 있었다.
 */
export async function appendSoloHistory(
  userId: string,
  answers: OnboardingAnswers,
  progress: number
) {
  // 익명 사용자는 users/{uid} 문서가 아직 없다. updateDoc은 없는 문서에 실패하므로
  // merge로 만들면서 쓴다. rules의 create 조건은 plan 기본값 'free'로 통과한다.
  await setDoc(doc(db, "users", userId), {
    soloHistory: arrayUnion(entryOf(answers, progress)),
  }, { merge: true });
}
