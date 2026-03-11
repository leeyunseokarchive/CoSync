"use client";

import Link from "next/link";
import { useState } from "react";
import { useAppState } from "../../components/AppState";
import { Footer } from "../../components/Footer";

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const { setIsAuthed } = useAppState();
  return (
    <main className="page auth-page">
      <div className="container">
        <Link className="back-arrow" href="/login">
          ←
        </Link>
      </div>
      <section className="center-card auth-card">
        <h1>회원가입</h1>
        <p className="auth-sub">
          이미 계정이 있으신가요? <Link href="/login">로그인</Link>
        </p>

        <div className="form-grid">
          <label className="label">이름</label>
          <input className="input" placeholder="성함을 입력하세요" />

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
          <div className="hint">✓ 최소 8자 이상, 영문/숫자 포함</div>

          <label className="label">비밀번호 확인</label>
          <div className="password-row">
            <input
              className="input"
              type={showConfirm ? "text" : "password"}
              placeholder="••••••••"
            />
            <button
              className="eye-btn"
              type="button"
              onClick={() => setShowConfirm((prev) => !prev)}
              aria-label={showConfirm ? "비밀번호 숨기기" : "비밀번호 표시"}
            >
              {showConfirm ? (
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

          <label className="checkbox-row">
            <input type="checkbox" />
            <span>
              <em className="req">(필수)</em> 서비스 이용약관에 동의합니다.
            </span>
          </label>
          <label className="checkbox-row">
            <input type="checkbox" />
            <span>
              <em className="req">(필수)</em> 개인정보 수집 및 이용에 동의합니다.
            </span>
          </label>
        </div>

        <Link
          className="btn btn-primary full"
          href="/workspace"
          onClick={() => setIsAuthed(true)}
        >
          계정 만들기 →
        </Link>
      </section>
      <Footer />
    </main>
  );
}
