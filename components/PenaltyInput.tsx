"use client";

import React from "react";
import { AlertCircle } from "lucide-react";
import { formatKoreanAmount, formatNumber } from "./ContractQuestionInputs";

type PenaltyValue = { base?: number; rate?: number };
type Member = { id: string; name: string };

function ContextPanel({
  answers,
  members,
  base,
  rate,
  baseTxt,
  rateTxt,
}: {
  answers?: Record<string, unknown>;
  members?: Member[];
  base?: number;
  rate?: number;
  baseTxt: string | null;
  rateTxt: string | null;
}) {
  const ipTransfer = answers?.ipTransfer as boolean | undefined;
  const noncompete = answers?.noncompete as number | undefined;
  const tenure = answers?.tenure as number | undefined;
  const lockup = answers?.lockup as number | undefined;
  const hasSummary = baseTxt || rateTxt;

  return (
    <div className="pen-ctx">
      <div className="pen-ctx-head">합의한 내용 — 이 기준으로 위약벌이 적용됩니다</div>

      <div className="pen-ctx-rows">
        {/* 제3조 IP 이전 → 제8조 ① ③ */}
        <div className="pen-ctx-row">
          <span className="pen-ctx-art">제3조</span>
          <span className="pen-ctx-label">IP 이전</span>
          <div className="pen-ctx-chips">
            {ipTransfer === true
              ? <span className="pen-ctx-chip pen-ctx-chip-base">이전에 동의함</span>
              : ipTransfer === false
              ? <span className="pen-ctx-chip pen-ctx-chip-both">해당 없음</span>
              : <span className="pen-ctx-empty">아직 정하지 않음</span>
            }
          </div>
        </div>

        {/* 제4·5조 경업·근무 → 제8조 ② */}
        <div className="pen-ctx-row">
          <span className="pen-ctx-art">제4·5조</span>
          <span className="pen-ctx-label">경업금지 · 근무</span>
          <div className="pen-ctx-chips">
            {noncompete
              ? <span className="pen-ctx-chip pen-ctx-chip-rate">경업금지 {noncompete}년</span>
              : <span className="pen-ctx-empty pen-ctx-empty-sm">미설정</span>}
            {tenure
              ? <span className="pen-ctx-chip pen-ctx-chip-rate">계속근무 {tenure}년</span>
              : <span className="pen-ctx-empty pen-ctx-empty-sm">미설정</span>}
          </div>
        </div>

        {/* 제6조 처분금지 → 제8조 ⑤ */}
        <div className="pen-ctx-row">
          <span className="pen-ctx-art">제6조</span>
          <span className="pen-ctx-label">처분금지</span>
          <div className="pen-ctx-chips">
            {lockup
              ? <span className="pen-ctx-chip pen-ctx-chip-both">{lockup}년간 주식 처분 제한</span>
              : <span className="pen-ctx-empty">아직 정하지 않음</span>}
          </div>
        </div>
      </div>

      {hasSummary && (
        <div className="pen-ctx-summary" role="status" aria-live="polite">
          <AlertCircle size={15} className="pen-summary-icon" aria-hidden="true" />
          <span>
            조항을 어기면{baseTxt ? ` 위약벌로 각 ${baseTxt}` : ""}
            {baseTxt && rateTxt ? ", " : ""}
            {rateTxt ? `처분 금액의 ${rate}%` : ""}
            를 물어야 합니다.
            {base && rate ? " 처분 위반(⑤)은 둘 중 더 큰 금액이 적용됩니다." : ""}
          </span>
        </div>
      )}
    </div>
  );
}

function won(n: number | undefined): string | null {
  if (!n || n <= 0) return null;
  const UNITS = [
    { v: 1_0000_0000_0000, l: "조" },
    { v: 1_0000_0000, l: "억" },
    { v: 1_0000, l: "만" },
  ];
  let rest = Math.floor(n);
  const parts: string[] = [];
  for (const u of UNITS) {
    const q = Math.floor(rest / u.v);
    if (q > 0) { parts.push(`${q.toLocaleString("ko-KR")}${u.l}`); rest -= q * u.v; }
  }
  if (rest > 0) parts.push(rest.toLocaleString("ko-KR"));
  return `${parts.join(" ")} 원`;
}

// ── 레이아웃 상수 ────────────────────────────────────────────
// SVG viewBox: 0 0 120 316
// 입력 카드: 패딩 18px top/bottom, 카드 gap 16px → 각 카드 132px
//   base center y = 18 + 66 = 84
//   rate center y = 18 + 132 + 16 + 66 = 232
// 조항 박스: flex-1 × 3 + flex-none(88px) + gap 8px × 3 = 316px
//   flex-1 박스 = (316 - 88 - 24) / 3 = 68px
//   ① center = 34,  ③ center = 110,  ② center = 186,  ⑤ center = 272

