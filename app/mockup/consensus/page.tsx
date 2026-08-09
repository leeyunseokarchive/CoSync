"use client";

import { useState } from "react";
import { TopNav } from "../../../components/TopNav";
import { Check, ChevronDown, ChevronUp, FileCheck2, MessageCircle, X } from "lucide-react";

const ITEMS = [
  { chapter: "운영 규칙", label: "의사결정 방식", status: "자동 합의", tone: "match", members: ["김민준", "이서연"], answers: ["만장일치", "만장일치"], note: "전원 답변 일치 — 아래 조항이 합의서에 자동 반영됩니다.", clause: "주요 의사결정은 모든 구성원의 만장일치로 결정한다." },
  { chapter: "운영 규칙", label: "회의 및 보고", status: "합의 완료", tone: "resolved", members: ["김민준", "이서연"], answers: ["주 1회", "주 2회"], note: "합의 완료 — 확정 조항:", clause: "정기 회의는 매주 1회 진행하고, 회의록은 24시간 이내 공유한다." },
  { chapter: "의사결정 및 권한", label: "지분 변경 권한", status: "조정중", tone: "voting", members: ["김민준", "이서연"], answers: ["전원 동의", "대표 승인"], note: "김민준님의 제안 · 전원 동의", clause: "지분 변경은 모든 구성원의 사전 동의를 받아야 한다." },
  { chapter: "의사결정 및 권한", label: "대표 권한 범위", status: "제안 필요", tone: "needs", members: ["김민준", "이서연"], answers: ["미응답", "대표에게 위임"], note: "우리 팀의 합의안을 제안해보세요.", clause: "" },
];

