"use client";

import React from "react";
import { TopNav } from "../../../components/TopNav";
import { Check, ChevronRight } from "lucide-react";

// ponytail: 합의 세션 — 질문 페이지(사이드바+스텝퍼)와 동일한 레이아웃 언어로 재구성한 목업.
// "최소 근무 기간(제5조 ①)" 항목만 실데이터로 채우고, 나머지 항목은 사이드바 탐색용 더미 상태.

const GROUPS = [
  {
    id: "basics", ko: "기본", en: "Basics",
    items: [
      { id: "identity", label: "계약 당사자", status: "done" },
      { id: "shareType", label: "주식의 종류", status: "done" },
      { id: "ipTransfer", label: "기술·지식재산 이전", status: "done" },
    ],
  },
  {
    id: "roles", ko: "역할&책임", en: "Roles",
    items: [{ id: "roles", label: "역할 분담", status: "done" }],
  },
  {
    id: "decision", ko: "의사결정&권한", en: "Decision",
    items: [
      { id: "decisionAmount", label: "큰 투자의 기준 금액", status: "done" },
      { id: "deadlock", label: "결정이 막혔을 때", status: "voting" },
    ],
  },
  {
    id: "equity", ko: "지분&보상", en: "Equity",
    items: [
      { id: "equity", label: "지분 배분", status: "done" },
      { id: "vesting", label: "지분 확정 (베스팅·클리프)", status: "voting" },
      { id: "lockup", label: "주식 매각 제한 기간", status: "todo" },
      { id: "dragAlong", label: "다 같이 팔기 (드래그얼롱)", status: "todo" },
      { id: "tagAlong", label: "함께 팔 권리 (태그얼롱)", status: "todo" },
    ],
  },
  {
    id: "tenure", ko: "이탈&정리", en: "Departure",
    items: [
      { id: "noncompete", label: "퇴사 후 경업 금지", status: "done" },
      { id: "tenure", label: "최소 근무 기간", status: "current" },
      { id: "buybackPrice", label: "퇴사자 주식 회수 가격", status: "todo" },
    ],
  },
  {
    id: "misc", ko: "기타", en: "Misc",
    items: [{ id: "penalty", label: "위약벌", status: "todo" }],
  },
];

const MEMBERS = [
  { id: "m1", name: "김민준", me: true, answer: "3년" },
  { id: "m2", name: "이서연", me: false, answer: "2년" },
  { id: "m3", name: "박도윤", me: false, answer: "5년" },
];

const RESOLVED_YEARS = "3년";
const RESOLVED_CLAUSE = `① 주주는 본 계약 체결일로부터 사유를 불문하고 ${RESOLVED_YEARS}간 다른 주주들 전원의 사전 서면 동의 없이 회사에서 퇴사하여서는 아니된다. 단, 해당 주주에게 책임 없는 사유로 인한 비자발적 퇴사에 대하여는 본 조의 적용을 배제한다.`;

const STATUS_MARK: Record<string, { icon: React.ReactNode; cls: string }> = {
  done: { icon: <Check size={10} strokeWidth={3.5} />, cls: "done" },
  voting: { icon: "●", cls: "voting" },
  todo: { icon: "", cls: "" },
  current: { icon: "", cls: "" },
};

