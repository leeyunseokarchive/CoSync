"use client";

import { useState } from "react";

type FlowStep = "education" | "input";

// ── 공통 상수 ──
const CONSENT_OPTIONS = ["전원합의", "2/3 이상", "과반수"];
const FIXED_ITEMS     = ["정관 변경", "합병·분할·사업양도", "신주 발행", "배당", "사업 내용 변경", "주요 경영진 거래"];
const PRIORITY_OPTS   = ["시장 관행 기준", "핵심 역량", "일한 기간", "마일스톤 기여"];
const ROLE_CHIPS      = ["대표 / CEO", "CTO", "개발 담당", "COO", "CPO", "기타"];
const MEMBERS         = ["나 (대표)", "박CTO", "이COO"];
const VOTING_TABLE    = [
  { pct: "67% 이상", meaning: "특별결의 단독 통과 (정관변경, 합병 등)" },
  { pct: "50% 초과", meaning: "일반결의 단독 가결" },
  { pct: "33% 초과", meaning: "특별결의 거부권 (Veto)" },
  { pct: "10% 이상", meaning: "이사 해임 청구권" },
  { pct: "3% 이상",  meaning: "대표소송권" },
];

// ── 스타일 토큰 ──
const S = {
  page:        { minHeight: "100vh", background: "radial-gradient(circle at 90% 10%, rgba(108,108,242,0.10), transparent 45%), radial-gradient(circle at 8% 90%, rgba(83,220,198,0.10), transparent 40%), #f7f8fc", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "40px 16px", fontFamily: "'Pretendard', -apple-system, sans-serif" } as React.CSSProperties,
  card:        { background: "#fff", borderRadius: "24px", boxShadow: "0 12px 40px rgba(29,35,63,0.09)" } as React.CSSProperties,
  tag:         { display: "inline-block", background: "rgba(255,255,255,0.18)", borderRadius: "999px", padding: "3px 12px", marginBottom: "14px", fontSize: "0.72rem", fontWeight: "700", color: "#fff", letterSpacing: "0.05em" } as React.CSSProperties,
  secLabel:    (color = "#5b5be7") => ({ fontSize: "0.72rem", fontWeight: "700", color, marginBottom: "5px" } as React.CSSProperties),
  fLabel:      { fontWeight: "700", color: "#1f2430", fontSize: "0.9rem", marginBottom: "5px" } as React.CSSProperties,
  fSub:        { fontSize: "0.83rem", color: "#64748b", marginBottom: "12px", lineHeight: "1.55" } as React.CSSProperties,
  input:       (on: boolean) => ({ flex: 1, padding: "12px 14px", border: `2px solid ${on ? "#5b5be7" : "#e2e8f0"}`, borderRadius: "10px", fontSize: "1rem", fontWeight: "700", color: "#1f2430", outline: "none", fontFamily: "inherit" } as React.CSSProperties),
  btn:         (on: boolean) => ({ width: "100%", padding: "15px", background: on ? "#5b5be7" : "#e2e8f0", color: on ? "#fff" : "#94a3b8", border: "none", borderRadius: "14px", fontSize: "0.95rem", fontWeight: "700", cursor: on ? "pointer" : "not-allowed", transition: "background 0.15s" } as React.CSSProperties),
  backBtn:     { background: "none", border: "none", color: "#94a3b8", fontSize: "0.82rem", fontWeight: "600", cursor: "pointer", padding: "0", display: "flex", alignItems: "center", gap: "4px", marginBottom: "4px" } as React.CSSProperties,
  toggle:      (on: boolean) => ({ width: "40px", height: "22px", borderRadius: "999px", background: on ? "#5b5be7" : "#e2e8f0", position: "relative" as const, transition: "background 0.2s", flexShrink: 0 }),
  toggleKnob:  (on: boolean) => ({ position: "absolute" as const, top: "3px", left: on ? "21px" : "3px", width: "16px", height: "16px", borderRadius: "50%", background: "#fff", transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.15)" }),
  chip:        (on: boolean) => ({ padding: "6px 13px", borderRadius: "999px", border: "1.5px solid", borderColor: on ? "#5b5be7" : "#e2e8f0", background: on ? "#f0f0fe" : "#f8fafc", color: on ? "#5b5be7" : "#64748b", fontSize: "0.82rem", fontWeight: "600", cursor: "pointer", whiteSpace: "nowrap" as const }),
  addOpt:      { display: "flex", alignItems: "center", gap: "7px", width: "100%", padding: "9px 12px", border: "1.5px dashed #c7d2fe", borderRadius: "10px", background: "#fff", color: "#94a3b8", fontSize: "0.82rem", fontWeight: "600", cursor: "pointer", textAlign: "left" as const },
  optHeader:   { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" } as React.CSSProperties,
  collapseBtn: { background: "none", border: "none", color: "#94a3b8", fontSize: "0.75rem", fontWeight: "600", cursor: "pointer", padding: "0" } as React.CSSProperties,
  clauseBox:   { background: "#f8fafc", borderRadius: "12px", padding: "14px 16px", borderLeft: "3px solid #5b5be7" } as React.CSSProperties,
  warnBadge:   { display: "inline-block", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "8px", padding: "8px 12px", fontSize: "0.8rem", color: "#92400e", fontWeight: "600", lineHeight: "1.5" } as React.CSSProperties,
};

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <div style={S.toggle(on)} onClick={onToggle}>
      <div style={S.toggleKnob(on)} />
    </div>
  );
}

const PAGE_META = [
  { title: "의사결정 & 실행",          sha: "별지 — 교착 상태의 해소" },
  { title: "지분 & 보상",              sha: "별지 — 지분 보유 현황 · 베스팅·클리프" },
  { title: "역할 & 책임",              sha: "별지 — 전념의무·이사선임" },
  { title: "주식양도 제한·우선매수권",  sha: "별지 — 주식양도 제한·우선매수권" },
  { title: "동반매도·동반매각",         sha: "별지 — Tag/Drag-along" },
  { title: "경업금지·비밀유지",         sha: "별지 — 경업금지·비밀유지" },
  { title: "위약벌",                   sha: "별지 — 위약벌" },
];

