"use client";

import Link from "next/link";
import { Footer } from "../../components/Footer";
import { useAuth } from "../../components/AuthContext";
import { useUserProfile } from "../../components/useUserProfile";
export default function OnboardingIntroPage() {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const hasCompletedOnboarding = Boolean(user && profile?.department && profile?.role);

  return (
    <main className="page onboarding-page">
      <div className="onboarding-shell">
        <section className="container onboarding-hero">
          <span className="pill">Onboarding Guide</span>
          <h1>
            막연한 약속을 <br />
            <span className="accent">실행 가능한 규칙</span>으로
          </h1>
          <p>
            팀의 민감한 협업 과정을
            <br />
            CoSync와 함께 해결하고 성장에 집중하세요.
          </p>
          <div className="hero-note">
            ✓ 팀의 모든 규칙이 실현 가능한 구조로 수렴합니다.
          </div>

          <div className="step-line">
            <div className="step-icon">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M7 12.5c-2.1 0-3.8 1.3-3.8 2.9v1.2h7.6v-1.2c0-1.6-1.7-2.9-3.8-2.9Zm10.2-.9c1.6 0 2.8-1.1 2.8-2.4s-1.2-2.4-2.8-2.4-2.8 1.1-2.8 2.4 1.2 2.4 2.8 2.4ZM7 11c1.6 0 2.8-1.1 2.8-2.4S8.6 6.2 7 6.2 4.2 7.3 4.2 8.6 5.4 11 7 11Zm10.3 1.5c-1.4 0-2.7.6-3.4 1.5h6.8c-.7-.9-2-1.5-3.4-1.5Z"
                  fill="currentColor"
                />
              </svg>
            </div>
            <div className="line" />
            <div className="step-icon active">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M5 18h14v-2H5v2Zm1-4h3V6H6v8Zm5 0h3V9h-3v5Zm5 0h3V4h-3v10Z"
                  fill="currentColor"
                />
              </svg>
            </div>
            <div className="line" />
            <div className="step-icon">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="m6 17.5 7.9-7.9 1.6 1.6L7.6 19H6v-1.5Zm10-10 1.6 1.6c.4.4.4 1 0 1.4l-1 1-3-3 1-1c.4-.4 1-.4 1.4 0Z"
                  fill="currentColor"
                />
              </svg>
            </div>
          </div>

          <div className="step-cards">
            <div className="card step-card">
              <div className="step-label">STEP 01</div>
              <h3>시나리오 진단</h3>
              <p>나의 팀이 겪을 상황을 점검합니다.</p>
            </div>
            <div className="card step-card">
              <div className="step-label">STEP 02</div>
              <h3>인식 격차 분석</h3>
              <p>팀원별 차이를 확인합니다.</p>
            </div>
            <div className="card step-card">
              <div className="step-label">STEP 03</div>
              <h3>합의 규칙 확정</h3>
              <p>합의안을 구조화합니다.</p>
            </div>
          </div>

          <Link
            className="btn btn-primary"
            href={hasCompletedOnboarding ? "/gap-report" : "/onboarding/diagnosis"}
          >
            {hasCompletedOnboarding ? "내 결과 보러가기 →" : "무료 진단 시작하기 →"}
          </Link>
          <div className="hint">✓ 약 3분 소요</div>
        </section>

        <div className="onboarding-footer-shell">
          <Footer />
        </div>
      </div>
    </main>
  );
}