export default function TenureConsensusWideMockup() {
  const totalItems = GROUPS.reduce((a, g) => a + g.items.length, 0);
  const doneItems = GROUPS.reduce((a, g) => a + g.items.filter((i) => i.status === "done").length, 0);
  const progress = Math.round((doneItems / totalItems) * 100);

  return (
    <div className="cq-page">
      <TopNav
        links={[{ label: "대시보드", href: "/workspace" }, { label: "갭 리포트", href: "/gap-report" }, { label: "설정", href: "#" }]}
        active="합의 세션"
      />
      <div className="cq-shell">
        {/* ── sidebar ── */}
        <aside className="cq-sidebar">
          <div className="cq-sidebar-label">CoSync · Team Consensus</div>
          <nav className="cq-sidebar-nav" aria-label="합의 항목 목록">
            {GROUPS.map((g) => {
              const done = g.items.filter((i) => i.status === "done").length;
              const active = g.id === "tenure";
              return (
                <div key={g.id} className={`cq-side-group ${active ? "active" : ""}`}>
                  <div className="cq-side-head">
                    <span className="cq-side-ko">{g.ko}</span>
                    <span className="cq-side-en">{g.en}</span>
                    <span className="cq-side-count">{done}/{g.items.length}</span>
                  </div>
                  <ul className="cq-side-list">
                    {g.items.map((item) => {
                      const isCurrent = item.status === "current";
                      const mark = STATUS_MARK[item.status];
                      return (
                        <li key={item.id}>
                          <button type="button" className={`cq-side-q ${isCurrent ? "current" : ""}`}>
                            <span className={`cq-side-mark ${mark.cls}`}>{mark.icon}</span>
                            <span className="cq-side-q-text">{item.label}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </nav>
        </aside>

        {/* ── main ── */}
        <main className="cq-main">
          <article className="cq-card">
            <header className="cq-card-head">
              <div className="cq-eyebrow-row">
                <span className="cq-eyebrow-bar" />
                <span className="cq-eyebrow">이탈 &amp; 정리 · 제5조 ①</span>
                <span className="tc-status-chip">조정중</span>
                <span className="bc-step">합의 진행 {doneItems}/{totalItems}</span>
              </div>
              <h1 className="cq-title">최소 몇 년간 근무 의무를 지나요?</h1>
              <p className="cq-desc">이 기간 안에는 다른 주주 전원의 서면 동의 없이 퇴사할 수 없습니다. 본인 책임이 아닌 비자발적 퇴사는 제외됩니다.</p>
            </header>

            {/* 팀원별 응답 비교 */}
            <div className="cq-input-zone">
              <div className="tc-positions">
                {MEMBERS.map((m) => (
                  <div key={m.id} className={`tc-position ${m.me ? "me" : ""}`}>
                    <div className="tc-position-name">{m.name}{m.me ? " (나)" : ""}</div>
                    <div className="tc-position-answer">{m.answer}</div>
                  </div>
                ))}
              </div>

              {/* 조정중: 제안 + 투표 현황 */}
              <div className="tc-vote">
                <div className="tc-vote-proposal">
                  <div className="tc-vote-proposal-meta">
                    <span><strong>박도윤</strong>님의 제안 — 3년 <span className="tc-proposal-time">· 2시간 전</span></span>
                  </div>
                  <div className="cq-paper">
                    <p className="cq-paper-para">{RESOLVED_CLAUSE}</p>
                  </div>
                </div>

                <div className="tc-vote-status">
                  <span className="tc-vote-pill approve">김민준: 동의</span>
                  <span className="tc-vote-pill reject">이서연: 반대</span>
                  <span className="tc-vote-pill pending">박도윤: 대기</span>
                </div>

                <div className="tc-note rejected">
                  반대 의견이 있습니다. 아래 의견을 확인하고, 제안자는 수정하거나 새 제안으로 다시 합의를 시작하세요.
                </div>

                <div className="tc-comments">
                  <div className="tc-comment">
                    <div className="tc-comment-meta">
                      <span className="tc-comment-author">이서연</span>
                      <span className="tc-comment-time">1시간 전</span>
                    </div>
                    <p className="tc-comment-text">3년은 너무 길다고 생각해요. 초기 팀이라 이직·합류 유연성도 필요할 것 같은데, 2년 정도로 시작하고 재합의 때 늘리는 건 어때요?</p>
                  </div>
                </div>
              </div>
            </div>
          </article>
        </main>
      </div>

      {/* ── footer ── */}
      <footer className="cq-footer">
        <button type="button" className="cq-back">이전 항목</button>
        <div className="cq-footer-right">
          <div className="cq-progress">
            <div className="cq-progress-meta">
              <span className="cq-progress-label">{doneItems}/{totalItems} 완료</span>
              <span className="cq-progress-pct">{progress}%</span>
            </div>
            <div className="cq-progress-bar"><span style={{ width: `${progress}%` }} /></div>
          </div>
          <button type="button" className="cq-cta">다음 항목 <ChevronRight size={16} /></button>
        </div>
      </footer>

      <style dangerouslySetInnerHTML={{ __html: `
        .cq-page { min-height: 100vh; min-height: 100dvh; display: flex; flex-direction: column; font-size: 16px;
          background:
            radial-gradient(at 0% 0%, rgba(79,70,229,0.12) 0px, transparent 50%),
            radial-gradient(at 100% 0%, rgba(16,185,129,0.08) 0px, transparent 50%),
            radial-gradient(at 100% 100%, rgba(79,70,229,0.08) 0px, transparent 50%),
            radial-gradient(at 0% 100%, rgba(16,185,129,0.08) 0px, transparent 50%),
            #F8FAFC; }
        .cq-shell { flex: 1; display: flex; flex-wrap: wrap; align-items: stretch; max-width: 1680px;
          width: calc(100% - 56px); margin: 28px auto 132px;
          background: #fff; border: 1px solid #e2e8f0; border-radius: 28px;
          box-shadow: 0 24px 60px -34px rgba(15,23,42,0.18); }

        .cq-sidebar { width: 280px; flex-shrink: 0; padding: 26px 0; border-right: 1px solid #eef2f7; border-radius: 28px 0 0 28px; overflow: hidden; }
        .cq-sidebar-label { padding: 0 20px; margin-bottom: 20px; font-size: 10px; font-weight: 900; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.2em; }
        .cq-sidebar-nav { display: flex; flex-direction: column; gap: 2px; }
        .cq-side-group { position: relative; padding-bottom: 8px; }
        .cq-side-head { width: 100%; display: grid; grid-template-columns: 1fr auto; grid-template-areas: "ko count" "en count"; align-items: center; gap: 0 8px; padding: 12px 16px 8px 20px; }
        .cq-side-ko { grid-area: ko; font-size: 14px; font-weight: 700; color: #94a3b8; }
        .cq-side-en { grid-area: en; font-size: 10px; font-weight: 500; color: rgba(148,163,184,0.6); text-transform: uppercase; letter-spacing: 0.08em; }
        .cq-side-count { grid-area: count; font-size: 12px; font-weight: 800; color: #cbd5e1; font-variant-numeric: tabular-nums; }
        .cq-side-group.active .cq-side-ko { font-weight: 800; color: #0f172a; }
        .cq-side-group.active .cq-side-en { color: rgba(79,70,229,0.7); }
        .cq-side-group.active .cq-side-count { color: #4F46E5; }
        .cq-side-group.active::before { content: ""; position: absolute; left: 0; top: 14px; width: 4px; height: 26px; background: #4F46E5; border-radius: 0 999px 999px 0; }
        .cq-side-list { list-style: none; display: flex; flex-direction: column; }
        .cq-side-q { width: 100%; display: flex; align-items: center; gap: 9px; padding: 7px 14px 7px 20px; background: none; border: none; font: inherit; text-align: left; cursor: pointer; border-radius: 0 12px 12px 0; }
        .cq-side-q:hover { background: rgba(79,70,229,0.05); }
        .cq-side-q.current { background: rgba(79,70,229,0.09); }
        .cq-side-mark { width: 17px; height: 17px; flex-shrink: 0; border-radius: 999px; border: 1px solid #e2e8f0; background: #fff; color: #94a3b8; font-size: 9px; font-weight: 900; display: inline-flex; align-items: center; justify-content: center; }
        .cq-side-mark.done { background: #10B981; border-color: #10B981; color: #fff; }
        .cq-side-mark.voting { background: #EDE9FE; border-color: #C4B5FD; color: #7C3AED; font-size: 8px; }
        .cq-side-q.current .cq-side-mark { border-color: #4F46E5; color: #4F46E5; }
        .cq-side-q-text { font-size: 12px; font-weight: 600; color: #94a3b8; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .cq-side-q.current .cq-side-q-text { color: #3730A3; font-weight: 800; }

        .cq-main { flex: 1 1 520px; min-width: 0; padding: 34px 32px 48px 24px; }
        .cq-card { max-width: 880px; margin: 0; display: flex; flex-direction: column; gap: 28px; }
        .cq-card-head { display: flex; flex-direction: column; gap: 14px; }
        .cq-eyebrow-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .cq-eyebrow-bar { height: 3px; width: 32px; background: #4F46E5; border-radius: 999px; }
        .cq-eyebrow { color: #4F46E5; font-weight: 900; font-size: 13px; letter-spacing: -0.01em; }
        .tc-status-chip { font-size: 11px; font-weight: 900; padding: 5px 12px; border-radius: 999px; background: #ede9fe; color: #6d28d9; }
        .bc-step { margin-left: auto; font-size: 12px; font-weight: 800; color: #cbd5e1; }
        .cq-title { font-size: 30px; font-weight: 900; line-height: 1.25; color: #0f172a; letter-spacing: -0.02em; }
        .cq-desc { font-size: 15px; color: #64748b; font-weight: 500; line-height: 1.7; max-width: 42rem; }

        .cq-input-zone { border-top: 1px solid #f1f5f9; border-bottom: 1px solid #f1f5f9; padding: 28px 0; display: flex; flex-direction: column; gap: 18px; }
        .tc-positions { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; }
        .tc-position { border: 2px solid #e2e8f0; border-radius: 20px; padding: 18px 22px; background: #fafafa; }
        .tc-position.me { border-color: #4F46E5; background: rgba(79,70,229,0.04); }
        .tc-position-name { font-size: 13px; font-weight: 800; color: #94a3b8; margin-bottom: 8px; }
        .tc-position-answer { font-size: 19px; font-weight: 900; color: #0f172a; }
        .tc-note { display: flex; align-items: center; gap: 8px; font-size: 15px; font-weight: 800; color: #4338CA; }
        .cq-paper { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 1px 3px rgba(15,23,42,0.04); padding: 32px 36px; }
        .cq-paper-para { font-size: 13.5px; line-height: 2.05; color: #1e293b; word-break: keep-all; margin: 0; }

        .tc-vote { display: flex; flex-direction: column; gap: 18px; background: #fafafa; border-radius: 20px; padding: 24px; border: 1px solid #f1f5f9; }
        .tc-vote-proposal-meta { font-size: 15px; color: #334155; margin-bottom: 10px; }
        .tc-proposal-time { color: #94a3b8; font-weight: 500; font-size: 13px; }
        .tc-vote-status { display: flex; flex-wrap: wrap; gap: 10px; }
        .tc-vote-pill { font-size: 13.5px; font-weight: 800; padding: 7px 16px; border-radius: 999px; background: #f1f5f9; color: #64748b; }
        .tc-vote-pill.approve { background: #ecfdf5; color: #059669; }
        .tc-vote-pill.reject { background: #fee2e2; color: #b91c1c; }
        .tc-vote-pill.pending { background: #f1f5f9; color: #94a3b8; }
        .tc-note.rejected { color: #b91c1c; font-weight: 700; font-size: 14px; padding: 14px 18px; background: #fef2f2; border-radius: 12px; line-height: 1.6; }
        .tc-comments { display: flex; flex-direction: column; gap: 10px; border-top: 1px solid #f1f5f9; padding-top: 18px; }
        .tc-comment { background: #fff; border: 1px solid #f1f5f9; border-radius: 12px; padding: 14px 18px; }
        .tc-comment-meta { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; }
        .tc-comment-author { font-size: 13px; font-weight: 800; color: #334155; }
        .tc-comment-time { font-size: 12px; color: #94a3b8; }
        .tc-comment-text { font-size: 14.5px; color: #475569; line-height: 1.7; margin: 0; }

        .cq-footer { position: fixed; bottom: 0; left: 0; width: 100%; height: 96px; display: flex; align-items: center; justify-content: space-between; padding: 0 48px; background: rgba(255,255,255,0.9); backdrop-filter: blur(24px); border-top: 1px solid rgba(226,232,240,0.5); z-index: 100; }
        .cq-back { display: inline-flex; align-items: center; gap: 10px; padding: 10px 20px; min-height: 44px; border-radius: 16px; border: none; background: none; color: #94a3b8; font: inherit; font-size: 15px; font-weight: 700; cursor: pointer; }
        .cq-back:hover { color: #4F46E5; background: #f8fafc; }
        .cq-footer-right { display: flex; align-items: center; gap: 32px; }
        .cq-progress { display: flex; flex-direction: column; align-items: flex-end; gap: 8px; }
        .cq-progress-meta { display: flex; align-items: center; gap: 14px; }
        .cq-progress-label { font-size: 11px; font-weight: 900; color: #94a3b8; letter-spacing: 0.1em; }
        .cq-progress-pct { font-size: 14px; font-weight: 900; color: #4F46E5; }
        .cq-progress-bar { width: 224px; height: 8px; background: rgba(241,245,249,0.8); border-radius: 999px; overflow: hidden; }
        .cq-progress-bar span { display: block; height: 100%; background: #4F46E5; border-radius: 999px; }
        .cq-cta { height: 56px; padding: 0 40px; background: #4F46E5; color: #fff; font: inherit; font-size: 16px; font-weight: 900; border: none; border-radius: 20px; box-shadow: 0 15px 35px rgba(79,70,229,0.3); cursor: pointer; display: inline-flex; align-items: center; gap: 10px; }
        .cq-cta:hover { background: #4338CA; }

        @media (max-width: 900px) {
          .cq-sidebar { display: none; }
          .cq-shell { width: calc(100% - 24px); margin: 12px auto 116px; border-radius: 20px; }
          .cq-main { padding: 24px 20px 32px; }
          .cq-title { font-size: 22px; }
          .cq-footer { padding: 0 20px; }
        }
      `}} />
    </div>
  );
}
