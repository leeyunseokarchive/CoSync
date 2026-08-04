import { TopNav } from "../../../components/TopNav";
import { Footer } from "../../../components/Footer";
import { MessageCircle, ArrowRight, Target } from "lucide-react";

// ponytail: 사업계획서 스크린샷용 정적 목업 — app/questions/page.tsx 레퍼런스 + gap-report(카테고리 바)·consensus(장 구분/칩) 디자인 차용, 데이터/상태 로직 없음
const CATEGORIES = [
  { label: "역할 & 책임", status: "critical" as const, statusLabel: "충돌 1" },
  { label: "이탈 & 회수", status: "critical" as const, statusLabel: "충돌 1" },
  { label: "비전 & 가치관", status: "low" as const, statusLabel: "일치" },
  { label: "조달 & 운용", status: "high" as const, statusLabel: "차이 1" },
  { label: "의사결정 & 실행", status: "low" as const, statusLabel: "일치" },
  { label: "지분 & 보상", status: "low" as const, statusLabel: "일치" },
];

const SECTIONS = [
  {
    cat: "역할 & 책임",
    items: [
      {
        label: "회색지대 업무 배정",
        status: "conflict" as const,
        topic: "애매한 업무 담당",
        open: "나 요즘 누가 해야 하는 일인지 애매할 때 좀 불편하더라고. 잠깐 얘기해도 될까?",
        steps: [
          { title: "각자 답답했던 순간 꺼내기", qs: ["그 일 네가 해야 한다고 생각했어, 내가 해야 한다고 생각했어?", "그때 왜 그렇게 생각했어?"] },
          { title: "공통 전제 찾기", qs: ["우리 둘 다 애매한 일은 누군가 챙겨야 한다는 건 동의하지?"] },
          { title: "기준 정하기", qs: ["앞으로 그런 일 생기면 누가 먼저 깃발 꽂기로 할까?", "결정 기한도 같이 정해놓을까?"] },
        ],
        guide: "금액 또는 영향 범위로 기준을 숫자화하세요. 예: 'X만 원 이하 지출이나 담당 영역 안의 결정은 혼자, 그 이상이거나 팀 전체에 영향 가는 건 공유'처럼 기준 하나만 숫자로 합의해도 됩니다.",
      },
    ],
  },
  {
    cat: "이탈 & 회수",
    items: [
      {
        label: "이탈 시 지분 정리",
        status: "conflict" as const,
        topic: "지분 정리 기준",
        open: "지분 얘기 꺼내기 어렵지만 이게 제일 중요한 것 같아서.",
        steps: [
          { title: "각자 생각하는 기준 꺼내기", qs: ["나가게 됐을 때 지분 어떻게 돼야 한다고 생각해?", "그 기준이 왜 맞다고 봐?"] },
          { title: "공통 전제 찾기", qs: ["기여한 만큼 인정받아야 한다는 건 둘 다 동의하지?"] },
          { title: "조건 정하기", qs: ["단계적으로 지분을 확정하는 기간은 어느 정도로 볼까?", "최소 몇 개월은 함께해야 지분 확정이 시작된다고 볼까?"] },
        ],
        guide: "단계적 지분 확정 기간(통상 3~4년), 최소 근속 기간(통상 1년), 이탈 시 회수 가격(액면가 vs 시가)을 지금 합의해두면 나중에 훨씬 수월합니다.",
      },
    ],
  },
  {
    cat: "조달 & 운용",
    items: [
      {
        label: "돈 쓰는 기준",
        status: "diff" as const,
        topic: "단독 결정 한도",
        open: "돈 쓰는 기준이 서로 다를 수 있을 것 같아서.",
        steps: [
          { title: "각자 기준 꺼내기", qs: ["얼마까지는 말 안 하고 써도 된다고 생각해?", "왜 그 금액이야?"] },
          { title: "공통 전제 찾기", qs: ["어느 선 이상은 같이 보는 게 맞다는 건 동의해?"] },
          { title: "한도 정하기", qs: ["단독 결정 한도를 얼마로 할까?", "그 이상은 어떤 방식으로 공유하기로 할까?"] },
        ],
        guide: "단독 결정 가능 금액 상한선을 숫자로 정하세요. 예: 'X만 원 이하는 혼자 결정, 그 이상은 카톡 공유 후 동의 필요'처럼 금액 기준이 가장 명확하고 실행하기 쉽습니다.",
      },
    ],
  },
];

