"use client";

import { useRouter } from "next/navigation";
import { TopNav } from "../../../components/TopNav";
import { Footer } from "../../../components/Footer";
import { Compass, Settings, Pin, Scale, Banknote, DoorOpen, ClipboardList, Handshake, MessageCircle, Lightbulb } from "lucide-react";

const CATEGORIES_BASIC = [
  { icon: <Compass size={18} />, title: "비전", desc: "왜 하는가", detail: "회사를 어디까지 키울 건지, 무엇을 위해 하는지" },
  { icon: <Settings size={18} />, title: "실행", desc: "어떻게 일하는가", detail: "업무 몰입 수준, 협업 리듬, 결정 속도" },
  { icon: <Pin size={18} />, title: "책임", desc: "누가 맡는가", detail: "역할 경계, 회색지대 업무, 성과 기준" },
];

const CATEGORIES_PREMIUM = [
  { icon: <Scale size={18} />, title: "권한", desc: "누가 결정하는가", detail: "담당 영역별 결정권, 공동 의사결정 기준" },
  { icon: <Banknote size={18} />, title: "돈", desc: "무엇을 나누는가", detail: "지분 구조, 급여 기준, 투자 유치 방향" },
  { icon: <DoorOpen size={18} />, title: "종료", desc: "깨질 때 어떻게 하는가", detail: "이탈 시 인수인계, 지분 정리, 권한 차단" },
];

const STEPS = [
  { num: "01", title: "각자 독립 응답", desc: "상대방 답을 보지 않은 상태에서 각자 솔직하게 작성합니다." },
  { num: "02", title: "동시 공개", desc: "두 사람 모두 완료하면 서로의 응답이 공개됩니다." },
  { num: "03", title: "합의 문서 완성", desc: "응답을 바탕으로 팀 운영 규칙을 문서로 확정합니다." },
];