export default function ConsensusMockup() {
  const [open, setOpen] = useState(1);

  return (
    <main className="mock-consensus-page">
      <TopNav links={[{ label: "대시보드", href: "/workspace" }, { label: "갭 리포트", href: "#" }]} active="합의 세션" />
      <section className="mock-consensus-body">
        <header className="mock-consensus-head">
          <div className="mock-consensus-label">AGREEMENT SESSION</div>
          <h1>팀 합의 세션</h1>
          <p>갭이 확인된 항목에 대해 합의안을 제안하고 전원 동의로 확정합니다.<br />일치한 항목은 자동으로 합의서에 반영됩니다.</p>
          <div className="mock-team-picker"><span>현재 팀</span><strong>CoSync 팀</strong><ChevronDown size={16} /></div>
          <div className="mock-progress"><span>합의 진행 1/2</span><b>50%</b><div><i /></div></div>
        </header>

        {["운영 규칙", "의사결정 및 권한"].map((chapter) => (
          <section className="mock-consensus-cat" key={chapter}>
            <h2>{chapter === "운영 규칙" ? "제1장." : "제2장."} {chapter}</h2>
            <div className="mock-items">
              {ITEMS.filter((item) => item.chapter === chapter).map((item) => {
                const index = ITEMS.indexOf(item);
                const isOpen = open === index;
                return <article className={`mock-consensus-item ${isOpen ? "open" : ""}`} key={item.label}>
                  <button className="mock-item-head" type="button" onClick={() => setOpen(isOpen ? -1 : index)}>
                    <strong>{item.label}</strong><span className={`mock-chip ${item.tone}`}>{item.status}</span>{isOpen ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
                  </button>
                  {isOpen && <div className="mock-item-body">
                    <div className="mock-positions">{item.members.map((name, i) => <div key={name}><small>{name}{i === 0 ? " (나)" : ""}</small><b>{item.answers[i]}</b></div>)}</div>
                    {item.tone === "voting" && <div className="mock-vote-status"><span>김민준: 대기</span><span className="approved">이서연: 동의</span></div>}
                    <div className={`mock-note ${item.tone}`}>
                      {item.tone === "resolved" && <Check size={15} />}{item.note}
                      {item.clause && <div className="mock-clause">{item.clause}</div>}
                      {item.tone === "resolved" && <button type="button" className="mock-reopen">재논의하기</button>}
                    </div>
                    {item.tone === "voting" && <div className="mock-actions"><button type="button" className="mock-primary"><Check size={15} /> 동의</button><button type="button" className="mock-secondary"><X size={15} /> 반대</button></div>}
                    {item.tone === "needs" && <div className="mock-propose"><strong>합의안 제안</strong><div className="mock-options"><button type="button">대표에게 위임</button><button type="button">전원 동의</button><button type="button">별도 규칙</button></div><textarea placeholder="우리 팀 상황에 맞는 조항을 입력해보세요." /><button type="button" className="mock-primary">제안하기</button></div>}
                    {(item.tone === "voting" || item.tone === "resolved") && <div className="mock-comments"><MessageCircle size={14} /> 의견 <span>아직 의견이 없습니다.</span></div>}
                  </div>}
                </article>;
              })}
            </div>
          </section>
        ))}

        <div className="mock-finalize"><button type="button" className="mock-primary"><FileCheck2 size={17} /> 합의안 생성하기</button><p>모든 갭 항목이 합의 완료되면 합의안을 생성할 수 있습니다.</p></div>
      </section>
      <style dangerouslySetInnerHTML={{ __html: `
        .mock-consensus-page{min-height:100vh;background:#f8fafc}.mock-consensus-body{max-width:920px;margin:auto;padding:56px 24px 100px}.mock-consensus-head{position:relative;margin-bottom:44px}.mock-consensus-label{color:#5858e2;font-size:12px;font-weight:800;letter-spacing:2px;margin-bottom:12px}.mock-consensus-head h1{font-size:38px;color:#0f172a;margin:0 0 12px}.mock-consensus-head p{color:#64748b;line-height:1.7;margin:0}.mock-team-picker{display:inline-flex;gap:12px;align-items:center;margin-top:24px;padding:12px 16px;border:1px solid #e2e8f0;border-radius:10px;background:#fff;color:#64748b;font-size:13px}.mock-team-picker strong{color:#0f172a}.mock-progress{position:absolute;right:0;bottom:0;width:220px;color:#64748b;font-size:12px}.mock-progress b{float:right;color:#5858e2}.mock-progress div{height:7px;background:#e2e8f0;border-radius:99px;overflow:hidden;margin-top:9px}.mock-progress i{display:block;width:50%;height:100%;background:#5858e2}.mock-consensus-cat{margin-top:38px}.mock-consensus-cat h2{font-size:16px;color:#334155;margin:0 0 14px}.mock-items{display:grid;gap:10px}.mock-consensus-item{background:#fff;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;box-shadow:0 3px 12px #0f172a08}.mock-item-head{display:flex;align-items:center;width:100%;gap:12px;padding:20px 22px;border:0;background:transparent;color:#334155;text-align:left;cursor:pointer}.mock-item-head strong{flex:1}.mock-chip{padding:5px 10px;border-radius:99px;font-size:11px;font-weight:700}.mock-chip.match{background:#dcfce7;color:#15803d}.mock-chip.resolved{background:#ede9fe;color:#6d28d9}.mock-chip.voting{background:#fef3c7;color:#b45309}.mock-chip.needs{background:#fee2e2;color:#b91c1c}.mock-item-body{border-top:1px solid #f1f5f9;padding:22px}.mock-positions{display:grid;grid-template-columns:1fr 1fr;gap:12px}.mock-positions>div{padding:14px 16px;background:#f8fafc;border-radius:10px}.mock-positions small,.mock-positions b{display:block}.mock-positions small{color:#64748b;margin-bottom:5px}.mock-positions b{color:#0f172a}.mock-note{margin-top:18px;padding:16px;background:#f8fafc;border-radius:10px;color:#475569;font-size:13px;line-height:1.6}.mock-note.resolved{color:#15803d;background:#f0fdf4}.mock-note svg{vertical-align:-3px;margin-right:5px}.mock-clause{margin-top:10px;padding:12px;background:#fff;border-left:3px solid #5858e2;color:#334155}.mock-reopen{margin-top:12px;border:0;background:transparent;color:#64748b;cursor:pointer}.mock-vote-status{display:flex;gap:8px;margin-top:14px}.mock-vote-status span{padding:6px 10px;border-radius:99px;background:#fef3c7;color:#92400e;font-size:12px}.mock-vote-status .approved{background:#dcfce7;color:#15803d}.mock-actions,.mock-options{display:flex;gap:8px;margin-top:14px}.mock-primary,.mock-secondary{display:inline-flex;align-items:center;gap:6px;padding:10px 16px;border:0;border-radius:8px;font-weight:700;cursor:pointer}.mock-primary{background:#5858e2;color:#fff}.mock-secondary{background:#f1f5f9;color:#475569}.mock-propose{margin-top:18px;padding-top:18px;border-top:1px solid #f1f5f9}.mock-options button{border:1px solid #e2e8f0;background:#fff;border-radius:8px;padding:9px 12px;color:#475569;cursor:pointer}.mock-propose textarea{display:block;width:100%;min-height:74px;margin:14px 0;padding:12px;border:1px solid #e2e8f0;border-radius:8px;resize:vertical;font:inherit}.mock-comments{display:flex;align-items:center;gap:6px;margin-top:18px;color:#475569;font-size:13px}.mock-comments span{color:#94a3b8;margin-left:8px}.mock-finalize{text-align:center;margin-top:44px}.mock-finalize p{color:#94a3b8;font-size:12px}.mock-consensus-item.open{border-color:#c7d2fe}@media(max-width:700px){.mock-consensus-head h1{font-size:30px}.mock-progress{position:static;margin-top:24px;width:100%}.mock-positions{grid-template-columns:1fr}.mock-item-head{padding:16px}.mock-item-body{padding:16px}.mock-options{flex-wrap:wrap}}
      ` }} />
    </main>
  );
}
