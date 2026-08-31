"use client";

import React from "react";
import type { Figure } from "../lib/contractResults";
import { GLOSSARY } from "../lib/glossary";
import { keepInView } from "./Gloss";

// 도형 4종. 규칙마다 SVG를 그리지 않고, 형태에 값을 넣는다.
// 기존 화면과 같은 평면 스타일로 그린다 — 그라디언트·그림자·하이라이트 없이 면과 선만 쓴다.
const IND = "#4F46E5";        // 본체
const IND_MID = "#C7D2FE";    // 보조 막대
const IND_LIGHT = "#E0E7FF";  // 3번째 이후
const IND_INK = "#3730A3";    // 연한 면 위 글자
const TRACK = "#F1F5F9";      // 트랙
const AMBER = "#F59E0B";
const AMBER_INK = "#B45309";
const AMBER_SOFT = "#FEF3C7";
const LINE = "#E2E8F0";
const SLATE = "#94a3b8";
const INK = "#334155";

// 값 옆에 붙는 알약 라벨. 면은 채우고 테두리 1px — 카드 테두리와 같은 굵기다.
function Pill({ x, y, text, tone }: { x: number; y: number; text: string; tone: "ind" | "amber" }) {
  const w = text.length * 7.6 + 18;
  const amber = tone === "amber";
  return (
    <g>
      <rect
        x={x} y={y} width={w} height={22} rx={11}
        fill={amber ? AMBER_SOFT : "#fff"}
        stroke={amber ? AMBER : LINE}
        strokeWidth="1"
      />
      <text x={x + w / 2} y={y + 15} textAnchor="middle" fontSize="11" fontWeight="800" fill={amber ? AMBER_INK : IND_INK}>
        {text}
      </text>
    </g>
  );
}

export function ResultFigure({ figure }: { figure: Figure }) {
  if (figure.shape === "timeline") return <TimelineFigure figure={figure} />;
  if (figure.shape === "threshold") return <ThresholdFigure figure={figure} />;
  if (figure.shape === "magnitude") return <MagnitudeFigure figure={figure} />;
  if (figure.shape === "accrual") return <AccrualFigure figure={figure} />;
  return <BalanceFigure figure={figure} />;
}

// 시간이 흐르는 그림. 막대가 여러 개면 어긋난 구간이 눈으로 잡힌다.
function TimelineFigure({ figure }: { figure: Extract<Figure, { shape: "timeline" }> }) {
  const { bars, gap, unit } = figure;
  const max = Math.max(...bars.map((b) => b.to), gap?.to ?? 0);
  const L = 122;
  const R = 500;
  const x = (v: number) => L + (v / max) * (R - L);

  const rowH = 40;
  const top = gap ? 36 : 14;
  const h = top + bars.length * rowH + 34;

  const step = niceStep(max);
  const ticks: number[] = [];
  for (let v = 0; v <= max + 1e-9; v += step) ticks.push(Math.round(v * 100) / 100);

  return (
    <svg viewBox={`0 0 520 ${h}`} className="cr-svg" role="img">
      {gap && (
        <>
          <rect
            x={x(gap.from)} y={top - 8}
            width={Math.max(8, x(gap.to) - x(gap.from))} height={bars.length * rowH + 6}
            rx="12" fill={AMBER_SOFT} stroke={AMBER} strokeWidth="1" strokeDasharray="4 4"
          />
          <Pill
            x={Math.min(R - gap.label.length * 7.6 - 18, (x(gap.from) + x(gap.to)) / 2 - (gap.label.length * 7.6 + 18) / 2)}
            y={2} text={gap.label} tone="amber"
          />
        </>
      )}

      {bars.map((b, i) => {
        const y = top + i * rowH;
        const bw = Math.max(10, x(b.to) - x(b.from));
        return (
          <g key={i}>
            <text x={L - 14} y={y + 21} textAnchor="end" fontSize="12" fontWeight="800" fill={INK}>{b.label}</text>
            <rect x={L} y={y + 4} width={R - L} height={26} rx="13" fill={TRACK} />
            <rect x={x(b.from)} y={y + 4} width={bw} height={26} rx="13" fill={b.soft ? IND_MID : IND} />
            <text x={x(b.to) - 12} y={y + 21} textAnchor="end" fontSize="12" fontWeight="800" fill={b.soft ? IND_INK : "#fff"}>
              {trim(b.to - b.from)}{unit}
            </text>
          </g>
        );
      })}

      {ticks.map((t) => (
        <g key={t}>
          <circle cx={x(t)} cy={h - 24} r="2" fill={LINE} />
          <text x={x(t)} y={h - 6} textAnchor="middle" fontSize="10.5" fontWeight="700" fill={SLATE}>
            {trim(t)}{unit}
          </text>
        </g>
      ))}
    </svg>
  );
}