export default function AgreementPreviewPage() {
  const router = useRouter();

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
        </div>
      </section>

      <section className="container agreement-preview-body">

        {/* Trust */}
        <div className="agreement-trust-block">
          <div className="trust-legal-badge">
            <Scale size={14} style={{ display: "inline", verticalAlign: "middle", marginRight: "6px" }} /> 변호사 감수 · 실제 분쟁 판례 반영
          </div>
          <div className="trust-cards">
            <div className="trust-card">
              <div className="trust-card-icon"><ClipboardList size={22} /></div>
              <div className="trust-card-title">주주간계약 필수 조항 기반</div>
              <div className="trust-card-desc">실제 주주간계약서에서 분쟁이 가장 많이 발생하는 필수 조항을 바탕으로 설계되었습니다.</div>
            </div>
            <div className="trust-card">
              <div className="trust-card-icon"><Handshake size={22} /></div>
              <div className="trust-card-title">변호사 협력 검증 템플릿</div>
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

        {/* Pricing */}
        <div className="agreement-section">
          <div className="agreement-section-label">PRICING</div>
          <h2 className="agreement-section-title">플랜을 선택하세요</h2>
          <p className="agreement-section-desc">2인 기준 · 업그레이드 시 차액(₩200,000)만 추가</p>

          <div className="pricing-grid">

            {/* Basic */}
            <div className="pricing-card">
              <div className="pricing-plan-name">Basic</div>
              <div className="pricing-amount">₩129,000</div>
              <div className="pricing-per">2인 기준 · 1인당 ₩64,500</div>
              <div className="pricing-divider" />
              <div className="pricing-category-label">포함 카테고리 (3개)</div>
              <div className="pricing-categories">
                {CATEGORIES_BASIC.map((cat) => (
                  <div key={cat.title} className="pricing-cat-item">
                    <span className="pricing-cat-icon">{cat.icon}</span>
                    <div>
                      <div className="pricing-cat-title">{cat.title} <span className="pricing-cat-desc">{cat.desc}</span></div>
                      <div className="pricing-cat-detail">{cat.detail}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="pricing-divider" />
              <div className="pricing-features">
                <div className="pricing-feature">✓ 팀 문화·운영 규칙 합의 문서</div>
                <div className="pricing-feature">✓ 변호사 브리핑 자료로 활용 가능</div>
                <div className="pricing-feature">✓ 버전 히스토리</div>
                <div className="pricing-feature">✓ 양측 확인 서명</div>
              </div>
              <button
                type="button"
                className="btn btn-ghost pricing-cta-btn"
                onClick={() => router.push("/agreement/start?plan=basic")}
              >
                Basic으로 시작하기
              </button>
            </div>

            {/* Premium */}
            <div className="pricing-card premium">
              <div className="pricing-recommended">추천</div>
              <div className="pricing-plan-name">Premium</div>
              <div className="pricing-amount">₩329,000</div>
              <div className="pricing-per">2인 기준 · 1인당 ₩164,500</div>
              <div className="pricing-divider" />
              <div className="pricing-category-label">포함 카테고리 (6개 전체)</div>
              <div className="pricing-categories">
                {[...CATEGORIES_BASIC, ...CATEGORIES_PREMIUM].map((cat) => (
                  <div key={cat.title} className="pricing-cat-item">
                    <span className="pricing-cat-icon">{cat.icon}</span>
                    <div>
                      <div className="pricing-cat-title">{cat.title} <span className="pricing-cat-desc">{cat.desc}</span></div>
                      <div className="pricing-cat-detail">{cat.detail}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="pricing-divider" />
              <div className="pricing-features">
                <div className="pricing-feature">✓ Basic 전체 포함</div>
                <div className="pricing-feature">✓ 권한·돈·종료 법적 핵심 영역 추가</div>
                <div className="pricing-feature">✓ 빠짐없는 6개 카테고리 합의안</div>
                <div className="pricing-feature premium-feature">✓ 스타트업 전문 변호사 컨택 가능</div>
              </div>
              <button
                type="button"
                className="btn btn-primary pricing-cta-btn"
                onClick={() => router.push("/agreement/start?plan=premium")}
              >
                Premium으로 시작하기 →
              </button>
              <div className="pricing-lawyer-note">
                변호사 검토는 선택 사항이며 별도 비용이 발생합니다.
                <br />시중 주주간계약서 대비 합리적인 비용으로 연결됩니다.
              </div>
            </div>

          </div>
        </div>

        {/* Upgrade note */}
        <div className="upgrade-note-block">
          <Lightbulb size={18} className="upgrade-note-icon" />
          <p>Basic으로 시작하고 나중에 Premium으로 업그레이드할 수 있습니다. 업그레이드 시 차액 <strong>₩200,000</strong>만 추가됩니다.</p>
        </div>

      </section>

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
        .trust-legal-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(99, 102, 241, 0.1);
          border: 1.5px solid rgba(99, 102, 241, 0.45);
          color: #4338ca;
          padding: 8px 18px;
          border-radius: 999px;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: -0.01em;
          width: fit-content;
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
        .pricing-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          align-items: stretch;
        }
        @media (max-width: 700px) {
          .pricing-grid { grid-template-columns: 1fr; }
        }
        .pricing-card {
          background: #fff;
          border-radius: 24px;
          padding: 32px 28px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          position: relative;
        }
        .pricing-card.premium {
          border-color: #5858e2;
          box-shadow: 0 12px 40px rgba(88,88,226,0.12);
        }
        .pricing-recommended {
          position: absolute;
          top: -14px; left: 50%;
          transform: translateX(-50%);
          background: linear-gradient(120deg, #5858e2, #777ef0);
          color: #fff;
          font-size: 0.75rem;
          font-weight: 700;
          padding: 4px 16px;
          border-radius: 999px;
          letter-spacing: 1px;
          white-space: nowrap;
        }
        .pricing-plan-name { font-size: 0.9rem; font-weight: 700; color: #64748b; letter-spacing: 1px; }
        .pricing-amount { font-size: 2rem; font-weight: 800; color: #0f172a; letter-spacing: -1px; }
        .pricing-per { font-size: 0.82rem; color: #94a3b8; margin-top: -6px; }
        .pricing-divider { height: 1px; background: #f1f5f9; margin: 4px 0; }
        .pricing-category-label { font-size: 0.8rem; font-weight: 700; color: #5858e2; letter-spacing: 1px; }
        .pricing-categories { display: flex; flex-direction: column; gap: 10px; }
        .pricing-cat-item { display: flex; gap: 10px; align-items: flex-start; }
        .pricing-cat-icon { font-size: 1.1rem; flex-shrink: 0; margin-top: 1px; }
        .pricing-cat-title { font-size: 0.88rem; font-weight: 700; color: #0f172a; }
        .pricing-cat-desc { font-size: 0.8rem; font-weight: 500; color: #5858e2; }
        .pricing-cat-detail { font-size: 0.78rem; color: #94a3b8; line-height: 1.4; margin-top: 2px; }
        .pricing-features { display: flex; flex-direction: column; gap: 8px; }
        .pricing-feature { font-size: 0.88rem; color: #475569; }
        .premium-feature { color: #5858e2; font-weight: 600; }
        .pricing-cta-btn { width: 100%; margin-top: auto; padding-top: 8px; }
        .pricing-lawyer-note {
          font-size: 0.78rem;
          color: #94a3b8;
          line-height: 1.6;
          text-align: center;
          margin-top: -4px;
        }
        .upgrade-note-block {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          background: rgba(88,88,226,0.05);
          border: 1px solid rgba(88,88,226,0.12);
          border-radius: 16px;
          padding: 20px 24px;
          font-size: 0.9rem;
          color: #475569;
          line-height: 1.6;
        }
        .upgrade-note-icon { font-size: 1.1rem; flex-shrink: 0; margin-top: 2px; }
      `}} />
    </main>
  );
}
