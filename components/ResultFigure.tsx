"use client";

import React from "react";
import type { Figure } from "../lib/contractResults";

// 도형 4종. 규칙마다 SVG를 그리지 않고, 형태에 값을 넣는다.
// 차트가 아니라 일러스트로 읽히도록 그라디언트·상단 하이라이트·부드러운 그림자를 쓴다.
const AMBER_INK = "#B45309";
const SLATE = "#94a3b8";
const INK = "#334155";

// 그라디언트 id 는 문서 전역이다. 모든 도형이 같은 정의를 쓰므로 중복돼도 결과가 같다.
function Defs() {
  return (
    <defs>
      <linearGradient id="rf-ind" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#8B7CF6" />
        <stop offset="1" stopColor="#4F46E5" />
      </linearGradient>
      <linearGradient id="rf-ind2" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#B9BEFA" />
        <stop offset="1" stopColor="#8189EE" />
      </linearGradient>
      <linearGradient id="rf-ind3" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#DCE0FD" />
        <stop offset="1" stopColor="#BEC4F8" />
      </linearGradient>
      <linearGradient id="rf-amber" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#FFE3B0" />
        <stop offset="1" stopColor="#FDC978" />
      </linearGradient>
      <linearGradient id="rf-track" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#EDF1F6" />
        <stop offset="1" stopColor="#F8FAFC" />
      </linearGradient>
      <filter id="rf-lift" x="-30%" y="-40%" width="160%" height="200%">
        <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#4338CA" floodOpacity="0.26" />
      </filter>
      <filter id="rf-lift-soft" x="-30%" y="-40%" width="160%" height="200%">
        <feDropShadow dx="0" dy="3" stdDeviation="3.5" floodColor="#0f172a" floodOpacity="0.12" />
      </filter>
    </defs>
  );
}

// 입체감은 두 겹으로 만든다. 그라디언트 본체 위에 흰 하이라이트를 얇게 얹는다.
function Solid({ x, y, w, h, r, fill, soft }: { x: number; y: number; w: number; h: number; r: number; fill: string; soft?: boolean }) {
  const width = Math.max(r * 2, w);
  return (
    <g filter={soft ? "url(#rf-lift-soft)" : "url(#rf-lift)"}>
      <rect x={x} y={y} width={width} height={h} rx={r} fill={fill} />
      <rect x={x + 3} y={y + 2.5} width={Math.max(0, width - 6)} height={h * 0.3} rx={h * 0.15} fill="#fff" opacity="0.3" />
    </g>
  );
}

// 값 옆에 붙는 알약 라벨. 텍스트만 두면 그림 위에서 묻힌다.
function Pill({ x, y, text, tone }: { x: number; y: number; text: string; tone: "ind" | "amber" }) {
  const w = text.length * 7.6 + 18;
  return (
    <g filter="url(#rf-lift-soft)">
      <rect x={x} y={y} width={w} height={21} rx={10.5} fill={tone === "amber" ? "url(#rf-amber)" : "#fff"} />
      <text x={x + w / 2} y={y + 14.5} textAnchor="middle" fontSize="11" fontWeight="900" fill={tone === "amber" ? AMBER_INK : "#4338CA"}>
        {text}
      </text>
    </g>
  );
}

export function ResultFigure({ figure }: { figure: Figure }) {
  if (figure.shape === "timeline") return <TimelineFigure figure={figure} />;
  if (figure.shape === "threshold") return <ThresholdFigure figure={figure} />;
  if (figure.shape === "magnitude") return <MagnitudeFigure figure={figure} />;
  return <BalanceFigure figure={figure} />;
}

