"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../lib/firebase";
import { Footer } from "../../components/Footer";
import { GoogleAuthButton } from "../../components/GoogleAuthButton";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      // 로그인은 인증만 수행한다. 익명(비로그인) 진단 상태를 계정에 기록하지 않는다.
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/workspace");
    } catch (err) {
      const code = (err as { code?: string })?.code;
      if (code === "auth/invalid-credential" || code === "auth/wrong-password") {
        setError("이메일 또는 비밀번호가 올바르지 않습니다.");
      } else if (code === "auth/user-not-found") {
        setError("등록되지 않은 계정입니다. 회원가입을 진행해주세요.");
      } else if (code === "auth/too-many-requests") {
        setError("로그인이 일시적으로 제한되었습니다. 잠시 후 다시 시도해주세요.");
      } else {
        setError("로그인에 실패했습니다. 잠시 후 다시 시도해주세요.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="page auth-page login-page">
      <section className="center-card auth-card">
        <Link className="back-arrow auth-back" href="/">
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none">
            <path d="M14.75 5.75 8.5 12l6.25 6.25" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Link>
        <h1>로그인</h1>
        <p className="auth-sub">
          반가워요! 다시 팀 합의를 시작해볼까요?
          <br />
          아직 계정이 없으신가요? <Link href="/register">회원가입</Link>
        </p>

        <GoogleAuthButton label="Google로 로그인" />
        <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "18px 0" }}>
          <span style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
          <span style={{ fontSize: 12, color: "#94a3b8" }}>또는 이메일로 로그인</span>
          <span style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
        </div>

        <form className="form-grid" onSubmit={(e) => { e.preventDefault(); handleLogin(); }}>
          <label className="label" htmlFor="email-input">이메일 주소</label>
          <div className="password-row">
            <input
              id="email-input"
              className="input"
              placeholder="example@cosync.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>

          <label className="label" htmlFor="password-input">비밀번호</label>
          <div className="password-row">
            <input
              id="password-input"
              className="input"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <button
              className="eye-btn"
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 표시"}
            >
              {showPassword ? (
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="M3 12s3.6-6 9-6 9 6 9 6-3.6 6-9 6-9-6-9-6Zm9 4a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7.5-9.5 15 11"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="M3 12s3.6-6 9-6 9 6 9 6-3.6 6-9 6-9-6-9-6Zm9 4a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </button>
          </div>

          {error && <div className="error-text">{error}</div>}

        <button className="btn btn-primary full" type="submit" disabled={loading}>
          {loading ? "로그인 중..." : "로그인하기 →"}
        </button>
        </form>
      </section>
      <Footer />
    </main>
  );
}
