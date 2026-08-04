import { TopNav } from "../../../components/TopNav";
import { CircleAvatar } from "../../../components/Brand";

// ponytail: 사업계획서 스크린샷용 정적 목업 — 상태/저장 로직 없음, 실서비스 연결 시 별도 구현
export default function InvestmentCriteriaMockup() {
  return (
    <main className="page">
      <TopNav
        links={[
          { label: "대시보드", href: "/workspace" },
          { label: "운영 기준 설정", href: "#" },
          { label: "갭 리포트", href: "/gap-report" },
        ]}
        active="운영 기준 설정"
      />

      <section className="invest-container">
        <div className="invest-head">
          <div>
            <div className="gap-breadcrumb">합의세션 &gt; 의사결정 및 권한</div>
            <span className="question-step">STEP 3 / 10</span>
            <h1 className="invest-title">주요 의사결정 기준 정하기</h1>
            <p className="invest-sub">
              투자, 채용 등 중요한 순간에 우리 팀의 결정 기준을 미리 정해보세요.
            </p>
          </div>
        </div>

        <div className="invest-grid">
          <div className="card invest-card">
            <h3>투자 검토 기준</h3>
            <p>투자 논의를 시작할 기준을 정해주세요.</p>
            <label className="label">투자 금액</label>
            <div className="invest-input-row">
              <input className="input select invest-input" defaultValue="₩ 100,000,000" readOnly />
              <span>이상</span>
            </div>
            <div className="invest-or">또는</div>
            <label className="label">지분 희석률</label>
            <div className="invest-input-row">
              <input className="input select invest-input narrow" defaultValue="10" readOnly />
              <span>% 이상</span>
            </div>
          </div>

          <div className="card invest-card">
            <h3>최종 결정 방식</h3>
            <p>최종 결정 시 어떤 방식으로 결정할까요?</p>
            <div className="invest-radios">
              <label className="invest-radio"><input type="radio" name="decide" readOnly /> 대표 결정</label>
              <label className="invest-radio checked"><input type="radio" name="decide" defaultChecked readOnly /> 과반수 찬성</label>
              <label className="invest-radio"><input type="radio" name="decide" readOnly /> 2/3 이상 찬성</label>
              <label className="invest-radio"><input type="radio" name="decide" readOnly /> 만장일치</label>
              <label className="invest-radio"><input type="radio" name="after" readOnly /> 기타</label>
            </div>
          </div>

          <div className="card invest-card">
            <h3>합의 방식</h3>
            <p>의견 차이가 발생했을 때 합의 방식을 정해주세요.</p>
            <label className="label">합의 시도 기간</label>
            <div className="invest-input-row">
              <input className="input select invest-input narrow" defaultValue="7" readOnly />
              <span>일</span>
            </div>
            <label className="label" style={{ marginTop: 14 }}>이후 처리 방식</label>
            <div className="invest-radios">
              <label className="invest-radio"><input type="radio" name="after" readOnly /> 추가 논의</label>
              <label className="invest-radio checked"><input type="radio" name="after" defaultChecked readOnly /> 외부 전문가 의견 참고</label>
              <label className="invest-radio"><input type="radio" name="after" readOnly /> 대표 최종 결정</label>
              <label className="invest-radio"><input type="radio" name="after" readOnly /> 기타</label>
            </div>
          </div>
        </div>

        <div className="card invest-card invest-extra">
          <h3>추가 합의 내용</h3>
          <p>팀 상황에 맞는 추가 기준을 작성할 수 있습니다.</p>
          <textarea
            className="invest-textarea"
            rows={2}
            defaultValue="투자 계약 체결 전 모든 공동창업자의 동의를 확인한다."
            readOnly
          />
        </div>

        <div className="invest-bottom">
          <div className="invest-cta">
            <button className="btn btn-primary">다음 →</button>
          </div>
        </div>
      </section>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .invest-container { width: min(1280px, 94vw); margin: 0 auto; padding: 28px 0 40px; display: flex; flex-direction: column; gap: 18px; }
        .invest-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 24px; }
        .invest-title { font-size: 30px; font-weight: 800; color: #0f172a; margin: 10px 0 6px; letter-spacing: -0.02em; }
        .invest-sub { color: var(--muted); font-size: 15px; line-height: 1.6; }
        .invest-team { padding: 16px 20px; border-radius: var(--radius-md); display: flex; flex-direction: column; gap: 10px; }
        .invest-team-label { font-size: 12px; font-weight: 700; color: var(--brand); letter-spacing: 0.04em; }
        .invest-team-avatars { display: flex; gap: 6px; }
        .invest-team-pills { display: flex; gap: 8px; flex-wrap: wrap; }
        .invest-pill { font-size: 12px; font-weight: 600; padding: 5px 12px; border-radius: 999px; background: #f1f5f9; color: #64748b; white-space: nowrap; }
        .invest-pill.done { background: #ecfdf5; color: #059669; }
        .invest-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
        .invest-card { padding: 22px 24px; border-radius: var(--radius-md); }
        .invest-card h3 { font-size: 17px; font-weight: 700; color: #0f172a; margin-bottom: 4px; }
        .invest-card > p { font-size: 13px; color: var(--muted); margin-bottom: 16px; line-height: 1.5; }
        .invest-input-row { display: flex; align-items: center; gap: 10px; font-size: 14px; color: #475569; font-weight: 600; }
        .invest-input { max-width: 200px; font-weight: 600; color: var(--brand); }
        .invest-input.narrow { max-width: 90px; text-align: center; }
        .invest-or { text-align: left; font-size: 12px; font-weight: 700; color: #9aa2b2; margin: 12px 0; }
        .invest-radios { display: flex; flex-direction: column; gap: 8px; }
        .invest-radio { display: flex; align-items: center; gap: 10px; padding: 10px 14px; border: 1.5px solid #e1e4ed; border-radius: 12px; font-size: 14px; font-weight: 500; color: #475569; cursor: pointer; background: #fff; }
        .invest-radio input { accent-color: var(--brand); width: 15px; height: 15px; }
        .invest-radio.checked { border-color: var(--brand); background: #f5f5ff; color: #4338ca; font-weight: 600; box-shadow: 0 0 0 1px var(--brand); }
        .invest-extra { padding: 20px 24px; }
        .invest-extra > p { margin-bottom: 10px; }
        .invest-textarea { width: 100%; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px 16px; font: inherit; font-size: 14px; line-height: 1.6; color: #334155; resize: none; background: #f9faff; }
        .invest-bottom { display: grid; grid-template-columns: 1fr auto; gap: 24px; align-items: center; }
        .invest-guide { flex-direction: column; gap: 8px; }
        .invest-guide strong { font-size: 13px; color: #334155; }
        .invest-guide-items { display: flex; gap: 18px; flex-wrap: wrap; font-size: 13px; color: #475569; font-weight: 500; }
        .invest-cta { display: flex; flex-direction: column; align-items: flex-end; gap: 8px; }
        .invest-cta-hint { font-size: 12px; color: #9aa2b2; }
        @media (max-width: 1000px) { .invest-grid { grid-template-columns: 1fr; } .invest-head { flex-direction: column; } .invest-bottom { grid-template-columns: 1fr; } }
      `,
        }}
      />
    </main>
  );
}
