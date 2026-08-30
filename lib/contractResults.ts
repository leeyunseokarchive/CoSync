// 답변이 만드는 결과를 문장 + 도형으로 내놓는다. 순수 함수만 둔다.
// 원칙: 상태만 서술한다. "위험/불리/주의" 같은 판단은 쓰지 않는다 — 변호사법 제109조.
// 설계: docs/superpowers/specs 참고. 제안 단계라 기존 위저드에는 아직 연결하지 않는다.

import { MOCK_MEMBERS } from "./contractQuestions.ts";

// 도형은 4종뿐이다. 규칙마다 그림을 그리면 규칙을 늘릴 때마다 SVG가 늘어난다.
export type TimeBar = { label: string; from: number; to: number; soft?: boolean };

export type Figure =
  | { shape: "timeline"; unit: "년" | "일"; bars: TimeBar[]; gap?: { from: number; to: number; label: string } }
  | { shape: "threshold"; blocks: { label: string; value: number }[]; line: number; lineLabel: string }
  | { shape: "magnitude"; bars: { label: string; value: number; text: string; outline?: boolean }[] }
  | { shape: "balance"; left: { label: string; value: number }; right: { label: string; value: number } };

export type ResultBlock = {
  id: string;
  plain: string;     // 쉬운 말 한 줄
  formal: string;    // 조문 근거를 포함한 정식 문장 — 접어 둔다
  figure: Figure;
  from?: string[];   // 함께 쓰인 다른 문항 id — 어느 조항의 영향인지 화면에 붙인다
};

// ── 값 꺼내기 ────────────────────────────────────────────────
const num = (v: unknown): number | null => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
};
const str = (v: unknown): string | null => (typeof v === "string" && v.length > 0 ? v : null);
const part = (v: unknown, k: string): unknown =>
  v && typeof v === "object" ? (v as Record<string, unknown>)[k] : undefined;

// 지분은 합계 100이 아니어도 그린다. 미완성 상태에서도 결과는 보여야 한다.
const alloc = (v: unknown): { id: string; name: string; value: number }[] | null => {
  if (!v || typeof v !== "object") return null;
  const rec = v as Record<string, unknown>;
  const rows = MOCK_MEMBERS.map((m) => ({ id: m.id, name: m.name, value: Number(rec[m.id]) || 0 }));
  return rows.some((r) => r.value > 0) ? rows : null;
};

const nameOf = (id: string | null) => MOCK_MEMBERS.find((m) => m.id === id)?.name ?? null;

// 이름 뒤 조사. "김민준이(가)" 처럼 두 개를 다 적으면 쉬운 말이 아니게 된다.
const hasBatchim = (w: string) => {
  const c = w.charCodeAt(w.length - 1);
  return c >= 0xac00 && c <= 0xd7a3 && (c - 0xac00) % 28 !== 0;
};
const ga = (w: string) => w + (hasBatchim(w) ? "이" : "가");

const UNITS = [
  { v: 1_0000_0000_0000, label: "조" },
  { v: 1_0000_0000, label: "억" },
  { v: 1_0000, label: "만" },
];

// 금액을 한글 단위로 읽는다. lib 안에서 끝내려고 components 쪽 함수를 가져오지 않았다.
export function won(n: number): string {
  let rest = Math.floor(n);
  if (rest <= 0) return "0원";
  const parts: string[] = [];
  for (const u of UNITS) {
    const q = Math.floor(rest / u.v);
    if (q > 0) {
      parts.push(`${q.toLocaleString("ko-KR")}${u.label}`);
      rest -= q * u.v;
    }
  }
  if (rest > 0) parts.push(rest.toLocaleString("ko-KR"));
  return `${parts.join(" ")} 원`;
}

// 결과를 낼 수 있는 문항. 신원·주식종류·역할은 크고 작음이 없어 결과가 없다.
// 이 목록에 없는 문항에서는 결과 영역 자체를 그리지 않는다 — 빈 상태를 띄우면
// "값을 넣으면 나온다"는 잘못된 안내가 된다.
export const RESULT_QUESTION_IDS = new Set([
  "decisionAmount", "deadlock", "equity", "noncompete",
  "tenure", "vesting", "buybackPrice", "lockup", "dragAlong",
]);

