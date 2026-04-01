"use client";

import Link from "next/link";
import Image from "next/image";
import { TopNav } from "../components/TopNav";
import { Footer } from "../components/Footer";

export default function LandingPage() {
  return (
    <main className="page landing-page">
      <TopNav 
        links={[
          { label: "Why CoSync", href: "#why-cosync" },
          { label: "Key Areas", href: "#categories" },
          { label: "Preview", href: "#output" },
          { label: "FAQ", href: "#faq" }
        ]} 
        hideAuthLinks={true} 
      />

      {/* 1. Hero */}
      <section className="section hero-section">
        <div className="container hero-container animate-fade-up">
          <div className="hero-text-content">
            <span className="pill hero-pill">
              공동창업팀의 운영 기준과 권리관계를 정리하는 합의 워크플로우
            </span>
            <h1 className="hero-title">
              지분 나누기 전에, <br />
              <span className="accent">기준부터 정리하세요</span>
            </h1>
            <p className="hero-sub">
              지분, 역할, 보상, 이탈 기준은 서로 연결되어 있습니다.
              <br />
              CoSync는 공동창업자 간 기준 차이를 비교하고, 팀 운영에 필요한 핵심 기준을 하나의 합의안 문서로 정리하는 서비스입니다.
            </p>
            <div className="hero-actions">
              <Link href="/onboarding" className="btn btn-primary btn-lg">
                우리 팀 기준 차이 확인하기
              </Link>
              <div className="hero-hint">✓ 현재 38개 이상 창업팀 대기 중</div>
            </div>
          </div>
          <div className="hero-visual delay-2 animate-fade-up">
            <Image 
              src="/images/hero-v2.png" 
              alt="CoSync Hero Concept" 
              width={500} 
              height={500}
              className="fluid-img"
              priority
            />
          </div>
        </div>
      </section>

      {/* 1.5 Empathy Section */}
      <section id="why-cosync" className="section" style={{ backgroundColor: "#ffffff" }}>
        <div className="container">
          <div className="section-header animate-fade-up">
            <h2 className="section-title">
              이런 고민,<br />미루고 계시지 않으셨습니까?
            </h2>
            <p className="section-sub">
              지분과 수익 분배는 민감해서 먼저 꺼내기 어렵고, 역할과 책임은 나눴어도 기준은 여전히 흐릿할 수 있습니다.
              <br />
              무엇을 어디까지 합의해야 하는지 막막한 상태로 팀이 출발하는 경우도 많습니다.
            </p>
          </div>

          <div className="empathy-visual-container animate-fade-up delay-1">
            <div className="empathy-visual">
              <Image 
                src="/images/founder-silhouettes.png" 
                alt="Founders contemplating" 
                width={500} 
                height={500} 
                className="silhouette-img" 
              />
              <div className="thought-card tc-1">지분 이야기는 언제 꺼내야 할까?</div>
              <div className="thought-card tc-2">역할은 나눴는데 책임 기준은?</div>
              <div className="thought-card tc-3">수익 분배는 어떤 기준으로 정하지?</div>
              <div className="thought-card tc-4">누군가 나가면 어떻게 정리하지?</div>
            </div>
          </div>
        </div>
      </section>
      {/* 2. Problem */}
      <section id="why" className="section bg-soft">
        <div className="container">
          <div className="section-header animate-fade-up">
            <h2 className="section-title">
              공동창업의 문제는<br />
              서로 다른 기준에서 시작됩니다.
            </h2>
            <p className="section-sub">
              초기 팀은 빠른 실행에 집중하느라 정작 중요한 운영 기준 합의는 뒤로 미루곤 합니다.
              <br />
              합의된 기준이 없다면, 중요한 순간마다 해석 차이와 불필요한 재논의가 반복됩니다.
              <br />
              <strong style={{ color: "var(--brand)" }}>진짜 문제는 갈등 자체가 아니라, 명확한 기준 없이 팀이 운영된다는 점입니다.</strong>
            </p>
          </div>

          <div className="grid-3 animate-fade-up delay-1">
            <div className="card feature-card">
              <div className="card-icon alert-icon">✕</div>
              <h4>역할 기준이 없으면</h4>
              <p>업무 범위와 책임 해석이 엇갈립니다</p>
            </div>
            <div className="card feature-card delay-1">
              <div className="card-icon alert-icon">✕</div>
              <h4>보상 기준이 없으면</h4>
              <p>지분과 기여에 대한 재논의가 반복됩니다</p>
            </div>
            <div className="card feature-card delay-2">
              <div className="card-icon alert-icon">✕</div>
              <h4>이탈 기준이 없으면</h4>
              <p>누군가 팀을 떠날 때 남은 사람과 떠나는 사람 모두가 피해를 봅니다.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Empathy */}
      <section className="section">
        <div className="container">
          <div className="section-header animate-fade-up">
            <h2 className="section-title">같은 팀이라도 기준은 다를 수 있습니다</h2>
            <p className="section-sub">
              겉으로는 합의된 것처럼 보여도, 실제로는 역할과 기여, 보상에 대한 해석이 다를 수 있습니다.
            </p>
          </div>

          <div className="empathy-blocks animate-fade-up delay-1">
            <h3 className="empathy-title">이런 차이, 생각보다 자주 있습니다</h3>
            <div className="grid-3 empathy-cardless-grid">
              <div className="empathy-column">
                <div className="badge-wrapper"><span className="badge">기여 기준</span></div>
                <div className="bubble left animate-fade-up delay-1"><span className="tiny-speaker">A</span>“내가 영업과 운영을 다 맡고 있는데, 기여도가 더 큰 것 아닌가?”</div>
                <div className="bubble right animate-fade-up delay-3">“제품이 없으면 아무것도 진행되지 않는데, 개발 기여가 더 핵심 아닌가?”<span className="tiny-speaker">B</span></div>
              </div>
              <div className="empathy-column delay-1">
                <div className="badge-wrapper"><span className="badge">근무 기준</span></div>
                <div className="bubble left animate-fade-up delay-2"><span className="tiny-speaker">A</span>“초기에는 풀타임으로 몰입하는 게 당연하지 않나?”</div>
                <div className="bubble right animate-fade-up delay-4">“지속 가능하게 가려면 근무 강도와 방식부터 맞춰야 하지 않나?”<span className="tiny-speaker">B</span></div>
              </div>
              <div className="empathy-column delay-2">
                <div className="badge-wrapper"><span className="badge">이탈 기준</span></div>
                <div className="bubble left animate-fade-up delay-3"><span className="tiny-speaker">A</span>“중간에 나가면 지분은 다시 정리해야 하는 것 아닌가?”</div>
                <div className="bubble right animate-fade-up delay-4">“그동안의 기여가 있는데 아무 권리도 남지 않는 건 이상하지 않나?”<span className="tiny-speaker">B</span></div>
              </div>
            </div>
            <p className="empathy-closing animate-fade-up delay-4">
              CoSync는 이런 기준 차이를 먼저 드러내고, 팀의 합의안으로 정리합니다.
            </p>
          </div>
        </div>
      </section>

      {/* 4. How CoSync Works */}
      <section className="section bg-soft">
        <div className="container">
          <div className="section-header animate-fade-up">
            <h2 className="section-title">
              CoSync는 기준 차이 확인부터<br />합의안 정리까지 연결합니다
            </h2>
            <p className="section-sub">
              감에 의존한 대화가 아니라, 질문과 비교, 정리의 흐름으로 팀 기준을 문서화합니다.
            </p>
          </div>
          
          <div className="workflow-graphic animate-fade-up delay-1">
            <Image 
              src="/images/workflow-v6.png" 
              alt="Workflow Process" 
              width={800} 
              height={400} 
              className="fluid-img" 
            />
          </div>

          <div className="process-steps animate-fade-up delay-2">
            <div className="step-item">
              <div className="step-number">01</div>
              <div className="step-content">
                <h4>기준 입력</h4>
                <p>
                  공동창업자 각자가 구조화된 질문에 답하며, 역할과 보상, 이탈에 대한 기준을 정리합니다.
                </p>
              </div>
            </div>
            <div className="step-arrow">→</div>
            <div className="step-item delay-1">
              <div className="step-number">02</div>
              <div className="step-content">
                <h4>차이 비교</h4>
                <p>
                  팀원별 응답을 비교해 어떤 항목에서 기준 차이가 큰지 직관적으로 확인합니다.
                </p>
              </div>
            </div>
            <div className="step-arrow">→</div>
            <div className="step-item delay-2">
              <div className="step-number">03</div>
              <div className="step-content">
                <h4>합의안 정리</h4>
                <p>
                  비교 결과를 바탕으로 우리 팀이 채택할 운영 기준과 권리관계를 하나의 문서로 정리합니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Core Categories */}
      <section id="categories" className="section">
        <div className="container">
          <div className="section-header animate-fade-up">
            <h2 className="section-title">공동창업 전에 반드시 정리해야 할 핵심 기준</h2>
            <p className="section-sub">
              막연한 대화가 아니라, 실제로 팀 운영에 영향을 주는 핵심 항목부터 구조적으로 정리합니다.
            </p>
          </div>

          <div className="checklist-container animate-fade-up delay-1">
            <div className="checklist-item">
              <div className="check-circle">✓</div>
              <div className="checklist-content">
                <h4>역할 및 책임</h4>
                <p>각자의 담당 영역, 책임 범위, 관여 수준을 정리합니다.</p>
              </div>
            </div>
            <div className="checklist-item delay-1">
              <div className="check-circle">✓</div>
              <div className="checklist-content">
                <h4>지분 및 수익</h4>
                <p>지분 배분 기준, 기여 반영 방식, 보상 원칙을 정리합니다.</p>
              </div>
            </div>
            <div className="checklist-item delay-2">
              <div className="check-circle">✓</div>
              <div className="checklist-content">
                <h4>이탈 및 정리</h4>
                <p>중도 이탈 시 지분, 산출물, 정산 기준을 정리합니다.</p>
              </div>
            </div>
          </div>
          <p className="category-note animate-fade-up delay-3" style={{ textAlign: "center" }}>
            * 필요 시 의사결정 및 권한, 운영 원칙까지 확장하여 정리할 수 있습니다.
          </p>
        </div>
      </section>

      {/* 6. Final Output */}
      <section id="output" className="section bg-dark">
        <div className="container">
          <div className="split-layout">
            <div className="section-header dark animate-fade-up text-left" style={{ margin: 0 }}>
              <h2 className="section-title" style={{ textAlign: "left" }}>최종 결과는 단순 리포트가 아니라,<br />우리 팀의 합의안입니다</h2>
              <p className="section-sub" style={{ textAlign: "left" }}>
                CoSync의 핵심 결과물은 팀 내부에서 채택한 운영 기준과 권리관계를 정리한 문서입니다. 
                <br /><br />
                단순히 성향을 보여주는 진단으로 끝나지 않습니다. 팀원별 기준 차이를 비교한 뒤, 우리 팀이 실제로 합의한 내용이 하나의 문서로 정리됩니다. 
                이 문서는 공동창업팀의 운영 기준을 명확히 남기기 위한 결과물이며, 필요 시 후속 법률 검토의 기초 자료로도 활용할 수 있습니다.
              </p>
              
              <div className="grid-3" style={{ gridTemplateColumns: "1fr", marginTop: 40, gap: 16 }}>
                <div className="card feature-card dark-card" style={{ padding: "20px 24px", display: "flex", flexDirection: "row", alignItems: "center", textAlign: "left", gap: 16 }}>
                  <div className="card-icon check-icon" style={{ marginBottom: 0, width: 36, height: 36, fontSize: 18, flexShrink: 0 }}>✓</div>
                  <div>
                    <h4 style={{ marginBottom: 4, fontSize: 16 }}>합의 내용 문서화</h4>
                    <p style={{ fontSize: 13, margin: 0 }}>조율된 기준이 문서 형태로 정리됩니다</p>
                  </div>
                </div>
                <div className="card feature-card dark-card" style={{ padding: "20px 24px", display: "flex", flexDirection: "row", alignItems: "center", textAlign: "left", gap: 16 }}>
                  <div className="card-icon check-icon" style={{ marginBottom: 0, width: 36, height: 36, fontSize: 18, flexShrink: 0 }}>✓</div>
                  <div>
                    <h4 style={{ marginBottom: 4, fontSize: 16 }}>팀원별 최종 확인</h4>
                    <p style={{ fontSize: 13, margin: 0 }}>누가 어떤 기준에 동의했는지 기록</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="output-visual animate-fade-up delay-2">
              <Image 
                src="/images/document.png" 
                alt="Document Mockup" 
                width={500} 
                height={500} 
              />
            </div>
          </div>
        </div>
      </section>

      {/* 7. Differentiation */}
      <section className="section bg-soft">
        <div className="container">
          <div className="section-header animate-fade-up">
            <h2 className="section-title">CoSync는 단순 진단도, 단순 문서 툴도 아닙니다</h2>
          </div>

          <div className="diff-list animate-fade-up delay-1">
            <div className="diff-item">
              <h4>일반 협업 툴과 다릅니다</h4>
              <p>일정과 업무를 관리하는 것이 아니라, 팀의 기준과 권리관계를 정리합니다.</p>
            </div>
            <div className="diff-item delay-1">
              <h4>지분 계산기가 아닙니다</h4>
              <p>지분 숫자보다 먼저, 그 기준부터 맞춥니다.</p>
            </div>
            <div className="diff-item delay-2">
              <h4>법률 서비스가 아닙니다</h4>
              <p>다만 실제 법률 전문가 자문을 바탕으로, 공동창업팀의 핵심 쟁점을 반영해 설계했습니다.</p>
            </div>
          </div>
          <p className="diff-closing animate-fade-up delay-3">
            CoSync는 기준 차이 확인부터 합의안 정리, 문서화와 이력 관리까지 하나의 흐름으로 연결합니다.
          </p>
        </div>
      </section>

      {/* 8. FAQ */}
      <section id="faq" className="section">
        <div className="container faq-container animate-fade-up">
          <h2 className="section-title text-center mb-8">자주 묻는 질문</h2>
          
          <div className="faq-list">
            <div className="faq-item">
              <div className="faq-q">Q. CoSync는 지분만 다루는 서비스인가요?</div>
              <div className="faq-a">A. 아닙니다. CoSync는 역할 및 책임, 지분 및 수익, 이탈 및 정리 등 공동창업팀의 핵심 운영 기준 전반을 다룹니다.</div>
            </div>
            <div className="faq-item">
              <div className="faq-q">Q. 법적인 효력이 있는 계약서인가요?</div>
              <div className="faq-a">A. 아닙니다. CoSync의 결과물은 팀 내부 기준을 정리한 합의안 문서이며, 필요 시 후속 법률 문서 작성의 기초 자료로 활용할 수 있습니다.</div>
            </div>
            <div className="faq-item">
              <div className="faq-q">Q. 아직 지분을 정할 단계가 아닌데도 사용할 수 있나요?</div>
              <div className="faq-a">A. 네. 오히려 지분 논의 이전에 역할과 책임, 기여 기준부터 먼저 정리하는 것이 더 효과적입니다.</div>
            </div>
            <div className="faq-item">
              <div className="faq-q">Q. 팀원 한 명만 먼저 시작할 수 있나요?</div>
              <div className="faq-a">A. 가능합니다. 먼저 본인의 기준을 정리한 뒤, 초대 링크를 통해 다른 공동창업자를 합류시킬 수 있습니다. 팀원 모두가 입력을 완료하면 비교와 조율이 시작됩니다.</div>
            </div>
          </div>
        </div>
      </section>

      {/* 9. Final CTA */}
      <section className="section cta-section">
        <div className="container text-center animate-fade-up">
          <h2 className="section-title">공동창업의 기준, 나중이 아니라 지금 정리하십시오</h2>
          <p className="section-sub mb-8 text-white-80">
            역할, 지분, 이탈 기준을 구두로 넘기지 말고<br />
            우리 팀이 실제로 채택할 합의안 문서로 정리해 보세요.
          </p>
          <Link href="/onboarding" className="btn btn-primary btn-lg">
            지금 우리 팀 기준 맞추기 시작하기
          </Link>
          <p className="cta-hint mt-4">🔒 5분 만에 우리 팀의 기준 차이를 확인해보세요</p>
        </div>
      </section>

      <Footer />
    </main>
  );
}
