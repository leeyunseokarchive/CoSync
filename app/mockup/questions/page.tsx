import { TopNav } from "../../../components/TopNav";
import { LayoutGrid, Clock, CheckCircle2, HelpCircle, ArrowLeft, ArrowRight } from "lucide-react";

// ponytail: 사업계획서 스크린샷용 정적 목업 — reference/CoSync UI/Questions/code.html 디자인 재현.
// 폰트(Pretendard 전역)와 TopNav만 서비스 것으로 교체, Tailwind CDN 대신 동일 스타일 CSS 재현.
const SIDEBAR = [
  { ko: "운영 규칙", en: "Operating Rules", active: false },
  { ko: "의사결정 및 권한", en: "Decision & Authority", active: false },
  { ko: "역할 및 책임", en: "Role & Responsibility", active: false },
  { ko: "자금 및 재무", en: "Funding & Finance", active: true },
  { ko: "투자 회수 및 종료", en: "Exit & Termination", active: false },
];

const ROWS = [
  { item: "아이디어·기술 기여", desc: "핵심 기술 및 특허 제공, 사업 원형 기여도", me: 18, other: 8, rate: "0.20" },
  { item: "역할 및 책임 (R&R)", desc: "직책의 중요도 및 실무 실행 책임 범위", me: 20, other: 10, rate: "0.25" },
  { item: "시간 및 몰입도", desc: "실제 투입 시간 및 기회비용 (Full-time 여부)", me: 15, other: 5, rate: "0.20" },
  { item: "자본 및 유무형 자산", desc: "현금 출자액 및 사무실/장비 지원 기여도", me: 12, other: 4, rate: "0.20" },
  { item: "네트워크 및 세일즈", desc: "주요 고객 확보 및 투자자 유치 가능성", me: 10, other: 2, rate: "0.15" },
];

