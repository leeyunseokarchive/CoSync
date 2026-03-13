"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "../../lib/firebase";
import { Footer } from "../../components/Footer";
import { useAppState } from "../../components/AppState";

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { department, role, progress } = useAppState();

  const handleRegister = async () => {
    if (!name || !email || !password) {
      setError("필수 항목을 모두 입력해주세요.");
      return;
    }
    if (password !== confirm) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: name });
      await setDoc(doc(db, "users", cred.user.uid), {
        name,
        email,
        department,
        role,
        onboardingProgress: progress,
        teamIds: [],
        createdAt: serverTimestamp()
      });
      router.push("/workspace");
    } catch (err) {
      const code = (err as { code?: string })?.code;
      if (code === "auth/email-already-in-use") {
        setError("이미 사용 중인 이메일입니다. 로그인해 주세요.");
      } else if (code === "auth/invalid-email") {
        setError("이메일 형식이 올바르지 않습니다.");
      } else if (code === "auth/weak-password") {
        setError("비밀번호가 너무 약합니다. 8자 이상으로 설정해주세요.");
      } else {
        setError("회원가입에 실패했습니다. 다시 시도해주세요.");
      }
    } finally {
      setLoading(false);
    }
  };

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
          <input
            className="input"
            placeholder="성함을 입력하세요"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />

          <label className="label">이메일 주소</label>
          <input
            className="input"
            placeholder="example@cosync.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />

          <label className="label">비밀번호</label>
          <div className="password-row">
            <input
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
          <div className="hint">✓ 최소 8자 이상, 영문/숫자 포함</div>

          <label className="label">비밀번호 확인</label>
          <div className="password-row">
            <input
              className="input"
              type={showConfirm ? "text" : "password"}
              placeholder="••••••••"
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
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

          {error && <div className="error-text">{error}</div>}

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

        <button className="btn btn-primary full" type="button" onClick={handleRegister} disabled={loading}>
          {loading ? "계정 생성 중..." : "계정 만들기 →"}
        </button>
      </section>
      <Footer />
    </main>
  );
}