// 시간이 흐르는 그림. 막대가 여러 개면 어긋난 구간이 눈으로 잡힌다.
function TimelineFigure({ figure }: { figure: Extract<Figure, { shape: "timeline" }> }) {
  const { bars, gap, unit } = figure;
  const max = Math.max(...bars.map((b) => b.to), gap?.to ?? 0);
  const L = 122;
  const R = 500;
  const x = (v: number) => L + (v / max) * (R - L);

  const rowH = 38;
  const top = gap ? 34 : 14;
  const h = top + bars.length * rowH + 34;

  const step = niceStep(max);
  const ticks: number[] = [];
  for (let v = 0; v <= max + 1e-9; v += step) ticks.push(Math.round(v * 100) / 100);

  return (
    <svg viewBox={`0 0 520 ${h}`} className="cr-svg" role="img">
      <Defs />

      {gap && (
        <>
          <rect x={x(gap.from)} y={top - 8} width={Math.max(8, x(gap.to) - x(gap.from))} height={bars.length * rowH + 8}
            fill="url(#rf-amber)" opacity="0.34" rx="14" />
          <Pill x={Math.min(R - gap.label.length * 7.6 - 18, (x(gap.from) + x(gap.to)) / 2 - (gap.label.length * 7.6 + 18) / 2)} y={2} text={gap.label} tone="amber" />
        </>
      )}

      {bars.map((b, i) => {
        const y = top + i * rowH;
        const bw = Math.max(10, x(b.to) - x(b.from));
        return (
          <g key={i}>
            <text x={L - 14} y={y + 19} textAnchor="end" fontSize="12" fontWeight="800" fill={INK}>{b.label}</text>
            <rect x={L} y={y + 4} width={R - L} height={22} rx="11" fill="url(#rf-track)" />
            <Solid x={x(b.from)} y={y + 4} w={bw} h={22} r={11} fill={b.soft ? "url(#rf-ind2)" : "url(#rf-ind)"} soft={b.soft} />
            <text x={x(b.to) - 10} y={y + 19} textAnchor="end" fontSize="12" fontWeight="900" fill="#fff">
              {trim(b.to - b.from)}{unit}
            </text>
          </g>
        );
      })}

      {ticks.map((t) => (
        <g key={t}>
          <circle cx={x(t)} cy={h - 24} r="2.5" fill="#dbe2ea" />
          <text x={x(t)} y={h - 6} textAnchor="middle" fontSize="10.5" fontWeight="700" fill={SLATE}>
            {trim(t)}{unit}
          </text>
        </g>
      ))}
    </svg>
  );
}

// 지분 덩어리와 기준선. 덩어리를 떼어 놓아야 각자의 몫으로 읽힌다.
function ThresholdFigure({ figure }: { figure: Extract<Figure, { shape: "threshold" }> }) {
  const { blocks, line, lineLabel } = figure;
  const L = 24;
  const R = 496;
  const x = (v: number) => L + (v / 100) * (R - L);
  const h = 118;
  const shades = ["url(#rf-ind)", "url(#rf-ind2)", "url(#rf-ind3)"];

  let acc = 0;
  const lw = lineLabel.length * 7.6 + 18;
  return (
    <svg viewBox={`0 0 520 ${h}`} className="cr-svg" role="img">
      <Defs />
      <rect x={L} y={44} width={R - L} height={34} rx="14" fill="url(#rf-track)" />

      {blocks.map((b, i) => {
        const start = acc;
        acc += b.value;
        const w = Math.max(0, x(acc) - x(start) - 4);
        return (
          <g key={b.label}>
            <Solid x={x(start) + 2} y={44} w={w} h={34} r={14} fill={shades[i % 3]} soft={i > 0} />
            {w > 60 && (
              <text x={x(start) + 2 + w / 2} y={66} textAnchor="middle" fontSize="12" fontWeight="900" fill={i === 0 ? "#fff" : "#312E81"}>
                {b.label} {b.value}%
              </text>
            )}
          </g>
        );
      })}

      <line x1={x(line)} y1={36} x2={x(line)} y2={86} stroke="#F59E0B" strokeWidth="3" strokeDasharray="5 4" strokeLinecap="round" />
      <circle cx={x(line)} cy={86} r="5" fill="#F59E0B" />
      <Pill x={Math.max(L, Math.min(R - lw, x(line) - lw / 2))} y={8} text={lineLabel} tone="amber" />

      {[0, 25, 50, 75, 100].map((t) => (
        <text key={t} x={x(t)} y={107} textAnchor="middle" fontSize="10.5" fontWeight="700" fill={SLATE}>{t}%</text>
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
      <Defs />
      <ellipse cx="260" cy="128" rx="86" ry="7" fill="#0f172a" opacity="0.07" />
      <g filter="url(#rf-lift-soft)">
        <rect x="70" y="34" width="380" height="9" rx="4.5" fill="url(#rf-track)" />
        <rect x="252" y="40" width="16" height="72" rx="8" fill="url(#rf-track)" />
        <ellipse cx="260" cy="114" rx="42" ry="9" fill="url(#rf-track)" />
      </g>
      <Pan cx={148} value={left.value} label={left.label} accent />
      <Pan cx={372} value={right.value} label={right.label} />
    </svg>
  );
}

function Pan({ cx, value, label, accent }: { cx: number; value: number; label: string; accent?: boolean }) {
  return (
    <g>
      <rect x={cx - 3} y="38" width="6" height="16" rx="3" fill="#dbe2ea" />
      <Solid x={cx - 60} y={52} w={120} h={42} r={16} fill={accent ? "url(#rf-ind)" : "url(#rf-ind3)"} soft={!accent} />
      <text x={cx} y="79" textAnchor="middle" fontSize="17" fontWeight="900" fill={accent ? "#fff" : "#312E81"}>
        {value}%
      </text>
      <text x={cx} y="115" textAnchor="middle" fontSize="11.5" fontWeight="800" fill={accent ? "#4338CA" : SLATE}>
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