// 시간이 갈수록 쌓이는 몫. 막대 하나는 길이만 보여줘서 "조금씩 확정된다"가 안 보인다.
// 제5조 ④항이 "매월 균등하게 확정"이므로 해마다 뛰는 계단이 아니라, 클리프에서 한 번
// 뛴 뒤 완만히 오르는 선이다. 계단으로 그리면 "1년차 내내 25%"라는 틀린 말이 된다.
function AccrualFigure({ figure }: { figure: Extract<Figure, { shape: "accrual" }> }) {
  const { years, cliff, band, unit } = figure;
  const L = 96, R = 486, TOP = 46, BASE = 138;
  const x = (v: number) => L + (v / years) * (R - L);
  const y = (frac: number) => BASE - frac * (BASE - TOP);
  const h = 188;
  const pct = (f: number) => `${Math.round(f * 100)}%`;

  // t년 시점에 확정된 비율. 클리프 전이면 한 주도 없고, 클리프에 닿는 순간 그만큼 한 번에 확정된다.
  const vested = (t: number) => (cliff && t < cliff ? 0 : Math.min(1, t / years));

  const c = cliff ?? 0;
  const ramp = cliff
    ? `M ${L} ${y(0)} L ${x(c)} ${y(0)} L ${x(c)} ${y(vested(c))} L ${R} ${y(1)}`
    : `M ${L} ${y(0)} L ${R} ${y(1)}`;

  // 노란 구간이 닫히는 시점에 얼마가 쌓여 있는지. "3년에 나가면 몇 %인가"가 이 점 하나로 답해진다.
  const markAt = band && band.to > c && band.to < years ? band.to : null;

  const svg = (
    <svg viewBox={`0 0 520 ${h}`} className="cr-svg" role="img">
      <text x={L - 12} y={TOP + 4} textAnchor="end" fontSize="10.5" fontWeight="700" fill={SLATE}>100%</text>
      <text x={L - 12} y={BASE + 4} textAnchor="end" fontSize="10.5" fontWeight="700" fill={SLATE}>0%</text>
      <text x={L - 12} y={(TOP + BASE) / 2 - 10} textAnchor="end" fontSize="12" fontWeight="800" fill={INK}>확정된</text>
      <text x={L - 12} y={(TOP + BASE) / 2 + 6} textAnchor="end" fontSize="12" fontWeight="800" fill={INK}>지분</text>

      <line x1={L} y1={TOP} x2={R} y2={TOP} stroke={LINE} strokeWidth="1" strokeDasharray="3 4" />
      <line x1={L} y1={BASE} x2={R} y2={BASE} stroke={LINE} strokeWidth="1" />

      {band && (
        <>
          <rect
            x={x(band.from)} y={TOP - 10}
            width={Math.max(8, x(band.to) - x(band.from))} height={BASE - TOP + 18}
            rx="12" fill={AMBER_SOFT} stroke={AMBER} strokeWidth="1" strokeDasharray="4 4"
          />
          <Pill
            x={Math.min(R - band.label.length * 7.6 - 18, (x(band.from) + x(band.to)) / 2 - (band.label.length * 7.6 + 18) / 2)}
            y={4} text={band.label} tone="amber"
          />
        </>
      )}

      <path d={`${ramp} L ${R} ${BASE} L ${L} ${BASE} Z`} fill={IND_MID} />
      <path d={ramp} fill="none" stroke={IND} strokeWidth="2" strokeLinejoin="round" />

      {cliff ? (
        <text x={x(c) + 8} y={y(vested(c)) - 8} fontSize="10.5" fontWeight="800" fill={IND_INK}>
          {pct(vested(c))}
        </text>
      ) : null}

      {markAt !== null && (
        <g>
          <line x1={x(markAt)} y1={BASE} x2={x(markAt)} y2={y(vested(markAt))} stroke={AMBER} strokeWidth="1.5" strokeDasharray="3 3" />
          <circle cx={x(markAt)} cy={y(vested(markAt))} r="4.5" fill="#fff" stroke={AMBER} strokeWidth="2.5" />
          <text x={x(markAt) - 8} y={y(vested(markAt)) - 9} textAnchor="end" fontSize="11" fontWeight="800" fill={AMBER_INK}>
            {trim(markAt)}{unit} · {pct(vested(markAt))}
          </text>
        </g>
      )}

      {/* 선으로 바꾸면서 해마다 얼마가 쌓였는지가 사라졌다. 클리프와 끝점 사이의 각 해에
          점을 찍어 눈금을 되살린다. 노란 구간 끝(markAt)은 이미 값을 달고 있어 건너뛴다. */}
      {Array.from({ length: Math.max(0, years - 1) }, (_, k) => k + 1)
        .filter((i) => i > c && i !== markAt)
        .map((i) => (
          <g key={i}>
            <circle cx={x(i)} cy={y(vested(i))} r="3.5" fill="#fff" stroke={IND} strokeWidth="2" />
            <text x={x(i)} y={y(vested(i)) - 10} textAnchor="middle" fontSize="10.5" fontWeight="700" fill={IND_INK}>
              {pct(vested(i))}
            </text>
          </g>
        ))}

      <circle cx={R} cy={y(1)} r="4.5" fill={IND} />
      <text x={R} y={y(1) - 11} textAnchor="middle" fontSize="10.5" fontWeight="800" fill={IND}>100%</text>

      {Array.from({ length: years + 1 }, (_, i) => (
        <text key={i} x={x(i)} y={BASE + 22} textAnchor="middle" fontSize="10.5" fontWeight="700" fill={SLATE}>
          {i}{unit}
        </text>
      ))}
    </svg>
  );

  // 클리프 라벨만 SVG 밖으로 뺀다. <text>에는 뜻풀이 말풍선(span)을 붙일 수 없어서,
  // 그림 위에 겹쳐 두고 다른 용어와 같은 .cq-term 을 그대로 쓴다.
  if (!cliff) return svg;
  return (
    <div style={{ position: "relative" }}>
      {svg}
      <span
        className="cq-term"
        tabIndex={0}
        onMouseEnter={(e) => keepInView(e.currentTarget)}
        onFocus={(e) => keepInView(e.currentTarget)}
        onPointerDown={(e) => keepInView(e.currentTarget)}
        style={{
          position: "absolute",
          left: `${(x(c) / 520) * 100}%`,
          bottom: `${((h - BASE - 44) / h) * 100}%`,
          transform: "translateX(-50%)",
          fontSize: 10.5,
          fontWeight: 800,
          whiteSpace: "nowrap",
        }}
      >
        클리프
        <span className="cq-term-pop" role="tooltip">{GLOSSARY["클리프"]}</span>
      </span>
    </div>
  );
}

