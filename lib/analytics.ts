"use client";

import { getApps } from "firebase/app";
import type { Analytics } from "firebase/analytics";

/**
 * 퍼널 계측.
 *
 * measurementId(G-XXXXXXXXXX)는 Firebase 콘솔에서 Google Analytics를 연결해야 나온다.
 * 아직 없으므로 값이 비어 있으면 조용히 아무것도 하지 않는다 — 나중에 환경변수만
 * 채우면 코드 변경 없이 켜진다.
 *
 * 지금 Firestore에 남는 건 결과물뿐이라 "3번 문항에서 나갔다" 같은 건 알 방법이 없다.
 * 여기서 재려는 건 오직 이탈 지점이다.
 */
// firebaseConfig에 들어간 값과 같다. 환경변수는 덮어쓰기용으로만 남긴다.
const MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID ?? "G-YPY0078KFL";

// 계측 하나 때문에 화면이 멈추면 안 된다. 전부 실패해도 조용히 넘어간다.
let analyticsPromise: Promise<Analytics | null> | null = null;

async function getAnalyticsOnce(): Promise<Analytics | null> {
  if (!MEASUREMENT_ID || typeof window === "undefined") return null;
  if (!analyticsPromise) {
    analyticsPromise = (async () => {
      try {
        const mod = await import("firebase/analytics");
        if (!(await mod.isSupported())) return null;
        const app = getApps()[0];
        return app ? mod.getAnalytics(app) : null;
      } catch {
        return null;
      }
    })();
  }
  return analyticsPromise;
}

/** 퍼널 지점. 이름을 자유롭게 만들면 대시보드에서 못 찾는다. */
export type FunnelEvent =
  | "diagnosis_start"        // 진단 첫 문항 진입
  | "diagnosis_basic_done"   // 기본 12문항 완료
  | "diagnosis_deep_done"    // 심화 Q13~Q20 완료
  | "gap_report_view"        // 갭 리포트 도달
  | "team_created"           // 팀 생성
  | "invite_sent"            // 초대 링크 공유·복사
  | "invite_opened"          // 초대 링크로 착지
  | "invite_accepted"        // 초대 수락(팀 참가)
  | "signup_completed";      // 가입 완료

export async function track(event: FunnelEvent, params?: Record<string, string | number | boolean>) {
  const analytics = await getAnalyticsOnce();
  if (!analytics) return;
  try {
    const { logEvent } = await import("firebase/analytics");
    logEvent(analytics, event, params);
  } catch {
    // 광고 차단기 등으로 막히는 경우가 흔하다. 무시한다.
  }
}

/** navigator.share는 TS DOM 타입상 항상 정의된 것으로 되어 있어 truthiness 검사가 안 먹는다. */
export const canShare = () =>
  typeof navigator !== "undefined" && typeof navigator.share === "function";
