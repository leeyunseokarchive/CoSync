"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { EmailAuthProvider, createUserWithEmailAndPassword, linkWithCredential, updateProfile } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "../../lib/firebase";
import { Footer } from "../../components/Footer";
import { useAppState } from "../../components/AppState";
import { track } from "../../lib/analytics";

const TOTAL_STEPS = 5;

const EyeOpen = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M3 12s3.6-6 9-6 9 6 9 6-3.6 6-9 6-9-6-9-6Zm9 4a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const EyeClosed = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M3 12s3.6-6 9-6 9 6 9 6-3.6 6-9 6-9-6-9-6Zm9 4a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7.5-9.5 15 11" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [fromDiagnosis, setFromDiagnosis] = useState(false);
  const { department, role, progress } = useAppState();

  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("cosync-pending-save")) {
      setFromDiagnosis(true);
    }
  }, []);

  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setError("");
    const refs: Record<number, React.RefObject<HTMLInputElement | null>> = {
      1: nameRef, 2: emailRef, 3: passwordRef, 4: confirmRef,
    };
    const timer = setTimeout(() => refs[step]?.current?.focus(), 60);
    return () => clearTimeout(timer);
  }, [step]);

  const validate = (): boolean => {
    if (step === 1 && !name.trim()) { setError("이름을 입력해주세요."); return false; }
    if (step === 2) {
      if (!email.trim()) { setError("이메일을 입력해주세요."); return false; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError("올바른 이메일 형식이 아닙니다."); return false; }
    }
    if (step === 3 && password.length < 8) { setError("비밀번호는 8자 이상이어야 합니다."); return false; }
    if (step === 4 && password !== confirm) { setError("비밀번호가 일치하지 않습니다."); return false; }
    return true;
  };

  const goNext = () => {
    if (validate()) { setError(""); setStep(s => s + 1); }
  };

  const goBack = () => {
    setError("");
    setStep(s => s - 1);
  };

  const handleRegister = async () => {
    if (!agreeTerms || !agreePrivacy) { setError("필수 약관에 모두 동의해주세요."); return; }
    setLoading(true);
    setError("");
    try {
      const profileData = {
        name,
        email,
        department,
        role,
        onboardingProgress: progress,
        teamIds: [],
        plan: "free",
        subscriptionStatus: "expired",
        createdAt: serverTimestamp(),
      };
      // 이전 시도에서 계정은 생성됐지만 프로필 저장에 실패한 경우 복구
      const current = auth.currentUser;
      if (current && current.email === email) {
        const ref = doc(db, "users", current.uid);
        if (!(await getDoc(ref)).exists()) {
          await setDoc(ref, profileData);
        }
        track("signup_completed", { path: "recover" });
        router.push("/workspace");
        return;
      }
      // 익명 세션이면 새 계정을 만들지 않고 그 uid에 이메일을 붙인다(승격).
      // uid가 유지되므로 가입 전에 푼 진단 답변, 만든 팀, 발급한 초대코드가 그대로 따라온다.
      // 새로 createUser를 하면 uid가 바뀌어 그동안 쌓인 게 전부 고아가 된다.
      if (current?.isAnonymous) {
        const linked = await linkWithCredential(current, EmailAuthProvider.credential(email, password));
        await updateProfile(linked.user, { displayName: name });
        const ref = doc(db, "users", linked.user.uid);
        const snap = await getDoc(ref);
        // 익명일 때 이미 쌓인 필드(soloAnswers, teamIds 등)를 덮지 않는다.
        await setDoc(ref, snap.exists() ? { ...profileData, teamIds: snap.data().teamIds ?? [] } : profileData, { merge: true });
        track("signup_completed", { path: "linked_anonymous" });
        router.push("/workspace");
        return;
      }
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: name });
      await setDoc(doc(db, "users", cred.user.uid), profileData);
      track("signup_completed", { path: "new" });
      router.push("/workspace");
    } catch (err) {
      const code = (err as { code?: string })?.code;
      // credential-already-in-use: 익명 세션에 이미 가입된 이메일을 붙이려 한 경우
      if (code === "auth/email-already-in-use" || code === "auth/credential-already-in-use") {
        setError("이미 사용 중인 이메일입니다. 로그인해 주세요.");
      } else if (code === "auth/invalid-email") {
        setError("이메일 형식이 올바르지 않습니다.");
        setStep(2);
      } else if (code === "auth/weak-password") {
        setError("비밀번호가 너무 약합니다. 8자 이상으로 설정해주세요.");
        setStep(3);
      } else {
        setError("회원가입에 실패했습니다. 다시 시도해주세요.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="page auth-page">
      <section className="center-card auth-card wizard-card">
        <div className="wizard-header">
          {step > 1 ? (
            <button className="wizard-back-btn" type="button" onClick={goBack} aria-label="이전 단계">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
                <path d="M14.75 5.75 8.5 12l6.25 6.25" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          ) : (
            <Link className="wizard-back-btn" href="/login" aria-label="로그인으로 이동">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
                <path d="M14.75 5.75 8.5 12l6.25 6.25" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
          )}
          <div className="wizard-progress">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <div
                key={i}
                className={`wizard-dot${i + 1 < step ? " done" : ""}${i + 1 === step ? " active" : ""}`}
              />
            ))}
          </div>
          <div className="wizard-spacer" />
        </div>

        <div className="wizard-body" key={step}>
        <form onSubmit={e => { e.preventDefault(); goNext(); }}>
          {step === 1 && (
            <>
              {/* 진단을 마치고 넘어온 사람에겐 "왜 저장해야 하는지"가 먼저다.
                  "진단 결과를 저장하고 팀원을 초대하세요"는 지시일 뿐 이유가 아니었다.
                  팀원 얘기는 넣지 않는다 — 이 화면은 진단 직후(팀 없음)와 초대 후
                  두 경로에서 들어오는데, 전자에선 팀원이 뜬금없이 나온다. */}
              {fromDiagnosis && (
                <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, padding: "14px 16px", marginBottom: 20, textAlign: "left" }}>
                  <p style={{ fontSize: 13.5, fontWeight: 700, color: "#1e293b", margin: "0 0 4px", wordBreak: "keep-all" }}>
                    지금 결과는 이 브라우저에만 있어요
                  </p>
                  <p style={{ fontSize: 12.5, color: "#64748b", margin: 0, lineHeight: 1.6, wordBreak: "keep-all" }}>
                    저장해두면 기기를 바꿔도 다시 열 수 있어요.
                  </p>
                </div>
              )}
              <h1 className="wizard-question">어떻게 불러드릴까요?</h1>
              <p className="wizard-sub">팀원에게 이 이름으로 표시돼요.</p>
              <input
                ref={nameRef}
                className="input wizard-input"
                placeholder="이름 또는 닉네임"
                value={name}
                autoComplete="name"
                onChange={e => setName(e.target.value)}
              />
              {error && <div className="error-text">{error}</div>}
              <button className="btn btn-primary full wizard-btn" type="submit" disabled={!name.trim()}>
                다음 →
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <h1 className="wizard-question">이메일 주소를 알려주세요</h1>
              <input
                ref={emailRef}
                className="input wizard-input"
                type="email"
                placeholder="example@cosync.com"
                value={email}
                autoComplete="email"
                onChange={e => setEmail(e.target.value)}
              />
              {error && <div className="error-text">{error}</div>}
              <button className="btn btn-primary full wizard-btn" type="submit" disabled={!email.trim()}>
                다음 →
              </button>
            </>
          )}

          {step === 3 && (
            <>
              <h1 className="wizard-question">비밀번호를 설정해주세요</h1>
              <div className="password-row">
                <input
                  ref={passwordRef}
                  className="input wizard-input"
                  type={showPassword ? "text" : "password"}
                  placeholder="8자 이상"
                  value={password}
                  autoComplete="new-password"
                  onChange={e => setPassword(e.target.value)}
                />
                <button
                  className="eye-btn"
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  aria-label="비밀번호 표시 전환"
                >
                  {showPassword ? <EyeClosed /> : <EyeOpen />}
                </button>
              </div>
              <div className="hint">✓ 최소 8자 이상, 영문/숫자 포함</div>
              {error && <div className="error-text">{error}</div>}
              <button className="btn btn-primary full wizard-btn" type="submit" disabled={password.length < 8}>
                다음 →
              </button>
            </>
          )}

          {step === 4 && (
            <>
              <h1 className="wizard-question">비밀번호를 한 번 더 입력해주세요</h1>
              <div className="password-row">
                <input
                  ref={confirmRef}
                  className="input wizard-input"
                  type={showConfirm ? "text" : "password"}
                  placeholder="비밀번호 재입력"
                  value={confirm}
                  autoComplete="new-password"
                  onChange={e => setConfirm(e.target.value)}
                />
                <button
                  className="eye-btn"
                  type="button"
                  onClick={() => setShowConfirm(p => !p)}
                  aria-label="비밀번호 표시 전환"
                >
                  {showConfirm ? <EyeClosed /> : <EyeOpen />}
                </button>
              </div>
              {confirm && (
                password === confirm
                  ? <div className="hint wizard-match-hint">✓ 비밀번호가 일치합니다</div>
                  : <div className="error-text">비밀번호가 일치하지 않습니다.</div>
              )}
              {error && <div className="error-text">{error}</div>}
              <button className="btn btn-primary full wizard-btn" type="submit" disabled={!confirm || password !== confirm}>
                다음 →
              </button>
            </>
          )}

          {step === 5 && (
            <>
              <h1 className="wizard-question">약관에 동의해주세요</h1>
              <div className="wizard-terms-list">
                <div
                  className={`wizard-terms-item${agreeTerms ? " agreed" : ""}`}
                  onClick={() => setAgreeTerms(p => !p)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => (e.key === " " || e.key === "Enter") && setAgreeTerms(p => !p)}
                >
                  <div className="wizard-terms-check">{agreeTerms ? "✓" : ""}</div>
                  <span className="wizard-terms-text">
                    <em className="req">(필수)</em> 서비스 이용약관
                  </span>
                  <button
                    type="button"
                    className="terms-link"
                    onClick={e => { e.stopPropagation(); setShowTermsModal(true); }}
                  >
                    보기
                  </button>
                </div>
                <div
                  className={`wizard-terms-item${agreePrivacy ? " agreed" : ""}`}
                  onClick={() => setAgreePrivacy(p => !p)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => (e.key === " " || e.key === "Enter") && setAgreePrivacy(p => !p)}
                >
                  <div className="wizard-terms-check">{agreePrivacy ? "✓" : ""}</div>
                  <span className="wizard-terms-text">
                    <em className="req">(필수)</em> 개인정보 수집 및 이용
                  </span>
                  <button
                    type="button"
                    className="terms-link"
                    onClick={e => { e.stopPropagation(); setShowPrivacyModal(true); }}
                  >
                    보기
                  </button>
                </div>
              </div>
              {error && <div className="error-text">{error}</div>}
              <button
                className="btn btn-primary full wizard-btn"
                type="button"
                onClick={handleRegister}
                disabled={loading || !agreeTerms || !agreePrivacy}
              >
                {loading ? "계정 생성 중..." : "계정 만들기 →"}
              </button>
              <p className="auth-sub" style={{ marginTop: 14, textAlign: "center" }}>
                이미 계정이 있으신가요? <Link href="/login">로그인</Link>
              </p>
            </>
          )}
        </form>
        </div>
      </section>
      <Footer />

      {showTermsModal && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="terms-title">
          <div className="modal-card" style={{ maxWidth: 560 }}>
            <div className="modal-top">
              <h2 id="terms-title" style={{ fontSize: 17, fontWeight: 700 }}>서비스 이용약관</h2>
              <button className="close" type="button" autoFocus onClick={() => setShowTermsModal(false)}>✕</button>
            </div>
            <div style={{ overflowY: "auto", maxHeight: "60vh", fontSize: 13, lineHeight: 1.8, color: "var(--text-2)", paddingRight: 4 }}>
              <p style={{ marginBottom: 12 }}>본 약관은 CoSync(이하 "회사")이 제공하는 공동창업자 정렬 진단 서비스(이하 "서비스")의 이용 조건 및 절차, 회사와 회원 간의 권리·의무 및 책임사항을 규정함을 목적으로 합니다.</p>

              <strong>제1조 (정의)</strong>
              <p>① "서비스"란 회사가 제공하는 공동창업자 정렬 진단, 갭 리포트, 합의안 문서화 등 일체의 서비스를 말합니다.<br />
              ② "회원"이란 본 약관에 동의하고 회사와 이용계약을 체결한 자를 말합니다.<br />
              ③ "팀"이란 회원이 생성하거나 참여하는 협업 단위를 말하며, "콘텐츠"란 회원이 서비스 이용 과정에서 생성·입력한 데이터를 말합니다.</p>

              <strong>제2조 (약관의 효력 및 변경)</strong>
              <p>① 본 약관은 서비스 화면에 게시하거나 기타의 방법으로 회원에게 공지함으로써 효력이 발생합니다.<br />
              ② 회사는 관련 법령을 위배하지 않는 범위에서 약관을 변경할 수 있으며, 변경 시 적용일자 및 변경사유를 명시하여 최소 7일 전(회원에게 불리하거나 중대한 변경은 30일 전)부터 공지합니다.<br />
              ③ 회원이 변경된 약관에 동의하지 않을 경우 이용계약을 해지할 수 있으며, 변경 약관의 효력 발생일 이후에도 서비스를 계속 이용하는 경우 변경에 동의한 것으로 봅니다.</p>

              <strong>제3조 (이용계약의 체결 및 계정)</strong>
              <p>① 이용계약은 이용자가 약관에 동의하고 회원가입을 신청한 후 회사가 이를 승낙함으로써 체결됩니다.<br />
              ② 서비스는 만 19세 이상을 대상으로 하며, 회원은 가입 시 정확한 정보를 제공해야 합니다.<br />
              ③ 회사는 타인의 정보 도용, 허위 정보 기재, 부정한 목적의 신청 등에 대해 승낙을 거부하거나 사후에 이용계약을 해지할 수 있습니다.</p>

              <strong>제4조 (서비스의 제공 및 변경·중단)</strong>
              <p>① 회사는 연중무휴 1일 24시간 서비스 제공을 원칙으로 합니다.<br />
              ② 회사는 시스템 점검, 설비 교체, 천재지변 등 운영상·기술상 필요한 경우 서비스의 전부 또는 일부를 변경하거나 중단할 수 있으며, 사전 통지를 원칙으로 하되 불가피한 경우 사후 통지할 수 있습니다.</p>

              <strong>제5조 (회원의 의무 및 금지행위)</strong>
              <p>① 회원은 계정 정보를 안전하게 관리할 책임이 있으며, 이를 타인과 공유하거나 양도할 수 없습니다.<br />
              ② 회원은 다음 행위를 하여서는 안 됩니다: 타인의 권리·명예·신용을 침해하는 행위, 서비스 운영을 방해하는 행위, 역설계·자동수집·무단복제 등 부정한 방법으로 서비스를 이용하는 행위, 관련 법령에 위반되는 행위.</p>

              <strong>제6조 (콘텐츠 및 지식재산권)</strong>
              <p>① 서비스 내 콘텐츠, 알고리즘, UI/UX 등 회사가 제작한 일체의 지식재산권은 회사에 귀속됩니다.<br />
              ② 회원이 입력·생성한 콘텐츠의 권리는 회원에게 있으며, 회사는 서비스 제공·개선 목적의 범위 내에서만 이를 이용합니다.<br />
              ③ 진단 응답 데이터는 통계 작성, 서비스 개선 및 알고리즘 고도화 목적으로 식별이 불가능하도록 익명·가명 처리 후 활용될 수 있습니다.</p>

              <strong>제7조 (계약 해지 및 이용 제한)</strong>
              <p>① 회원은 언제든지 서비스 내 절차를 통해 이용계약을 해지(회원 탈퇴)할 수 있습니다.<br />
              ② 회사는 회원이 본 약관을 위반하거나 서비스의 정상적 운영을 방해한 경우 사전 통지 후 이용을 제한하거나 계약을 해지할 수 있습니다.</p>

              <strong>제8조 (면책 및 손해배상)</strong>
              <p>① 회사는 천재지변, 회원의 귀책사유 등 회사의 통제 범위를 벗어난 사유로 인한 손해에 대해 책임을 지지 않습니다.<br />
              ② 서비스의 진단 결과는 참고 목적의 정보로 제공되며 법률·세무·경영 자문을 대체하지 않습니다. 회사는 이를 근거로 한 회원의 의사결정 및 그 결과에 대해 법적 책임을 지지 않습니다.</p>

              <strong>제9조 (준거법 및 관할)</strong>
              <p>본 약관은 대한민국 법률에 따라 해석되며, 서비스 이용과 관련한 분쟁에 대해서는 민사소송법상의 관할 법원을 제1심 관할 법원으로 합니다.</p>

              <strong>제10조 (문의처)</strong>
              <p>서비스 및 약관에 관한 문의는 아래로 연락해 주세요.<br />
              · 이메일: cosync.support@gmail.com</p>

              <p style={{ marginTop: 16, color: "var(--text-3)" }}>시행일: 2026년 1월 1일</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" type="button" onClick={() => { setAgreeTerms(true); setShowTermsModal(false); }}>동의하고 닫기</button>
            </div>
          </div>
        </div>
      )}

      {showPrivacyModal && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="privacy-title">
          <div className="modal-card" style={{ maxWidth: 560 }}>
            <div className="modal-top">
              <h2 id="privacy-title" style={{ fontSize: 17, fontWeight: 700 }}>개인정보 수집 및 이용 동의</h2>
              <button className="close" type="button" autoFocus onClick={() => setShowPrivacyModal(false)}>✕</button>
            </div>
            <div style={{ overflowY: "auto", maxHeight: "60vh", fontSize: 13, lineHeight: 1.8, color: "var(--text-2)", paddingRight: 4 }}>
              <p style={{ marginBottom: 12 }}>CoSync(이하 "회사")은 「개인정보 보호법」 등 관련 법령을 준수하며, 이용자의 개인정보를 다음과 같이 처리합니다.</p>

              <strong>1. 수집하는 개인정보 항목</strong>
              <p>· 필수: 이름, 이메일 주소, 비밀번호<br />
              · 서비스 이용 중 생성: 진단 응답 데이터, 팀 정보, 역할/소속 정보<br />
              · 자동 수집: 접속 IP, 쿠키, 접속 로그, 기기·브라우저 정보, 서비스 이용 기록</p>

              <strong>2. 수집 및 이용 목적</strong>
              <p>· 회원 식별 및 가입 의사 확인, 서비스 제공<br />
              · 공동창업자 정렬 진단 결과 분석 및 갭 리포트 생성<br />
              · 서비스 개선 및 알고리즘 고도화 (익명·가명 처리 후 활용)<br />
              · 고객 문의 대응 및 공지사항 전달<br />
              · 부정 이용 방지 및 서비스 안정성 확보</p>

              <strong>3. 보유 및 이용 기간</strong>
              <p>원칙적으로 회원 탈퇴 시 지체 없이 파기합니다. 단, 관련 법령에 따라 보존이 필요한 경우 해당 기간 동안 보관합니다.<br />
              · 계약 또는 청약철회 등에 관한 기록: 5년 (전자상거래법)<br />
              · 대금결제 및 재화 공급에 관한 기록: 5년 (전자상거래법)<br />
              · 소비자 불만 또는 분쟁 처리에 관한 기록: 3년 (전자상거래법)<br />
              · 접속 로그 등 통신사실확인자료: 3개월 (통신비밀보호법)</p>

              <strong>4. 개인정보의 제3자 제공</strong>
              <p>회사는 원칙적으로 이용자의 개인정보를 외부에 제공하지 않습니다. 다만, 이용자가 사전에 동의한 경우 또는 법령에 의거한 경우에는 예외로 합니다.</p>

              <strong>5. 개인정보 처리의 위탁</strong>
              <p>회사는 안정적인 서비스 제공을 위해 클라우드 인프라 및 데이터 보관 업무를 외부 전문업체에 위탁할 수 있으며, 위탁 시 관련 법령에 따라 개인정보가 안전하게 관리되도록 필요한 사항을 규정합니다.</p>

              <strong>6. 정보주체의 권리 및 행사 방법</strong>
              <p>이용자는 언제든지 자신의 개인정보에 대한 열람·정정·삭제·처리정지를 요구할 수 있으며, 서비스 내 설정 또는 아래 문의처를 통해 권리를 행사할 수 있습니다. 회사는 지체 없이 필요한 조치를 취합니다.</p>

              <strong>7. 개인정보의 파기 절차 및 방법</strong>
              <p>보유 기간이 경과하거나 처리 목적이 달성된 개인정보는 지체 없이 파기합니다. 전자적 파일은 복구가 불가능한 방법으로 영구 삭제하며, 출력물은 분쇄 또는 소각합니다.</p>

              <strong>8. 개인정보의 안전성 확보 조치</strong>
              <p>회사는 비밀번호 암호화, 접근 권한 관리, 접근 통제 시스템 운영, 전송 구간 암호화(SSL) 등 관련 법령이 요구하는 기술적·관리적 보호조치를 시행합니다.</p>

              <strong>9. 동의 거부 권리 및 불이익</strong>
              <p>이용자는 개인정보 수집·이용에 동의하지 않을 권리가 있습니다. 단, 필수 항목에 대한 동의를 거부할 경우 회원가입 및 서비스 이용이 제한될 수 있습니다.</p>

              <strong>10. 개인정보 보호책임자 및 문의처</strong>
              <p>개인정보 처리에 관한 문의·불만·피해구제는 아래로 연락해 주세요.<br />
              · 개인정보 보호책임자: CoSync 운영팀<br />
              · 이메일: cosync.support@gmail.com</p>

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