export function PenaltyInput({
  value,
  onChange,
  answers,
  members,
}: {
  value: PenaltyValue | undefined;
  onChange: (v: unknown) => void;
  answers?: Record<string, unknown>;
  members?: Member[];
}) {
  const v = value ?? {};
  const base = v.base;
  const rate = v.rate;
  const set = (k: "base" | "rate", n: number) => onChange({ ...v, [k]: n || undefined });

  const baseTxt = won(base);
  const rateTxt = rate ? `${rate}%` : null;

  return (
    <div className="pen-root">
      {/* ── 흐름 다이어그램 ── */}
      <div className="pen-flow">

        {/* Left: 입력 카드 */}
        <div className="pen-flow-left">
          <div className={`pen-icard ${base ? "pen-icard-base" : ""}`}>
            <div className="pen-icard-meta">
              <span className="pen-icard-label">기준 금액</span>
              <span className="pen-icard-applies">① ③ ⑤</span>
            </div>
            <div className="cq-amount-row">
              <span className="cq-amount-won" aria-hidden="true">₩</span>
              <input
                id="pen-base"
                className="cq-input cq-num"
                inputMode="numeric"
                placeholder="0"
                value={base ? formatNumber(base) : ""}
                onChange={(e) => set("base", Number(e.target.value.replace(/[^0-9]/g, "")))}
              />
            </div>
            <p className="cq-help">{formatKoreanAmount(base ?? 0) || "금액을 입력하면 한글로 확인"}</p>
          </div>

          <div className={`pen-icard ${rate ? "pen-icard-rate" : ""}`}>
            <div className="pen-icard-meta">
              <span className="pen-icard-label">처분 비율</span>
              <span className="pen-icard-applies">② ⑤</span>
            </div>
            <div className="cq-pct-row">
              <input
                id="pen-rate"
                className="cq-input cq-num cq-pct-num"
                inputMode="numeric"
                placeholder="0"
                value={rate || ""}
                onChange={(e) => set("rate", Math.min(100, Number(e.target.value.replace(/[^0-9]/g, ""))))}
              />
              <span className="cq-unit">%</span>
            </div>
          </div>
        </div>

        {/* Middle: SVG 커넥터 */}
        <svg
          className="pen-flow-svg"
          viewBox="0 0 120 316"
          aria-hidden="true"
          focusable="false"
        >
          <defs>
            <marker id="pen-arr-b" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
              <path d="M0,0.5 L5.5,3 L0,5.5z" fill="#818CF8" />
            </marker>
            <marker id="pen-arr-r" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
              <path d="M0,0.5 L5.5,3 L0,5.5z" fill="#A78BFA" />
            </marker>
            <marker id="pen-arr-g" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
              <path d="M0,0.5 L5.5,3 L0,5.5z" fill="#d1d5db" />
            </marker>
          </defs>

          {/* base → ① */}
          <path d="M0,84 C60,84 60,34 120,34"
            className={`pen-path ${base ? "pen-path-base" : "pen-path-off"}`}
            markerEnd={base ? "url(#pen-arr-b)" : "url(#pen-arr-g)"} />
          {/* base → ③ */}
          <path d="M0,84 C60,84 60,110 120,110"
            className={`pen-path ${base ? "pen-path-base" : "pen-path-off"}`}
            markerEnd={base ? "url(#pen-arr-b)" : "url(#pen-arr-g)"} />
          {/* base → ⑤  (dashed: 간접 적용) */}
          <path d="M0,84 C60,84 60,268 120,268"
            className={`pen-path ${base ? "pen-path-base pen-path-dashed" : "pen-path-off"}`}
            markerEnd={base ? "url(#pen-arr-b)" : "url(#pen-arr-g)"} />

          {/* rate → ② */}
          <path d="M0,232 C60,232 60,186 120,186"
            className={`pen-path ${rate ? "pen-path-rate" : "pen-path-off"}`}
            markerEnd={rate ? "url(#pen-arr-r)" : "url(#pen-arr-g)"} />
          {/* rate → ⑤ */}
          <path d="M0,232 C60,232 60,276 120,276"
            className={`pen-path ${rate ? "pen-path-rate" : "pen-path-off"}`}
            markerEnd={rate ? "url(#pen-arr-r)" : "url(#pen-arr-g)"} />
        </svg>

        {/* Right: 조항 박스 */}
        <div className="pen-flow-right">
          <div className={`pen-clause ${base ? "pen-clause-base" : ""}`}>
            <span className="pen-clause-art">제8조 ①</span>
            <span className="pen-clause-name">IP 이전 위반 · 위약벌</span>
            <span className="pen-clause-val">{baseTxt ?? <em className="pen-dash">—</em>}</span>
          </div>
          <div className={`pen-clause ${base ? "pen-clause-base" : ""}`}>
            <span className="pen-clause-art">제8조 ③</span>
            <span className="pen-clause-name">손해배상예정액</span>
            <span className="pen-clause-val">{baseTxt ?? <em className="pen-dash">—</em>}</span>
          </div>
          <div className={`pen-clause ${rate ? "pen-clause-rate" : ""}`}>
            <span className="pen-clause-art">제8조 ②</span>
            <span className="pen-clause-name">경업·근무 위반 · 위약벌</span>
            <span className="pen-clause-val">{rateTxt ?? <em className="pen-dash">—</em>}</span>
          </div>
          {/* ⑤ — 두 값의 MAX */}
          <div className={`pen-clause pen-clause-5 ${base || rate ? "pen-clause-both" : ""}`}>
            <span className="pen-clause-art">제8조 ⑤</span>
            <span className="pen-clause-name">처분 위반 · 위약벌</span>
            <div className="pen-max-row">
              <div className={`pen-max-box ${rate ? "pen-max-rate" : ""}`}>
                <span className="pen-max-lbl">비율</span>
                <span className="pen-max-v">{rateTxt ?? <em className="pen-dash">—</em>}</span>
              </div>
              <span className="pen-max-vs">MAX</span>
              <div className={`pen-max-box ${base ? "pen-max-base" : ""}`}>
                <span className="pen-max-lbl">금액</span>
                <span className="pen-max-v">{baseTxt ?? <em className="pen-dash">—</em>}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 합의 내용 + 요약 통합 카드 */}
      <ContextPanel
        answers={answers}
        members={members}
        base={base}
        rate={rate}
        baseTxt={baseTxt}
        rateTxt={rateTxt}
      />

      <style dangerouslySetInnerHTML={{ __html: PEN_CSS }} />
    </div>
  );
}