export default function AdvancedDiagnosisMockup() {
  const [pageIndex, setPageIndex] = useState(0);
  const [step, setStep]           = useState<FlowStep>("education");

  // ── Page 1 — 의사결정 & 실행 ──
  const [dailyDecision, setDailyDecision] = useState("");
  const [showDaily, setShowDaily]         = useState(false);
  const [p1Note, setP1Note]               = useState("");
  const [showP1Note, setShowP1Note]       = useState(false);
  const [consentTypes, setConsentTypes]   = useState(Array(FIXED_ITEMS.length).fill("전원합의"));
  const [openDropdown, setOpenDropdown]   = useState<number | null>(null);
  const [useAmount, setUseAmount]         = useState(false);
  const [amount, setAmount]               = useState("");
  const [amountMemo, setAmountMemo]       = useState("");
  const [deadlock, setDeadlock]           = useState("");

  // ── Page 2 — 지분 & 보상 ──
  const [equityStatus, setEquityStatus] = useState<"decided" | "undecided" | "">("");
  const [capTable, setCapTable]         = useState<Record<string, string>>(Object.fromEntries(MEMBERS.map(m => [m, ""])));
  const [myBasisA, setMyBasisA]         = useState("");
  const [prioritiesA, setPrioritiesA]   = useState<string[]>([]);
  const [workingMonths, setWorkingMonths] = useState("");
  const [hasInvestment, setHasInvestment] = useState(false);
  const [myInvestment, setMyInvestment]   = useState("");
  const [myBasisB, setMyBasisB]           = useState("");
  const [priorities, setPriorities]       = useState<string[]>([]);
  const [equityB, setEquityB]             = useState<Record<string, string>>(Object.fromEntries(MEMBERS.map(m => [m, ""])));
  const [vestingOn, setVestingOn]         = useState(true);
  const [vestingYrs, setVestingYrs]       = useState("");
  const [vestingClf, setVestingClf]       = useState("");
  const [showVestingInfo, setShowVestingInfo] = useState(false);
  const [freeNote, setFreeNote]           = useState("");
  const [showFreeNote, setShowFreeNote]   = useState(false);
  const [basisAOther, setBasisAOther]     = useState(false);
  const [basisBOther, setBasisBOther]     = useState(false);

  // ── Page 3 — 역할 & 책임 ──
  const [myP3Role, setMyP3Role]           = useState("");
  const [p3RoleOther, setP3RoleOther]     = useState(false);
  const [myDomain, setMyDomain]           = useState("");
  const [isFulltime, setIsFulltime]       = useState(true);
  const [directorOn, setDirectorOn]       = useState(false);
  const [showP3Other, setShowP3Other]     = useState(false);
  const [p3OtherDetail, setP3OtherDetail] = useState("");
  const [showP3Note, setShowP3Note]       = useState(false);
  const [p3Note, setP3Note]               = useState("");

  // ── Page 4 — 주식양도 제한·우선매수권 ──
  const [lockupMonths, setLockupMonths] = useState("");
  const [rofrDays, setRofrDays]         = useState("");
  const [showP4Note, setShowP4Note]     = useState(false);
  const [p4Note, setP4Note]             = useState("");

  // ── Page 5 — 동반매도·동반매각 ──
  const [dragTrigger, setDragTrigger] = useState("");
  const [dragYrs, setDragYrs]         = useState("");
  const [showDragYrs, setShowDragYrs] = useState(false);
  const [tagProtect, setTagProtect]   = useState(true);
  const [showP5Note, setShowP5Note]   = useState(false);
  const [p5Note, setP5Note]           = useState("");

  // ── Page 6 — 경업금지·비밀유지 ──
  const [nonCompeteYrs, setNonCompeteYrs] = useState("");
  const [ndaYrs, setNdaYrs]               = useState("");
  const [showP6Note, setShowP6Note]       = useState(false);
  const [p6Note, setP6Note]               = useState("");

  // ── Page 7 — 위약벌 ──
  const [penaltyAmt, setPenaltyAmt]   = useState("");
  const [callOptOn, setCallOptOn]     = useState(false);
  const [callOptPct, setCallOptPct]   = useState("");
  const [showP7Note, setShowP7Note]   = useState(false);
  const [p7Note, setP7Note]           = useState("");

  const goNext = () => { setPageIndex(p => p + 1); setStep("education"); setOpenDropdown(null); };
  const goBack = () => { if (step === "input") setStep("education"); };

  // ── Page 2 계산 ──
  const totalCapA  = MEMBERS.reduce((s, m) => s + (parseInt(capTable[m], 10) || 0), 0);
  const totalCapB  = MEMBERS.reduce((s, m) => s + (parseInt(equityB[m], 10) || 0), 0);
  const p2ACanNext = equityStatus === "decided" && prioritiesA.length > 0;
  const p2BCanNext = equityStatus === "undecided" && priorities.length > 0 && MEMBERS.every(m => equityB[m] !== "");
  const p2CanNext  = p2ACanNext || p2BCanNext;

  const togglePriority  = (item: string) => setPriorities(p => p.includes(item) ? p.filter(x => x !== item) : [...p, item]);
  const togglePriorityA = (item: string) => setPrioritiesA(p => p.includes(item) ? p.filter(x => x !== item) : [...p, item]);

  const meta = PAGE_META[pageIndex];
  const TOTAL = PAGE_META.length;

  return (
    <main style={S.page} onClick={() => setOpenDropdown(null)}>
      <div style={{ width: "min(540px, 100%)" }}>

        {/* ── 진행 헤더 ── */}
        <div style={{ marginBottom: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
            <div>
              <div style={{ fontSize: "0.7rem", fontWeight: "700", color: "#5b5be7", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "3px" }}>심화 진단</div>
              <div style={{ fontSize: "1.1rem", fontWeight: "800", color: "#1f2430" }}>{meta.title}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "0.78rem", color: "#94a3b8", fontWeight: "600" }}>{pageIndex + 1} / {TOTAL}</span>
              <div style={{ display: "flex", gap: "4px" }}>
                {Array.from({ length: TOTAL }, (_, i) => (
                  <div key={i} style={{ width: "18px", height: "4px", borderRadius: "2px", background: i === pageIndex ? "#5b5be7" : i < pageIndex ? "#a5b4fc" : "#e2e8f0" }} />
                ))}
              </div>
            </div>
          </div>
          <div style={{ fontSize: "0.72rem", color: "#94a3b8", fontWeight: "500" }}>{meta.sha}</div>
        </div>

        {/* ═══════════════════════════════
            PAGE 1 — 의사결정 & 실행
        ═══════════════════════════════ */}
        {pageIndex === 0 && (
          <>
            {step === "education" && (
              <div style={{ ...S.card, overflow: "hidden" }}>
                <div style={{ background: "linear-gradient(135deg, #5b5be7 0%, #7c7cf5 100%)", padding: "28px 28px 24px" }}>
                  <div style={S.tag}>이 조항이 왜 있는 걸까요?</div>
                  <h2 style={{ fontSize: "1.25rem", fontWeight: "800", color: "#fff", lineHeight: "1.45", wordBreak: "keep-all" }}>나중에 "우리 이미 정해놨잖아"<br />라고 말할 수 있는 구조</h2>
                </div>
                <div style={{ padding: "24px 28px 28px", display: "flex", flexDirection: "column", gap: "18px" }}>
                  {[
                    { icon: "⚡", t: "일상 결정까지 전원 동의하면 팀이 느려져요", d: "중요한 결정만 함께 해요. 나머지는 각자 속도대로 움직여요." },
                    { icon: "🔒", t: "중요 결정은 반드시 전원이 동의해야 해요",   d: "정관 변경, 합병, 신주 발행 등 회사 구조를 바꾸는 결정이에요." },
                    { icon: "🕐", t: "합의가 안 될 때를 대비하는 안전장치",        d: "기간을 정해두면 이후는 대표가 최종 결정해요. 팀이 멈추지 않는 구조예요." },
                  ].map(({ icon, t, d }) => (
                    <div key={t} style={{ display: "flex", gap: "12px" }}>
                      <div style={{ width: "30px", height: "30px", borderRadius: "50%", background: "#f0f0fe", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "0.85rem" }}>{icon}</div>
                      <div><div style={{ fontWeight: "700", color: "#1f2430", fontSize: "0.9rem", marginBottom: "3px" }}>{t}</div><div style={{ fontSize: "0.85rem", color: "#64748b", lineHeight: "1.55" }}>{d}</div></div>
                    </div>
                  ))}
                  <div style={S.clauseBox}>
                    <div style={{ fontSize: "0.72rem", fontWeight: "700", color: "#5b5be7", marginBottom: "5px" }}>별지 — 교착 상태의 해소</div>
                    <div style={{ fontSize: "0.875rem", color: "#334155", lineHeight: "1.65" }}>중요 사안은 주주 전원의 동의를 받아야 한다. 합의가 <strong>___일</strong> 이내에 이루어지지 않으면 대표이사가 최종 결정한다.</div>
                  </div>
                  <button onClick={() => setStep("input")} style={S.btn(true)}>우리 팀 기준 정하기 →</button>
                </div>
              </div>
            )}

            {step === "input" && (
              <div style={{ ...S.card, padding: "28px", display: "flex", flexDirection: "column", gap: "24px" }}>
                <button onClick={goBack} style={S.backBtn}>← 이전으로</button>
                <div>
                  <div style={S.secLabel()}>각자 먼저 답해주세요 — 서로 안 보여요</div>
                  <h2 style={{ fontSize: "1.15rem", fontWeight: "800", color: "#1f2430" }}>전원 동의가 필요한 사항을 확인하세요</h2>
                </div>

                {/* 사전동의사항 */}
                <div style={{ border: "1.5px solid #e2e8f0", borderRadius: "14px", overflow: "visible" }}>
                  {FIXED_ITEMS.map((item, i) => (
                    <div key={item} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 16px", borderBottom: i < FIXED_ITEMS.length - 1 ? "1px solid #f1f5f9" : "none", position: "relative" }}>
                      <span style={{ fontSize: "0.9rem", fontWeight: "600", color: "#1f2430" }}>{item}</span>
                      <div style={{ position: "relative" }} onClick={e => e.stopPropagation()}>
                        <button onClick={() => setOpenDropdown(openDropdown === i ? null : i)}
                          style={{ display: "flex", alignItems: "center", gap: "6px", padding: "5px 10px 5px 12px", border: "1.5px solid", borderColor: consentTypes[i] !== "전원합의" ? "#5b5be7" : "#e2e8f0", borderRadius: "999px", background: consentTypes[i] !== "전원합의" ? "#f0f0fe" : "#f8fafc", cursor: "pointer", fontSize: "0.82rem", fontWeight: "700", color: consentTypes[i] !== "전원합의" ? "#5b5be7" : "#64748b", whiteSpace: "nowrap" }}>
                          {consentTypes[i]}
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ transform: openDropdown === i ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}><path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </button>
                        {openDropdown === i && (
                          <div style={{ position: "absolute", right: 0, top: "calc(100% + 6px)", background: "#fff", borderRadius: "12px", boxShadow: "0 8px 24px rgba(29,35,63,0.14)", border: "1px solid #e2e8f0", overflow: "hidden", zIndex: 50, minWidth: "130px" }}>
                            {CONSENT_OPTIONS.map(opt => (
                              <button key={opt} onClick={() => { setConsentTypes(p => p.map((v, j) => j === i ? opt : v)); setOpenDropdown(null); }}
                                style={{ display: "block", width: "100%", padding: "10px 14px", textAlign: "left", background: consentTypes[i] === opt ? "#f0f0fe" : "#fff", border: "none", fontSize: "0.85rem", fontWeight: consentTypes[i] === opt ? "700" : "500", color: consentTypes[i] === opt ? "#5b5be7" : "#1f2430", cursor: "pointer" }}>
                                {opt}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* 금액 기준 */}
                <div style={{ border: "1.5px solid", borderColor: useAmount ? "#5b5be7" : "#e2e8f0", borderRadius: "14px", overflow: "hidden" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 16px", cursor: "pointer" }} onClick={() => setUseAmount(v => !v)}>
                    <div style={{ fontSize: "0.9rem", fontWeight: "600", color: "#1f2430" }}>금액 기준 추가 (선택)</div>
                    <Toggle on={useAmount} onToggle={() => setUseAmount(v => !v)} />
                  </div>
                  {useAmount && (
                    <div style={{ padding: "0 16px 16px", borderTop: "1px solid #f1f5f9", display: "flex", flexDirection: "column", gap: "10px", paddingTop: "14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <input type="text" inputMode="numeric" placeholder="금액 입력" value={amount} onChange={e => setAmount(e.target.value.replace(/[^0-9]/g, ""))} style={S.input(!!amount)} />
                        <span style={{ fontSize: "0.9rem", fontWeight: "600", color: "#475569", whiteSpace: "nowrap" }}>만 원 초과</span>
                      </div>
                      <textarea placeholder="이 금액 기준이 어떻게 적용되는지 메모 (선택)" value={amountMemo} onChange={e => setAmountMemo(e.target.value)} rows={2}
                        style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #e2e8f0", borderRadius: "10px", fontSize: "0.85rem", color: "#334155", outline: "none", fontFamily: "inherit", resize: "none", lineHeight: "1.5" }} />
                    </div>
                  )}
                </div>

                {/* 데드락 기간 */}
                <div>
                  <div style={S.fLabel}>합의가 안 될 때 대표에게 넘기는 기간</div>
                  <div style={S.fSub}>이 기간이 지나도 합의가 안 되면 대표가 최종 결정해요.</div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <input type="text" inputMode="numeric" placeholder="" value={deadlock} onChange={e => setDeadlock(e.target.value.replace(/[^0-9]/g, ""))} style={{ ...S.input(!!deadlock), maxWidth: "100px" }} />
                    <span style={{ fontSize: "0.9rem", fontWeight: "600", color: "#475569", whiteSpace: "nowrap" }}>일 후 대표 결정</span>
                  </div>
                </div>

                {/* 선택 항목 */}
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {!showDaily ? (
                    <button style={S.addOpt} onClick={() => setShowDaily(true)}>
                      <span style={{ fontSize: "0.9rem", lineHeight: 1, color: "#a5b4fc" }}>＋</span> 일상적인 결정 방식 기록하기
                    </button>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                      <div style={S.optHeader}>
                        <div style={S.fLabel}>일상적인 결정은 어떻게 하나요?</div>
                        <button style={S.collapseBtn} onClick={() => { setShowDaily(false); setDailyDecision(""); }}>✕ 접기</button>
                      </div>
                      <textarea placeholder="예) 담당 영역은 각자 결정, 팀 전체 영향 있는 건 공유" value={dailyDecision} onChange={e => setDailyDecision(e.target.value)} rows={2} autoFocus
                        style={{ width: "100%", padding: "12px 14px", border: "1.5px solid #5b5be7", borderRadius: "12px", fontSize: "0.9rem", color: "#334155", outline: "none", fontFamily: "inherit", resize: "none", lineHeight: "1.55" }} />
                    </div>
                  )}
                  {!showP1Note ? (
                    <button style={S.addOpt} onClick={() => setShowP1Note(true)}>
                      <span style={{ fontSize: "0.9rem", lineHeight: 1, color: "#a5b4fc" }}>＋</span> 추가로 하고 싶은 말 남기기
                    </button>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                      <div style={S.optHeader}>
                        <div style={S.fLabel}>추가로 하고 싶은 말</div>
                        <button style={S.collapseBtn} onClick={() => { setShowP1Note(false); setP1Note(""); }}>✕ 접기</button>
                      </div>
                      <textarea placeholder="의사결정 외에 팀에 전하고 싶은 것, 걱정되는 것..." value={p1Note} onChange={e => setP1Note(e.target.value)} rows={3} autoFocus
                        style={{ width: "100%", padding: "12px 14px", border: "1.5px solid #5b5be7", borderRadius: "12px", fontSize: "0.9rem", color: "#334155", outline: "none", fontFamily: "inherit", resize: "none", lineHeight: "1.6" }} />
                    </div>
                  )}
                </div>

                <button onClick={() => deadlock && goNext()} disabled={!deadlock} style={S.btn(!!deadlock)}>저장하고 다음으로 →</button>
              </div>
            )}
          </>
        )}

        {/* ═══════════════════════════════
            PAGE 2 — 지분 & 보상
        ═══════════════════════════════ */}
        {pageIndex === 1 && (
          <>
            {step === "education" && (
              <div style={{ ...S.card, overflow: "hidden" }}>
                <div style={{ background: "linear-gradient(135deg, #2fb9a7 0%, #5b5be7 100%)", padding: "28px 28px 24px" }}>
                  <div style={S.tag}>지분을 정하기 전에</div>
                  <h2 style={{ fontSize: "1.25rem", fontWeight: "800", color: "#fff", lineHeight: "1.45", wordBreak: "keep-all" }}>지분율마다 가지는<br />권한이 달라요</h2>
                </div>
                <div style={{ padding: "24px 28px 28px", display: "flex", flexDirection: "column", gap: "18px" }}>
                  <div>
                    <div style={{ fontSize: "0.8rem", fontWeight: "700", color: "#475569", marginBottom: "10px" }}>지분율별 권한</div>
                    <div style={{ border: "1.5px solid #e2e8f0", borderRadius: "12px", overflow: "hidden" }}>
                      {VOTING_TABLE.map((row, i) => (
                        <div key={row.pct} style={{ display: "flex", gap: "12px", alignItems: "flex-start", padding: "11px 14px", borderBottom: i < VOTING_TABLE.length - 1 ? "1px solid #f1f5f9" : "none", background: i === 0 ? "#f8f8ff" : "#fff" }}>
                          <span style={{ fontSize: "0.82rem", fontWeight: "800", color: "#5b5be7", whiteSpace: "nowrap", minWidth: "70px" }}>{row.pct}</span>
                          <span style={{ fontSize: "0.82rem", color: "#475569", lineHeight: "1.45" }}>{row.meaning}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={{ ...S.clauseBox, borderColor: "#2fb9a7" }}>
                    <div style={{ fontSize: "0.72rem", fontWeight: "700", color: "#2fb9a7", marginBottom: "5px" }}>별지 — 지분 보유 현황 · 베스팅·클리프</div>
                    <div style={{ fontSize: "0.875rem", color: "#334155", lineHeight: "1.65" }}>지분율과 베스팅 조건은 초기에 정하는 게 맞아요. 나중에 바꾸려면 전원 동의가 필요하고, 투자자에게도 설명해야 해요.</div>
                  </div>
                  <button onClick={() => setStep("input")} style={{ ...S.btn(true), background: "#2fb9a7" }}>우리 팀 지분 정하기 →</button>
                </div>
              </div>
            )}

            {step === "input" && (
              <div style={{ ...S.card, padding: "28px", display: "flex", flexDirection: "column", gap: "24px" }}>
                <button onClick={goBack} style={S.backBtn}>← 이전으로</button>
                <div>
                  <div style={S.secLabel()}>각자 먼저 답해주세요 — 서로 안 보여요</div>
                  <h2 style={{ fontSize: "1.15rem", fontWeight: "800", color: "#1f2430" }}>지분과 보상을 어떻게 정할 건가요?</h2>
                </div>

                {/* 분기 질문 */}
                <div>
                  <div style={S.fLabel}>지분 비율을 이미 얘기해 본 적 있나요?</div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    {[{ key: "decided" as const, label: "예, 어느 정도 정해졌어요" }, { key: "undecided" as const, label: "아직, 기준부터 잡아야 해요" }].map(({ key, label }) => (
                      <button key={key} onClick={() => setEquityStatus(key)}
                        style={{ flex: 1, padding: "11px 8px", border: "2px solid", borderColor: equityStatus === key ? "#5b5be7" : "#e2e8f0", borderRadius: "12px", background: equityStatus === key ? "#f0f0fe" : "#f8fafc", fontSize: "0.82rem", fontWeight: "700", color: equityStatus === key ? "#5b5be7" : "#64748b", cursor: "pointer", lineHeight: "1.4", transition: "all 0.15s" }}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* A: 지분 정해진 경우 */}
                {equityStatus === "decided" && (
                  <>
                    <div>
                      <div style={S.fLabel}>합의된 지분 구조</div>
                      <div style={S.fSub}>팀에서 이미 얘기한 숫자를 입력하세요.</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {MEMBERS.map(member => (
                          <div key={member} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <div style={{ width: "84px", fontSize: "0.85rem", fontWeight: "700", color: "#64748b" }}>{member}</div>
                            <input type="text" inputMode="numeric" placeholder="0" value={capTable[member]}
                              onChange={e => setCapTable(p => ({ ...p, [member]: e.target.value.replace(/[^0-9]/g, "") }))}
                              style={{ ...S.input(!!capTable[member]), maxWidth: "90px", textAlign: "right" }} />
                            <span style={{ fontSize: "0.9rem", fontWeight: "600", color: "#475569" }}>%</span>
                          </div>
                        ))}
                      </div>
                      {totalCapA > 0 && (
                        <div style={{ marginTop: "8px", fontSize: "0.85rem", fontWeight: "700", color: totalCapA === 100 ? "#10b981" : totalCapA > 100 ? "#ef4444" : "#94a3b8" }}>
                          합계 {totalCapA}% {totalCapA === 100 ? "✓" : totalCapA > 100 ? "— 100%를 초과해요" : ""}
                        </div>
                      )}
                    </div>
                    <div>
                      <div style={S.fLabel}>이 지분율은 어떤 기준에서 나왔나요?</div>
                      <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginBottom: "10px" }}>중요한 순서대로 클릭해요.</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                        {[...PRIORITY_OPTS, "기타"].map(opt => {
                          const isOther = opt === "기타";
                          const rank = prioritiesA.indexOf(opt);
                          const sel  = rank !== -1;
                          return (
                            <button key={opt} onClick={() => { if (isOther) { setBasisAOther(b => !b); if (!basisAOther) togglePriorityA("기타"); else { setPrioritiesA(p => p.filter(x => x !== "기타")); setMyBasisA(""); } } else togglePriorityA(opt); }}
                              style={{ ...S.chip(isOther ? basisAOther : sel), display: "flex", alignItems: "center", gap: "6px" }}>
                              {sel && !isOther && <span style={{ background: "#5b5be7", color: "#fff", borderRadius: "50%", width: "18px", height: "18px", fontSize: "0.7rem", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "800", flexShrink: 0 }}>{rank + 1}</span>}
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                      {basisAOther && (
                        <textarea placeholder="직접 입력하세요" value={myBasisA} onChange={e => setMyBasisA(e.target.value)} rows={2} autoFocus
                          style={{ width: "100%", marginTop: "10px", padding: "10px 14px", border: "1.5px solid #5b5be7", borderRadius: "10px", fontSize: "0.88rem", color: "#334155", outline: "none", fontFamily: "inherit", resize: "none", lineHeight: "1.55" }} />
                      )}
                    </div>
                  </>
                )}

                {/* B: 지분 미정인 경우 */}
                {equityStatus === "undecided" && (
                  <>
                    <div style={{ border: "1.5px solid #e2e8f0", borderRadius: "14px", overflow: "hidden" }}>
                      <div style={{ padding: "12px 16px", borderBottom: "1px solid #f1f5f9", background: "#f8fafc" }}>
                        <div style={{ fontSize: "0.78rem", fontWeight: "700", color: "#475569" }}>먼저 사실관계를 적어주세요</div>
                      </div>
                      <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "14px" }}>
                        <div>
                          <div style={{ fontSize: "0.85rem", fontWeight: "700", color: "#1f2430", marginBottom: "8px" }}>함께 일한 기간</div>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <input type="text" inputMode="numeric" placeholder="" value={workingMonths} onChange={e => setWorkingMonths(e.target.value.replace(/[^0-9]/g, ""))} style={{ ...S.input(!!workingMonths), maxWidth: "80px" }} />
                            <span style={{ fontSize: "0.9rem", fontWeight: "600", color: "#475569" }}>개월</span>
                          </div>
                        </div>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: hasInvestment ? "10px" : "0" }}>
                            <div style={{ fontSize: "0.85rem", fontWeight: "700", color: "#1f2430" }}>초기에 투자한 금액이 있나요?</div>
                            <Toggle on={hasInvestment} onToggle={() => { setHasInvestment(v => !v); setMyInvestment(""); }} />
                          </div>
                          {hasInvestment && (
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                              <input type="text" inputMode="numeric" placeholder="" value={myInvestment} onChange={e => setMyInvestment(e.target.value.replace(/[^0-9]/g, ""))} style={{ ...S.input(!!myInvestment), maxWidth: "120px" }} />
                              <span style={{ fontSize: "0.9rem", fontWeight: "600", color: "#475569" }}>만 원</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div>
                      <div style={S.fLabel}>어떤 기준이 더 중요하다고 생각하나요?</div>
                      <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginBottom: "10px" }}>중요한 순서대로 클릭해요.</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                        {[...PRIORITY_OPTS, "기타"].map(opt => {
                          const isOther = opt === "기타";
                          const rank = priorities.indexOf(opt);
                          const sel  = rank !== -1;
                          return (
                            <button key={opt} onClick={() => { if (isOther) { setBasisBOther(b => !b); if (!basisBOther) togglePriority("기타"); else { setPriorities(p => p.filter(x => x !== "기타")); setMyBasisB(""); } } else togglePriority(opt); }}
                              style={{ ...S.chip(isOther ? basisBOther : sel), display: "flex", alignItems: "center", gap: "6px" }}>
                              {sel && !isOther && <span style={{ background: "#5b5be7", color: "#fff", borderRadius: "50%", width: "18px", height: "18px", fontSize: "0.7rem", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "800", flexShrink: 0 }}>{rank + 1}</span>}
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                      {basisBOther && (
                        <textarea placeholder="직접 입력하세요" value={myBasisB} onChange={e => setMyBasisB(e.target.value)} rows={2} autoFocus
                          style={{ width: "100%", marginTop: "10px", padding: "10px 14px", border: "1.5px solid #5b5be7", borderRadius: "10px", fontSize: "0.88rem", color: "#334155", outline: "none", fontFamily: "inherit", resize: "none", lineHeight: "1.55" }} />
                      )}
                    </div>
                    {priorities.length > 0 && (
                      <div>
                        <div style={S.fLabel}>내가 생각하는 지분 구조</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                          {MEMBERS.map(member => (
                            <div key={member} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                              <div style={{ width: "84px", fontSize: "0.85rem", fontWeight: "700", color: "#64748b" }}>{member}</div>
                              <input type="text" inputMode="numeric" placeholder="0" value={equityB[member]}
                                onChange={e => setEquityB(p => ({ ...p, [member]: e.target.value.replace(/[^0-9]/g, "") }))}
                                style={{ ...S.input(!!equityB[member]), maxWidth: "90px", textAlign: "right" }} />
                              <span style={{ fontSize: "0.9rem", fontWeight: "600", color: "#475569" }}>%</span>
                            </div>
                          ))}
                        </div>
                        {totalCapB > 0 && (
                          <div style={{ marginTop: "8px", fontSize: "0.85rem", fontWeight: "700", color: totalCapB === 100 ? "#10b981" : totalCapB > 100 ? "#ef4444" : "#94a3b8" }}>
                            합계 {totalCapB}% {totalCapB === 100 ? "✓" : totalCapB > 100 ? "— 100%를 초과해요" : ""}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}

                {/* 베스팅 */}
                {equityStatus !== "" && (
                  <div style={{ border: "1.5px solid", borderColor: vestingOn ? "#5b5be7" : "#e2e8f0", borderRadius: "14px", overflow: "hidden", transition: "border-color 0.15s" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px" }}>
                      <div onClick={() => setVestingOn(v => !v)} style={{ cursor: "pointer" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <span style={{ fontSize: "0.95rem", fontWeight: "700", color: "#1f2430" }}>베스팅 설정</span>
                          <button onClick={e => { e.stopPropagation(); setShowVestingInfo(v => !v); }}
                            style={{ width: "20px", height: "20px", borderRadius: "50%", border: "1.5px solid #cbd5e1", background: showVestingInfo ? "#5b5be7" : "#f8fafc", color: showVestingInfo ? "#fff" : "#94a3b8", fontSize: "0.72rem", fontWeight: "800", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>?</button>
                        </div>
                        <div style={{ fontSize: "0.78rem", color: "#94a3b8", marginTop: "2px" }}>근무 기간에 따라 지분이 확정돼요</div>
                      </div>
                      <Toggle on={vestingOn} onToggle={() => setVestingOn(v => !v)} />
                    </div>
                    {showVestingInfo && (
                      <div style={{ margin: "0 14px 14px", background: "#f8fafc", borderRadius: "10px", padding: "13px 14px", display: "flex", flexDirection: "column", gap: "10px" }}>
                        <div><div style={{ fontSize: "0.78rem", fontWeight: "800", color: "#5b5be7", marginBottom: "3px" }}>베스팅 (Vesting)</div><div style={{ fontSize: "0.82rem", color: "#475569", lineHeight: "1.55" }}>지분이 한 번에 주어지는 게 아니라, 일정 기간 동안 조금씩 확정돼요. 예: 4년 베스팅이면 1년마다 25%씩.</div></div>
                        <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "10px" }}><div style={{ fontSize: "0.78rem", fontWeight: "800", color: "#5b5be7", marginBottom: "3px" }}>클리프 (Cliff)</div><div style={{ fontSize: "0.82rem", color: "#475569", lineHeight: "1.55" }}>클리프 기간이 지나야 베스팅이 시작돼요. 예: 12개월 클리프면 1년 미만 퇴사 시 지분이 하나도 없어요.</div></div>
                      </div>
                    )}
                    {vestingOn && (
                      <div style={{ padding: "14px 16px 16px", borderTop: "1px solid #f1f5f9", display: "flex", flexDirection: "column", gap: "12px" }}>
                        <div>
                          <div style={{ fontSize: "0.8rem", fontWeight: "700", color: "#475569", marginBottom: "8px" }}>베스팅 기간</div>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <input type="text" inputMode="numeric" placeholder="" value={vestingYrs} onChange={e => setVestingYrs(e.target.value.replace(/[^0-9]/g, ""))} style={{ ...S.input(!!vestingYrs), maxWidth: "80px", minWidth: "70px" }} />
                            <span style={{ fontSize: "0.9rem", fontWeight: "600", color: "#475569" }}>년</span>
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: "0.8rem", fontWeight: "700", color: "#475569", marginBottom: "4px" }}>클리프 기간</div>
                          <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginBottom: "8px" }}>이 기간 전에 퇴사하면 지분이 없어요</div>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <input type="text" inputMode="numeric" placeholder="" value={vestingClf} onChange={e => setVestingClf(e.target.value.replace(/[^0-9]/g, ""))} style={{ ...S.input(!!vestingClf), maxWidth: "80px", minWidth: "70px" }} />
                            <span style={{ fontSize: "0.9rem", fontWeight: "600", color: "#475569" }}>개월</span>
                          </div>
                        </div>
                        {vestingYrs && vestingClf && (
                          <div style={{ padding: "10px 12px", background: "#f0f0fe", borderRadius: "9px", fontSize: "0.82rem", color: "#5b5be7", fontWeight: "600" }}>
                            → {vestingClf}개월 전 퇴사 시 지분 없음, 이후 {vestingYrs}년에 걸쳐 확정
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {equityStatus !== "" && (
                  <div>
                    {!showFreeNote ? (
                      <button style={S.addOpt} onClick={() => setShowFreeNote(true)}>
                        <span style={{ fontSize: "1rem", lineHeight: 1 }}>+</span> 추가로 하고 싶은 말 남기기
                      </button>
                    ) : (
                      <div>
                        <div style={S.optHeader}>
                          <div style={S.fLabel}>추가로 하고 싶은 말</div>
                          <button style={S.collapseBtn} onClick={() => { setShowFreeNote(false); setFreeNote(""); }}>✕ 접기</button>
                        </div>
                        <textarea placeholder="지분, 보상 외에 팀에 전하고 싶은 것..." value={freeNote} onChange={e => setFreeNote(e.target.value)} rows={3} autoFocus
                          style={{ width: "100%", padding: "12px 14px", border: "1.5px solid #5b5be7", borderRadius: "12px", fontSize: "0.88rem", color: "#334155", outline: "none", fontFamily: "inherit", resize: "none", lineHeight: "1.6" }} />
                      </div>
                    )}
                  </div>
                )}

                <button onClick={() => p2CanNext && goNext()} disabled={!p2CanNext} style={S.btn(p2CanNext)}>저장하고 다음으로 →</button>
              </div>
            )}
          </>
        )}

        {/* ═══════════════════════════════
            PAGE 3 — 역할 & 책임
        ═══════════════════════════════ */}
        {pageIndex === 2 && (
          <>
            {step === "education" && (
              <div style={{ ...S.card, padding: "28px", display: "flex", flexDirection: "column", gap: "20px" }}>
                <div>
                  <div style={S.secLabel()}>역할 & 책임</div>
                  <h2 style={{ fontSize: "1.2rem", fontWeight: "800", color: "#1f2430", lineHeight: "1.4" }}>역할이 흐릿하면<br />책임도 흐릿해져요</h2>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {[
                    { icon: "⚠️", title: "역할 공백·중복", desc: "누가 뭘 담당하는지 불명확하면 같은 일을 두 명이 하거나, 아무도 안 하는 일이 생겨요." },
                    { icon: "⏸️", title: "전념 의무 미명시", desc: "겸업·다른 활동을 사전에 공유하지 않으면, 나중에 신뢰 문제가 돼요. 계약서에 전념 의무를 명시해두는 이유예요." },
                    { icon: "⚖️", title: "이사 등기", desc: "이사로 등기된 공동창업자는 대표이사와 법적 책임을 함께 집니다. 누가 등기할 것인지 미리 합의하는 것이 중요해요." },
                  ].map(({ icon, title, desc }) => (
                    <div key={title} style={{ display: "flex", gap: "14px", padding: "14px", background: "#f8fafc", borderRadius: "14px" }}>
                      <span style={{ fontSize: "1.1rem", flexShrink: 0, marginTop: "1px" }}>{icon}</span>
                      <div>
                        <div style={{ fontWeight: "700", color: "#1f2430", fontSize: "0.9rem", marginBottom: "4px" }}>{title}</div>
                        <div style={{ fontSize: "0.83rem", color: "#64748b", lineHeight: "1.55" }}>{desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: "0.75rem", color: "#94a3b8", paddingTop: "4px" }}>별지 — 전념의무·이사선임 조항</div>
                <button onClick={() => setStep("input")} style={S.btn(true)}>각자 답변 입력하기 →</button>
              </div>
            )}

            {step === "input" && (
              <div style={{ ...S.card, padding: "28px", display: "flex", flexDirection: "column", gap: "24px" }}>
                <button onClick={goBack} style={S.backBtn}>← 이전으로</button>
                <div>
                  <div style={S.secLabel()}>각자 먼저 답해주세요 — 서로 안 보여요</div>
                  <h2 style={{ fontSize: "1.15rem", fontWeight: "800", color: "#1f2430" }}>이 팀에서 나의 역할은 무엇인가요?</h2>
                </div>

                {/* 직책 */}
                <div>
                  <div style={S.fLabel}>직책 / 역할</div>
                  <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginBottom: "10px" }}>CTO와 개발 담당은 달라요. 정확하게 골라주세요.</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {ROLE_CHIPS.slice(0, -1).map(chip => (
                      <button key={chip} onClick={() => { setP3RoleOther(false); setMyP3Role(myP3Role === chip ? "" : chip); }} style={S.chip(!p3RoleOther && myP3Role === chip)}>{chip}</button>
                    ))}
                    <button onClick={() => { setP3RoleOther(o => !o); if (!p3RoleOther) setMyP3Role(""); }} style={S.chip(p3RoleOther)}>기타</button>
                  </div>
                  {p3RoleOther && (
                    <input type="text" placeholder="직접 입력하세요" value={myP3Role} onChange={e => setMyP3Role(e.target.value)} autoFocus
                      style={{ ...S.input(!!myP3Role), width: "100%", marginTop: "10px" }} />
                  )}
                </div>

                {/* 담당 영역 */}
                <div>
                  <div style={S.fLabel}>주로 맡을 업무 영역</div>
                  <textarea placeholder="예) 제품 개발·기술 의사결정, 개발자 채용" value={myDomain} onChange={e => setMyDomain(e.target.value)} rows={2}
                    style={{ width: "100%", padding: "12px 14px", border: `1.5px solid ${myDomain ? "#5b5be7" : "#e2e8f0"}`, borderRadius: "12px", fontSize: "0.9rem", color: "#334155", outline: "none", fontFamily: "inherit", resize: "none", lineHeight: "1.55", transition: "border-color 0.15s" }} />
                </div>

                {/* 전념 여부 */}
                <div>
                  <div style={S.fLabel}>전념 여부</div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    {[{ label: "풀타임 전념", val: true }, { label: "파트타임 / 병행 중", val: false }].map(({ label, val }) => (
                      <button key={label} onClick={() => setIsFulltime(val)} style={{ ...S.chip(isFulltime === val), flex: 1, padding: "10px 0" }}>{label}</button>
                    ))}
                  </div>
                </div>

                {/* 이사 등기 여부 */}
                <div style={{ border: "1.5px solid", borderColor: directorOn ? "#5b5be7" : "#e2e8f0", borderRadius: "14px", overflow: "hidden", transition: "border-color 0.15s" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", cursor: "pointer" }} onClick={() => setDirectorOn(v => !v)}>
                    <div>
                      <div style={{ fontSize: "0.95rem", fontWeight: "700", color: "#1f2430" }}>이사 등기 대상인가요?</div>
                      <div style={{ fontSize: "0.78rem", color: "#94a3b8", marginTop: "2px" }}>등기 이사는 대표이사와 법적 책임을 함께 져요</div>
                    </div>
                    <Toggle on={directorOn} onToggle={() => setDirectorOn(v => !v)} />
                  </div>
                  {directorOn && (
                    <div style={{ padding: "10px 16px 14px", borderTop: "1px solid #f1f5f9", background: "#f8fafc" }}>
                      <div style={{ fontSize: "0.8rem", color: "#475569", lineHeight: "1.55" }}>
                        이사로 등기되면 회사 의사결정에 법적 권한이 생기는 동시에, 이사 의무·책임도 따라와요. 투자 유치 시 이사회 구성에도 영향을 줘요.
                      </div>
                    </div>
                  )}
                </div>

                {/* 선택 항목 */}
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {!showP3Other ? (
                    <button style={S.addOpt} onClick={() => setShowP3Other(true)}>
                      <span style={{ fontSize: "0.9rem", lineHeight: 1, color: "#a5b4fc" }}>＋</span> 다른 활동 / 겸업 공개하기
                    </button>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                      <div style={S.optHeader}>
                        <div style={S.fLabel}>어떤 활동인가요?</div>
                        <button style={S.collapseBtn} onClick={() => { setShowP3Other(false); setP3OtherDetail(""); }}>✕ 접기</button>
                      </div>
                      <textarea placeholder="예) 기존 프리랜서 계약 2건, 약 3개월 이내 마무리 예정" value={p3OtherDetail} onChange={e => setP3OtherDetail(e.target.value)} rows={2} autoFocus
                        style={{ width: "100%", padding: "12px 14px", border: "1.5px solid #5b5be7", borderRadius: "12px", fontSize: "0.9rem", color: "#334155", outline: "none", fontFamily: "inherit", resize: "none", lineHeight: "1.55" }} />
                    </div>
                  )}
                  {!showP3Note ? (
                    <button style={S.addOpt} onClick={() => setShowP3Note(true)}>
                      <span style={{ fontSize: "0.9rem", lineHeight: 1, color: "#a5b4fc" }}>＋</span> 추가로 하고 싶은 말 남기기
                    </button>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                      <div style={S.optHeader}>
                        <div style={S.fLabel}>추가로 하고 싶은 말</div>
                        <button style={S.collapseBtn} onClick={() => { setShowP3Note(false); setP3Note(""); }}>✕ 접기</button>
                      </div>
                      <textarea placeholder="역할 외에 팀에 전하고 싶은 것, 우려되는 것..." value={p3Note} onChange={e => setP3Note(e.target.value)} rows={3} autoFocus
                        style={{ width: "100%", padding: "12px 14px", border: "1.5px solid #5b5be7", borderRadius: "12px", fontSize: "0.9rem", color: "#334155", outline: "none", fontFamily: "inherit", resize: "none", lineHeight: "1.6" }} />
                    </div>
                  )}
                </div>

                <button
                  onClick={() => ((p3RoleOther ? myP3Role.trim() !== "" : myP3Role !== "") && myDomain) && goNext()}
                  disabled={!((p3RoleOther ? myP3Role.trim() !== "" : myP3Role !== "") && myDomain)}
                  style={S.btn(!!((p3RoleOther ? myP3Role.trim() !== "" : myP3Role !== "") && myDomain))}>
                  저장하고 다음으로 →
                </button>
              </div>
            )}
          </>
        )}

        {/* ═══════════════════════════════
            PAGE 4 — 주식양도 제한·우선매수권
        ═══════════════════════════════ */}
        {pageIndex === 3 && (
          <>
            {step === "education" && (
              <div style={{ ...S.card, overflow: "hidden" }}>
                <div style={{ background: "linear-gradient(135deg, #0ea5e9 0%, #5b5be7 100%)", padding: "28px 28px 24px" }}>
                  <div style={S.tag}>이 조항이 왜 있는 걸까요?</div>
                  <h2 style={{ fontSize: "1.25rem", fontWeight: "800", color: "#fff", lineHeight: "1.45", wordBreak: "keep-all" }}>모르는 사람이 갑자기<br />주주가 되는 걸 막는 구조</h2>
                </div>
                <div style={{ padding: "24px 28px 28px", display: "flex", flexDirection: "column", gap: "18px" }}>
                  {[
                    { icon: "🚫", t: "설립 초기에는 지분을 팔 수 없게 해요", d: "설립 후 일정 기간 동안 다른 주주 동의 없이 지분을 제3자에게 양도할 수 없어요. 팀 안정성을 위한 최소 장치예요." },
                    { icon: "🤝", t: "팔고 싶다면 팀원에게 먼저 기회를 줘요", d: "우선매수권(ROFR): 외부에 팔기 전에 기존 주주에게 같은 조건으로 먼저 살 기회를 줘요." },
                    { icon: "⚠️", t: "기간이 없으면 이 조항은 실효성이 없어요", d: "우선매수권 행사 기한이 정해져 있지 않으면 위반 여부 판단이 어렵고 제재도 불가능해요." },
                  ].map(({ icon, t, d }) => (
                    <div key={t} style={{ display: "flex", gap: "12px" }}>
                      <div style={{ width: "30px", height: "30px", borderRadius: "50%", background: "#e0f2fe", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "0.85rem" }}>{icon}</div>
                      <div><div style={{ fontWeight: "700", color: "#1f2430", fontSize: "0.9rem", marginBottom: "3px" }}>{t}</div><div style={{ fontSize: "0.85rem", color: "#64748b", lineHeight: "1.55" }}>{d}</div></div>
                    </div>
                  ))}
                  <div style={S.clauseBox}>
                    <div style={{ fontSize: "0.72rem", fontWeight: "700", color: "#5b5be7", marginBottom: "5px" }}>별지 — 주식양도 제한·우선매수권</div>
                    <div style={{ fontSize: "0.875rem", color: "#334155", lineHeight: "1.65" }}>구성원은 회사 설립일로부터 <strong>___개월간</strong> 다른 구성원의 사전 서면동의 없이 보유 주식을 제3자에게 양도할 수 없다. 양도 시 다른 구성원은 동일한 조건으로 먼저 매수할 권리(우선매수권)를 가지며, 통지받은 날로부터 <strong>___일</strong> 이내에 매수 여부를 회신한다.</div>
                  </div>
                  <button onClick={() => setStep("input")} style={S.btn(true)}>우리 팀 기준 정하기 →</button>
                </div>
              </div>
            )}

            {step === "input" && (
              <div style={{ ...S.card, padding: "28px", display: "flex", flexDirection: "column", gap: "24px" }}>
                <button onClick={goBack} style={S.backBtn}>← 이전으로</button>
                <div>
                  <div style={S.secLabel()}>각자 먼저 답해주세요 — 서로 안 보여요</div>
                  <h2 style={{ fontSize: "1.15rem", fontWeight: "800", color: "#1f2430" }}>주식 양도 제한과 우선매수권 기간을 정해주세요</h2>
                </div>

                {/* 양도 제한 기간 */}
                <div>
                  <div style={S.fLabel}>양도 제한 기간</div>
                  <div style={S.fSub}>설립 후 이 기간 동안은 다른 주주 동의 없이 지분을 팔 수 없어요.</div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <input type="text" inputMode="numeric" placeholder="" value={lockupMonths} onChange={e => setLockupMonths(e.target.value.replace(/[^0-9]/g, ""))} style={{ ...S.input(!!lockupMonths), maxWidth: "100px" }} />
                    <span style={{ fontSize: "0.9rem", fontWeight: "600", color: "#475569", whiteSpace: "nowrap" }}>개월</span>
                  </div>
                </div>

                {/* 우선매수권 행사기간 */}
                <div>
                  <div style={S.fLabel}>우선매수권 행사기간 (ROFR)</div>
                  <div style={S.fSub}>양도 통지를 받은 날로부터 이 기간 안에 매수 의사를 밝혀야 해요. 통상 30~60일이에요.</div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <input type="text" inputMode="numeric" placeholder="" value={rofrDays} onChange={e => setRofrDays(e.target.value.replace(/[^0-9]/g, ""))} style={{ ...S.input(!!rofrDays), maxWidth: "100px" }} />
                    <span style={{ fontSize: "0.9rem", fontWeight: "600", color: "#475569", whiteSpace: "nowrap" }}>일 이내</span>
                  </div>
                  {rofrDays && (parseInt(rofrDays) < 14 || parseInt(rofrDays) > 90) && (
                    <div style={{ ...S.warnBadge, marginTop: "8px", display: "block" }}>
                      통상 30~60일이에요. {parseInt(rofrDays) < 14 ? "너무 짧으면 실제로 검토가 어려울 수 있어요." : "너무 길면 양도인의 거래 기회가 줄어들 수 있어요."}
                    </div>
                  )}
                </div>

                {/* 선택 항목 */}
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {!showP4Note ? (
                    <button style={S.addOpt} onClick={() => setShowP4Note(true)}>
                      <span style={{ fontSize: "0.9rem", lineHeight: 1, color: "#a5b4fc" }}>＋</span> 추가로 하고 싶은 말 남기기
                    </button>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                      <div style={S.optHeader}>
                        <div style={S.fLabel}>추가로 하고 싶은 말</div>
                        <button style={S.collapseBtn} onClick={() => { setShowP4Note(false); setP4Note(""); }}>✕ 접기</button>
                      </div>
                      <textarea placeholder="양도 제한 외에 팀에 전하고 싶은 것..." value={p4Note} onChange={e => setP4Note(e.target.value)} rows={3} autoFocus
                        style={{ width: "100%", padding: "12px 14px", border: "1.5px solid #5b5be7", borderRadius: "12px", fontSize: "0.9rem", color: "#334155", outline: "none", fontFamily: "inherit", resize: "none", lineHeight: "1.6" }} />
                    </div>
                  )}
                </div>

                <button onClick={() => (lockupMonths && rofrDays) && goNext()} disabled={!(lockupMonths && rofrDays)} style={S.btn(!!(lockupMonths && rofrDays))}>저장하고 다음으로 →</button>
              </div>
            )}
          </>
        )}

        {/* ═══════════════════════════════
            PAGE 5 — 동반매도·동반매각
        ═══════════════════════════════ */}
        {pageIndex === 4 && (
          <>
            {step === "education" && (
              <div style={{ ...S.card, overflow: "hidden" }}>
                <div style={{ background: "linear-gradient(135deg, #7c3aed 0%, #5b5be7 100%)", padding: "28px 28px 24px" }}>
                  <div style={S.tag}>이 조항이 왜 있는 걸까요?</div>
                  <h2 style={{ fontSize: "1.25rem", fontWeight: "800", color: "#fff", lineHeight: "1.45", wordBreak: "keep-all" }}>엑싯할 때 소수주주 때문에<br />막히지 않게</h2>
                </div>
                <div style={{ padding: "24px 28px 28px", display: "flex", flexDirection: "column", gap: "18px" }}>
                  {[
                    { icon: "📤", t: "드래그얼롱: 함께 팔 수 있는 권리", d: "대주주가 회사 전체를 제3자에게 매각하기로 결정하면, 소수주주도 같은 조건으로 함께 팔도록 요구할 수 있어요." },
                    { icon: "🛡️", t: "태그얼롱: 함께 팔 수 있는 권리 (소수주주 보호)", d: "대주주가 지분을 팔 때, 소수주주도 같은 조건으로 동반 매각에 참여할 수 있어요." },
                    { icon: "📅", t: "트리거 조건이 없으면 발동이 어려워요", d: "몇 % 이상 동의했을 때, 설립 후 몇 년이 지났을 때 발동 가능한지 명시해야 실효성이 있어요." },
                  ].map(({ icon, t, d }) => (
                    <div key={t} style={{ display: "flex", gap: "12px" }}>
                      <div style={{ width: "30px", height: "30px", borderRadius: "50%", background: "#ede9fe", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "0.85rem" }}>{icon}</div>
                      <div><div style={{ fontWeight: "700", color: "#1f2430", fontSize: "0.9rem", marginBottom: "3px" }}>{t}</div><div style={{ fontSize: "0.85rem", color: "#64748b", lineHeight: "1.55" }}>{d}</div></div>
                    </div>
                  ))}
                  <div style={S.clauseBox}>
                    <div style={{ fontSize: "0.72rem", fontWeight: "700", color: "#5b5be7", marginBottom: "5px" }}>별지 — 동반매도·동반매각 (Tag/Drag-along)</div>
                    <div style={{ fontSize: "0.875rem", color: "#334155", lineHeight: "1.65" }}>지분 <strong>___%</strong> 이상을 보유한 구성원이 회사 지분 전부를 매각하기로 결정한 경우, 다른 구성원에게 동일한 가격 및 조건으로 동반매각을 요구할 수 있다.</div>
                  </div>
                  <button onClick={() => setStep("input")} style={S.btn(true)}>우리 팀 기준 정하기 →</button>
                </div>
              </div>
            )}

            {step === "input" && (
              <div style={{ ...S.card, padding: "28px", display: "flex", flexDirection: "column", gap: "24px" }}>
                <button onClick={goBack} style={S.backBtn}>← 이전으로</button>
                <div>
                  <div style={S.secLabel()}>각자 먼저 답해주세요 — 서로 안 보여요</div>
                  <h2 style={{ fontSize: "1.15rem", fontWeight: "800", color: "#1f2430" }}>드래그얼롱·태그얼롱 조건을 정해주세요</h2>
                </div>

                {/* 드래그얼롱 발동 기준 */}
                <div>
                  <div style={S.fLabel}>드래그얼롱 발동 기준</div>
                  <div style={S.fSub}>몇 % 이상 동의 시 전체 주주를 매각에 참여시킬 수 있나요?</div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <input type="text" inputMode="numeric" placeholder="" value={dragTrigger} onChange={e => setDragTrigger(e.target.value.replace(/[^0-9]/g, ""))} style={{ ...S.input(!!dragTrigger), maxWidth: "100px" }} />
                    <span style={{ fontSize: "0.9rem", fontWeight: "600", color: "#475569", whiteSpace: "nowrap" }}>% 이상 동의 시</span>
                  </div>
                </div>

                {/* 태그얼롱 */}
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                      <div style={S.fLabel}>태그얼롱 보호 동의</div>
                      <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "2px" }}>소수주주가 대주주 매각에 동반 참여할 수 있는 권리를 보장해요.</div>
                    </div>
                    <Toggle on={tagProtect} onToggle={() => setTagProtect(v => !v)} />
                  </div>
                </div>

                {/* 선택: 드래그얼롱 발동 가능 시점 */}
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {!showDragYrs ? (
                    <button style={S.addOpt} onClick={() => setShowDragYrs(true)}>
                      <span style={{ fontSize: "0.9rem", lineHeight: 1, color: "#a5b4fc" }}>＋</span> 드래그얼롱 발동 가능 시점 추가 (선택)
                    </button>
                  ) : (
                    <div>
                      <div style={S.optHeader}>
                        <div style={S.fLabel}>드래그얼롱 발동 가능 시점</div>
                        <button style={S.collapseBtn} onClick={() => { setShowDragYrs(false); setDragYrs(""); }}>✕ 접기</button>
                      </div>
                      <div style={S.fSub}>실무상 설립 후 5~10년이 지난 후 발동 가능하도록 설계하는 경우가 많아요.</div>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span style={{ fontSize: "0.9rem", fontWeight: "600", color: "#475569", whiteSpace: "nowrap" }}>설립 후</span>
                        <input type="text" inputMode="numeric" placeholder="" value={dragYrs} onChange={e => setDragYrs(e.target.value.replace(/[^0-9]/g, ""))} autoFocus style={{ ...S.input(!!dragYrs), maxWidth: "80px" }} />
                        <span style={{ fontSize: "0.9rem", fontWeight: "600", color: "#475569", whiteSpace: "nowrap" }}>년 이후</span>
                      </div>
                    </div>
                  )}
                  {!showP5Note ? (
                    <button style={S.addOpt} onClick={() => setShowP5Note(true)}>
                      <span style={{ fontSize: "0.9rem", lineHeight: 1, color: "#a5b4fc" }}>＋</span> 추가로 하고 싶은 말 남기기
                    </button>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                      <div style={S.optHeader}>
                        <div style={S.fLabel}>추가로 하고 싶은 말</div>
                        <button style={S.collapseBtn} onClick={() => { setShowP5Note(false); setP5Note(""); }}>✕ 접기</button>
                      </div>
                      <textarea placeholder="엑싯·매각 관련해서 팀에 전하고 싶은 것..." value={p5Note} onChange={e => setP5Note(e.target.value)} rows={3} autoFocus
                        style={{ width: "100%", padding: "12px 14px", border: "1.5px solid #5b5be7", borderRadius: "12px", fontSize: "0.9rem", color: "#334155", outline: "none", fontFamily: "inherit", resize: "none", lineHeight: "1.6" }} />
                    </div>
                  )}
                </div>

                <button onClick={() => dragTrigger && goNext()} disabled={!dragTrigger} style={S.btn(!!dragTrigger)}>저장하고 다음으로 →</button>
              </div>
            )}
          </>
        )}

        {/* ═══════════════════════════════
            PAGE 6 — 경업금지·비밀유지
        ═══════════════════════════════ */}
        {pageIndex === 5 && (
          <>
            {step === "education" && (
              <div style={{ ...S.card, overflow: "hidden" }}>
                <div style={{ background: "linear-gradient(135deg, #059669 0%, #2fb9a7 100%)", padding: "28px 28px 24px" }}>
                  <div style={S.tag}>이 조항이 왜 있는 걸까요?</div>
                  <h2 style={{ fontSize: "1.25rem", fontWeight: "800", color: "#fff", lineHeight: "1.45", wordBreak: "keep-all" }}>떠난 이후에도<br />지켜야 할 것들이 있어요</h2>
                </div>
                <div style={{ padding: "24px 28px 28px", display: "flex", flexDirection: "column", gap: "18px" }}>
                  {[
                    { icon: "🚷", t: "경업금지: 퇴사 후 동종 업계 진출 제한", d: "퇴사 후 바로 경쟁사를 차리거나 합류하는 것을 방지해요. 기간이 구체적이어야 법적 효력이 있어요." },
                    { icon: "🔐", t: "비밀유지: 핵심 정보 유출 방지", d: "재직 중에 알게 된 고객 정보·기술·전략을 퇴사 후에도 외부에 공개하지 않아야 해요." },
                    { icon: "📋", t: "기간이 명시돼야 실효성이 있어요", d: "경업금지와 비밀유지 모두 기간이 불명확하면 위반 여부를 판단하기 어려워요. 각각 몇 년인지 정해두세요." },
                  ].map(({ icon, t, d }) => (
                    <div key={t} style={{ display: "flex", gap: "12px" }}>
                      <div style={{ width: "30px", height: "30px", borderRadius: "50%", background: "#d1fae5", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "0.85rem" }}>{icon}</div>
                      <div><div style={{ fontWeight: "700", color: "#1f2430", fontSize: "0.9rem", marginBottom: "3px" }}>{t}</div><div style={{ fontSize: "0.85rem", color: "#64748b", lineHeight: "1.55" }}>{d}</div></div>
                    </div>
                  ))}
                  <div style={{ ...S.clauseBox, borderColor: "#059669" }}>
                    <div style={{ fontSize: "0.72rem", fontWeight: "700", color: "#059669", marginBottom: "5px" }}>별지 — 경업금지·비밀유지</div>
                    <div style={{ fontSize: "0.875rem", color: "#334155", lineHeight: "1.65" }}>구성원은 재임 중 및 퇴임 후 <strong>___년간</strong> 회사와 동일·유사한 사업을 영위하거나 경쟁사에 관여할 수 없다. 또한 재직 중 알게 된 영업비밀·고객정보·기술정보를 퇴임 후 <strong>___년간</strong> 제3자에게 누설하거나 자기 목적으로 사용하지 않는다.</div>
                  </div>
                  <button onClick={() => setStep("input")} style={{ ...S.btn(true), background: "#059669" }}>우리 팀 기준 정하기 →</button>
                </div>
              </div>
            )}

            {step === "input" && (
              <div style={{ ...S.card, padding: "28px", display: "flex", flexDirection: "column", gap: "24px" }}>
                <button onClick={goBack} style={S.backBtn}>← 이전으로</button>
                <div>
                  <div style={S.secLabel()}>각자 먼저 답해주세요 — 서로 안 보여요</div>
                  <h2 style={{ fontSize: "1.15rem", fontWeight: "800", color: "#1f2430" }}>퇴사 후 지켜야 할 기간을 정해주세요</h2>
                </div>

                {/* 경업금지 기간 */}
                <div>
                  <div style={S.fLabel}>퇴사 후 경업금지 기간</div>
                  <div style={S.fSub}>퇴사 후 이 기간 동안은 동종·경쟁 사업에 관여할 수 없어요. 통상 1~2년이에요.</div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <input type="text" inputMode="numeric" placeholder="" value={nonCompeteYrs} onChange={e => setNonCompeteYrs(e.target.value.replace(/[^0-9]/g, ""))} style={{ ...S.input(!!nonCompeteYrs), maxWidth: "100px" }} />
                    <span style={{ fontSize: "0.9rem", fontWeight: "600", color: "#475569", whiteSpace: "nowrap" }}>년</span>
                  </div>
                </div>

                {/* 비밀유지 존속기간 */}
                <div>
                  <div style={S.fLabel}>비밀유지 존속기간</div>
                  <div style={S.fSub}>퇴사 후 이 기간 동안은 재직 중 알게 된 정보를 외부에 공개할 수 없어요. 통상 2~3년이에요.</div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <input type="text" inputMode="numeric" placeholder="" value={ndaYrs} onChange={e => setNdaYrs(e.target.value.replace(/[^0-9]/g, ""))} style={{ ...S.input(!!ndaYrs), maxWidth: "100px" }} />
                    <span style={{ fontSize: "0.9rem", fontWeight: "600", color: "#475569", whiteSpace: "nowrap" }}>년</span>
                  </div>
                </div>

                {/* 선택 항목 */}
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {!showP6Note ? (
                    <button style={S.addOpt} onClick={() => setShowP6Note(true)}>
                      <span style={{ fontSize: "0.9rem", lineHeight: 1, color: "#a5b4fc" }}>＋</span> 추가로 하고 싶은 말 남기기
                    </button>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                      <div style={S.optHeader}>
                        <div style={S.fLabel}>추가로 하고 싶은 말</div>
                        <button style={S.collapseBtn} onClick={() => { setShowP6Note(false); setP6Note(""); }}>✕ 접기</button>
                      </div>
                      <textarea placeholder="경업금지·비밀유지 외에 팀에 전하고 싶은 것..." value={p6Note} onChange={e => setP6Note(e.target.value)} rows={3} autoFocus
                        style={{ width: "100%", padding: "12px 14px", border: "1.5px solid #5b5be7", borderRadius: "12px", fontSize: "0.9rem", color: "#334155", outline: "none", fontFamily: "inherit", resize: "none", lineHeight: "1.6" }} />
                    </div>
                  )}
                </div>

                <button onClick={() => (nonCompeteYrs && ndaYrs) && goNext()} disabled={!(nonCompeteYrs && ndaYrs)} style={S.btn(!!(nonCompeteYrs && ndaYrs))}>저장하고 다음으로 →</button>
              </div>
            )}
          </>
        )}

        {/* ═══════════════════════════════
            PAGE 7 — 위약벌
        ═══════════════════════════════ */}
        {pageIndex === 6 && (
          <>
            {step === "education" && (
              <div style={{ ...S.card, overflow: "hidden" }}>
                <div style={{ background: "linear-gradient(135deg, #dc2626 0%, #f59e0b 100%)", padding: "28px 28px 24px" }}>
                  <div style={S.tag}>이 조항이 왜 있는 걸까요?</div>
                  <h2 style={{ fontSize: "1.25rem", fontWeight: "800", color: "#fff", lineHeight: "1.45", wordBreak: "keep-all" }}>계약이 '진짜' 계약이 되는<br />마지막 장치</h2>
                </div>
                <div style={{ padding: "24px 28px 28px", display: "flex", flexDirection: "column", gap: "18px" }}>
                  {[
                    { icon: "📄", t: "위약벌이 없으면 위반해도 제재할 방법이 없어요", d: "앞선 조항들이 아무리 잘 정해져 있어도, 위반 시 금전적 제재가 없으면 억제력이 없어요." },
                    { icon: "💰", t: "금액이 비어있으면 계약서는 있으나 마나예요", d: "변호사 인사이트: 위약벌 금액이 미정이면 실제로는 억제력이 거의 없어요. 반드시 숫자를 정해야 해요." },
                    { icon: "📊", t: "통상 1,000만~1억 원 수준이에요", d: "지분 가치 대비 20~50%를 기준으로 산정하는 경우도 있고, 사안의 경중에 따라 10억 원 이상으로 설정되기도 해요." },
                  ].map(({ icon, t, d }) => (
                    <div key={t} style={{ display: "flex", gap: "12px" }}>
                      <div style={{ width: "30px", height: "30px", borderRadius: "50%", background: "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "0.85rem" }}>{icon}</div>
                      <div><div style={{ fontWeight: "700", color: "#1f2430", fontSize: "0.9rem", marginBottom: "3px" }}>{t}</div><div style={{ fontSize: "0.85rem", color: "#64748b", lineHeight: "1.55" }}>{d}</div></div>
                    </div>
                  ))}
                  <div style={{ ...S.clauseBox, borderColor: "#dc2626" }}>
                    <div style={{ fontSize: "0.72rem", fontWeight: "700", color: "#dc2626", marginBottom: "5px" }}>별지 — 위약벌</div>
                    <div style={{ fontSize: "0.875rem", color: "#334155", lineHeight: "1.65" }}>구성원이 본 별지 조항상의 의무를 위반하여 다른 구성원에게 손해가 발생한 경우, 위반 구성원은 위약벌로 금 <strong>_________원</strong>을 지급한다.</div>
                  </div>
                  <button onClick={() => setStep("input")} style={{ ...S.btn(true), background: "#dc2626" }}>우리 팀 기준 정하기 →</button>
                </div>
              </div>
            )}

            {step === "input" && (
              <div style={{ ...S.card, padding: "28px", display: "flex", flexDirection: "column", gap: "24px" }}>
                <button onClick={goBack} style={S.backBtn}>← 이전으로</button>
                <div>
                  <div style={S.secLabel()}>각자 먼저 답해주세요 — 서로 안 보여요</div>
                  <h2 style={{ fontSize: "1.15rem", fontWeight: "800", color: "#1f2430" }}>위약벌 금액을 정해주세요</h2>
                </div>

                {/* 위약벌 금액 */}
                <div>
                  <div style={S.fLabel}>위약벌 금액</div>
                  <div style={S.fSub}>계약 조항 위반 시 지급해야 하는 금액이에요. 통상 1,000만~1억 원 수준이에요.</div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <input type="text" inputMode="numeric" placeholder="" value={penaltyAmt} onChange={e => setPenaltyAmt(e.target.value.replace(/[^0-9]/g, ""))} style={{ ...S.input(!!penaltyAmt), maxWidth: "160px" }} />
                    <span style={{ fontSize: "0.9rem", fontWeight: "600", color: "#475569", whiteSpace: "nowrap" }}>만 원</span>
                  </div>
                  {penaltyAmt && (
                    <div style={{ marginTop: "8px", padding: "10px 12px", background: "#f0f0fe", borderRadius: "9px", fontSize: "0.82rem", color: "#5b5be7", fontWeight: "600" }}>
                      → {Number(penaltyAmt).toLocaleString()}만 원 ({(Number(penaltyAmt) / 10000).toFixed(1)}억 원)
                    </div>
                  )}
                </div>

                {/* 콜옵션 추가 제재 */}
                <div style={{ border: "1.5px solid", borderColor: callOptOn ? "#5b5be7" : "#e2e8f0", borderRadius: "14px", overflow: "hidden", transition: "border-color 0.15s" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", cursor: "pointer" }} onClick={() => setCallOptOn(v => !v)}>
                    <div>
                      <div style={{ fontSize: "0.95rem", fontWeight: "700", color: "#1f2430" }}>콜옵션 제재 추가 (선택)</div>
                      <div style={{ fontSize: "0.78rem", color: "#94a3b8", marginTop: "2px" }}>위반 시 시가 할인 가격으로 지분 강제 매각</div>
                    </div>
                    <Toggle on={callOptOn} onToggle={() => setCallOptOn(v => !v)} />
                  </div>
                  {callOptOn && (
                    <div style={{ padding: "0 16px 16px", borderTop: "1px solid #f1f5f9", paddingTop: "14px", display: "flex", flexDirection: "column", gap: "8px" }}>
                      <div style={{ fontSize: "0.83rem", color: "#64748b", lineHeight: "1.55" }}>위반 주주 지분을 시가 대비 할인된 가격으로 강제 매수해요. 실무상 시가의 70~80% 수준이에요.</div>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span style={{ fontSize: "0.85rem", fontWeight: "600", color: "#475569", whiteSpace: "nowrap" }}>시가의</span>
                        <input type="text" inputMode="numeric" placeholder="70" value={callOptPct} onChange={e => setCallOptPct(e.target.value.replace(/[^0-9]/g, ""))} style={{ ...S.input(!!callOptPct), maxWidth: "80px" }} />
                        <span style={{ fontSize: "0.85rem", fontWeight: "600", color: "#475569", whiteSpace: "nowrap" }}>% 로 강제 매각</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* 선택 항목 */}
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {!showP7Note ? (
                    <button style={S.addOpt} onClick={() => setShowP7Note(true)}>
                      <span style={{ fontSize: "0.9rem", lineHeight: 1, color: "#a5b4fc" }}>＋</span> 추가로 하고 싶은 말 남기기
                    </button>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                      <div style={S.optHeader}>
                        <div style={S.fLabel}>추가로 하고 싶은 말</div>
                        <button style={S.collapseBtn} onClick={() => { setShowP7Note(false); setP7Note(""); }}>✕ 접기</button>
                      </div>
                      <textarea placeholder="위약벌 외에 팀에 전하고 싶은 것..." value={p7Note} onChange={e => setP7Note(e.target.value)} rows={3} autoFocus
                        style={{ width: "100%", padding: "12px 14px", border: "1.5px solid #5b5be7", borderRadius: "12px", fontSize: "0.9rem", color: "#334155", outline: "none", fontFamily: "inherit", resize: "none", lineHeight: "1.6" }} />
                    </div>
                  )}
                </div>

                <button onClick={() => penaltyAmt && goNext()} disabled={!penaltyAmt} style={S.btn(!!penaltyAmt)}>저장하고 완료 →</button>
              </div>
            )}
          </>
        )}

      </div>
    </main>
  );
}
