"use client";

import { useState } from "react";
import {
  GoogleAuthProvider,
  linkWithPopup,
  signInWithCredential,
  signInWithPopup,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { track } from "../lib/analytics";

const GoogleMark = () => (
  <svg width="17" height="17" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#4285F4" d="M45.1 24.5c0-1.6-.1-3.2-.4-4.7H24v8.9h11.8c-.5 2.7-2 5-4.4 6.6v5.5h7.1c4.1-3.8 6.6-9.4 6.6-16.3z"/>
    <path fill="#34A853" d="M24 46c5.9 0 10.9-2 14.5-5.2l-7.1-5.5c-2 1.3-4.5 2.1-7.4 2.1-5.7 0-10.5-3.8-12.2-9H4.5v5.7C8.1 41.2 15.4 46 24 46z"/>
    <path fill="#FBBC05" d="M11.8 28.4c-.4-1.3-.7-2.7-.7-4.4s.3-3.1.7-4.4v-5.7H4.5C2.9 17.1 2 20.4 2 24s.9 6.9 2.5 10.1l7.3-5.7z"/>
    <path fill="#EA4335" d="M24 11.4c3.2 0 6.1 1.1 8.4 3.3l6.3-6.3C34.9 4.8 29.9 2.7 24 2.7 15.4 2.7 8.1 7.5 4.5 14.9l7.3 5.7c1.7-5.2 6.5-9.2 12.2-9.2z"/>
  </svg>
);

/**
 * 구글 계정으로 가입·로그인.
 *
 * 익명 세션이면 linkWithPopup으로 같은 uid에 붙인다(승격) — 그동안 쌓인 답변·팀이 따라온다.
 * 그 구글 계정으로 이미 가입한 적이 있으면 붙일 수 없으므로, 기존 계정으로 로그인시키고
 * 방금 답변은 따라가지 못했다고 알린다. 두 계정의 답을 병합하면 "내 답이 왜 바뀌었지"가 된다.
 */
export function GoogleAuthButton({ label = "Google로 계속하기" }: { label?: string }) {
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const run = async () => {
    setError("");
    setNotice("");
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const current = auth.currentUser;
      let uid: string;
      let displayName: string | null = null;
      let email: string | null = null;
      // setNotice 직후엔 state가 아직 갱신되지 않는다. 이동 여부는 지역 변수로 판단한다.
      let stayForNotice = false;

      if (current?.isAnonymous) {
        try {
          const res = await linkWithPopup(current, provider);
          uid = res.user.uid;
          displayName = res.user.displayName;
          email = res.user.email;
          track("signup_completed", { path: "linked_google" });
        } catch (e) {
          const code = (e as { code?: string })?.code;
          if (code !== "auth/credential-already-in-use") throw e;
          // 이미 가입된 구글 계정이다. 익명 uid는 버리고 그 계정으로 들어간다.
          const cred = GoogleAuthProvider.credentialFromError(e as never);
          if (!cred) throw e;
          const res = await signInWithCredential(auth, cred);
          uid = res.user.uid;
          displayName = res.user.displayName;
          email = res.user.email;
          setNotice("이미 가입된 계정으로 들어왔어요. 방금 답변은 이 계정에 저장되지 않았어요.");
          stayForNotice = true;
          track("signup_completed", { path: "google_existing" });
        }
      } else {
        const res = await signInWithPopup(auth, provider);
        uid = res.user.uid;
        displayName = res.user.displayName;
        email = res.user.email;
        track("signup_completed", { path: "google" });
      }

      // 처음 들어온 계정이면 프로필을 만든다. 있으면 건드리지 않는다.
      const ref = doc(db, "users", uid);
      if (!(await getDoc(ref)).exists()) {
        await setDoc(ref, {
          name: displayName || "",
          email: email || "",
          teamIds: [],
          plan: "free",
          subscriptionStatus: "expired",
          createdAt: serverTimestamp(),
        }, { merge: true });
      }

      // 안내가 있으면 읽고 직접 넘어가게 둔다.
      if (stayForNotice) return;
      window.location.href = "/workspace";
    } catch (e) {
      const code = (e as { code?: string })?.code;
      if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") {
        // 사용자가 닫은 것이므로 오류로 다루지 않는다.
      } else if (code === "auth/operation-not-allowed") {
        setError("구글 로그인이 아직 켜져 있지 않아요. 잠시 후 다시 시도해주세요.");
      } else {
        setError("구글 로그인에 실패했어요. 잠시 후 다시 시도해주세요.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={run}
        disabled={loading}
        style={{
          width: "100%", display: "inline-flex", alignItems: "center", justifyContent: "center",
          gap: 8, minHeight: 48, padding: "0 16px", borderRadius: 12,
          border: "1px solid #dadce0", background: "#fff", color: "#1f2430",
          fontSize: 14.5, fontWeight: 700, cursor: loading ? "default" : "pointer",
        }}
      >
        <GoogleMark />
        {loading ? "연결 중..." : label}
      </button>
      {notice && (
        <div style={{ marginTop: 10, fontSize: 12.5, color: "#475569", lineHeight: 1.6, wordBreak: "keep-all", textAlign: "center" }}>
          {notice}
          <div style={{ marginTop: 8 }}>
            <a href="/workspace" className="btn btn-primary" style={{ display: "inline-flex" }}>대시보드로 가기</a>
          </div>
        </div>
      )}
      {error && <div className="error-text" style={{ marginTop: 8 }}>{error}</div>}
    </>
  );
}