const PEN_CSS = `
.pen-root { display: flex; flex-direction: column; gap: 20px; }

/* ── 흐름 레이아웃 ── */
.pen-flow { display: flex; align-items: stretch; }

.pen-flow-left {
  width: 200px; flex-shrink: 0;
  display: flex; flex-direction: column;
  gap: 16px; padding: 18px 0;
}

.pen-flow-svg {
  width: 120px; flex-shrink: 0;
  height: 316px; overflow: visible;
}

.pen-flow-right {
  flex: 1; min-width: 0;
  display: flex; flex-direction: column; gap: 8px;
}

/* ── SVG 경로 ──
   정액(제8조 ①③)은 남색, 비율(②)은 에메랄드. 두 갈래가 ⑤에서 만난다.
   전에는 둘 다 보라 계열이라 색이 갈래를 구분해 주지 못했다. */
.pen-path {
  fill: none; stroke-width: 1.5;
  transition: stroke 0.3s, stroke-dasharray 0.3s;
}
.pen-path-off { stroke: #d1d5db; stroke-dasharray: 4 3; }
.pen-path-base { stroke: #818CF8; stroke-dasharray: none; }
.pen-path-rate { stroke: #34D399; stroke-dasharray: none; }
.pen-path-base.pen-path-dashed { stroke-dasharray: 5 3; stroke: #a5b4fc; }

/* ── 입력 카드 ── */
.pen-icard {
  flex: 1; min-height: 0;
  padding: 14px 15px; border-radius: 18px;
  border: 1.5px solid #e2e8f0; background: #fff;
  display: flex; flex-direction: column; gap: 8px;
  transition: border-color 0.18s, background 0.18s;
}
.pen-icard-base { border-color: #c7d2fe; background: #F5F6FF; }
.pen-icard-rate { border-color: #A7F3D0; background: #F0FDF9; }
.pen-icard-meta { display: flex; align-items: baseline; justify-content: space-between; }
.pen-icard-label { font-size: 13px; font-weight: 800; color: #475569; }
.pen-icard-applies { font-size: 11px; font-weight: 900; color: #a5b4fc; letter-spacing: 0.04em; }
.pen-icard-base .pen-icard-label { color: #3730A3; }
.pen-icard-base .pen-icard-applies { color: #818CF8; }
.pen-icard-rate .pen-icard-label { color: #047857; }
.pen-icard-rate .pen-icard-applies { color: #34D399; }

/* ── 조항 박스 ── */
.pen-clause {
  flex: 1;
  padding: 10px 14px; border-radius: 16px;
  border: 1.5px solid #e2e8f0; background: #fff;
  display: flex; flex-direction: column; gap: 3px;
  transition: border-color 0.18s, background 0.18s;
  overflow: hidden;
}
.pen-clause-5 { flex: none; min-height: 88px; }
.pen-clause-base { border-color: #c7d2fe; background: #fff; }
.pen-clause-rate { border-color: #A7F3D0; background: #fff; }
.pen-clause-both { border-color: #cbd5e1; background: #fff; }
.pen-clause-art { font-size: 11px; font-weight: 900; color: #94a3b8; letter-spacing: 0.06em; }
.pen-clause-base .pen-clause-art { color: #4338CA; }
.pen-clause-rate .pen-clause-art { color: #047857; }
.pen-clause-both .pen-clause-art { color: #4338CA; }
.pen-clause-name { font-size: 13px; font-weight: 700; color: #64748b; line-height: 1.4; }
.pen-clause-val { font-size: 15px; font-weight: 900; color: #94a3b8; font-variant-numeric: tabular-nums; margin-top: 2px; }
.pen-clause-base .pen-clause-val { color: #3730A3; }
.pen-clause-rate .pen-clause-val { color: #065F46; }
.pen-dash { color: #cbd5e1; font-style: normal; }

/* ── MAX 비교 (⑤) ── */
.pen-max-row { display: flex; align-items: center; gap: 5px; margin-top: 5px; }
.pen-max-box {
  flex: 1; display: flex; flex-direction: column; align-items: center; gap: 2px;
  padding: 6px 4px; border-radius: 10px;
  border: 1px dashed #e2e8f0; background: #f8fafc;
  transition: border-color 0.15s, background 0.15s;
}
.pen-max-base { border: 1px solid #a5b4fc; border-style: solid; background: #EEF2FF; }
.pen-max-rate { border: 1px solid #A7F3D0; border-style: solid; background: #F0FDF9; }
.pen-max-lbl { font-size: 10px; font-weight: 900; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.08em; }
.pen-max-base .pen-max-lbl { color: #6366f1; }
.pen-max-rate .pen-max-lbl { color: #059669; }
.pen-max-v { font-size: 12px; font-weight: 900; color: #94a3b8; text-align: center; line-height: 1.3; font-variant-numeric: tabular-nums; }
.pen-max-base .pen-max-v { color: #3730A3; }
.pen-max-rate .pen-max-v { color: #065F46; }
.pen-max-vs { font-size: 10px; font-weight: 900; color: #cbd5e1; letter-spacing: 0.05em; flex-shrink: 0; }
.pen-clause-both .pen-max-vs { color: #818CF8; }

/* ── 합의 내용 + 요약 통합 카드 ── */
.pen-ctx {
  display: flex; flex-direction: column; gap: 16px;
  padding: 20px 22px; border-radius: 20px;
  border: 1px solid #e2e8f0; background: #fff;
}
.pen-ctx-head {
  font-size: 12px; font-weight: 900; color: #94a3b8;
  text-transform: uppercase; letter-spacing: 0.08em;
}
.pen-ctx-rows { display: flex; flex-direction: column; gap: 12px; }
.pen-ctx-row { display: flex; align-items: center; gap: 12px; }
.pen-ctx-art {
  flex-shrink: 0; width: 56px;
  font-size: 13px; font-weight: 900; color: #4338CA;
  letter-spacing: 0.02em;
}
.pen-ctx-label {
  flex-shrink: 0; width: 92px;
  font-size: 14px; font-weight: 700; color: #64748b;
}
.pen-ctx-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.pen-ctx-chip {
  display: inline-block;
  padding: 5px 13px; border-radius: 999px;
  font-size: 14px; font-weight: 700; line-height: 1.4;
}
.pen-ctx-chip-base { background: #EEF2FF; color: #3730A3; }
.pen-ctx-chip-rate { background: #ECFDF5; color: #065F46; }
.pen-ctx-chip-both { background: linear-gradient(90deg,#EEF2FF,#ECFDF5); color: #334155; }
.pen-ctx-empty { font-size: 14px; font-weight: 600; color: #cbd5e1; font-style: italic; }
.pen-ctx-empty-sm { font-size: 13px; font-weight: 600; color: #d1d5db; font-style: italic; }
.pen-ctx-summary {
  display: flex; align-items: flex-start; gap: 10px;
  padding-top: 16px; border-top: 1px solid #f1f5f9;
  font-size: 14px; font-weight: 700; color: #1e293b;
  line-height: 1.75; word-break: keep-all;
}
.pen-summary-icon { flex-shrink: 0; margin-top: 3px; color: #4F46E5; }

/* ── 반응형 ── */
@media (max-width: 680px) {
  .pen-flow { flex-direction: column; gap: 16px; }
  .pen-flow-svg { display: none; }
  .pen-flow-left { width: 100%; height: auto; padding: 0; }
  .pen-icard { flex: none; }
  .pen-flow-right { flex-direction: row; flex-wrap: wrap; gap: 8px; }
  .pen-clause { min-width: calc(50% - 4px); flex: none; height: auto; min-height: 70px; }
  .pen-clause-5 { min-width: 100%; }
}
`;
