"use client";

import React, { useMemo, useState } from "react";
import { TopNav } from "../../../components/TopNav";
import { QuestionInput, formatKoreanAmount, formatNumber } from "../../../components/ContractQuestionInputs";
import { ResultFigure } from "../../../components/ResultFigure";
import { Gloss } from "../../../components/Gloss";
import {
  CONTRACT_QUESTIONS,
  QUESTION_GROUPS,
  MOCK_MEMBERS,
  INFO_DISCLAIMER,
  PENALTY_CLAUSES,
  validateAllocation,
  fillPreview,
  choiceLabel,
  type ContractQuestion,
  type PenaltyClause,
  type PreviewBlock,
} from "../../../lib/contractQuestions";
import { resultsFor, RESULT_QUESTION_IDS, won } from "../../../lib/contractResults";
import {
  ArrowLeft, ArrowRight, FileText, Users, Check,
  BookOpen, HelpingHand, Scale, Plus, Trash2, ChevronDown, Sparkles,
} from "lucide-react";

// ponytail: 결과 카드 제안 시안. /mockup/contract-questions 를 그대로 두고 이 파일만 따로 둔다.
// 화면 구성은 원본과 같고, 입력과 미리보기 사이에 「이렇게 됩니다」 한 덩어리만 추가된다.

// 회의에서 바로 결과를 보도록 답을 채워 둔 상태로 시작한다. 값은 자유롭게 바꿀 수 있다.
const PREFILL: Record<string, unknown> = {
  decisionAmount: 100_000_000,
  deadlock: { days: 7, decider: "m1" },
  equity: { m1: 50, m2: 30, m3: 20 },
  noncompete: 1,
  tenure: 3,
  vesting: { apply: "yes", vestingYears: 4, cliffYears: 1 },
  buybackPrice: "par",
  lockup: 5,
  dragAlong: 67,
  penalty: { base: 100_000_000, rate: 30 },
};

