"use client";

import Link from "next/link";
import { useState } from "react";
import { useAppState } from "../../components/AppState";
import { Footer } from "../../components/Footer";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const { setIsAuthed } = useAppState();
  return (
    <main className="page auth-page">
      <div className="container">
        <Link className="back-arrow" href="/onboarding/diagnosis">
          ←
        </Link>
      </div>
      <section className="center-card auth-card">
        <h1>로그인</h1>
        <p className="auth-sub">
          반가워요! 다시 팀 합의를 시작해볼까요?
          <br />
          아직 계정이 없으신가요? <Link href="/register">회원가입</Link>
        </p>

        <div className="form-grid">
          <label className="label">이메일 주소</label>
          <input className="input" placeholder="example@cosync.com" />

          <label className="label">비밀번호</label>
          <div className="password-row">
            <input
              className="input"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
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
          <div className="right-link">비밀번호를 잊으셨나요?</div>
        </div>

        <Link
          className="btn btn-primary full"
          href="/workspace"
          onClick={() => setIsAuthed(true)}
        >
          로그인하기 →
        </Link>
        <div className="auth-footer">
          계정 정보를 잊으셨나요? <strong>계정 찾기</strong>
        </div>
      </section>
      <Footer />
    </main>
  );
}
