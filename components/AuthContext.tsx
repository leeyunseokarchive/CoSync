"use client";

import { onAuthStateChanged, signInAnonymously, User } from "firebase/auth";
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { auth } from "../lib/firebase";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  /** 익명 세션이면 true. 진짜 계정이 필요한 지점에서만 확인한다. */
  isGuest: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  // StrictMode의 이중 실행과 onAuthStateChanged 재호출로 익명 로그인이 겹치지 않게 막는다.
  const signingIn = useRef(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (nextUser) => {
      if (nextUser) {
        setUser(nextUser);
        setLoading(false);
        signingIn.current = false;
        return;
      }
      // 로그인하지 않은 방문자에게 익명 uid를 발급한다. firestore.rules는 전부
      // request.auth != null 만 보므로 익명 세션도 진짜 계정과 똑같이 통과한다.
      // 덕분에 진단 답변·팀·초대코드가 가입 전에도 그대로 저장된다.
      // 나중에 register/login에서 linkWithCredential로 붙이면 uid가 유지돼 데이터가 따라온다.
      if (signingIn.current) return;
      signingIn.current = true;
      try {
        await signInAnonymously(auth);
        // 성공하면 onAuthStateChanged가 다시 불려 위 분기에서 처리된다.
      } catch (e) {
        // 익명 로그인이 막힌 환경(콘솔에서 비활성화 등)에서도 앱은 계속 돌아야 한다.
        // user는 null로 남고, 기존의 "로그인 필요" 경로가 그대로 동작한다.
        console.error("익명 로그인 실패", e);
        signingIn.current = false;
        setUser(null);
        setLoading(false);
      }
    });
    return () => unsub();
  }, []);

  const value = useMemo(
    () => ({ user, loading, isGuest: Boolean(user?.isAnonymous) }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider.");
  }
  return ctx;
}