const EMPTY_CATS = CATEGORIES.filter((c) => c.status === "low").map((c) => c.label);

export default function DeepQuestionsMockup() {
  return (
    <main className="page questions-page">
      <TopNav
        links={[
          { label: "갭 리포트", href: "/gap-report" },
          { label: "심층 질문", href: "#" },
          { label: "합의 세션", href: "/consensus" },
        ]}
        active="심층 질문"
      />

      <section className="container questions-body">
        <div className="gap-breadcrumb">진단 &gt; 심층 대화</div>

        <header className="questions-head">
          <div className="questions-eyebrow"><Target size={16} /> 진단 후 심층 대화</div>
          <h1 className="questions-title">지금 꼭 맞춰봐야 할 대화</h1>
          <p className="questions-sub">진단에서 서로 답이 갈린 항목입니다. 카테고리별로 확인하고, 아래 순서대로 대화하면 합의가 쉬워집니다.</p>
          <div className="questions-stat-row">
            <span className="pill conflict">충돌 2</span>
            <span className="pill diff">차이 1</span>
            <span className="pill match">일치 3</span>
          </div>
        </header>

        <div className="questions-layout">
          <aside className="card questions-sidebar">
            <div className="sidebar-title">카테고리별 현황</div>
            <div className="q-cat-list">
              {CATEGORIES.map((c) => (
                <div key={c.label} className="cat-bar">
                  <div className="cat-bar-top">
                    <span className="cat-bar-label">{c.label}</span>
                    <span className={`cat-bar-status ${c.status}`}>{c.statusLabel}</span>
                  </div>
                  <div className="cat-bar-track">
                    <div
                      className={`cat-bar-fill ${c.status}`}
                      style={{ width: c.status === "low" ? "18%" : c.status === "high" ? "62%" : "88%" }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </aside>

          <div className="questions-main">
            {SECTIONS.map((section) => (
              <div key={section.cat} className="q-section">
                <h2 className="q-section-title">{section.cat}</h2>
                <div className="q-cards">
                  {section.items.map((item) => (
                    <article key={item.label} className="q-card">
                      <div className="q-card-head">
                        <h3 className="q-card-title">{item.label}</h3>
                        <span className={`pill ${item.status}`}>{item.status === "conflict" ? "충돌" : "차이"}</span>
                      </div>
                      <p className="q-topic">{item.topic}</p>
                      <div className="q-open">
                        <MessageCircle size={16} />
                        <span>“{item.open}”</span>
                      </div>
                      <ol className="q-steps">
                        {item.steps.map((s, i) => (
                          <li key={i} className="q-step">
                            <span className="q-step-num">{i + 1}</span>
                            <div className="q-step-body">
                              <div className="q-step-title">{s.title}</div>
                              <ul className="q-step-qs">
                                {s.qs.map((q, j) => <li key={j}>{q}</li>)}
                              </ul>
                            </div>
                          </li>
                        ))}
                      </ol>
                      <div className="q-guide"><strong>정하기 팁</strong> {item.guide}</div>
                    </article>
                  ))}
                </div>
              </div>
            ))}

            <div className="q-section">
              <h2 className="q-section-title muted">답변이 일치하는 카테고리</h2>
              <div className="q-empty-row">
                {EMPTY_CATS.map((label) => (
                  <span key={label} className="pill match">{label} · 대화 불필요</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="questions-cta">
          <a href="#" className="btn btn-primary questions-cta-btn">
            합의 세션으로 <ArrowRight size={18} />
          </a>
        </div>
      </section>

      <Footer />

      <style dangerouslySetInnerHTML={{ __html: `
        .questions-body { padding: 40px 0 80px; display: flex; flex-direction: column; gap: 20px; }
        .questions-body .gap-breadcrumb { text-align: center; }
        .questions-head { text-align: center; display: flex; flex-direction: column; gap: 10px; align-items: center; margin-top: 4px; }
        .questions-eyebrow { display: inline-flex; align-items: center; gap: 6px; font-size: 0.95rem; font-weight: 700; color: #5858e2; background: #f5f5ff; padding: 6px 14px; border-radius: 999px; }
        .questions-title { font-size: clamp(1.6rem, 4vw, 2.2rem); font-weight: 800; color: #0f172a; }
        .questions-sub { font-size: 1.05rem; color: #475569; line-height: 1.7; max-width: 560px; }
        .questions-stat-row { display: flex; gap: 10px; margin-top: 4px; }

        .questions-layout { display: grid; grid-template-columns: 240px 1fr; gap: 28px; align-items: start; margin-top: 12px; }
        .questions-sidebar { padding: 22px 20px; display: flex; flex-direction: column; gap: 16px; position: sticky; top: 88px; background: #f8f9fd; border: 1px solid #eef1f6; box-shadow: none; }
        .q-cat-list { display: flex; flex-direction: column; gap: 16px; }

        .q-section { display: flex; flex-direction: column; gap: 14px; margin-bottom: 24px; }
        .q-section-title { font-size: 1.15rem; font-weight: 800; color: #0f172a; padding-left: 12px; border-left: 3px solid #5858e2; }
        .q-section-title.muted { border-left-color: #cbd5e1; color: #94a3b8; font-size: 1rem; }
        .q-cards { display: flex; flex-direction: column; gap: 16px; }
        .q-empty-row { display: flex; flex-wrap: wrap; gap: 8px; }

        .q-card { border: 1px solid #e2e8f0; border-radius: 18px; padding: 26px 28px; background: #fff; display: flex; flex-direction: column; gap: 16px; transition: box-shadow 0.2s, border-color 0.2s; }
        .q-card:hover { box-shadow: 0 6px 18px rgba(15, 23, 42, 0.05); border-color: #d8dcf0; }
        .q-card-head { display: flex; align-items: center; gap: 12px; }
        .q-card-title { flex: 1; font-size: 1.2rem; font-weight: 800; color: #0f172a; }
        .q-topic { font-size: 0.98rem; color: #64748b; font-weight: 600; margin-top: -8px; }
        .q-open { display: flex; align-items: flex-start; gap: 8px; background: #f5f5ff; border-radius: 12px; padding: 14px 18px; color: #4338ca; font-size: 1rem; line-height: 1.6; font-weight: 600; }
        .q-steps { display: flex; flex-direction: column; gap: 14px; list-style: none; }
        .q-step { display: flex; gap: 14px; align-items: flex-start; }
        .q-step-num { flex-shrink: 0; width: 26px; height: 26px; border-radius: 50%; background: #f5f5ff; color: #5858e2; font-weight: 800; font-size: 0.85rem; display: inline-flex; align-items: center; justify-content: center; border: 1.5px solid rgba(91, 91, 231, 0.25); margin-top: 2px; }
        .q-step-body { display: flex; flex-direction: column; gap: 5px; }
        .q-step-title { font-size: 1rem; font-weight: 700; color: #0f172a; }
        .q-step-qs { list-style: disc; padding-left: 20px; display: flex; flex-direction: column; gap: 4px; }
        .q-step-qs li { font-size: 0.95rem; color: #334155; line-height: 1.65; }
        .q-guide { font-size: 0.95rem; color: #334155; line-height: 1.7; background: #f8fafc; border-left: 3px solid #5858e2; border-radius: 8px; padding: 14px 18px; }
        .q-guide strong { color: #4338ca; display: block; margin-bottom: 4px; }

        .questions-cta { text-align: center; padding-top: 8px; }
        .questions-cta-btn { display: inline-flex; align-items: center; gap: 8px; padding: 16px 40px; font-size: 1.1rem; font-weight: 700; border-radius: 14px; }

        @media (max-width: 1000px) {
          .questions-layout { grid-template-columns: 1fr; }
          .questions-sidebar { position: static; }
        }
      `}} />
    </main>
  );
}