export default function DeepQuestionsMockup() {
  return (
    <div className="qm-page">
      <TopNav
        links={[
          { label: "대시보드", href: "/workspace" },
          { label: "합의 히스토리", href: "#" },
          { label: "설정", href: "#" },
        ]}
        active="합의 히스토리"
      />

      <div className="qm-shell">
        <aside className="qm-sidebar">
          <div className="qm-sidebar-label">Agreement Phase</div>
          <nav className="qm-sidebar-nav">
            {SIDEBAR.map((s) => (
              <button key={s.ko} className={`qm-side-item ${s.active ? "active" : ""}`} type="button">
                <span className="qm-side-ko">{s.ko}</span>
                <span className="qm-side-en">{s.en}</span>
              </button>
            ))}
          </nav>
        </aside>

        <main className="qm-main">
          <div className="qm-content">

            <div className="qm-premium-card">
              <div className="qm-card-head">
                <div className="qm-eyebrow-row">
                  <span className="qm-eyebrow-bar" />
                  <span className="qm-eyebrow">Contribution Analysis</span>
                  <span className="qm-guide-chip"><HelpCircle size={14} /> 가이드라인</span>
                </div>
                <h2>정밀한 지분 산정을 위해 항목별 점수와 가중치를 설정하십시오.</h2>
                <p className="qm-card-sub">
                  설정된 값은 창업자 간 합의의 법적 근거가 됩니다. 모든 가중치의 합은 <span className="qm-underline">1.00</span>이 되어야 합니다.
                </p>
              </div>

              <div className="qm-table-wrap">
                <table className="qm-table">
                  <thead>
                    <tr>
                      <th style={{ width: 200 }}>평가 항목</th>
                      <th>정성적 평가 기준</th>
                      <th style={{ width: 120, textAlign: "center" }}>나의 점수<br /><span className="qm-th-sub">(0~20)</span></th>
                      <th style={{ width: 120, textAlign: "center" }}>상대 점수<br /><span className="qm-th-sub">(0~20)</span></th>
                      <th style={{ width: 120, textAlign: "center" }}>가중치<br /><span className="qm-th-sub">(RATE)</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {ROWS.map((r) => (
                      <tr key={r.item}>
                        <td className="qm-td-item">{r.item}</td>
                        <td className="qm-td-desc">{r.desc}</td>
                        <td><input className="qm-input" defaultValue={r.me} readOnly /></td>
                        <td><input className="qm-input" defaultValue={r.other} readOnly /></td>
                        <td><input className="qm-input rate" defaultValue={r.rate} readOnly /></td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={5}>
                        <div className="qm-result-row">
                          <div className="qm-result-label">
                            <span className="qm-eyebrow small">Result Calculation</span>
                            <span className="qm-result-title">매트릭스 기반 자동 계산 지분율</span>
                          </div>
                          <div className="qm-result-values">
                            <div className="qm-result-col">
                              <span className="qm-result-who">나 (본인)</span>
                              <span className="qm-result-num brand">75<small>%</small> <CheckCircle2 size={18} className="qm-check" /></span>
                            </div>
                            <div className="qm-result-divider" />
                            <div className="qm-result-col">
                              <span className="qm-result-who">공동창업자</span>
                              <span className="qm-result-num">25<small>%</small></span>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>

      <footer className="qm-footer">
        <button className="qm-back-btn" type="button">
          <ArrowLeft size={18} /> 이전 단계로
        </button>
        <div className="qm-footer-right">
          <div className="qm-progress">
            <div className="qm-progress-meta">
              <span className="qm-progress-label">Agreement Progress</span>
              <span className="qm-progress-pct">80%</span>
            </div>
            <div className="qm-progress-bar"><span style={{ width: "80%" }} /></div>
          </div>
          <button className="qm-cta" type="button">
            계속 입력하기 <ArrowRight size={20} />
          </button>
        </div>
      </footer>

      <style dangerouslySetInnerHTML={{
        __html: `
        .qm-page {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background:
            radial-gradient(at 0% 0%, rgba(79, 70, 229, 0.12) 0px, transparent 50%),
            radial-gradient(at 100% 0%, rgba(16, 185, 129, 0.08) 0px, transparent 50%),
            radial-gradient(at 100% 100%, rgba(79, 70, 229, 0.08) 0px, transparent 50%),
            radial-gradient(at 0% 100%, rgba(16, 185, 129, 0.08) 0px, transparent 50%),
            #F8FAFC;
        }
        .qm-shell { flex: 1; display: flex; max-width: 1600px; margin: 0 auto; width: 100%; }

        .qm-sidebar { width: 272px; flex-shrink: 0; padding: 40px 0; display: flex; flex-direction: column; border-right: 1px solid rgba(226, 232, 240, 0.4); }
        .qm-sidebar-label { padding: 0 32px; margin-bottom: 32px; font-size: 10px; font-weight: 900; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.25em; }
        .qm-sidebar-nav { display: flex; flex-direction: column; }
        .qm-side-item { position: relative; display: flex; flex-direction: column; align-items: flex-start; gap: 2px; padding: 16px 32px; background: none; border: none; cursor: pointer; text-align: left; transition: transform 0.2s; }
        .qm-side-item:hover:not(.active) { transform: translateX(4px); }
        .qm-side-ko { font-size: 15px; font-weight: 700; color: #94a3b8; }
        .qm-side-en { font-size: 10px; font-weight: 500; color: rgba(148, 163, 184, 0.6); text-transform: uppercase; letter-spacing: 0.08em; }
        .qm-side-item.active .qm-side-ko { font-weight: 800; color: #0f172a; }
        .qm-side-item.active .qm-side-en { color: rgba(79, 70, 229, 0.7); }
        .qm-side-item.active::before { content: ""; position: absolute; left: 0; top: 50%; transform: translateY(-50%); width: 4px; height: 32px; background: #4F46E5; border-radius: 0 999px 999px 0; }

        .qm-main { flex: 1; overflow-y: auto; padding: 32px 64px 120px; }
        .qm-content { max-width: 1000px; margin: 0 auto; }

        .qm-select-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 28px; }
        .qm-select-card { position: relative; display: flex; flex-direction: column; align-items: flex-start; gap: 14px; padding: 26px 32px; border-radius: 32px; background: rgba(255, 255, 255, 0.6); border: 1px solid rgba(226, 232, 240, 0.5); box-shadow: 0 1px 2px rgba(0,0,0,0.03); text-align: left; cursor: pointer; transition: all 0.2s; }
        .qm-select-card:hover:not(.selected) { background: rgba(255, 255, 255, 0.9); }
        .qm-select-card.selected { background: rgba(255, 255, 255, 0.95); border: 2px solid #4F46E5; box-shadow: 0 20px 25px -5px rgba(79, 70, 229, 0.1); }
        .qm-select-icon { width: 48px; height: 48px; border-radius: 16px; background: #f1f5f9; color: #94a3b8; display: inline-flex; align-items: center; justify-content: center; }
        .qm-select-icon.active { background: rgba(79, 70, 229, 0.1); color: #4F46E5; }
        .qm-select-card h3 { font-size: 19px; font-weight: 900; color: #0f172a; letter-spacing: -0.02em; }
        .qm-select-card p { font-size: 14px; color: #64748b; margin-top: 8px; line-height: 1.45; font-weight: 500; }
        .qm-selected-badge { position: absolute; top: 32px; right: 32px; display: inline-flex; align-items: center; gap: 6px; color: #10B981; font-weight: 900; font-size: 11px; letter-spacing: 0.05em; background: rgba(16, 185, 129, 0.05); padding: 4px 12px; border-radius: 999px; border: 1px solid rgba(16, 185, 129, 0.1); }

        .qm-premium-card { background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(24px); border: 1px solid rgba(255, 255, 255, 0.2); box-shadow: 0 20px 50px rgba(79, 70, 229, 0.05); border-radius: 40px; padding: 40px 48px; display: flex; flex-direction: column; gap: 28px; }
        .qm-card-head { display: flex; flex-direction: column; gap: 14px; }
        .qm-eyebrow-row { display: flex; align-items: center; gap: 12px; }
        .qm-eyebrow-bar { height: 3px; width: 32px; background: #4F46E5; border-radius: 999px; }
        .qm-eyebrow { color: #4F46E5; font-weight: 900; font-size: 11px; letter-spacing: 0.3em; text-transform: uppercase; }
        .qm-eyebrow.small { letter-spacing: 0.25em; }
        .qm-guide-chip { display: inline-flex; align-items: center; gap: 6px; margin-left: 12px; padding: 6px 12px; border-radius: 999px; background: #f8fafc; border: 1px solid #e2e8f0; font-size: 11px; font-weight: 900; color: #475569; cursor: pointer; }
        .qm-guide-chip svg { color: #4F46E5; }
        .qm-card-head h2 { font-size: 30px; font-weight: 900; line-height: 1.25; color: #0f172a; letter-spacing: -0.02em; }
        .qm-card-sub { font-size: 15px; color: #64748b; font-weight: 500; line-height: 1.6; max-width: 42rem; }
        .qm-underline { color: #4F46E5; font-weight: 700; text-decoration: underline; text-underline-offset: 4px; }

        .qm-table-wrap { overflow: hidden; border: 1px solid #f1f5f9; border-radius: 24px; background: rgba(255, 255, 255, 0.4); }
        .qm-table { width: 100%; border-collapse: collapse; }
        .qm-table th { padding: 12px 16px; text-align: left; font-size: 10px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em; background: rgba(248, 250, 252, 0.3); border-bottom: 1px solid #f1f5f9; line-height: 1.5; }
        .qm-th-sub { font-size: 9px; font-weight: 900; color: rgba(79, 70, 229, 0.6); }
        .qm-table td { padding: 13px 16px; font-size: 13px; border-bottom: 1px solid #f8fafc; }
        .qm-table tbody tr:last-child td { border-bottom: none; }
        .qm-td-item { font-weight: 900; color: #1e293b; }
        .qm-td-desc { color: #64748b; font-weight: 500; line-height: 1.4; }
        .qm-input { width: 100%; background: rgba(255, 255, 255, 0.8); border: 1px solid #e2e8f0; border-radius: 8px; padding: 6px 8px; font: inherit; font-size: 13px; font-weight: 700; color: #1e293b; text-align: center; box-shadow: 0 1px 2px rgba(0,0,0,0.03); }
        .qm-input.rate { border-color: rgba(79, 70, 229, 0.2); background: rgba(79, 70, 229, 0.03); }

        .qm-table tfoot td { background: rgba(79, 70, 229, 0.04); padding: 22px 40px; border-bottom: none; }
        .qm-result-row { display: flex; align-items: center; justify-content: space-between; gap: 24px; flex-wrap: wrap; }
        .qm-result-label { display: flex; flex-direction: column; gap: 6px; }
        .qm-result-title { font-size: 19px; font-weight: 900; color: #0f172a; }
        .qm-result-values { display: flex; align-items: center; gap: 56px; }
        .qm-result-col { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
        .qm-result-who { font-size: 13px; font-weight: 700; color: #94a3b8; }
        .qm-result-num { font-size: 36px; font-weight: 900; color: #334155; letter-spacing: -0.04em; display: inline-flex; align-items: center; gap: 10px; }
        .qm-result-num small { font-size: 20px; margin-left: 2px; }
        .qm-result-num.brand { color: #4F46E5; }
        .qm-check { color: #10B981; }
        .qm-result-divider { width: 1px; height: 48px; background: rgba(226, 232, 240, 0.6); }

        .qm-footer { position: fixed; bottom: 0; left: 0; width: 100%; height: 96px; background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(24px); border-top: 1px solid rgba(226, 232, 240, 0.5); box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.02); z-index: 100; }
        .qm-footer { display: flex; align-items: center; justify-content: space-between; padding: 0 48px; }
        .qm-back-btn { display: inline-flex; align-items: center; gap: 12px; padding: 10px 20px; border-radius: 16px; border: none; background: none; color: #94a3b8; font-size: 15px; font-weight: 700; cursor: pointer; transition: all 0.2s; }
        .qm-back-btn:hover { color: #4F46E5; background: #f8fafc; }
        .qm-footer-right { display: flex; align-items: center; gap: 56px; }
        .qm-progress { display: flex; flex-direction: column; align-items: flex-end; gap: 10px; }
        .qm-progress-meta { display: flex; align-items: center; gap: 16px; }
        .qm-progress-label { font-size: 10px; font-weight: 900; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.2em; }
        .qm-progress-pct { font-size: 14px; font-weight: 900; color: #4F46E5; }
        .qm-progress-bar { width: 224px; height: 8px; background: rgba(241, 245, 249, 0.8); border: 1px solid rgba(226, 232, 240, 0.3); border-radius: 999px; overflow: hidden; padding: 1px; }
        .qm-progress-bar span { display: block; height: 100%; background: #4F46E5; border-radius: 999px; box-shadow: 0 0 12px rgba(79, 70, 229, 0.3); }
        .qm-cta { height: 64px; padding: 0 56px; background: #4F46E5; color: #fff; font-size: 17px; font-weight: 900; border: none; border-radius: 20px; box-shadow: 0 15px 35px rgba(79, 70, 229, 0.3); cursor: pointer; display: inline-flex; align-items: center; gap: 12px; transition: all 0.2s; font-family: inherit; }
        .qm-cta:hover { background: #4338CA; transform: scale(1.02); }
        .qm-cta:active { transform: scale(0.98); }

        @media (max-width: 1100px) {
          .qm-sidebar { display: none; }
          .qm-main { padding: 32px 24px 140px; }
          .qm-select-grid { grid-template-columns: 1fr; }
        }
      `}} />
    </div>
  );
}
