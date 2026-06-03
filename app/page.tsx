"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { TopNav } from "../components/TopNav";
import { Footer } from "../components/Footer";

function AnimatedStatRing({ value, delayMs = 0 }: { value: number; delayMs?: number }) {
  const ringRef = useRef<HTMLDivElement | null>(null);
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const node = ringRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      {
        threshold: 0.45
      }
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) {
      setProgress(0);
      return;
    }

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    if (mediaQuery.matches) {
      setProgress(value);
      return;
    }

    let frameId = 0;
    let timeoutId = 0;

    timeoutId = window.setTimeout(() => {
      const start = performance.now();
      const duration = 1200;

      const tick = (now: number) => {
        const elapsed = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - elapsed, 3);
        setProgress(value * eased);

        if (elapsed < 1) {
          frameId = window.requestAnimationFrame(tick);
        }
      };

      frameId = window.requestAnimationFrame(tick);
    }, delayMs);

    return () => {
      window.clearTimeout(timeoutId);
      window.cancelAnimationFrame(frameId);
    };
  }, [delayMs, isVisible, value]);

  const displayValue = Math.round(progress);
  const fill = progress.toFixed(1);

  return (
    <div
      ref={ringRef}
      style={{
        position: "relative",
        width: "170px",
        height: "170px",
        borderRadius: "50%",
        background: `conic-gradient(var(--brand) 0% ${fill}%, #f1f3f9 ${fill}% 100%)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: "32px"
      }}
    >
      <div style={{ position: "absolute", inset: 0, borderRadius: "50%", boxShadow: "inset 0 4px 10px rgba(0,0,0,0.06)" }} />
      <div
        style={{
          width: "130px",
          height: "130px",
          background: "#fff",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          boxShadow: "0 4px 16px rgba(0,0,0,0.06)"
        }}
      >
        <div
          style={{
            fontSize: "48px",
            fontWeight: 800,
            color: "var(--brand)",
            lineHeight: 1,
            letterSpacing: "-1.5px",
            transform: "translateX(2px)"
          }}
        >
          {displayValue}
          <span style={{ fontSize: "24px", color: "var(--muted)", letterSpacing: "0" }}>%</span>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <main className="page landing-page">
      <TopNav 
        links={[
          { label: "Why CoSync", href: "#whycosync" },
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
            <h1 className="hero-title motion-headline">
              지분 나누기 전에, <br />
              <span className="accent">기준부터 정리하세요</span>
            </h1>
            <p className="hero-sub">
              지분, 역할, 보상, 이탈 기준은 서로 연결되어 있습니다.
              <br />
              CoSync는 공동창업자 간 기준 차이를 비교하고, 팀 운영에 필요한 핵심 기준을 하나의 합의안 문서로 정리하는 서비스입니다.
            </p>
            <div className="hero-actions">
              <Link href="/onboarding" className="btn btn-primary btn-lg motion-cta">
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
      <section id="why" className="section bg-soft" style={{ position: 'relative', zIndex: 1, paddingBottom: '96px' }}>
        <div className="container">
          <div className="section-header animate-fade-up">
            <h2 className="section-title">
              공동창업 갈등은 감정 문제가 아니라<br />
              <span className="accent">기준 불일치가 만든 리스크</span>입니다.
            </h2>
            <p className="section-sub" style={{ marginTop: '16px' }}>
              이 문제는 단순한 성격 차이로 시작하지 않습니다.<br />
              <strong style={{ color: "var(--ink)", fontWeight: 600 }}>기준이 맞지 않으면 갈등은 실제 비용으로 번질 수 있습니다.</strong>
            </p>
          </div>

          <div className="animate-fade-up delay-1" style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
            gap: '24px', 
            maxWidth: '860px',
            margin: '56px auto 48px'
          }}>
            <div className="card" style={{ padding: '48px 32px', textAlign: 'center', background: '#fff', border: '1px solid #edf0f7', borderRadius: '24px', boxShadow: '0 12px 36px rgba(29,35,63,0.04)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <AnimatedStatRing value={71} />
              <p style={{ fontSize: '16px', color: 'var(--ink)', margin: 0, wordBreak: 'keep-all', lineHeight: 1.85 }}>
                결별을 겪은 공동창업자 응답자들은<br/>
                <span style={{ background: 'rgba(91,91,231,0.08)', color: 'var(--brand)', padding: '4px 12px', borderRadius: '8px', fontWeight: 700, fontSize: '15.5px' }}>회사 방향성 차이</span>를<br/>
                핵심 원인으로 꼽았습니다.
              </p>
            </div>
            
            <div className="card delay-1" style={{ padding: '48px 32px', textAlign: 'center', background: '#fff', border: '1px solid #edf0f7', borderRadius: '24px', boxShadow: '0 12px 36px rgba(29,35,63,0.04)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <AnimatedStatRing value={43} delayMs={180} />
              <p style={{ fontSize: '16px', color: 'var(--ink)', margin: 0, wordBreak: 'keep-all', lineHeight: 1.85 }}>
                <span style={{ background: 'rgba(91,91,231,0.08)', color: 'var(--brand)', padding: '4px 12px', borderRadius: '8px', fontWeight: 700, fontSize: '15.5px' }}>권력다툼과 내부 갈등</span> 때문에<br/>
                공동창업자 바이아웃을<br/>
                겪었다고 답했습니다.
              </p>
            </div>
          </div>

          <div className="animate-fade-up delay-3 bottom-conclusion-box" style={{ 
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px',
            margin: '0 auto', padding: '0 20px'
          }}>
             <div style={{ width: '42px', height: '42px', background: 'rgba(239, 68, 68, 0.08)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e45b5b', flexShrink: 0 }}>
               <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><path d="M12 9v4"></path><path d="M12 17h.01"></path></svg>
             </div>
             <div style={{ textAlign: 'left' }}>
                <p style={{ fontSize: '18px', fontWeight: 700, color: 'var(--ink)', margin: '0 0 4px 0' }}>
                  합의되지 않은 기준은 단순한 의견 차이가 아니라 <span style={{ color: '#e45b5b' }}>실제 분리 비용 신호</span>입니다.
                </p>
                <p style={{ fontSize: '13.5px', color: 'var(--muted)', margin: 0 }}>
                  출처: Fuel Ventures 인용 창업자 조사
                </p>
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
                <div className="bubble left animate-fade-up delay-1"><span className="tiny-speaker">A</span>“영업과 운영을 다 맡고 있는데,<br />내 기여도가 더 커야 하지 않나?”</div>
                <div className="bubble right animate-fade-up delay-3">“제품 없인 진행도 안 되는데,<br />개발 기여가 더 핵심 아닐까?”<span className="tiny-speaker">B</span></div>
              </div>
              <div className="empathy-column delay-1">
                <div className="badge-wrapper"><span className="badge">근무 기준</span></div>
                <div className="bubble left animate-fade-up delay-2"><span className="tiny-speaker">A</span>“초기엔 다 같이 풀타임으로<br />몰입하는 게 당연하지 않나?”</div>
                <div className="bubble right animate-fade-up delay-4">“지속 가능하려면 근무 강도와<br />방식부터 맞춰야 하지 않나?”<span className="tiny-speaker">B</span></div>
              </div>
              <div className="empathy-column delay-2">
                <div className="badge-wrapper"><span className="badge">저작권 귀속 기준</span></div>
                <div className="bubble left animate-fade-up delay-3"><span className="tiny-speaker">A</span>“법인 설립 전에 내가 만든 건데,<br />내 소유로 남아야하는 거 아닌가?”</div>
                <div className="bubble right animate-fade-up delay-4">“서비스 핵심 자산이니, 법인에<br />귀속해야 나중에 문제 없지!”<span className="tiny-speaker">B</span></div>
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
              <p>다만 법률 전문가 자문을 바탕으로, 공동창업팀 핵심 쟁점을 반영해 설계했습니다.</p>
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
