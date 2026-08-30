import type { FirestoreError } from "firebase/firestore";

/**
 * onSnapshot 에러 핸들러.
 *
 * 로그아웃하면 토큰이 먼저 사라지고 리스너 해제는 그다음이라, 그 사이에 서버가
 * permission-denied를 돌려준다. 실제 권한 문제가 아니라 정상적인 종료 순서인데
 * console.error로 찍으면 개발 오버레이가 빨갛게 뜬다. 그것만 걸러낸다.
 */
export const onListenError = (label: string) => (err: FirestoreError) => {
  if (err.code === "permission-denied") return;
  console.error(`${label} listen error:`, err);
};