// 지분 덩어리와 기준선. 덩어리를 떼어 놓아야 각자의 몫으로 읽힌다.
function ThresholdFigure({ figure }: { figure: Extract<Figure, { shape: "threshold" }> }) {
  const { blocks, line, lineLabel } = figure;
  const L = 24;
  const R = 496;
  const x = (v: number) => L + (v / 100) * (R - L);
  const h = 120;
  const shades = [IND, IND_MID, IND_LIGHT];

  let acc = 0;
  const lw = lineLabel.length * 7.6 + 18;
  return (
    <svg viewBox={`0 0 520 ${h}`} className="cr-svg" role="img">
      <rect x={L} y={44} width={R - L} height={38} rx="16" fill={TRACK} />

      {blocks.map((b, i) => {
        const start = acc;
        acc += b.value;
        const w = Math.max(0, x(acc) - x(start) - 4);
        return (
          <g key={b.label}>
            <rect x={x(start) + 2} y={44} width={w} height={38} rx="16" fill={shades[i % 3]} />
            {w > 60 && (
              <text x={x(start) + 2 + w / 2} y={68} textAnchor="middle" fontSize="12" fontWeight="800" fill={i === 0 ? "#fff" : IND_INK}>
                {b.label} {b.value}%
              </text>
            )}
          </g>
        );
      })}

      <line x1={x(line)} y1={36} x2={x(line)} y2={90} stroke={AMBER} strokeWidth="2" strokeDasharray="5 4" strokeLinecap="round" />
      <circle cx={x(line)} cy={90} r="3.5" fill={AMBER} />
      <Pill x={Math.max(L, Math.min(R - lw, x(line) - lw / 2))} y={6} text={lineLabel} tone="amber" />

      {[0, 25, 50, 75, 100].map((t) => (
        <text key={t} x={x(t)} y={110} textAnchor="middle" fontSize="10.5" fontWeight="700" fill={SLATE}>{t}%</text>
      ))}
    </svg>
  );
}

