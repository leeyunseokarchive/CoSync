"use client";

import React from "react";
import { TopNav } from "../../../components/TopNav";
import { Check, RotateCcw } from "lucide-react";

// ponytail: "최소 근무 기간(제5조 ①)" 합의 세션 예상 화면 — 실제 /consensus 페이지와 동일 마크업/CSS, 데이터만 하드코딩
const MEMBERS = [
  { id: "m1", name: "김민준", me: true, answer: "3년" },
  { id: "m2", name: "이서연", me: false, answer: "2년" },
  { id: "m3", name: "박도윤", me: false, answer: "5년" },
];

const RESOLVED_YEARS = "3년";
const RESOLVED_CLAUSE = `① 주주는 본 계약 체결일로부터 사유를 불문하고 ${RESOLVED_YEARS}간 다른 주주들 전원의 사전 서면 동의 없이 회사에서 퇴사하여서는 아니된다. 단, 해당 주주에게 책임 없는 사유로 인한 비자발적 퇴사에 대하여는 본 조의 적용을 배제한다.`;

export default function TenureConsensusMockup() {
  return (
    <main className="page consensus-page">
      <TopNav
        links={[{ label: "대시보드", href: "/workspace" }, { label: "갭 리포트", href: "/gap-report" }]}
        active="합의 세션"
      />

      <section className="container consensus-body">
        <div className="consensus-head">
          <div className="consensus-label">AGREEMENT SESSION</div>
          <h1>팀 합의 세션</h1>
          <p className="consensus-sub">
            갭이 확인된 항목에 대해 합의안을 제안하고 전원 동의로 확정합니다.
            일치한 항목은 자동으로 합의서에 반영됩니다.
          </p>
          <div className="consensus-progress">
            <div className="consensus-progress-text">합의 진행 1/1</div>
            <div className="consensus-progress-bar">
              <div className="consensus-progress-fill" style={{ width: "100%" }} />
            </div>
          </div>
        </div>

        <div className="consensus-cat">
          <h2 className="consensus-cat-title">제5장. 이탈 &amp; 정리</h2>
          <div className="consensus-items">
            <div className="card consensus-item open">
              <button type="button" className="consensus-item-head" disabled>
                <span className="consensus-item-label">최소 근무 기간 (제5조 ①)</span>
                <span className="consensus-chip chip-resolved">합의 완료</span>
              </button>

              <div className="consensus-item-body">
                <div className="consensus-positions">
                  {MEMBERS.map((m) => (
                    <div key={m.id} className={`consensus-position ${m.me ? "me" : ""}`}>
                      <div className="position-name">
                        {m.name}
                        {m.me ? " (나)" : ""}
                      </div>
                      <div className="position-answer">{m.answer}</div>
                    </div>
                  ))}
                </div>

                <div className="consensus-note resolved">
                  <Check size={15} /> 합의 완료 — 확정 조항:
                  <div className="consensus-clause-preview">{RESOLVED_CLAUSE}</div>
                  <button className="btn btn-ghost reopen-btn" disabled>
                    <RotateCcw size={14} /> 재논의하기
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <style dangerouslySetInnerHTML={{ __html: `
        .consensus-body { padding: 48px 0 80px; display: flex; flex-direction: column; gap: 40px; }
        .consensus-label { font-size: 0.75rem; font-weight: 700; letter-spacing: 2px; color: #5858e2; margin-bottom: 12px; }
        .consensus-head h1 { font-size: clamp(1.8rem, 4vw, 2.4rem); font-weight: 800; color: #0f172a; margin-bottom: 12px; }
        .consensus-sub { font-size: 1rem; color: #64748b; line-height: 1.7; max-width: 600px; }
        .consensus-progress { margin-top: 24px; max-width: 420px; }
        .consensus-progress-text { font-size: 0.9rem; font-weight: 700; color: #5858e2; margin-bottom: 8px; }
        .consensus-progress-bar { height: 8px; background: #e2e8f0; border-radius: 999px; overflow: hidden; }
        .consensus-progress-fill { height: 100%; background: linear-gradient(90deg, #5858e2, #8b5cf6); border-radius: 999px; }
        .consensus-cat-title { font-size: 1.4rem; font-weight: 800; color: #0f172a; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 2px solid #f1f5f9; }
        .consensus-items { display: flex; flex-direction: column; gap: 16px; }
        .consensus-item { padding: 0; overflow: hidden; border-radius: 16px; border: 1px solid #e2e8f0; }
        .consensus-item-head { width: 100%; display: flex; align-items: center; gap: 16px; padding: 20px 24px; background: none; border: none; font: inherit; text-align: left; color: #334155; }
        .consensus-item-head:disabled { cursor: default; opacity: 1; }
        .consensus-item-label { flex: 1; font-size: 1.15rem; font-weight: 700; color: #0f172a; }
        .consensus-chip { font-size: 0.75rem; font-weight: 700; padding: 6px 12px; border-radius: 999px; white-space: nowrap; }
        .chip-resolved { background: #e0e7ff; color: #4338ca; }
        .consensus-item-body { padding: 0 24px 24px; display: flex; flex-direction: column; gap: 24px; border-top: 1px solid #f1f5f9; padding-top: 24px; }
        .consensus-positions { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; }
        .consensus-position { border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px 20px; background: #fafafa; }
        .consensus-position.me { border-color: #5858e2; background: #f5f5ff; }
        .position-name { font-size: 0.95rem; font-weight: 700; color: #64748b; margin-bottom: 8px; }
        .position-answer { font-size: 1.05rem; font-weight: 600; color: #0f172a; line-height: 1.5; }
        .consensus-note { font-size: 1.05rem; color: #475569; line-height: 1.6; }
        .consensus-note.resolved { color: #4338ca; font-weight: 600; display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
        .consensus-clause-preview { width: 100%; margin-top: 12px; background: #f8fafc; border-radius: 12px; padding: 16px 20px; font-size: 1.05rem; color: #334155; font-weight: 400; line-height: 1.7; border: 1px solid #f1f5f9; }
        .reopen-btn { display: inline-flex; align-items: center; gap: 8px; padding: 10px 16px; font-size: 0.85rem; margin-top: 12px; min-height: 0; }
        .btn-ghost { background: #f1f5f9; color: #334155; border: none; cursor: pointer; border-radius: 12px; font-weight: 600; }
      `}} />
    </main>
  );
}
