"use client";

import Link from "next/link";
import { useState } from "react";
import { TopNav } from "../../components/TopNav";
import { Footer } from "../../components/Footer";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, Keyboard } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";

export default function GapReportPage() {
  const [showSubscribe, setShowSubscribe] = useState(false);
  const slides = [
    { title: "Agreement Confirm", src: "/preview/agreement-confirm.png" },
    { title: "Document View", src: "/preview/document-view.png" },
    { title: "Questions", src: "/preview/questions.png" },
    { title: "Version Diff", src: "/preview/version-diff.png" },
    { title: "Version History", src: "/preview/version-history.png" },
    { title: "Consensus", src: "/preview/consensus.png" }
  ];
  return (
    <main className="page gap-page">
      <TopNav
        links={[
          { label: "대시보드", href: "/workspace" }
        ]}
        active="리포트"
        rightName="황주명"
      />

      <section className="container gap-wrap">
        <div className="gap-header">
          <div>
            <h1 className="section-title">격차 리포트</h1>
            <p className="section-sub">최신 업데이트: 2024.06.20</p>
          </div>
          <button className="btn btn-primary small">진단 재시작 →</button>
        </div>

        <div className="card gap-summary">
          <div>
            <div className="summary-title">팀 온보딩</div>
            <div className="summary-value">미확정</div>
          </div>
          <div>
            <div className="summary-title">결정 기준</div>
            <div className="summary-value">없음</div>
          </div>
          <div>
            <div className="summary-title">이해차이 항목</div>
            <div className="summary-value">정의되지 않음</div>
          </div>
          <div className="summary-note">
            협업 규칙은 팀 합의를 통해 확정됩니다. AI가 핵심 이슈를 요약했습니다.
          </div>
        </div>

        <div className="card gap-insight detail">
          <div className="insight-left">
            <div className="donut">
              <span>64%</span>
            </div>
            <div className="pill">AI ANALYSIS SUMMARY</div>
          </div>
          <div className="insight-body">
            <p>
              전체적으로 운영 방식에서는 높은 일치도를 보이나, 의사결정권과
              분배에 대한 문제 인식 차이가 확인되었습니다. 협업 세션 시작 전,
              각자의 보상 기대에 대한 합의 방향을 점검하세요.
            </p>
            <div className="chip-grid small">
              <span className="chip">의사결정 프로세스 부족</span>
              <span className="chip">지분 구조 상충 인지</span>
            </div>
            <Link href="/gap-report/detail" className="link">
              인사이트 상세 보기 →
            </Link>
          </div>
        </div>

        <div className="card gap-focus">
          <div className="focus-head">
            <h3>핵심 대응 의제</h3>
          </div>
          <div className="focus-grid">
            <div className="focus-item">
              <span className="focus-id">01</span>
              <div>
                <div className="focus-title">의사결정 프로세스</div>
                <div className="focus-sub">의사결정 방식에 대한 팀 내 편차</div>
              </div>
            </div>
            <div className="focus-item">
              <span className="focus-id">02</span>
              <div>
                <div className="focus-title">지분 구조</div>
                <div className="focus-sub">지분 분배 및 기여도 인식 차이</div>
              </div>
            </div>
          </div>
        </div>

        <div className="card gap-matrix">
          <div className="matrix-head">
            <h3>영역별 상세 데이터 시각화</h3>
            <div className="legend">
              <span className="dot green" /> Alignment
              <span className="dot purple" /> Conflict
            </div>
          </div>
          <div className="matrix-grid">
            {Array.from({ length: 9 }).map((_, idx) => (
              <div
                key={idx}
                className={`matrix-cell ${idx % 3 === 2 ? "good" : "mid"}`}
              />
            ))}
          </div>
        </div>

        <div className="card gap-cta">
          <div>
            <h3>합의안을 생성하고 팀 기준을 고정하세요</h3>
            <p>팀원의 편차를 줄이고 실행 가능한 룰을 채택합니다.</p>
          </div>
          <button
            className="btn btn-primary"
            type="button"
            onClick={() => setShowSubscribe(true)}
          >
            합의 세션 시작하기
          </button>
        </div>
      </section>

      <Footer />

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
            <h3>프리미엄 플로우로 합의를 완성하세요</h3>
            <p>
              계약서 생성, 버전 히스토리, 합의 확정까지 이어지는 프리미엄
              워크플로우가 곧 제공됩니다.
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
              <button className="btn btn-primary" type="button">
                구독 시작하기 →
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