// 크기를 지어내지 않는다. 값을 모르는 항목은 점선 블록으로 두고 이름만 말한다.
function MagnitudeFigure({ figure }: { figure: Extract<Figure, { shape: "magnitude" }> }) {
  return (
    <div className="cr-mag">
      {figure.bars.map((b, i) => (
        <div key={i} className={`cr-mag-box ${b.outline ? "outline" : ""}`}>
          <span className="cr-mag-text">{b.text}</span>
          <span className="cr-mag-label">{b.label}</span>
        </div>
      ))}
    </div>
  );
}

// 저울은 기울지 않는다. 결정권이 지분이 아니라 지정에서 온다는 게 요점이다.
function BalanceFigure({ figure }: { figure: Extract<Figure, { shape: "balance" }> }) {
  const { left, right } = figure;
  return (
    <svg viewBox="0 0 520 142" className="cr-svg" role="img">
      <rect x="70" y="34" width="380" height="8" rx="4" fill={TRACK} />
      <rect x="253" y="40" width="14" height="72" rx="7" fill={TRACK} />
      <rect x="200" y="108" width="120" height="8" rx="4" fill={TRACK} />
      <Pan cx={148} value={left.value} label={left.label} accent />
      <Pan cx={372} value={right.value} label={right.label} />
    </svg>
  );
}

function Pan({ cx, value, label, accent }: { cx: number; value: number; label: string; accent?: boolean }) {
  return (
    <g>
      <rect x={cx - 2} y="38" width="4" height="16" rx="2" fill={LINE} />
      <rect x={cx - 60} y={52} width={120} height={44} rx="16" fill={accent ? IND : IND_LIGHT} />
      <text x={cx} y="80" textAnchor="middle" fontSize="17" fontWeight="800" fill={accent ? "#fff" : IND_INK}>
        {value}%
      </text>
      <text x={cx} y="116" textAnchor="middle" fontSize="11.5" fontWeight="700" fill={accent ? IND_INK : SLATE}>
        {label}
      </text>
    </g>
  );
}

const trim = (n: number) => Math.round(n * 10) / 10;

function niceStep(max: number) {
  for (const s of [1, 2, 5, 7, 10, 15, 30, 50]) if (max / s <= 5) return s;
  return Math.ceil(max / 5);
}