export default function ContractResultsMockup() {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, unknown>>(PREFILL);
  const [exceptions, setExceptions] = useState<Record<string, string>>({});
  const [exceptionOpen, setExceptionOpen] = useState(false);
  // 제8조 값은 문항끼리 공유한다. 체크박스를 켠 조항만 자기 값을 따로 갖는다.
  const [penaltyOverrides, setPenaltyOverrides] = useState<Record<string, { base?: number; rate?: number }>>({});

  const q = CONTRACT_QUESTIONS[index];
  const value = answers[q.id];
  const setValue = (v: unknown) => setAnswers((prev) => ({ ...prev, [q.id]: v }));
  const exception = exceptions[q.id] ?? "";
  const showException = exceptionOpen || exception.length > 0;

  const previewValues = usePreviewValues(q, value);
  const blocked = isBlocked(q, value);

  // 결과는 내가 답한 값만으로 만든다. 팀원 답은 이 단계에서 볼 수 없다.
  const results = resultsFor(q.id, answers);
  const hasResultZone = RESULT_QUESTION_IDS.has(q.id);

  // 제8조가 이 조항을 가리키면, 그 항을 이 페이지에서 바로 정하고 조문으로도 확인한다.
  const penaltyClauses = PENALTY_CLAUSES[q.id];
  const shared = (answers.penalty ?? {}) as { base?: number; rate?: number };
  const override = penaltyOverrides[q.id];
  const penalty = { base: override?.base ?? shared.base, rate: override?.rate ?? shared.rate };
  const penaltyValues = [
    penalty.base ? formatNumber(penalty.base) : null,
    penalty.rate ? String(penalty.rate) : null,
  ];

  const setPenalty = (key: "base" | "rate", v: number) => {
    if (override) setPenaltyOverrides((prev) => ({ ...prev, [q.id]: { ...prev[q.id], [key]: v } }));
    else setAnswers((prev) => ({ ...prev, penalty: { ...(prev.penalty as object), [key]: v } }));
  };
  // 켜는 순간 지금 보이는 값에서 갈라져 나온다. 끄면 다시 공유 값으로 돌아간다.
  const toggleOverride = () =>
    setPenaltyOverrides((prev) => {
      const next = { ...prev };
      if (next[q.id]) delete next[q.id];
      else next[q.id] = { ...penalty };
      return next;
    });

  const jumpTo = (i: number) => {
    setIndex(Math.min(CONTRACT_QUESTIONS.length - 1, Math.max(0, i)));
    setExceptionOpen(false);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const removeException = () => {
    setExceptions((prev) => {
      const next = { ...prev };
      delete next[q.id];
      return next;
    });
    setExceptionOpen(false);
  };
  const go = (delta: number) => jumpTo(index + delta);

  const progress = Math.round(((index + 1) / CONTRACT_QUESTIONS.length) * 100);

  return (
    <div className="cq-page">
      <TopNav
        links={[
          { label: "대시보드", href: "/workspace" },
          { label: "합의 히스토리", href: "#" },
          { label: "설정", href: "#" },
        ]}
        active="합의 히스토리"
      />

      <div className="cq-shell">
        <aside className="cq-sidebar">
          <div className="cq-sidebar-label">Agreement Draft</div>
          <nav className="cq-sidebar-nav" aria-label="질문 목록">
            {QUESTION_GROUPS.map((g) => {
              const inGroup = CONTRACT_QUESTIONS.filter((x) => x.group === g.id);
              const done = inGroup.filter((x) => answers[x.id] !== undefined).length;
              const active = q.group === g.id;
              const firstIndex = CONTRACT_QUESTIONS.findIndex((x) => x.group === g.id);
              return (
                <div key={g.id} className={`cq-side-group ${active ? "active" : ""}`}>
                  <button type="button" className="cq-side-head" onClick={() => jumpTo(firstIndex)}>
                    <span className="cq-side-ko">
                      {g.ko}
                      {inGroup.some((x) => x.proposed) && (
                        <span className="cq-side-dot" title="제안 문항 포함" aria-label="제안 문항 포함" />
                      )}
                    </span>
                    <span className="cq-side-en">{g.en}</span>
                    <span className="cq-side-count">{done}/{inGroup.length}</span>
                  </button>
                  <ul className="cq-side-list">
                    {inGroup.map((item) => {
                      const idx = CONTRACT_QUESTIONS.indexOf(item);
                      const answered = answers[item.id] !== undefined;
                      return (
                        <li key={item.id}>
                          <button
                            type="button"
                            className={`cq-side-q ${idx === index ? "current" : ""}`}
                            aria-current={idx === index ? "step" : undefined}
                            onClick={() => jumpTo(idx)}
                          >
                            <span className={`cq-side-mark ${answered ? "done" : ""}`} aria-hidden="true">
                              {answered ? <Check size={11} strokeWidth={3.5} /> : idx + 1}
                            </span>
                            <span className="cq-side-q-text">{item.article}</span>
                            {exceptions[item.id]?.trim() && (
                              <span className="cq-side-exc" title="예외 조항 있음" aria-label="예외 조항 있음" />
                            )}
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

        <main className="cq-main">
          <article className="cq-card">
            <header className="cq-card-head">
              <div className="cq-eyebrow-row">
                <span className="cq-eyebrow-bar" />
                <span className="cq-eyebrow">{q.article} · {q.articleTag}</span>
                {q.proposed && <span className="cq-badge-proposed">제안</span>}
                {!q.consensus && <span className="cq-badge-fact">합의 대상 아님</span>}
              </div>
              <h1 className="cq-title">{q.title}</h1>
              <p className="cq-desc"><Gloss text={q.desc} /></p>
            </header>

            <section className="cq-input-zone">
              <QuestionInput template={q.template} value={value} onChange={setValue} keyPrefix={q.id} />
            </section>

            {/* 추가되는 유일한 덩어리. 내가 넣은 값이 만드는 결과를 그 자리에서 보여준다. */}
            {hasResultZone && (
              <section className="cr-zone" aria-label="이렇게 됩니다">
                <div className="cr-zone-head"><Sparkles size={15} /> 이렇게 됩니다</div>
                {results.length === 0 ? (
                  <div className="cr-empty">
                    <div className="cr-empty-art" aria-hidden="true">
                      <svg viewBox="0 0 520 92">
                        <rect x="122" y="26" width="300" height="22" rx="11" fill="#eef2f7" />
                        <rect x="122" y="58" width="190" height="22" rx="11" fill="#f4f7fa" />
                        <circle cx="96" cy="37" r="7" fill="#eef2f7" />
                        <circle cx="96" cy="69" r="7" fill="#f4f7fa" />
                      </svg>
                    </div>
                    <p className="cr-empty-text">값을 정하면 그 값이 만드는 결과가 여기에 보여요.</p>
                  </div>
                ) : (
                  // 카드를 여러 장 쌓지 않는다. 그림은 이 문항의 결과 하나만 그리고,
                  // 다른 답과 겹쳐서 생기는 결과는 어느 조항에서 왔는지 달아 한 줄씩 잇는다.
                  <div className="cr-card">
                    <div className="cr-figure"><ResultFigure figure={results[0].figure} /></div>
                    <p className="cr-plain"><Gloss text={results[0].plain} /></p>
                    {results.length > 1 && (
                      <ul className="cr-rows">
                        {results.slice(1).map((r) => (
                          <li key={r.id} className="cr-row">
                            <span className="cr-from">
                              <span className="cr-from-with">함께 반영</span>
                              {(r.from ?? []).map((id) => (
                                <button
                                  key={id}
                                  type="button"
                                  className="cr-from-tag"
                                  title={CONTRACT_QUESTIONS.find((x) => x.id === id)?.title}
                                  onClick={() => jumpTo(CONTRACT_QUESTIONS.findIndex((x) => x.id === id))}
                                >
                                  {CONTRACT_QUESTIONS.find((x) => x.id === id)?.article ?? id}
                                </button>
                              ))}
                            </span>
                            <p className="cr-row-text"><Gloss text={r.plain} /></p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </section>
            )}

            {/* 제8조를 맨 뒤에서 한 번에 묻지 않고, 그 제재가 걸린 조항 옆에서 정한다. */}
            {penaltyClauses && (
              <section className="cq-penalty" aria-label="이 조항을 어기면">
                <div className="cq-penalty-head"><Scale size={15} /> 이 조항을 어기면</div>
                <ul className="cq-penalty-lines">
                  {penaltyClauses.map((c) => (
                    <li key={c.article}>
                      <span className="cq-penalty-tag">{c.article}</span>
                      {penaltyLine(c, penalty)}
                    </li>
                  ))}
                </ul>

                {penaltyUses(penaltyClauses).has("base") && (
                  <div className="cq-field-row">
                    <label className="cq-label" htmlFor={`${q.id}-pen-base`}>위약벌 기준 금액</label>
                    <div className="cq-amount-row">
                      <span className="cq-amount-won" aria-hidden="true">₩</span>
                      <input
                        id={`${q.id}-pen-base`}
                        className="cq-input cq-num"
                        inputMode="numeric"
                        placeholder="0"
                        value={penalty.base ? formatNumber(penalty.base) : ""}
                        onChange={(e) => setPenalty("base", Number(e.target.value.replace(/[^0-9]/g, "")))}
                      />
                    </div>
                    <p className="cq-help">{formatKoreanAmount(penalty.base ?? 0) || "금액을 입력하면 한글로 확인해 드립니다."}</p>
                  </div>
                )}

                {penaltyUses(penaltyClauses).has("rate") && (
                  <div className="cq-field-row">
                    <label className="cq-label" htmlFor={`${q.id}-pen-rate`}>처분 금액 대비 비율</label>
                    <div className="cq-pct-row">
                      <input
                        id={`${q.id}-pen-rate`}
                        className="cq-input cq-num cq-pct-num"
                        inputMode="numeric"
                        placeholder="0"
                        value={penalty.rate || ""}
                        onChange={(e) => setPenalty("rate", Math.min(100, Number(e.target.value.replace(/[^0-9]/g, ""))))}
                      />
                      <span className="cq-unit">%</span>
                    </div>
                  </div>
                )}

                <label className="cq-penalty-check">
                  <input type="checkbox" checked={!!override} onChange={toggleOverride} />
                  <span>이 조항만 다른 값으로 정하기</span>
                </label>
                <p className="cq-help">
                  {override
                    ? "이 조항에만 적용됩니다. 체크를 끄면 제8조 공통 값으로 돌아갑니다."
                    : "제8조 전체에 함께 적용되는 값입니다. 다른 조항에서 고쳐도 같이 바뀝니다."}
                </p>
              </section>
            )}

            {/* 제8조 문항은 공통 값을 정하는 자리이자, 따로 정한 조항을 모아 보는 자리다. */}
            {q.id === "penalty" && Object.keys(penaltyOverrides).length > 0 && (
              <section className="cq-penalty" aria-label="따로 정한 조항">
                <div className="cq-penalty-head"><Scale size={15} /> 따로 정한 조항</div>
                <ul className="cq-penalty-lines">
                  {Object.entries(penaltyOverrides).map(([id, ov]) => {
                    const target = CONTRACT_QUESTIONS.find((x) => x.id === id);
                    return (
                      <li key={id}>
                        <button
                          type="button"
                          className="cq-penalty-jump"
                          onClick={() => jumpTo(CONTRACT_QUESTIONS.findIndex((x) => x.id === id))}
                        >
                          {target?.article}
                        </button>
                        {ov.base !== undefined && ` 위약벌 ${won(ov.base)}`}
                        {ov.rate !== undefined && ` 처분 금액의 ${ov.rate}%`}
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}

            <section className="cq-exception">
              {!showException ? (
                <button
                  type="button"
                  className="cq-exception-add"
                  aria-expanded={false}
                  onClick={() => setExceptionOpen(true)}
                >
                  <Plus size={15} /> 예외 조항 추가
                  <span className="cq-exception-hint">이 조항에 붙일 단서가 있다면</span>
                </button>
              ) : (
                <div className="cq-exception-box">
                  <div className="cq-exception-top">
                    <label className="cq-label" htmlFor={`${q.id}-exception`}>예외 조항</label>
                    <button type="button" className="cq-exception-del" onClick={removeException}>
                      <Trash2 size={14} /> 삭제
                    </button>
                  </div>
                  <textarea
                    id={`${q.id}-exception`}
                    className="cq-textarea"
                    rows={3}
                    autoFocus={exception.length === 0}
                    placeholder="예) 다만, 긴급하여 사전 합의를 거칠 수 없는 경우에는 집행 후 지체 없이 다른 주주들에게 통지하는 것으로 갈음한다."
                    value={exception}
                    onChange={(e) => setExceptions((prev) => ({ ...prev, [q.id]: e.target.value }))}
                  />
                  <p className="cq-help">
                    적은 내용은 아래 조문 끝에 단서로 붙습니다. 다른 팀원도 각자 예외를 적을 수 있고, 합의 단계에서 함께 검토합니다.
                  </p>
                </div>
              )}
            </section>

            <section className="cq-preview">
              <div className="cq-preview-head"><FileText size={16} /> 계약서 반영 미리보기</div>
              <div className="cq-paper">
                <h2 className="cq-paper-article">{q.preview.article}</h2>
                {q.preview.blocks.map((block, i) => (
                  <PreviewBlockView key={i} block={block} values={previewValues} />
                ))}
                {exception.trim() && (
                  <p className="cq-paper-para cq-paper-exception">
                    <span className="cq-paper-exception-tag">예외</span>
                    {exception.trim()}
                  </p>
                )}
                {penaltyClauses && (
                  <>
                    <h2 className="cq-paper-article next">제8조 (손해배상 및 위약벌)</h2>
                    {penaltyClauses.map((c) => (
                      <p key={c.article} className="cq-paper-para">
                        {c.article.replace("제8조 ", "")} <Filled text={c.text} values={penaltyValues} />
                      </p>
                    ))}
                  </>
                )}
              </div>
            </section>

          </article>
        </main>

        <aside className="cq-info" aria-label="이 조항에 대한 정보">
          <div className="cq-info-label">알아두면 좋은 것</div>

          {/* 한 페이지에 글이 너무 많아진다. 제목만 두고 필요한 사람만 펼친다. */}
          <details className="cq-info-card">
            <summary className="cq-info-head">
              <BookOpen size={15} /> 이 조항은 무엇인가
              <ChevronDown size={14} className="cq-info-chev" aria-hidden="true" />
            </summary>
            <div className="cq-info-body"><p><Gloss text={q.info.what} /></p></div>
          </details>

          <details className="cq-info-card">
            <summary className="cq-info-head">
              <HelpingHand size={15} /> 정하지 않으면
              <ChevronDown size={14} className="cq-info-chev" aria-hidden="true" />
            </summary>
            <div className="cq-info-body"><p><Gloss text={q.info.ifUnset} /></p></div>
          </details>

          {/* 답을 넣으면 이 카드의 내용이 가운데 결과 카드로 대체된다. 같은 걸 두 번 읽히지 않는다. */}
          {value === undefined && (q.info.low || q.info.high) && (
            <details className="cq-info-card">
              <summary className="cq-info-head">
                <Scale size={15} /> 한쪽으로 정하면
                <ChevronDown size={14} className="cq-info-chev" aria-hidden="true" />
              </summary>
              <div className="cq-info-body">
                {q.info.low && (
                  <div className="cq-info-side">
                    <span className="cq-info-side-tag low">낮게 / 좁게</span>
                    <p><Gloss text={q.info.low} /></p>
                  </div>
                )}
                {q.info.high && (
                  <div className="cq-info-side">
                    <span className="cq-info-side-tag high">높게 / 넓게</span>
                    <p><Gloss text={q.info.high} /></p>
                  </div>
                )}
              </div>
            </details>
          )}

          <p className="cq-info-disclaimer">{INFO_DISCLAIMER}</p>
        </aside>
      </div>

      <footer className="cq-footer">
        <button className="cq-back" type="button" disabled={index === 0} onClick={() => go(-1)}>
          <ArrowLeft size={18} /> 이전
        </button>
        <div className="cq-footer-right">
          <div className="cq-team"><Users size={14} /> 3명 중 2명 응답</div>
          <div className="cq-progress">
            <div className="cq-progress-meta">
              <span className="cq-progress-label">{index + 1} / {CONTRACT_QUESTIONS.length}</span>
              <span className="cq-progress-pct">{progress}%</span>
            </div>
            <div className="cq-progress-bar"><span style={{ width: `${progress}%` }} /></div>
          </div>
          <button
            className="cq-cta"
            type="button"
            disabled={blocked || index === CONTRACT_QUESTIONS.length - 1}
            onClick={() => go(1)}
          >
            다음 <ArrowRight size={20} />
          </button>
        </div>
      </footer>

      <style dangerouslySetInnerHTML={{ __html: CSS }} />
    </div>
  );
}

// 제8조의 한 항이 이 조항에 무엇을 거는지 한 줄로 읽어 준다.
function penaltyLine(c: PenaltyClause, p: { base?: number; rate?: number }): string {
  return c.uses
    .map((u) =>
      u === "base"
        ? p.base ? `${won(p.base)}` : "금액 미정"
        : p.rate ? `처분 금액의 ${p.rate}%` : "비율 미정"
    )
    .join(c.uses.length > 1 ? " 또는 " : "");
}

function penaltyUses(clauses: PenaltyClause[]): Set<"base" | "rate"> {
  return new Set(clauses.flatMap((c) => c.uses));
}

// 조문 한 조각을 그리고, 답변이 들어간 자리를 하이라이트한다.
function Filled({ text, values }: { text: string; values: (string | null)[] }) {
  return (
    <>
      {fillPreview(text, values).map((part, i) =>
        part.filled ? (
          <mark key={i} className="cq-mark-fill">{part.text}</mark>
        ) : part.text === "[  ]" ? (
          <span key={i} className="cq-blank">&nbsp;&nbsp;&nbsp;&nbsp;</span>
        ) : (
          <span key={i}>{part.text}</span>
        )
      )}
    </>
  );
}

function PreviewBlockView({ block, values }: { block: PreviewBlock; values: (string | null)[] }) {
  if (block.kind === "ellipsis") return <p className="cq-paper-ellipsis">⋯ 이하 생략 ⋯</p>;
  if (block.kind === "sign") return <p className="cq-paper-sign"><Filled text={block.text} values={values} /></p>;
  if (block.kind === "para") {
    return (
      <p className={`cq-paper-para ${block.indent ? "indent" : ""}`}>
        <Filled text={block.text} values={values} />
      </p>
    );
  }
  return (
    <div className="cq-paper-table-wrap">
      <table className="cq-paper-table">
        <thead>
          <tr>{block.head.map((h, i) => <th key={i}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {block.rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j}>{cell ? <Filled text={cell} values={values} /> : null}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function usePreviewValues(q: ContractQuestion, value: unknown): (string | null)[] {
  return useMemo(() => {
    const t = q.template;
    if (value === undefined || value === null || value === "") return [];

    if (t.type === "amount") return [formatKoreanAmount(Number(value))];
    if (t.type === "duration") return [`${value}${t.unit}`];
    if (t.type === "percent") return [String(value)];
    if (t.type === "choice") return [choiceLabel(t, value)];
    if (t.type === "matrix") {
      const v = value as Record<string, string | number>;
      return MOCK_MEMBERS.map((m) => (v[m.id] ? String(v[m.id]) : null));
    }
    if (t.type === "fields") {
      const v = value as Record<string, string>;
      return t.fields.map((f) => v[f.key] || null);
    }
    const v = value as Record<string, unknown>;
    return t.parts.map((p) => {
      const pv = v[p.key];
      if (pv === undefined || pv === null || pv === "") return null;
      if (p.template.type === "amount") return formatNumber(Number(pv));
      if (p.template.type === "duration") return `${pv}${p.template.unit}`;
      if (p.template.type === "percent") return String(pv);
      if (p.template.type === "choice") return choiceLabel(p.template, pv);
      return String(pv);
    });
  }, [q, value]);
}

function isBlocked(q: ContractQuestion, value: unknown): boolean {
  if (q.template.type !== "matrix" || q.template.variant !== "allocation") return false;
  const v = (value ?? {}) as Record<string, number>;
  const nums: Record<string, number> = {};
  for (const m of MOCK_MEMBERS) nums[m.id] = Number(v[m.id]) || 0;
  return !validateAllocation(nums).ok;
}

// 스타일은 /mockup/contract-questions 와 동일하고, 맨 아래 cr-* 만 추가된다.
const CSS = `
.cq-page { min-height: 100vh; display: flex; flex-direction: column;
  background:
    radial-gradient(at 0% 0%, rgba(79,70,229,0.12) 0px, transparent 50%),
    radial-gradient(at 100% 0%, rgba(16,185,129,0.08) 0px, transparent 50%),
    radial-gradient(at 100% 100%, rgba(79,70,229,0.08) 0px, transparent 50%),
    radial-gradient(at 0% 100%, rgba(16,185,129,0.08) 0px, transparent 50%),
    #F8FAFC; }
.cq-shell { flex: 1; display: flex; flex-wrap: wrap; align-items: flex-start; max-width: 1680px; margin: 0 auto; width: 100%; }

/* 본문과 같이 움직인다. 따로 스크롤하지 않고, 본문 카드처럼 흰 면 위에 얹는다. */
.cq-sidebar { width: 272px; flex-shrink: 0; margin: 32px 0 140px 32px; padding: 24px 0; background: #fff; border: 1px solid #e2e8f0; border-radius: 24px; align-self: flex-start; overflow: hidden; }
.cq-sidebar-label { padding: 0 20px; margin-bottom: 20px; font-size: 10px; font-weight: 900; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.25em; }
.cq-sidebar-nav { display: flex; flex-direction: column; gap: 2px; }
.cq-side-group { position: relative; padding-bottom: 8px; }
.cq-side-head { width: 100%; display: grid; grid-template-columns: 1fr auto; grid-template-areas: "ko count" "en count"; align-items: center; gap: 0 8px; padding: 12px 16px 8px 20px; background: none; border: none; font: inherit; text-align: left; cursor: pointer; border-radius: 0 12px 12px 0; }
.cq-side-head:hover { background: rgba(79,70,229,0.04); }
.cq-side-head:focus-visible { outline: 2px solid #4F46E5; outline-offset: -2px; }
.cq-side-ko { grid-area: ko; font-size: 14px; font-weight: 700; color: #94a3b8; display: inline-flex; align-items: center; gap: 6px; }
.cq-side-en { grid-area: en; font-size: 10px; font-weight: 500; color: rgba(148,163,184,0.6); text-transform: uppercase; letter-spacing: 0.08em; }
.cq-side-count { grid-area: count; font-size: 12px; font-weight: 800; color: #cbd5e1; font-variant-numeric: tabular-nums; }
.cq-side-dot { width: 6px; height: 6px; border-radius: 999px; background: #F59E0B; }
.cq-side-group.active .cq-side-ko { font-weight: 800; color: #0f172a; }
.cq-side-group.active .cq-side-en { color: rgba(79,70,229,0.7); }
.cq-side-group.active .cq-side-count { color: #4F46E5; }
.cq-side-group.active::before { content: ""; position: absolute; left: 0; top: 14px; width: 4px; height: 26px; background: #4F46E5; border-radius: 0 999px 999px 0; }

.cq-side-list { list-style: none; display: flex; flex-direction: column; }
.cq-side-q { width: 100%; display: flex; align-items: center; gap: 9px; padding: 7px 14px 7px 20px; background: none; border: none; font: inherit; text-align: left; cursor: pointer; border-radius: 0 12px 12px 0; }
.cq-side-q:hover { background: rgba(79,70,229,0.05); }
.cq-side-q:focus-visible { outline: 2px solid #4F46E5; outline-offset: -2px; }
.cq-side-q.current { background: rgba(79,70,229,0.09); }
.cq-side-mark { width: 17px; height: 17px; flex-shrink: 0; border-radius: 999px; border: 1px solid #e2e8f0; background: #fff; color: #94a3b8; font-size: 9px; font-weight: 900; display: inline-flex; align-items: center; justify-content: center; font-variant-numeric: tabular-nums; }
.cq-side-mark.done { background: #10B981; border-color: #10B981; color: #fff; }
.cq-side-q.current .cq-side-mark:not(.done) { border-color: #4F46E5; color: #4F46E5; }
.cq-side-q-text { font-size: 12px; font-weight: 600; color: #94a3b8; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.cq-side-exc { width: 5px; height: 5px; flex-shrink: 0; border-radius: 999px; background: #10B981; }
.cq-side-q.current .cq-side-q-text { color: #3730A3; font-weight: 800; }

.cq-main { flex: 1 1 520px; min-width: 0; padding: 32px 28px 140px; }
.cq-card { max-width: 880px; margin: 0 auto; background: rgba(255,255,255,0.95); backdrop-filter: blur(24px);
  border: 1px solid rgba(255,255,255,0.2); box-shadow: 0 20px 50px rgba(79,70,229,0.05);
  border-radius: 40px; padding: 40px 48px; display: flex; flex-direction: column; gap: 28px; }
.cq-card-head { display: flex; flex-direction: column; gap: 14px; }
.cq-eyebrow-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.cq-eyebrow-bar { height: 3px; width: 32px; background: #4F46E5; border-radius: 999px; }
.cq-eyebrow { color: #4F46E5; font-weight: 900; font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; }
.cq-badge-proposed { padding: 4px 10px; border-radius: 999px; border: 1px dashed #F59E0B; background: rgba(245,158,11,0.06); color: #B45309; font-size: 11px; font-weight: 900; }
.cq-badge-fact { padding: 4px 10px; border-radius: 999px; background: #f1f5f9; color: #64748b; font-size: 11px; font-weight: 800; }
.cq-title { font-size: 30px; font-weight: 900; line-height: 1.25; color: #0f172a; letter-spacing: -0.02em; }
.cq-desc { font-size: 15px; color: #64748b; font-weight: 500; line-height: 1.7; max-width: 42rem; }

.cq-input-zone { border-top: 1px solid #f1f5f9; border-bottom: 1px solid #f1f5f9; padding: 28px 0; display: flex; flex-direction: column; }
.cq-field { display: flex; flex-direction: column; gap: 14px; }
.cq-field-row { display: flex; flex-direction: column; gap: 8px; }
.cq-label { font-size: 13px; font-weight: 800; color: #475569; }
.cq-help { font-size: 13px; color: #94a3b8; font-weight: 600; }
.cq-input { min-height: 44px; width: 100%; background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 14px; font: inherit; font-size: 15px; font-weight: 600; color: #1e293b; }
.cq-input:focus-visible { outline: 2px solid #4F46E5; outline-offset: 1px; }
.cq-num { font-variant-numeric: tabular-nums; }

.cq-chips { display: flex; flex-wrap: wrap; gap: 10px; }
/* 테두리 폭을 항상 2px 로 두고 색만 바꾼다. 선택할 때 1px 씩 밀리지 않게. */
.cq-chip { position: relative; min-height: 44px; padding: 0 18px; border-radius: 16px; border: 2px solid #e2e8f0; background: #fff; font: inherit; font-size: 14px; font-weight: 700; color: #475569; cursor: pointer; transition: border-color 0.15s, background 0.15s, color 0.15s; }
.cq-chip:hover { border-color: #c7d2fe; }
.cq-chip:focus-visible { outline: 2px solid #4F46E5; outline-offset: 2px; }
.cq-chip.on { border-color: #4F46E5; background: rgba(79,70,229,0.06); color: #4338CA; }
.cq-chips.small .cq-chip { min-height: 36px; padding: 0 12px; font-size: 12px; border-radius: 10px; }

.cq-amount-row { display: flex; align-items: center; gap: 10px; }
.cq-amount-won { font-size: 20px; font-weight: 800; color: #94a3b8; }
.cq-stepper { display: flex; align-items: center; gap: 10px; }
.cq-step-btn { width: 44px; height: 44px; border-radius: 12px; border: 1px solid #e2e8f0; background: #fff; font-size: 20px; font-weight: 800; color: #475569; cursor: pointer; }
.cq-step-btn:focus-visible { outline: 2px solid #4F46E5; outline-offset: 2px; }
.cq-step-input { width: 96px; text-align: center; }
.cq-unit { font-size: 15px; font-weight: 800; color: #475569; }

.cq-pct-row { display: flex; align-items: center; gap: 8px; }
.cq-pct-num { width: 96px; text-align: center; }
.cq-range { width: 100%; accent-color: #4F46E5; height: 44px; }
.cq-marks { display: flex; justify-content: space-between; gap: 8px; }
.cq-mark { display: flex; flex-direction: column; align-items: center; gap: 2px; background: none; border: none; cursor: pointer; font: inherit; padding: 6px 8px; border-radius: 10px; }
.cq-mark:hover { background: #f8fafc; }
.cq-mark:focus-visible { outline: 2px solid #4F46E5; outline-offset: 2px; }
.cq-mark-v { font-size: 12px; font-weight: 800; color: #475569; font-variant-numeric: tabular-nums; }
.cq-mark-l { font-size: 11px; font-weight: 700; color: #94a3b8; }

.cq-choice-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px; }
.cq-choice { position: relative; display: flex; align-items: flex-start; gap: 14px; text-align: left; padding: 20px 44px 20px 22px; border-radius: 24px; border: 2px solid #e2e8f0; background: #fff; cursor: pointer; font: inherit; transition: border-color 0.15s, background 0.15s, box-shadow 0.15s; }
.cq-choice:hover { border-color: #c7d2fe; }
.cq-choice:focus-visible { outline: 2px solid #4F46E5; outline-offset: 2px; }
.cq-choice.on { border-color: #4F46E5; background: rgba(79,70,229,0.04); box-shadow: 0 16px 30px -12px rgba(79,70,229,0.25); }
.cq-choice-body { display: flex; flex-direction: column; gap: 6px; }
.cq-choice-label { font-size: 16px; font-weight: 900; color: #0f172a; }
.cq-choice-desc { font-size: 13px; color: #64748b; font-weight: 500; line-height: 1.5; }
.cq-choice-check { position: absolute; top: 18px; right: 18px; color: #10B981; }
.cq-avatar { width: 40px; height: 40px; flex-shrink: 0; border-radius: 999px; background: rgba(79,70,229,0.1); color: #4F46E5; display: inline-flex; align-items: center; justify-content: center; font-size: 16px; font-weight: 900; }

.cq-matrix-row { display: grid; grid-template-columns: 160px 140px 1fr; align-items: center; gap: 14px; padding: 10px 0; border-bottom: 1px solid #f8fafc; }
.cq-matrix-row.text { grid-template-columns: 160px 1fr; grid-template-areas: "name chips" "name input"; gap: 8px 14px; align-items: start; }
.cq-matrix-row.text .cq-matrix-name { grid-area: name; padding-top: 10px; }
.cq-matrix-row.text .cq-chips { grid-area: chips; }
.cq-matrix-row.text .cq-input { grid-area: input; }
.cq-matrix-name { font-size: 15px; font-weight: 800; color: #1e293b; }
.cq-matrix-role { font-size: 12px; font-weight: 600; color: #94a3b8; }
.cq-bar { height: 14px; background: #f1f5f9; border-radius: 999px; overflow: hidden; }
.cq-bar span { display: block; height: 100%; background: #4F46E5; border-radius: 999px; transition: width 0.2s; }
.cq-total { display: inline-flex; align-self: flex-start; align-items: center; gap: 8px; margin-top: 8px; padding: 12px 18px; border-radius: 16px; font-size: 14px; font-weight: 800; min-height: 44px; }
.cq-total.ok { background: rgba(16,185,129,0.08); color: #047857; }
.cq-total.warn { background: rgba(245,158,11,0.08); color: #B45309; }

/* 예외 조항 — 평소엔 접어두고 버튼만 보인다. 문항마다 폼을 펼쳐두면 화면이 무거워진다. */
.cq-exception-add { display: inline-flex; align-items: center; gap: 8px; min-height: 44px; padding: 0 18px; border-radius: 16px; border: 1px dashed #cbd5e1; background: none; font: inherit; font-size: 13px; font-weight: 800; color: #64748b; cursor: pointer; transition: border-color 0.15s, color 0.15s, background 0.15s; }
.cq-exception-add:hover { border-color: #a5b4fc; color: #4338CA; background: rgba(79,70,229,0.03); }
.cq-exception-add:focus-visible { outline: 2px solid #4F46E5; outline-offset: 2px; }
.cq-exception-add svg { color: #94a3b8; }
.cq-exception-add:hover svg { color: #4F46E5; }
.cq-exception-hint { font-size: 12px; font-weight: 600; color: #cbd5e1; }
.cq-exception-box { display: flex; flex-direction: column; gap: 10px; padding: 20px 22px; border-radius: 20px; border: 1px solid #e2e8f0; background: rgba(248,250,252,0.7); }
.cq-exception-top { display: flex; align-items: center; justify-content: space-between; }
.cq-exception-del { display: inline-flex; align-items: center; gap: 5px; min-height: 32px; padding: 0 10px; border-radius: 10px; border: none; background: none; font: inherit; font-size: 12px; font-weight: 700; color: #94a3b8; cursor: pointer; }
.cq-exception-del:hover { color: #b91c1c; background: rgba(185,28,28,0.06); }
.cq-exception-del:focus-visible { outline: 2px solid #4F46E5; outline-offset: 2px; }
.cq-textarea { width: 100%; min-height: 88px; resize: vertical; background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px 14px; font: inherit; font-size: 14px; font-weight: 500; line-height: 1.7; color: #1e293b; }
.cq-textarea:focus-visible { outline: 2px solid #4F46E5; outline-offset: 1px; }
.cq-textarea::placeholder { color: #cbd5e1; }
.cq-paper-exception { position: relative; margin-top: 4px; padding: 14px 16px; border-radius: 10px; background: rgba(16,185,129,0.06); border-left: 3px solid #10B981; }
.cq-paper-exception-tag { display: inline-block; margin-right: 8px; padding: 2px 8px; border-radius: 999px; background: rgba(16,185,129,0.14); color: #047857; font-size: 10px; font-weight: 900; vertical-align: 2px; }

/* 제재 — 조문 미리보기와 같은 결의 구획. 카드를 하나 더 얹지 않는다. */
.cq-penalty { display: flex; flex-direction: column; gap: 12px; padding: 20px 22px; border: 1px solid #e2e8f0; border-radius: 20px; background: #f8fafc; }
.cq-penalty-head { display: inline-flex; align-items: center; gap: 8px; font-size: 11px; font-weight: 900; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.15em; }
.cq-penalty-head svg { color: #4F46E5; }
.cq-penalty-lines { list-style: none; display: flex; flex-direction: column; gap: 8px; }
.cq-penalty-lines li { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; font-size: 14px; font-weight: 700; color: #1e293b; }
.cq-penalty-tag { padding: 3px 9px; border-radius: 999px; background: #EEF2FF; color: #4338CA; font-size: 11px; font-weight: 900; }
.cq-penalty-check { display: inline-flex; align-items: center; gap: 9px; min-height: 44px; font-size: 13px; font-weight: 700; color: #475569; cursor: pointer; }
.cq-penalty-check input { width: 18px; height: 18px; accent-color: #4F46E5; cursor: pointer; }
.cq-penalty-jump { border: none; background: none; font: inherit; font-size: 14px; font-weight: 800; color: #4338CA; text-decoration: underline; padding: 0; cursor: pointer; }
.cq-penalty-jump:focus-visible { outline: 2px solid #4F46E5; outline-offset: 2px; }
.cq-paper-article.next { margin-top: 18px; }

.cq-preview { background: rgba(241,245,249,0.5); border: 1px solid #f1f5f9; border-radius: 24px; padding: 20px; display: flex; flex-direction: column; gap: 14px; }
.cq-preview-head { display: inline-flex; align-items: center; gap: 8px; padding-left: 6px; font-size: 11px; font-weight: 900; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.15em; }
.cq-preview-head svg { color: #4F46E5; }

/* 실제 계약서 지면. 마크다운 기호 없이 문서 그대로 읽히게 한다. */
.cq-paper { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 1px 3px rgba(15,23,42,0.04); padding: 36px 40px; display: flex; flex-direction: column; gap: 14px; }
.cq-paper-article { font-size: 15px; font-weight: 800; color: #0f172a; letter-spacing: -0.01em; padding-bottom: 14px; border-bottom: 1px solid #f1f5f9; margin-bottom: 4px; }
.cq-paper-para { font-size: 13.5px; line-height: 2.05; color: #1e293b; word-break: keep-all; }
.cq-paper-para.indent { padding-left: 22px; font-size: 13px; color: #334155; }
.cq-paper-sign { font-size: 13.5px; line-height: 2.1; color: #1e293b; white-space: pre-wrap; }
.cq-paper-ellipsis { text-align: center; font-size: 12px; color: #cbd5e1; font-weight: 700; letter-spacing: 0.1em; padding: 2px 0; }
.cq-paper-table-wrap { overflow-x: auto; margin: 4px 0; }
.cq-paper-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.cq-paper-table th, .cq-paper-table td { border: 1px solid #e2e8f0; padding: 9px 12px; text-align: center; color: #1e293b; }
.cq-paper-table th { background: #f8fafc; font-weight: 800; font-size: 12px; color: #475569; }
.cq-paper-table td:first-child { font-weight: 700; }
.cq-paper-table tbody tr:last-child { background: #fafbfc; font-weight: 800; }

.cq-mark-fill { background: rgba(79,70,229,0.12); color: #3730A3; font-weight: 800; padding: 1px 5px; border-radius: 4px; font-variant-numeric: tabular-nums; }
.cq-blank { display: inline-block; min-width: 3.2em; border-bottom: 1px solid #cbd5e1; vertical-align: baseline; }

/* 사이드바와 같다. 본문과 함께 움직이고, 카드는 제목만 두고 접어 둔다. */
.cq-info { width: 340px; flex-shrink: 0; padding: 32px 32px 140px 0; display: flex; flex-direction: column; gap: 10px; align-self: flex-start; }
.cq-info-label { font-size: 10px; font-weight: 900; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.25em; padding-left: 2px; margin-bottom: 4px; }
.cq-info-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; }
.cq-info-card:hover { border-color: #cbd5e1; }
.cq-info-card > summary { list-style: none; cursor: pointer; padding: 13px 16px; min-height: 44px; }
.cq-info-card > summary::-webkit-details-marker { display: none; }
.cq-info-card > summary:focus-visible { outline: 2px solid #4F46E5; outline-offset: -2px; }
.cq-info-head { display: flex; align-items: center; gap: 7px; font-size: 12px; font-weight: 900; color: #0f172a; letter-spacing: -0.01em; }
.cq-info-head svg { color: #4F46E5; flex-shrink: 0; }
.cq-info-head .cq-info-chev { margin-left: auto; color: #cbd5e1; transition: transform 0.15s; }
.cq-info-card[open] .cq-info-chev { transform: rotate(180deg); }
.cq-info-body { padding: 0 16px 16px; display: flex; flex-direction: column; gap: 10px; }
.cq-info-card p { font-size: 13px; line-height: 1.75; color: #475569; font-weight: 500; }
.cq-info-side { display: flex; flex-direction: column; gap: 6px; padding-top: 4px; }
.cq-info-side + .cq-info-side { border-top: 1px solid #f1f5f9; padding-top: 12px; }
.cq-info-side-tag { align-self: flex-start; padding: 3px 10px; border-radius: 999px; font-size: 10px; font-weight: 900; }
.cq-info-side-tag.low { background: rgba(148,163,184,0.14); color: #475569; }
.cq-info-side-tag.high { background: rgba(79,70,229,0.1); color: #4338CA; }
.cq-info-disclaimer { font-size: 11px; line-height: 1.7; color: #94a3b8; font-weight: 600; padding: 0 4px; }

.cq-composite { display: flex; flex-direction: column; gap: 28px; }
.cq-part-label { font-size: 12px; font-weight: 900; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.15em; margin-bottom: 12px; }

.cq-footer { position: fixed; bottom: 0; left: 0; width: 100%; height: 96px; display: flex; align-items: center; justify-content: space-between; padding: 0 48px; background: rgba(255,255,255,0.9); backdrop-filter: blur(24px); border-top: 1px solid rgba(226,232,240,0.5); z-index: 100; }
.cq-back { display: inline-flex; align-items: center; gap: 10px; padding: 10px 20px; min-height: 44px; border-radius: 16px; border: none; background: none; color: #94a3b8; font: inherit; font-size: 15px; font-weight: 700; cursor: pointer; }
.cq-back:hover:not(:disabled) { color: #4F46E5; background: #f8fafc; }
.cq-back:disabled { opacity: 0.4; cursor: not-allowed; }
.cq-footer-right { display: flex; align-items: center; gap: 32px; }
.cq-team { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 700; color: #94a3b8; }
.cq-progress { display: flex; flex-direction: column; align-items: flex-end; gap: 8px; }
.cq-progress-meta { display: flex; align-items: center; gap: 14px; }
.cq-progress-label { font-size: 11px; font-weight: 900; color: #94a3b8; letter-spacing: 0.1em; font-variant-numeric: tabular-nums; }
.cq-progress-pct { font-size: 14px; font-weight: 900; color: #4F46E5; font-variant-numeric: tabular-nums; }
.cq-progress-bar { width: 224px; height: 8px; background: rgba(241,245,249,0.8); border-radius: 999px; overflow: hidden; }
.cq-progress-bar span { display: block; height: 100%; background: #4F46E5; border-radius: 999px; transition: width 0.2s; }
.cq-cta { height: 56px; padding: 0 40px; background: #4F46E5; color: #fff; font: inherit; font-size: 16px; font-weight: 900; border: none; border-radius: 20px; box-shadow: 0 15px 35px rgba(79,70,229,0.3); cursor: pointer; display: inline-flex; align-items: center; gap: 10px; transition: all 0.2s; }
.cq-cta:hover:not(:disabled) { background: #4338CA; }
.cq-cta:disabled { background: #cbd5e1; box-shadow: none; cursor: not-allowed; }

/* ── 추가: 답변 결과 카드 ────────────────────────────────── */
.cr-zone { display: flex; flex-direction: column; gap: 14px; }
.cr-zone-head { display: inline-flex; align-items: center; gap: 8px; padding-left: 6px; font-size: 11px; font-weight: 900; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.15em; }
.cr-zone-head svg { color: #4F46E5; }

/* 카드는 본문의 다른 카드와 같은 규칙을 따른다 — 1px 테두리, 24px 라운드, 그림자 없음. */
.cr-card { position: relative; background: #fff; border: 1px solid #e2e8f0; border-radius: 24px; padding: 22px 24px 18px;
  display: flex; flex-direction: column; gap: 12px; }
.cr-figure { padding: 6px 0 2px; }
.cr-svg { width: 100%; height: auto; display: block; }
.cr-plain { font-size: 16px; line-height: 1.7; font-weight: 800; color: #0f172a; word-break: keep-all; letter-spacing: -0.01em; }
/* 다른 답과 겹쳐 생기는 결과. 카드를 새로 만들지 않고 한 줄씩 잇는다. */
.cr-rows { list-style: none; display: flex; flex-direction: column; gap: 12px; margin-top: 2px; padding-top: 14px; border-top: 1px solid #f1f5f9; }
.cr-row { display: flex; flex-direction: column; gap: 6px; }
.cr-from { display: inline-flex; align-items: center; gap: 4px; flex-wrap: wrap; }
.cr-from-tag { padding: 3px 9px; border-radius: 999px; border: 1px solid #c7d2fe; background: #EEF2FF; color: #4338CA; font: inherit; font-size: 11px; font-weight: 900; cursor: pointer; }
.cr-from-tag:hover { background: #E0E7FF; }
.cr-from-tag:focus-visible { outline: 2px solid #4F46E5; outline-offset: 2px; }
.cr-from-with { font-size: 11px; font-weight: 800; color: #94a3b8; }
.cr-row-text { font-size: 14.5px; line-height: 1.7; font-weight: 700; color: #1e293b; word-break: keep-all; }

/* 어려운 말 뜻풀이. 마우스와 키보드 둘 다로 열린다 — hover 전용은 만들지 않는다. */
.cq-term { position: relative; border-bottom: 1px dashed #cbd5e1; cursor: help; }
.cq-term-pop { position: absolute; left: 0; bottom: calc(100% + 8px); z-index: 60; width: max-content; max-width: 240px;
  padding: 10px 12px; border-radius: 10px; background: #1e293b; color: #fff;
  font-size: 12px; font-weight: 500; line-height: 1.6; letter-spacing: 0; text-align: left; word-break: keep-all;
  opacity: 0; visibility: hidden; transition: opacity 0.12s; pointer-events: none; }
.cq-term:hover .cq-term-pop, .cq-term:focus-visible .cq-term-pop { opacity: 1; visibility: visible; }
.cq-term:focus-visible { outline: 2px solid #4F46E5; outline-offset: 2px; border-radius: 3px; }
.cq-info .cq-term-pop { left: auto; right: 0; }

/* 값을 모르는 항목은 크기를 지어내지 않고 점선 블록으로 둔다. */
.cr-mag { display: flex; flex-wrap: wrap; gap: 12px; padding: 2px 0; }
.cr-mag-box { flex: 1 1 150px; display: flex; flex-direction: column; gap: 5px; padding: 16px 18px; border-radius: 16px;
  background: #EEF2FF; border: 1px solid #c7d2fe; }
.cr-mag-box.outline { background: #fff; border-color: #e2e8f0; border-style: dashed; }
.cr-mag-text { font-size: 19px; font-weight: 900; color: #3730A3; font-variant-numeric: tabular-nums; letter-spacing: -0.02em; }
.cr-mag-box.outline .cr-mag-text { color: #64748b; }
.cr-mag-label { font-size: 12px; font-weight: 700; color: #6366F1; }
.cr-mag-box.outline .cr-mag-label { color: #94a3b8; }

.cr-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; min-height: 190px; border: 1px dashed #e2e8f0; border-radius: 24px; background: #f8fafc; }
.cr-empty-art { width: 100%; max-width: 420px; opacity: 0.85; }
.cr-empty-art svg { width: 100%; height: auto; }
.cr-empty-text { font-size: 13px; font-weight: 700; color: #cbd5e1; }

/* 정보 칼럼이 좁아지기 전에 본문 아래로 내려보낸다. 읽는 순서는 질문 → 정보 그대로. */
@media (max-width: 1320px) {
  .cq-info { width: 100%; position: static; max-height: none; overflow: visible; padding: 0 40px 140px; flex-direction: row; flex-wrap: wrap; align-items: flex-start; }
  .cq-info-label { width: 100%; }
  .cq-info-card { flex: 1 1 280px; }
  .cq-info-disclaimer { width: 100%; }
  .cq-main { padding-bottom: 24px; }
}

@media (max-width: 1100px) {
  .cq-sidebar { display: none; }
  .cq-paper { padding: 24px 20px; }
  .cq-info { padding: 0 20px 180px; }
  .cq-main { padding: 24px 20px 8px; }
  .cq-card { padding: 28px 24px; border-radius: 28px; }
  .cq-title { font-size: 24px; }
  .cq-matrix-row { grid-template-columns: 1fr; }
  .cq-matrix-row.text { grid-template-columns: 1fr; grid-template-areas: "name" "chips" "input"; }
  .cq-matrix-row.text .cq-matrix-name { padding-top: 0; }
  .cq-footer { height: auto; padding: 12px 20px; flex-wrap: wrap; gap: 12px; }
  .cq-footer-right { gap: 16px; width: 100%; justify-content: space-between; }
  .cq-progress-bar { width: 120px; }
  .cq-cta { padding: 0 24px; }
}

@media (prefers-reduced-motion: reduce) {
  .cq-chip, .cq-choice, .cq-bar span, .cq-progress-bar span, .cq-cta, .cq-info-chev, .cq-term-pop { transition: none; }
}
`;
