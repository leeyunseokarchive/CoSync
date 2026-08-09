"use client";

import React from "react";
import { Check } from "lucide-react";
import type { ChoiceValue, QuestionTemplate } from "../lib/contractQuestions";
import { MOCK_MEMBERS, validateAllocation } from "../lib/contractQuestions";

export function formatNumber(n: number): string {
  return Number(n || 0).toLocaleString("ko-KR");
}

// 자릿수 오입력을 막기 위해 숫자 아래에 한글 금액을 병기한다.
const UNITS = [
  { v: 1_0000_0000_0000, label: "조" },
  { v: 1_0000_0000, label: "억" },
  { v: 1_0000, label: "만" },
];

export function formatKoreanAmount(n: number): string {
  let rest = Math.floor(Number(n) || 0);
  if (rest <= 0) return "";
  const parts: string[] = [];
  for (const u of UNITS) {
    const q = Math.floor(rest / u.v);
    if (q > 0) {
      parts.push(`${formatNumber(q)}${u.label}`);
      rest -= q * u.v;
    }
  }
  if (rest > 0) parts.push(formatNumber(rest));
  return `${parts.join(" ")} 원`;
}

// 칩은 입력 단축키일 뿐이다. 특정 값을 권하는 표식은 붙이지 않는다 — 변호사법 제109조 리스크.
function Chips({ items, active, onPick }: {
  items: { label: string; value: number }[];
  active: number | undefined;
  onPick: (v: number) => void;
}) {
  return (
    <div className="cq-chips">
      {items.map((it) => (
        <button
          key={it.value}
          type="button"
          className={`cq-chip ${active === it.value ? "on" : ""}`}
          aria-pressed={active === it.value}
          onClick={() => onPick(it.value)}
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}

function AmountInput({ tpl, value, onChange, id }: {
  tpl: Extract<QuestionTemplate, { type: "amount" }>;
  value: number | undefined;
  onChange: (v: number) => void;
  id: string;
}) {
  const korean = formatKoreanAmount(value ?? 0);
  return (
    <div className="cq-field">
      <Chips items={tpl.presets} active={value} onPick={onChange} />
      <label className="cq-label" htmlFor={id}>금액 직접 입력</label>
      <div className="cq-amount-row">
        <span className="cq-amount-won" aria-hidden="true">₩</span>
        <input
          id={id}
          className="cq-input cq-num"
          inputMode="numeric"
          value={value ? formatNumber(value) : ""}
          placeholder="0"
          onChange={(e) => onChange(Number(e.target.value.replace(/[^0-9]/g, "")))}
        />
      </div>
      <p className="cq-help">{korean || "금액을 입력하면 한글로 확인해 드립니다."}</p>
    </div>
  );
}

function DurationInput({ tpl, value, onChange, id }: {
  tpl: Extract<QuestionTemplate, { type: "duration" }>;
  value: number | undefined;
  onChange: (v: number) => void;
  id: string;
}) {
  const v = value ?? 0;
  return (
    <div className="cq-field">
      <Chips
        items={tpl.presets.map((p) => ({ label: `${p}${tpl.unit}`, value: p }))}
        active={v}
        onPick={onChange}
      />
      <label className="cq-label" htmlFor={id}>직접 입력</label>
      <div className="cq-stepper">
        <button type="button" className="cq-step-btn" aria-label="1 줄이기" onClick={() => onChange(Math.max(0, v - 1))}>−</button>
        <input
          id={id}
          className="cq-input cq-num cq-step-input"
          inputMode="numeric"
          value={v || ""}
          placeholder="0"
          onChange={(e) => onChange(Number(e.target.value.replace(/[^0-9]/g, "")))}
        />
        <button type="button" className="cq-step-btn" aria-label="1 늘리기" onClick={() => onChange(v + 1)}>+</button>
        <span className="cq-unit">{tpl.unit}</span>
      </div>
    </div>
  );
}

function PercentInput({ tpl, value, onChange, id }: {
  tpl: Extract<QuestionTemplate, { type: "percent" }>;
  value: number | undefined;
  onChange: (v: number) => void;
  id: string;
}) {
  const v = value ?? 0;
  return (
    <div className="cq-field">
      <label className="cq-label" htmlFor={id}>비율</label>
      <div className="cq-pct-row">
        <input
          id={id}
          className="cq-input cq-num cq-pct-num"
          inputMode="numeric"
          value={v || ""}
          placeholder="0"
          onChange={(e) => onChange(Math.min(100, Number(e.target.value.replace(/[^0-9]/g, ""))))}
        />
        <span className="cq-unit">%</span>
      </div>
      <input
        type="range"
        className="cq-range"
        min={0}
        max={100}
        step={1}
        value={v}
        aria-label="비율 슬라이더"
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <div className="cq-marks">
        {tpl.marks.map((m) => (
          <button key={m.value} type="button" className="cq-mark" onClick={() => onChange(m.value)}>
            <span className="cq-mark-v">{m.value}%</span>
            {m.label && <span className="cq-mark-l">{m.label}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}

// sub가 붙은 선택지(종류주식)를 고르면 값이 { id, sub } 객체가 되고 하위 내용을 복수로 고른다.
// 그 외 선택지는 지금처럼 문자열 하나만 넘긴다.
function ChoiceInput({ tpl, value, onChange }: {
  tpl: Extract<QuestionTemplate, { type: "choice" }>;
  value: ChoiceValue | undefined;
  onChange: (v: ChoiceValue) => void;
}) {
  const picked = typeof value === "object" && value ? value.id : (value as string | undefined);
  const sub = typeof value === "object" && value ? value.sub : [];
  const active = tpl.options.find((o) => o.id === picked);

  return (
    <div className="cq-field">
      <div className="cq-choice-grid" role="radiogroup">
        {tpl.options.map((o) => {
          const on = picked === o.id;
          return (
            <button
              key={o.id}
              type="button"
              role="radio"
              aria-checked={on}
              className={`cq-choice ${on ? "on" : ""} ${tpl.variant === "person" ? "person" : ""}`}
              onClick={() => onChange(o.sub ? { id: o.id, sub: on ? sub : [] } : o.id)}
            >
              {tpl.variant === "person" && <span className="cq-avatar" aria-hidden="true">{o.label.slice(0, 1)}</span>}
              <span className="cq-choice-body">
                <span className="cq-choice-label">{o.label}</span>
                <span className="cq-choice-desc">{o.desc}</span>
              </span>
              {on && <Check size={18} className="cq-choice-check" aria-hidden="true" />}
            </button>
          );
        })}
      </div>

      {active?.sub && (
        <>
          <div className="cq-part-label">{active.sub.label}</div>
          <div className="cq-choice-grid" role="group" aria-label={active.sub.label}>
            {active.sub.options.map((s) => {
              const on = sub.includes(s.id);
              return (
                <button
                  key={s.id}
                  type="button"
                  role="checkbox"
                  aria-checked={on}
                  className={`cq-choice ${on ? "on" : ""}`}
                  onClick={() =>
                    onChange({ id: active.id, sub: on ? sub.filter((x) => x !== s.id) : [...sub, s.id] })
                  }
                >
                  <span className="cq-choice-body">
                    <span className="cq-choice-label">{s.label}</span>
                    <span className="cq-choice-desc">{s.desc}</span>
                  </span>
                  {on && <Check size={18} className="cq-choice-check" aria-hidden="true" />}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function MatrixInput({ tpl, value, onChange, id }: {
  tpl: Extract<QuestionTemplate, { type: "matrix" }>;
  value: Record<string, string | number> | undefined;
  onChange: (v: Record<string, string | number>) => void;
  id: string;
}) {
  const v = value ?? {};
  const set = (k: string, next: string | number) => onChange({ ...v, [k]: next });

  if (tpl.variant === "allocation") {
    const nums: Record<string, number> = {};
    for (const m of MOCK_MEMBERS) nums[m.id] = Number(v[m.id]) || 0;
    const { total, ok, remaining } = validateAllocation(nums);
    return (
      <div className="cq-field">
        {MOCK_MEMBERS.map((m) => (
          <div key={m.id} className="cq-matrix-row">
            <label className="cq-matrix-name" htmlFor={`${id}-${m.id}`}>
              {m.name} <span className="cq-matrix-role">{m.role}</span>
            </label>
            <div className="cq-pct-row">
              <input
                id={`${id}-${m.id}`}
                className="cq-input cq-num cq-pct-num"
                inputMode="numeric"
                value={nums[m.id] || ""}
                placeholder="0"
                onChange={(e) => set(m.id, Math.min(100, Number(e.target.value.replace(/[^0-9]/g, ""))))}
              />
              <span className="cq-unit">%</span>
            </div>
            <div className="cq-bar"><span style={{ width: `${nums[m.id]}%` }} /></div>
          </div>
        ))}
        <div className={`cq-total ${ok ? "ok" : "warn"}`} aria-live="polite">
          {ok ? (
            <><Check size={16} aria-hidden="true" /> 합계 100% — 배분이 맞습니다.</>
          ) : remaining > 0 ? (
            <>합계 {total}%입니다. {remaining}%를 더 배분하세요.</>
          ) : (
            <>합계 {total}%입니다. {-remaining}%를 줄이세요.</>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="cq-field">
      {MOCK_MEMBERS.map((m) => (
        <div key={m.id} className="cq-matrix-row text">
          <label className="cq-matrix-name" htmlFor={`${id}-${m.id}`}>
            {m.name} <span className="cq-matrix-role">{m.role}</span>
          </label>
          {tpl.chips && (
            <div className="cq-chips small">
              {tpl.chips.map((c) => (
                <button key={c} type="button" className="cq-chip" onClick={() => set(m.id, c)}>{c}</button>
              ))}
            </div>
          )}
          <input
            id={`${id}-${m.id}`}
            className="cq-input"
            placeholder="담당하는 역할과 업무를 적어 주세요"
            value={String(v[m.id] ?? "")}
            onChange={(e) => set(m.id, e.target.value)}
          />
        </div>
      ))}
    </div>
  );
}

function FieldsInput({ tpl, value, onChange, id }: {
  tpl: Extract<QuestionTemplate, { type: "fields" }>;
  value: Record<string, string> | undefined;
  onChange: (v: Record<string, string>) => void;
  id: string;
}) {
  const v = value ?? {};
  return (
    <div className="cq-field">
      {tpl.fields.map((f) => (
        <div key={f.key} className="cq-field-row">
          <label className="cq-label" htmlFor={`${id}-${f.key}`}>{f.label}</label>
          <input
            id={`${id}-${f.key}`}
            className="cq-input"
            type={f.kind === "date" ? "date" : "text"}
            inputMode={f.kind === "number" ? "numeric" : undefined}
            placeholder={f.placeholder}
            value={v[f.key] ?? ""}
            onChange={(e) => onChange({ ...v, [f.key]: e.target.value })}
          />
        </div>
      ))}
    </div>
  );
}

function CompositeInput({ tpl, value, onChange, id }: {
  tpl: Extract<QuestionTemplate, { type: "composite" }>;
  value: Record<string, unknown> | undefined;
  onChange: (v: Record<string, unknown>) => void;
  id: string;
}) {
  const v = value ?? {};
  // 첫 파트가 choice이고 "no"를 골랐으면 이후 파트를 숨긴다 (베스팅 미적용).
  const first = tpl.parts[0];
  const collapsed = first.template.type === "choice" && v[first.key] === "no";
  const visible = collapsed ? [first] : tpl.parts;

  return (
    <div className="cq-composite">
      {visible.map((p) => (
        <div key={p.key} className="cq-part">
          <div className="cq-part-label">{p.label}</div>
          <QuestionInput
            template={p.template}
            value={v[p.key]}
            onChange={(next) => onChange({ ...v, [p.key]: next })}
            keyPrefix={`${id}-${p.key}`}
          />
        </div>
      ))}
    </div>
  );
}

export function QuestionInput({ template, value, onChange, keyPrefix }: {
  template: QuestionTemplate;
  value: unknown;
  onChange: (v: unknown) => void;
  keyPrefix: string;
}) {
  switch (template.type) {
    case "amount":
      return <AmountInput tpl={template} value={value as number} onChange={onChange} id={keyPrefix} />;
    case "duration":
      return <DurationInput tpl={template} value={value as number} onChange={onChange} id={keyPrefix} />;
    case "percent":
      return <PercentInput tpl={template} value={value as number} onChange={onChange} id={keyPrefix} />;
    case "choice":
      return <ChoiceInput tpl={template} value={value as ChoiceValue} onChange={onChange as (v: ChoiceValue) => void} />;
    case "matrix":
      return (
        <MatrixInput
          tpl={template}
          value={value as Record<string, string | number>}
          onChange={onChange as (v: Record<string, string | number>) => void}
          id={keyPrefix}
        />
      );
    case "fields":
      return (
        <FieldsInput
          tpl={template}
          value={value as Record<string, string>}
          onChange={onChange as (v: Record<string, string>) => void}
          id={keyPrefix}
        />
      );
    case "composite":
      return (
        <CompositeInput
          tpl={template}
          value={value as Record<string, unknown>}
          onChange={onChange as (v: Record<string, unknown>) => void}
          id={keyPrefix}
        />
      );
  }
}