// ── 규칙 ─────────────────────────────────────────────────────
// 단독 결과 10개 + 조합 결과 6개. 조합은 내가 답한 다른 문항이 있을 때만 붙는다.
export function resultsFor(qid: string, answers: Record<string, unknown>): ResultBlock[] {
  const out: ResultBlock[] = [];
  const A = answers;

  const decisionAmount = num(A.decisionAmount);
  const deadlockDays = num(part(A.deadlock, "days"));
  const decider = nameOf(str(part(A.deadlock, "decider")));
  const equity = alloc(A.equity);
  const noncompete = num(A.noncompete);
  const tenure = num(A.tenure);
  const vestingOn = str(part(A.vesting, "apply")) === "yes";
  const vestingYears = vestingOn ? num(part(A.vesting, "vestingYears")) : null;
  const cliffYears = vestingOn ? num(part(A.vesting, "cliffYears")) : null;
  const buyback = str(A.buybackPrice);
  const lockup = num(A.lockup);
  const dragAlong = num(A.dragAlong);

  // ── 제2조 ①7호 · 전원 합의 금액 ──
  if (qid === "decisionAmount" && decisionAmount) {
    out.push({
      id: "decisionAmount",
      plain: `${won(decisionAmount)}이 넘는 투자는 주주 전원이 동의해야 해요. 그보다 작으면 따로 동의를 받지 않고 집행할 수 있어요.`,
      formal: `제2조 ①항 7호의 기준 금액이 ${won(decisionAmount)}으로 정해집니다. 이 금액 이하의 투자·처분은 주주 전원의 사전 서면 합의 없이 집행할 수 있습니다.`,
      figure: {
        shape: "magnitude",
        bars: [
          { label: "전원 동의 없이 집행", value: 1, text: `${won(decisionAmount)}까지` },
          { label: "전원 동의 필요", value: 1, text: `${won(decisionAmount)} 초과`, outline: true },
        ],
      },
    });
  }

  // ── 제2조 ③ · 데드락 ──
  if (qid === "deadlock" && deadlockDays && decider) {
    out.push({
      id: "deadlock",
      plain: `${deadlockDays}일 동안 이야기해 보고, 그래도 안 정해지면 ${ga(decider)} 정해요.`,
      formal: `제2조 ③항에 따라 합의가 이루어지지 않으면 ${deadlockDays}일간 성실히 협의하고, 그 기간이 지나도 합의에 이르지 못한 사항은 ${decider}의 의사에 따라 결정됩니다.`,
      figure: {
        shape: "timeline",
        unit: "일",
        bars: [{ label: "협의 기간", from: 0, to: deadlockDays }],
        gap: { from: deadlockDays, to: deadlockDays + Math.max(2, Math.round(deadlockDays * 0.4)), label: `${decider} 결정` },
      },
    });
  }
  if (qid === "deadlock" && decider && equity) {
    const mine = equity.find((e) => e.name === decider)?.value ?? 0;
    const others = equity.reduce((s, e) => s + e.value, 0) - mine;
    out.push({
      id: "deadlock-equity",
      from: ["equity"],
      plain: `지분은 ${mine} 대 ${others}인데, 마지막엔 ${ga(decider)} 정해요.`,
      formal: `제2조 ③항의 최종 결정권은 지분율이 아니라 지정된 사람에게 있습니다. ${decider}(${mine}%)과 나머지 주주 합계(${others}%)의 비율과 관계없이 협의 기간 경과 후 결정 권한이 ${decider}에게 귀속됩니다.`,
      figure: {
        shape: "balance",
        left: { label: `${decider} (결정권)`, value: mine },
        right: { label: "나머지 주주", value: others },
      },
    });
  }

  // ── 전문·제3의 3조 · 지분 배분 ──
  if (qid === "equity" && equity) {
    const top = [...equity].sort((a, b) => b.value - a.value)[0];
    // 문턱은 두 개다 — 50% 넘으면 보통결의(이사 선임·배당), 66.7% 넘으면 특별결의(정관 변경·합병).
    // "절반을 넘는 사람이 없다"만 말하면 그래서 뭐가 달라지는지가 빠진다. 무엇을 못 하는지까지 적는다.
    out.push({
      id: "equity",
      plain:
        top.value > 66.7
          ? `${ga(top.name)} ${top.value}%예요. 이사 뽑기·배당은 물론이고 정관 변경·회사 매각까지 혼자 결정할 수 있어요. 나머지 두 사람이 반대해도 막을 수 없어요.`
          : top.value > 50
          ? `${ga(top.name)} ${top.value}%예요. 이사 뽑기·배당 같은 보통 안건은 나머지가 반대해도 혼자 통과시킬 수 있어요. 다만 정관 변경·회사 매각은 66.7%가 필요해서 혼자서는 못 해요.`
          : `가장 많이 가진 ${ga(top.name)} ${top.value}%라, 혼자 통과시킬 수 있는 안건이 하나도 없어요. 이사 뽑기·배당도 50%를 넘겨야 하니, 최소 두 사람이 찬성해야 결정이 돼요.`,
      formal: `상법 제368조의 보통결의는 출석 주주 의결권의 과반수와 발행주식총수의 4분의 1 이상을, 제434조의 특별결의는 출석 의결권의 3분의 2 이상과 발행주식총수의 3분의 1 이상을 요구합니다. 현재 배분에서 최대 지분은 ${top.name} ${top.value}%입니다.`,
      figure: {
        shape: "threshold",
        blocks: equity.map((e) => ({ label: e.name, value: e.value })),
        line: 50,
        lineLabel: "과반 50%",
      },
    });
  }

  // ── 제4조 ② · 경업금지 ──
  if (qid === "noncompete" && noncompete) {
    out.push({
      id: "noncompete",
      plain: `회사를 나가고 ${noncompete}년 동안은 같은 일을 할 수 없어요.`,
      formal: `제4조 ②항의 경업금지 기간이 퇴사일로부터 ${noncompete}년으로 정해집니다. 법원은 경업금지 약정의 유효성을 보호할 이익, 재직 기간과 지위, 제한 기간과 지역, 대가 지급 여부를 종합해 판단합니다.`,
      figure: {
        shape: "timeline",
        unit: "년",
        bars: [{ label: "퇴사 후 경업금지", from: 0, to: noncompete }],
      },
    });
  }
  if (qid === "noncompete" && noncompete && buyback === "par") {
    out.push({
      id: "noncompete-buyback",
      from: ["buybackPrice"],
      plain: `내 주식은 액면가로 정리되고, 그러고도 ${noncompete}년 동안 같은 일을 못 해요.`,
      formal: `제5조 ②항에 따라 사유를 불문하고 액면가로 매수되며, 제4조 ②항에 따라 그 후 ${noncompete}년간 경업이 금지됩니다. 두 조항이 함께 적용되면 회사 가치 상승분을 받지 못한 상태로 경업 제한 기간이 시작됩니다.`,
      figure: {
        shape: "timeline",
        unit: "년",
        bars: [
          { label: "액면가 매수 (퇴사 시점)", from: 0, to: 0.15 },
          { label: "경업금지", from: 0.15, to: noncompete + 0.15, soft: true },
        ],
      },
    });
  }

  // ── 제5조 ① · 계속근무 의무 ──
  if (qid === "tenure" && tenure) {
    out.push({
      id: "tenure",
      plain: `${tenure}년 안에 나가면, 내 주식을 다른 주주가 액면가로 사갈 수 있어요.`,
      formal: `제5조 ①항의 계속근무 의무가 ${tenure}년으로 정해집니다. 제5조 ②항은 3년 이내 퇴사 시 다른 주주의 액면가 매수권을 규정하고 있어, ①항을 3년과 다르게 정하면 두 항의 기준 연수가 달라집니다.`,
      figure: {
        shape: "timeline",
        unit: "년",
        bars: [{ label: "계속근무 의무", from: 0, to: tenure }],
        gap: { from: 0, to: Math.min(3, tenure), label: "액면가 매수 대상 구간" },
      },
    });
  }
  if (qid === "tenure" && tenure && vestingYears && vestingYears > tenure) {
    out.push({
      id: "tenure-vesting",
      from: ["vesting"],
      plain: `${tenure}년을 채우고 나가도, 지분은 ${vestingYears - tenure}년을 더 있어야 다 내 것이 돼요.`,
      formal: `제5조 ①항의 계속근무 의무는 ${tenure}년, 베스팅 기간은 ${vestingYears}년입니다. 근무 의무가 종료된 시점에도 ${vestingYears - tenure}년분의 지분이 미확정 상태로 남습니다.`,
      figure: {
        shape: "timeline",
        unit: "년",
        bars: [
          { label: "계속근무 의무", from: 0, to: tenure },
          { label: "베스팅", from: 0, to: vestingYears, soft: true },
        ],
        gap: { from: tenure, to: vestingYears, label: "근무 의무 종료 후 미확정" },
      },
    });
  }
  if (qid === "tenure" && tenure && lockup && lockup > tenure) {
    out.push({
      id: "tenure-lockup",
      from: ["lockup"],
      plain: `${tenure}년 뒤엔 나갈 수 있는데, 주식은 ${lockup - tenure}년을 더 못 팔아요.`,
      formal: `제5조 ①항의 계속근무 의무는 ${tenure}년, 제6조의 처분 제한은 ${lockup}년입니다. 근무 의무가 끝난 뒤에도 ${lockup - tenure}년 동안은 제7의 2조 공동매도요구권 외에는 주식을 처분할 통로가 없습니다.`,
      figure: {
        shape: "timeline",
        unit: "년",
        bars: [
          { label: "계속근무 의무", from: 0, to: tenure },
          { label: "처분 제한", from: 0, to: lockup, soft: true },
        ],
        gap: { from: tenure, to: lockup, label: "퇴사 가능 · 처분 불가" },
      },
    });
  }

  // ── 제5조 강화 · 베스팅 ──
  if (qid === "vesting" && vestingYears) {
    out.push({
      id: "vesting",
      plain: cliffYears
        ? `지분이 ${vestingYears}년에 걸쳐 내 것이 돼요. ${cliffYears}년을 못 채우고 나가면 한 주도 못 가져가요.`
        : `지분이 ${vestingYears}년에 걸쳐 조금씩 내 것이 돼요.`,
      formal: `베스팅 기간 ${vestingYears}년${cliffYears ? `, 클리프 ${cliffYears}년` : ""}으로 제5조가 구성됩니다. 클리프 기간 중 이탈하면 확정된 지분이 없고, 클리프 경과 후에는 근무 기간에 비례해 확정분이 늘어납니다.`,
      figure: {
        shape: "timeline",
        unit: "년",
        bars: [{ label: "베스팅", from: 0, to: vestingYears }],
        ...(cliffYears ? { gap: { from: 0, to: cliffYears, label: "클리프 · 확정분 없음" } } : {}),
      },
    });
  }

  // ── 제5조 ②·제9조 ③ · 퇴사 시 매수 가격 ──
  if (qid === "buybackPrice" && buyback) {
    const split = buyback === "split";
    out.push({
      id: "buybackPrice",
      plain: split
        ? "나가는 이유에 따라 값이 달라져요. 어떤 게 내 잘못인지는 계약서에 적어둬야 해요."
        : "어떤 이유로 나가든 값은 똑같아요. 액면가로 정리돼요.",
      formal: split
        ? "제5조 ②항과 제9조 ③항이 일반 퇴사와 귀책 퇴사에 서로 다른 매수 가격을 적용하는 구조가 됩니다. 귀책 사유의 범위를 조문에 구체적으로 열거하지 않으면 해당 여부 자체가 다툼의 대상이 됩니다."
        : "제5조 ②항의 현재 문안대로 사유를 불문하고 액면가가 적용됩니다. 산정이 명확해 가격 다툼이 없고, 오래 기여하고 떠나는 경우에도 회사 가치 상승분은 반영되지 않습니다.",
      figure: {
        shape: "magnitude",
        bars: split
          ? [
              { label: "일반 퇴사", value: 1, text: "가격 A", outline: true },
              { label: "귀책 퇴사", value: 1, text: "가격 B", outline: true },
            ]
          : [{ label: "모든 퇴사", value: 1, text: "액면가" }],
      },
    });
  }

  // ── 제6조 · 처분 제한 ──
  if (qid === "lockup" && lockup) {
    out.push({
      id: "lockup",
      plain: `${lockup}년 동안은 내 주식을 팔 수 없어요.`,
      formal: `제6조의 처분 제한 기간이 ${lockup}년으로 정해집니다. 제10조는 계약 변경을 주주 전원의 서면 합의로만 허용하므로, 이 기간을 나중에 줄이려면 전원이 동의해야 합니다.`,
      figure: {
        shape: "timeline",
        unit: "년",
        bars: [{ label: "처분 제한", from: 0, to: lockup }],
      },
    });
  }
  if (qid === "lockup" && lockup && dragAlong) {
    out.push({
      id: "lockup-drag",
      from: ["dragAlong"],
      plain: `${lockup}년 동안은 못 파는데, ${dragAlong}%가 팔자고 하면 그때는 팔아야 해요.`,
      formal: `제6조가 ${lockup}년간 처분을 제한하는 동안, 제7의 2조 공동매도요구권은 지분 ${dragAlong}% 이상의 찬성으로 발동됩니다. 처분 제한 기간 중 주식이 이전되는 유일한 통로입니다.`,
      figure: {
        shape: "timeline",
        unit: "년",
        bars: [
          { label: "처분 제한", from: 0, to: lockup },
          { label: `공동매도요구권 (${dragAlong}%)`, from: 0, to: lockup, soft: true },
        ],
      },
    });
  }

  // ── 제7의 2조 ① · 공동매도요구권 ──
  if (qid === "dragAlong" && dragAlong) {
    out.push({
      id: "dragAlong",
      plain:
        dragAlong >= 100
          ? "한 명이라도 반대하면 안 돼요. 제6조의 전원 동의와 사실상 같아요."
          : `지분 ${dragAlong}%가 팔자고 하면, 나머지도 같은 조건으로 따라 팔아야 해요.`,
      formal: `제7의 2조 ①항의 발동 지분율이 ${dragAlong}%로 정해집니다. 이 비율 이상의 찬성이 모이면 반대한 주주도 동일한 조건으로 주식을 매도해야 합니다.`,
      figure: {
        shape: "threshold",
        blocks: [],
        line: dragAlong,
        lineLabel: `발동 ${dragAlong}%`,
      },
    });
  }
  if (qid === "dragAlong" && dragAlong && equity) {
    const sorted = [...equity].sort((a, b) => b.value - a.value);
    const crew: string[] = [];
    let sum = 0;
    for (const e of sorted) {
      if (sum >= dragAlong) break;
      crew.push(e.name);
      sum += e.value;
    }
    const rest = equity.filter((e) => !crew.includes(e.name)).map((e) => e.name);
    out.push({
      id: "drag-equity",
      from: ["equity"],
      plain:
        sum >= dragAlong
          ? `${crew.length > 1 ? `${crew.join("·")} 몫을 합치면` : `${crew[0]} 혼자`} ${sum}%예요. ${rest.length ? `${ga(rest.join("·"))} 반대해도 팔아야 해요.` : "전원이 모여야 해요."}`
          : `지금 배분으로는 ${dragAlong}%를 넘길 조합이 없어요.`,
      formal: `현재 지분 배분에서 상위 ${crew.length}인의 합계는 ${sum}%이고, 제7의 2조 ①항의 발동 기준은 ${dragAlong}%입니다. ${sum >= dragAlong ? `이 조합만으로 요건이 충족되어 ${rest.join("·") || "나머지"}의 의사와 무관하게 매도 의무가 발생합니다.` : "어느 조합도 기준에 도달하지 않아 조항이 발동되지 않습니다."}`,
      figure: {
        shape: "threshold",
        blocks: sorted.map((e) => ({ label: e.name, value: e.value })),
        line: dragAlong,
        lineLabel: `발동 ${dragAlong}%`,
      },
    });
  }

  // ── 제7조 + 제7의 2조 · 드래그얼롱·태그얼롱 상관관계 (드래그얼롱 결과에 붙임) ──
  // 태그얼롱은 입력이 없는 안내 문항이라 답변값으로 조건을 걸 수 없다. 조합 결과가 아니라
  // 드래그얼롱 단독 결과의 부연이므로 from을 달지 않는다(달아두면 한쪽만 답해도 조합이 나온 것처럼 보인다).
  if (qid === "dragAlong" && dragAlong) {
    out.push({
      id: "dragAlong-tagAlong",
      plain: `드래그얼롱은 ${dragAlong}% 이상이 팔자고 하면 나머지도 따라 팔아야 하는 권리, 태그얼롱은 누군가 팔 때 소수 주주도 같은 조건으로 함께 팔 수 있는 권리예요. 두 조항이 세트로 있어 매각 과정에서 다수·소수 모두에게 출구 조건이 생깁니다.`,
      formal: `제7의 2조 공동매도요구권(드래그얼롱, 발동 기준 ${dragAlong}%)과 제7조 공동매도참여권(태그얼롱)은 매각 상황에서 서로 반대 방향으로 작동합니다. 드래그얼롱은 기준 비율 이상의 주주가 소수 주주에게 동반 매도를 요구하는 권리이고, 태그얼롱은 소수 주주가 대주주 매각에 동일 조건으로 참여할 수 있는 권리입니다. 두 조항이 함께 있으면 엑싯 과정에서 어느 쪽도 상대를 완전히 배제하기 어려워집니다.`,
      figure: {
        shape: "magnitude",
        bars: [
          { label: "드래그얼롱 (다수 → 소수)", value: 1, text: `${dragAlong}% 기준` },
          { label: "태그얼롱 (소수 → 대주주)", value: 1, text: "항시 보장" },
        ],
      },
    });
  }

  return out;
}
