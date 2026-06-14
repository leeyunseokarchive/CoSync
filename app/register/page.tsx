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
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
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
    if (!agreeTerms || !agreePrivacy) {
      setError("필수 약관에 모두 동의해주세요.");
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
      <section className="center-card auth-card">
        <Link className="back-arrow auth-back" href="/login">
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none">
            <path d="M14.75 5.75 8.5 12l6.25 6.25" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Link>
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
            <input
              type="checkbox"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
            />
            <span>
              <em className="req">(필수)</em>{" "}
              <button type="button" className="terms-link" onClick={() => setShowTermsModal(true)}>서비스 이용약관</button>에 동의합니다.
            </span>
          </label>
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={agreePrivacy}
              onChange={(e) => setAgreePrivacy(e.target.checked)}
            />
            <span>
              <em className="req">(필수)</em>{" "}
              <button type="button" className="terms-link" onClick={() => setShowPrivacyModal(true)}>개인정보 수집 및 이용</button>에 동의합니다.
            </span>
          </label>
        </div>

        <button className="btn btn-primary full" type="button" onClick={handleRegister} disabled={loading}>
          {loading ? "계정 생성 중..." : "계정 만들기 →"}
        </button>
      </section>
      <Footer />

      {showTermsModal && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-card" style={{ maxWidth: 560 }}>
            <div className="modal-top">
              <h2 style={{ fontSize: 17, fontWeight: 700 }}>서비스 이용약관</h2>
              <button className="close" type="button" onClick={() => setShowTermsModal(false)}>✕</button>
            </div>
            <div style={{ overflowY: "auto", maxHeight: "60vh", fontSize: 13, lineHeight: 1.8, color: "var(--text-2)", paddingRight: 4 }}>
              <p style={{ marginBottom: 12 }}>본 약관은 CoSync(이하 "회사")이 제공하는 공동창업자 정렬 진단 서비스(이하 "서비스")의 이용 조건 및 절차를 규정합니다.</p>

              <strong>제1조 (서비스 이용)</strong>
              <p>① 서비스는 만 19세 이상을 대상으로 합니다.<br />
              ② 회원가입 시 정확한 정보를 입력해야 하며, 타인의 정보를 도용하는 행위는 금지됩니다.<br />
              ③ 회사는 서비스의 전부 또는 일부를 사전 통지 후 변경하거나 중단할 수 있습니다.</p>

              <strong>제2조 (회원의 의무)</strong>
              <p>① 계정 정보를 안전하게 관리해야 하며, 타인과 공유해서는 안 됩니다.<br />
              ② 서비스를 이용해 타인의 권리를 침해하거나 불법적인 행위를 할 수 없습니다.<br />
              ③ 진단 응답 데이터는 서비스 개선 및 알고리즘 고도화 목적으로 익명 처리 후 활용될 수 있습니다.</p>

              <strong>제3조 (지식재산권)</strong>
              <p>서비스 내 콘텐츠, 알고리즘, UI/UX 등 모든 지식재산권은 회사에 귀속됩니다.</p>

              <strong>제4조 (면책조항)</strong>
              <p>① 회사는 천재지변, 서비스 장애 등 불가항력적 사유로 인한 손해에 대해 책임지지 않습니다.<br />
              ② 서비스의 진단 결과는 참고 목적으로만 활용되어야 하며, 이를 근거로 한 의사결정의 결과에 대해 회사는 법적 책임을 지지 않습니다.</p>

              <strong>제5조 (분쟁 해결)</strong>
              <p>본 약관과 관련한 분쟁은 대한민국 법률에 따르며, 관할 법원은 서울중앙지방법원으로 합니다.</p>

              <p style={{ marginTop: 16, color: "var(--text-3)" }}>시행일: 2026년 1월 1일</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" type="button" onClick={() => { setAgreeTerms(true); setShowTermsModal(false); }}>동의하고 닫기</button>
            </div>
          </div>
        </div>
      )}

      {showPrivacyModal && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-card" style={{ maxWidth: 560 }}>
            <div className="modal-top">
              <h2 style={{ fontSize: 17, fontWeight: 700 }}>개인정보 수집 및 이용 동의</h2>
              <button className="close" type="button" onClick={() => setShowPrivacyModal(false)}>✕</button>
            </div>
            <div style={{ overflowY: "auto", maxHeight: "60vh", fontSize: 13, lineHeight: 1.8, color: "var(--text-2)", paddingRight: 4 }}>
              <strong>1. 수집하는 개인정보 항목</strong>
              <p>· 필수: 이름, 이메일 주소, 비밀번호<br />
              · 서비스 이용 중 생성: 진단 응답 데이터, 팀 정보, 서비스 이용 기록</p>

              <strong>2. 수집 및 이용 목적</strong>
              <p>· 회원 식별 및 서비스 제공<br />
              · 공동창업자 정렬 진단 결과 분석 및 갭 리포트 생성<br />
              · 서비스 개선 및 알고리즘 고도화 (익명 처리 후 활용)<br />
              · 고객 문의 대응</p>

              <strong>3. 보유 및 이용 기간</strong>
              <p>회원 탈퇴 시까지 보유 후 즉시 파기합니다. 단, 관련 법령에 따라 보존이 필요한 경우 해당 기간 동안 보관합니다.<br />
              · 전자상거래법에 따른 계약/청약철회 기록: 5년<br />
              · 소비자 불만 및 분쟁 처리 기록: 3년</p>

              <strong>4. 개인정보의 제3자 제공</strong>
              <p>회사는 원칙적으로 이용자의 개인정보를 외부에 제공하지 않습니다. 다만, 이용자가 사전에 동의한 경우 또는 법령에 의거한 경우에는 예외로 합니다.</p>

              <strong>5. 동의 거부 권리 및 불이익</strong>
              <p>귀하는 개인정보 수집·이용에 동의하지 않을 권리가 있습니다. 단, 동의 거부 시 서비스 이용이 제한됩니다.</p>

              <strong>6. 개인정보 처리 문의</strong>
              <p>개인정보와 관련한 문의는 아래로 연락해 주세요.<br />
              · 이메일: privacy@cosync.kr</p>

              <p style={{ marginTop: 16, color: "var(--text-3)" }}>시행일: 2026년 1월 1일</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" type="button" onClick={() => { setAgreePrivacy(true); setShowPrivacyModal(false); }}>동의하고 닫기</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
