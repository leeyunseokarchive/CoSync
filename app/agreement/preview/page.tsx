"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, Keyboard } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import { TopNav } from "../../../components/TopNav";
import { Footer } from "../../../components/Footer";
import { useUserProfile } from "../../../components/useUserProfile";
import { ClipboardList, Handshake, MessageCircle } from "lucide-react";

const slides = [
  { title: "합의 세션", src: "/preview/agreement-confirm.png" },
  { title: "계약서 생성", src: "/preview/document-view.png" },
  { title: "구체적인 질문 리스트", src: "/preview/questions.png" },
  { title: "추천 문구", src: "/preview/version-diff.png" },
  { title: "히스토리 관리", src: "/preview/version-history.png" }
];

const STEPS = [
  { num: "01", title: "각자 독립 응답", desc: "상대방 답을 보지 않은 상태에서 각자 솔직하게 작성합니다." },
  { num: "02", title: "동시 공개", desc: "두 사람 모두 완료하면 서로의 응답이 공개됩니다." },
  { num: "03", title: "합의 문서 완성", desc: "응답을 바탕으로 팀 운영 규칙을 문서로 확정합니다." },
];

function AgreementPreviewInner() {
  const searchParams = useSearchParams();
  const teamId = searchParams ? searchParams.get("teamId") : null;
  const router = useRouter();
  const { profile } = useUserProfile();
  const [showSubscribe, setShowSubscribe] = useState(false);

  const handleStartConsensus = () => {
    if (profile?.plan === "premium") {
      router.push(`/consensus${teamId ? `?teamId=${teamId}` : ""}`);
    } else {
      setShowSubscribe(true);
    }
  };

  return (
    <main className="page">
      <TopNav links={[{ label: "갭 리포트", href: "/gap-report" }]} active="합의안" />

      <section className="agreement-preview-hero">
        <div className="container" style={{ textAlign: "center" }}>
          <div className="agreement-badge">PREMIUM</div>
          <h1 className="agreement-hero-title">합의안 만들기</h1>
          <p className="agreement-hero-sub">
            공동창업자 간 운영 규칙을 문서로 만드는 과정입니다.
            <br />
            각자 독립적으로 작성한 뒤, 함께 확인하고 합의합니다.
          </p>
          <button
            onClick={handleStartConsensus}
            className="btn btn-primary"
            style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "16px 40px", fontSize: "16px", marginTop: "28px" }}
          >
            합의 세션 시작하기 →
          </button>
        </div>
      </section>

      <section className="container agreement-preview-body">

        {/* Trust */}
        <div className="agreement-trust-block">
          <div className="trust-cards">
            <div className="trust-card">
              <div className="trust-card-icon"><ClipboardList size={22} /></div>
              <div className="trust-card-title">주주간계약 필수 조항 기반</div>
              <div className="trust-card-desc">실제 주주간계약서에서 분쟁이 가장 많이 발생하는 필수 조항을 바탕으로 설계되었습니다.</div>
            </div>
            <div className="trust-card">
              <div className="trust-card-icon"><Handshake size={22} /></div>
              <div className="trust-card-title">변호사 협력 검토 템플릿</div>
              <div className="trust-card-desc">스타트업 전문 변호사와 협력하여 합의 항목의 법적 유효성과 실효성을 검토했습니다.</div>
            </div>
            <div className="trust-card">
              <div className="trust-card-icon"><MessageCircle size={22} /></div>
              <div className="trust-card-title">팀 필수 대화 설계</div>
              <div className="trust-card-desc">창업 초기 팀이 반드시 나눠야 하지만 꺼내기 어려운 대화를 구조화된 질문으로 담았습니다.</div>
            </div>
          </div>
        </div>

        {/* How it works */}
        <div className="agreement-section">
          <div className="agreement-section-label">HOW IT WORKS</div>
          <h2 className="agreement-section-title">3단계로 완성됩니다</h2>
          <div className="agreement-steps">
            {STEPS.map((step, i) => (
              <div key={step.num} className="agreement-step">
                <div className="step-num">{step.num}</div>
                {i < STEPS.length - 1 && <div className="step-connector" />}
                <div className="step-content">
                  <div className="step-title">{step.title}</div>
                  <div className="step-desc">{step.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Demo evaluation CTA */}
        <div className="agreement-section" style={{ textAlign: "center" }}>
          <h2 className="agreement-section-title">데모 평가에 참여해주세요</h2>
          <p className="agreement-section-desc">
            CoSync 서비스를 체험해 보신 소감을 알려주세요.<br />
            여러분의 피드백이 더 나은 서비스를 만듭니다.
          </p>
          <a
            href="https://forms.gle/h4Xyp7GD4jcicqpM8"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary"
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", width: "100%", maxWidth: "480px", padding: "18px 28px", fontSize: "16px", margin: "16px auto 0" }}
          >
            데모 평가 참여하기 →
          </a>
        </div>

      </section>

      {showSubscribe && (
        <div className="subscribe-backdrop" role="dialog" aria-modal="true">
          <div className="subscribe-card">
            <button
              className="close"
              type="button"
              onClick={() => setShowSubscribe(false)}
              aria-label="닫기"
            >
              ✕
            </button>
            <h3>팀이 작을 때 하는 합의가 가장 쉽습니다</h3>
            <p>
              기업이 성장할수록, 같은 문제의 갈등 비용도 커집니다. <br />
              사전신청 팀에게 먼저 열립니다.
            </p>
            <div className="preview-slider">
              <Swiper
                modules={[Autoplay, Pagination, Keyboard]}
                autoplay={{ delay: 2400, disableOnInteraction: false }}
                pagination={{ clickable: true }}
                keyboard={{ enabled: true }}
                loop
                spaceBetween={16}
              >
                {slides.map((slide) => (
                  <SwiperSlide key={slide.title}>
                    <div className="slide-frame">
                      <img src={slide.src} alt={slide.title} />
                    </div>
                    <div className="slider-caption">{slide.title}</div>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
            <div className="subscribe-actions">
              <button
                className="btn btn-ghost"
                type="button"
                onClick={() => setShowSubscribe(false)}
              >
                나중에
              </button>
              <button
                className="btn btn-primary"
                type="button"
                onClick={() => {
                  setShowSubscribe(false);
                  window.location.href = `/gap-report${teamId ? `?teamId=${teamId}` : ""}#earlybird-section`;
                }}
              >
                사전신청하기 →
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />

      <style dangerouslySetInnerHTML={{ __html: `
        .agreement-preview-hero {
          padding: 80px 0 48px;
          text-align: center;
        }
        .agreement-badge {
          display: inline-block;
          background: linear-gradient(135deg, #5858e2, #8b5cf6);
          color: #fff;
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 2px;
          padding: 6px 16px;
          border-radius: 999px;
          margin-bottom: 20px;
        }
        .agreement-hero-title {
          font-size: clamp(2rem, 5vw, 3rem);
          font-weight: 800;
          color: #0f172a;
          margin-bottom: 16px;
          letter-spacing: -1px;
        }
        .agreement-hero-sub {
          font-size: 1.05rem;
          color: #475569;
          line-height: 1.7;
        }
        .agreement-preview-body {
          padding-bottom: 80px;
          display: flex;
          flex-direction: column;
          gap: 64px;
        }
        .agreement-section {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .agreement-section-label {
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 2px;
          color: #5858e2;
        }
        .agreement-section-title {
          font-size: 1.5rem;
          font-weight: 800;
          color: #0f172a;
        }
        .agreement-section-desc {
          font-size: 0.95rem;
          color: #64748b;
          margin-top: -4px;
        }
        .agreement-trust-block {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .trust-cards {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }
        @media (max-width: 700px) {
          .trust-cards { grid-template-columns: 1fr; }
        }
        .trust-card {
          background: #fff;
          border-radius: 16px;
          padding: 24px 20px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .trust-card-icon { font-size: 1.4rem; margin-bottom: 4px; }
        .trust-card-title { font-size: 0.95rem; font-weight: 700; color: #0f172a; }
        .trust-card-desc { font-size: 0.85rem; color: #64748b; line-height: 1.6; }
        .agreement-steps {
          display: flex;
          flex-direction: column;
          padding: 32px;
          background: #f8fafc;
          border-radius: 20px;
        }
        .agreement-step { display: flex; gap: 20px; align-items: flex-start; position: relative; }
        .step-num {
          font-size: 0.75rem;
          font-weight: 800;
          color: #5858e2;
          background: rgba(88,88,226,0.1);
          width: 40px; height: 40px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; letter-spacing: 1px;
        }
        .step-connector {
          position: absolute; left: 19px; top: 40px;
          width: 2px; height: 32px; background: #e2e8f0;
        }
        .step-content { padding: 8px 0 32px; }
        .step-content:last-child { padding-bottom: 0; }
        .step-title { font-size: 1rem; font-weight: 700; color: #0f172a; margin-bottom: 4px; }
        .step-desc { font-size: 0.9rem; color: #64748b; line-height: 1.6; }
      `}} />
    </main>
  );
}

export default function AgreementPreviewPage() {
  return (
    <Suspense>
      <AgreementPreviewInner />
    </Suspense>
  );
}
