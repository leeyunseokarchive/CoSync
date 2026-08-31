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
  | { shape: "balance"; left: { label: string; value: number }; right: { label: string; value: number } }
  // 시간에 따라 쌓이는 몫. 막대 하나로는 "조금씩 확정된다"가 그려지지 않아 계단으로 그린다.
  | { shape: "accrual"; unit: "년"; years: number; cliff: number | null; band?: { from: number; to: number; label: string } };

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
  "tenure", "vesting", "buybackPrice", "lockup", "dragAlong", "penalty",
  "ipTransfer", "tagAlong",
]);

// ── 규칙 ─────────────────────────────────────────────────────
// 단독 결과 10개 + 조합 결과 6개. 조합은 내가 답한 다른 문항이 있을 때만 붙는다.
export function resultsFor(qid: string, answers: Record<string, unknown>): ResultBlock[] {
  const out: ResultBlock[] = [];
  const A = answers;

  // 금액으로 선을 긋기로 한 경우에만 기준 금액이 의미를 가진다.
  const spendMode = str(part(A.decisionAmount, "mode"));
  const decisionAmount = spendMode === "amount" ? num(part(A.decisionAmount, "limit")) : null;
  const deadlockDays = num(A.deadlock);
  const equity = alloc(A.equity);
  const noncompete = num(A.noncompete);
  const tenure = num(A.tenure);
  const vestingOn = str(part(A.vesting, "apply")) === "yes";
  const vestingYears = vestingOn ? num(part(A.vesting, "vestingYears")) : null;
  const cliffYears = vestingOn ? num(part(A.vesting, "cliffYears")) : null;
  // 동의 문항이라 답은 boolean이다. 미응답(undefined)과 "더 이야기해 봐야겠어요"(false)를 구분한다.
  // 제5조 ②항의 회수 기간은 ①항의 근속 의무와 같은 값이다. 근속을 아직 안 정했으면
  // 베이스 계약서에 적힌 3년을 그대로 쓴다.
  const buybackYears = tenure ?? 3;
  const buyback = typeof A.buybackPrice === "boolean" ? (A.buybackPrice ? "agree" : "hold") : null;
  const lockup = num(A.lockup);
  const ipTransfer = typeof A.ipTransfer === "boolean" ? A.ipTransfer : null;
  const tagAlong = str(A.tagAlong);
  // 도입 여부와 비율을 한 문항에서 받는다. 넣지 않기로 했으면 비율은 의미가 없다.
  const dragOn = str(part(A.dragAlong, "apply")) === "yes";
  const dragAlong = dragOn ? num(part(A.dragAlong, "ratio")) : null;
  const penaltyBase = num(part(A.penalty, "base"));
  const penaltyRate = num(part(A.penalty, "rate"));

  // ── 제2조 ①7호 · 전원 합의 금액 ──
  if (qid === "decisionAmount" && spendMode === "lead") {
    out.push({
      id: "decisionAmount",
      plain: "회사가 돈을 쓰는 결정은 금액과 상관없이 대표가 해요. 나머지 주주는 사후에 알게 됩니다.",
      formal: "제2조 ①항 7호를 적용하지 않고, 회사의 지출 및 투자 집행을 대표이사인 주주의 단독 결정에 맡깁니다. 집행 속도가 빨라지는 대신 다른 주주에게는 사전 통제 수단이 남지 않습니다.",
      figure: {
        shape: "magnitude",
        bars: [{ label: "회사 지출·투자 집행", value: 1, text: "대표 단독" }],
      },
    });
  }
  if (qid === "decisionAmount" && decisionAmount) {
    out.push({
      id: "decisionAmount",
      plain: `${won(decisionAmount)}이 넘는 지출은 주주 전원이 동의해야 해요. 그보다 작으면 따로 동의를 받지 않고 집행할 수 있어요.`,
      formal: `제2조 ①항 7호의 기준 금액이 ${won(decisionAmount)}으로 정해집니다. 이 금액 이하의 지출·투자 집행은 주주 전원의 사전 서면 합의 없이 할 수 있습니다.`,
      figure: {
        shape: "magnitude",
        bars: [
          { label: "전원 동의 없이 집행", value: 1, text: `${won(decisionAmount)}까지` },
          { label: "전원 동의 필요", value: 1, text: `${won(decisionAmount)} 초과`, outline: true },
        ],
      },
    });
  }


  // ── 제3조 · 기술·지식재산 이전 ──
  // 제8조 ①③이 이름을 부르는 조항이라 위반의 대가가 있다. 그 사실이 화면에 없었다.
  if (qid === "ipTransfer" && ipTransfer !== null) {
    out.push({
      id: "ipTransfer",
      plain: ipTransfer
        ? "법인을 세우는 순간 내 이름으로 된 것이 회사 것이 돼요. 넘기지 않으면 위약벌을 물어요."
        : "넘길 것이 없다고 답했어요. 나중에 내 이름으로 된 것이 나오면 그때 넘겨야 하고, 안 넘기면 위약벌을 물어요.",
      formal: ipTransfer
        ? "제3조에 따라 설립 전 주주들에게 권리가 있던 비즈니스·기술·지식재산권은 회사 설립과 동시에 회사로 이전됩니다. 이전하지 않는 경우 제8조 ①·③항의 위약벌 및 손해배상예정액 대상이 됩니다."
        : "제3조는 이전 대상을 유형이 아니라 \"사업과 관련하여 권리가 있었던\" 것으로 정합니다. 해당 없음으로 답해도 실제로 해당하는 권리가 확인되면 이전 의무가 발생하며, 제8조 ①·③항이 그대로 적용됩니다.",
      figure: {
        shape: "magnitude",
        bars: ipTransfer
          ? [
              { label: "지금", value: 1, text: "내 이름", outline: true },
              { label: "법인 설립과 동시에", value: 1, text: "회사 것" },
            ]
          : [{ label: "이전할 권리", value: 1, text: "없다고 답함", outline: true }],
      },
    });
  }

  // ── 제7조 ① · 공동매도참여권(태그얼롱) ──
  if (qid === "tagAlong" && tagAlong) {
    const on = tagAlong === "yes";
    out.push({
      id: "tagAlong",
      plain: on
        ? "다른 주주가 자기 지분을 팔 때, 나도 같은 값에 함께 팔 수 있어요. 이걸 무시하고 판 거래는 위약벌 대상이고, 다른 주주들에게 통하지 않아요."
        : "다른 주주는 자기 지분만 팔고 나갈 수 있고, 나는 새 주주와 함께 남아요.",
      formal: on
        ? "제7조 ①항의 공동매도참여권이 유지됩니다. 매도주주는 30일 전 서면 통지 의무를 지고, 이를 위반해 처분한 경우 제8조 ⑤항에 따라 위약벌을 지급하며 그 처분행위로써 다른 주주들에게 대항할 수 없습니다."
        : "제7조 ①항에서 공동매도참여권을 제외합니다. 우선매수권은 남지만, 다른 주주의 매각에 동일 조건으로 참여할 통로가 없어집니다.",
      figure: {
        shape: "magnitude",
        bars: on
          ? [
              { label: "다른 주주가 팔 때", value: 1, text: "판다" },
              { label: "나는", value: 1, text: "같은 값에 함께" },
            ]
          : [
              { label: "다른 주주가 팔 때", value: 1, text: "판다" },
              { label: "나는", value: 1, text: "새 주주와 남는다", outline: true },
            ],
      },
    });
  }

  // ── 제2조 ③ · 데드락 ──
  if (qid === "deadlock" && deadlockDays) {
    out.push({
      id: "deadlock",
      plain: `${deadlockDays}일 동안 이야기해 보고, 그래도 안 정해지면 대표가 정해요. 이 절차가 없으면 한 명만 반대해도 안건이 멈추고, 투자 유치도 같이 막힙니다.`,
      formal: `제2조 ③항에 따라 합의가 이루어지지 않으면 ${deadlockDays}일간 성실히 협의하고, 그 기간이 지나도 합의에 이르지 못한 사항은 대표이사인 주주의 의사에 따라 결정됩니다.`,
      figure: {
        shape: "timeline",
        unit: "일",
        bars: [{ label: "협의 기간", from: 0, to: deadlockDays }],
        gap: { from: deadlockDays, to: deadlockDays + Math.max(2, Math.round(deadlockDays * 0.4)), label: "대표 결정" },
      },
    });
  }
  // deadlock-equity 조합 결과는 뺐다. 최종 결정권자를 대표로 고정하면서
  // "지분율과 무관하게 지정된 사람이 정한다"는 전제 자체가 사라졌다.

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
      plain: `회사를 나가고 ${noncompete}년 동안은 같은 일을 할 수 없어요. 어기면 위약벌을 물어요.`,
      formal: `제4조 ②항의 경업금지 기간이 퇴사일로부터 ${noncompete}년으로 정해지고, 위반 시 제8조 ②·③항의 위약벌 대상이 됩니다. 법원은 경업금지 약정의 유효성을 보호할 이익, 재직 기간과 지위, 제한 기간과 지역, 대가 지급 여부를 종합해 판단합니다.`,
      figure: {
        shape: "timeline",
        unit: "년",
        bars: [{ label: "퇴사 후 경업금지", from: 0, to: noncompete }],
        gap: { from: 0, to: noncompete, label: "어기면 위약벌" },
      },
    });
  }
  if (qid === "noncompete" && noncompete && buyback) {
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
  // ①항을 어긴 직접 효과는 제8조의 위약벌이다. ②항의 액면가 회수는 "제1항에도 불구하고"라
  // 위반 여부와 무관하게 발생하므로(동의를 받고 나가도 회수된다) 여기에 결과로 붙이면
  // 인과가 뒤바뀐다. 액면가는 아래 조합 줄에서 "같은 기간을 쓴다"는 사실로만 잇는다.
  if (qid === "tenure" && tenure) {
    out.push({
      id: "tenure",
      // 금액은 넣지 않는다. 위약벌 금액은 제8조 문항의 답이라 여기서 쓰면 칩 없이 다른 문항
      // 답을 끌어오는 셈이고, 그 계산은 위약벌 문항이 이미 화면에서 하고 있다.
      plain: `${tenure}년 안에 동의 없이 나가면 위약벌을 물어요. 본인 잘못이 아닌 퇴사는 빠집니다.`,
      formal: `제5조 ①항의 계속근무 의무가 ${tenure}년으로 정해집니다. 이 기간에 다른 주주 전원의 사전 서면 동의 없이 퇴사하면 제8조가 정한 위약벌 대상이 되며, 본인에게 책임 없는 사유로 인한 비자발적 퇴사는 ①항 단서에 따라 적용이 배제됩니다.`,
      figure: {
        shape: "timeline",
        unit: "년",
        bars: [{ label: "계속근무 의무", from: 0, to: tenure }],
        gap: { from: 0, to: tenure, label: "동의 없이 나가면 위약벌" },
      },
    });
  }
  // ②항의 회수 기간은 ①항과 같은 값으로 채워진다. 여기서 정한 숫자가 지분 회수 기간도
  // 정한다는 사실은 알려야 하되, 근속 위반의 결과가 아니라 별도 규칙임을 분명히 한다.
  if (qid === "tenure" && tenure && buyback) {
    out.push({
      id: "tenure-buyback",
      from: ["buybackPrice"],
      plain: `이 ${tenure}년 안에 나가면 확정된 몫까지 포함해 지분 전부가 액면가 회수 대상이에요. 동의를 받고 나가도 마찬가지예요.`,
      formal: `제5조 ②항은 "제1항에도 불구하고" ${tenure}년 이내 퇴사에 액면가 매수권을 부여합니다. 전원의 사전 서면 동의를 받아 적법하게 퇴사하는 경우에도 매수권은 발생하며, ③항에 따라 위약벌 등 손해배상의무와는 별도로 작동합니다.`,
      figure: {
        shape: "timeline",
        unit: "년",
        bars: [{ label: "액면가 매수 대상", from: 0, to: tenure }],
      },
    });
  }
  if (qid === "tenure" && tenure && vestingYears && vestingYears > tenure) {
    out.push({
      id: "tenure-vesting",
      from: ["vesting"],
      // 근속 기간 밖에서 나가면 ②항의 매수권은 없지만 ⑤항이 미확정분을 덮는다.
      // 두 조항이 다른 것을 가져간다는 걸 이 자리에서 구분해 준다.
      plain: `${tenure}년을 채우고 나가도, 지분은 ${vestingYears - tenure}년을 더 있어야 다 내 것이 돼요. 그때부터는 확정 안 된 몫만 액면가 회수 대상이에요.`,
      formal: `제5조 ①항의 계속근무 의무는 ${tenure}년, 베스팅 기간은 ${vestingYears}년입니다. 근무 의무가 종료된 시점에도 ${vestingYears - tenure}년분의 지분이 미확정 상태로 남습니다. ②항의 액면가 매수권은 ${tenure}년 이내 퇴사에만 발생하지만, ⑤항의 매수권은 기간 제한 없이 미확정분에 적용되므로 이 시점 이후의 퇴사에서도 미확정분은 회수 대상입니다.`,
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
        shape: "accrual",
        unit: "년",
        years: vestingYears,
        cliff: cliffYears,
        ...(cliffYears ? { band: { from: 0, to: cliffYears, label: "클리프 · 확정분 없음" } } : {}),
      },
    });
  }

  // ── 제5조 ②·제9조 ③ · 퇴사 시 매수 가격 ──
  if (qid === "buybackPrice" && buyback) {
    // 동의 여부와 상관없이 조문은 액면가 하나다. 달라지는 건 그 조문이 확정됐는지다.
    const hold = buyback === "hold";
    // "액면가" 막대 하나는 조문이 이미 한 말을 옮긴 것뿐이라 볼 것이 없다.
    // 베스팅을 답했으면 그 기간 위에 매수 구간을 겹쳐 그린다 — 지분이 확정되어 가는
    // 구간이 곧 액면가 회수 구간이라는 게 눈으로 잡힌다.
    out.push({
      id: "buybackPrice",
      plain: hold
        ? "이 합의안은 어떤 이유로 나가든 액면가예요. 아직 동의하지 않았으니 팀원과 먼저 이야기해 보세요."
        : "어떤 이유로 나가든 값은 똑같아요. 액면가로 정리돼요. 오래 일하고 나가도 그동안 오른 회사 가치는 못 받아요.",
      formal: hold
        ? "제5조 ②항의 현재 문안대로 사유를 불문하고 액면가가 적용됩니다. 이 조항에 동의하지 않은 주주가 있어, 확정 전에 팀 내 조율이 필요합니다."
        : "제5조 ②항의 현재 문안대로 사유를 불문하고 액면가가 적용됩니다. 산정이 명확해 가격 다툼이 없고, 오래 기여하고 떠나는 경우에도 회사 가치 상승분은 반영되지 않습니다.",
      figure: vestingYears
        ? {
            shape: "accrual",
            unit: "년",
            years: vestingYears,
            cliff: cliffYears,
            band: { from: 0, to: Math.min(buybackYears, vestingYears), label: "액면가 매수 대상 구간" },
          }
        : {
            shape: "magnitude",
            bars: [{ label: "모든 퇴사", value: 1, text: "액면가", outline: hold }],
          },
    });
  }

  // 베스팅을 "내 지분이 지켜지는 장치"로 읽은 사람이 뒤집히는 지점이다.
  // 확정분이 쌓여도 회수 기간 안에 나가면 그 확정분까지 액면가 매수 대상이 된다.
  if (qid === "buybackPrice" && buyback && vestingYears) {
    out.push({
      id: "vesting-buyback",
      from: ["vesting"],
      // 베스팅 기간과 회수 기간은 서로 다른 데서 온다. 한 문장에 두 숫자를 그냥 나열하면
      // 뒤의 숫자가 어디서 왔는지 알 수 없어 각각 이름을 붙인다.
      // 회수 기간이 끝나는 시점에 얼마가 쌓여 있는지까지 적어야 "그 뒤에 나가면?"이 답해진다.
      plain:
        vestingYears <= buybackYears
          ? `지분은 ${vestingYears}년에 걸쳐 확정되는데, 그 기간이 통째로 액면가로 되사갈 수 있는 ${buybackYears}년 안에 들어와요. 언제 나가든 그때까지 확정된 몫까지 되사갈 수 있어요.`
          : `지분은 ${vestingYears}년에 걸쳐 확정되는데, 액면가로 되사갈 수 있는 기간은 ${buybackYears}년이에요. ${buybackYears}년째에 나가면 그때까지 쌓인 ${Math.round((buybackYears / vestingYears) * 100)}%까지 되사갈 수 있고, 그 뒤에 나가면 그 권리는 없어져요.`,
      formal: `베스팅으로 확정된 지분도 제5조 ②항의 매수 대상에서 제외되지 않습니다. 제5조 ④항의 베스팅 기간은 ${vestingYears}년이고 ②항의 액면가 매수권은 ${buybackYears}년 이내 퇴사에만 발생하므로, 앞 ${buybackYears}년은 확정분이 쌓이는 기간과 매수권이 살아 있는 기간이 겹칩니다. ${buybackYears}년이 지난 뒤 퇴사하면 ②항의 매수권은 발생하지 않고, ④항에 따라 미확정 상태로 남은 지분만 확정되지 않습니다.`,
      figure: {
        shape: "accrual",
        unit: "년",
        years: vestingYears,
        cliff: cliffYears,
        band: { from: 0, to: Math.min(buybackYears, vestingYears), label: "액면가 매수 대상 구간" },
      },
    });
  }

  // ── 제6조 · 처분 제한 ──
  if (qid === "lockup" && lockup) {
    out.push({
      id: "lockup",
      plain: `${lockup}년 동안은 내 주식을 팔 수 없어요. 몰래 팔면 위약벌을 물고, 그 거래는 다른 주주들에게 통하지 않아요.`,
      formal: `제6조의 처분 제한 기간이 ${lockup}년으로 정해집니다. 위반해 처분한 경우 제8조 ⑤항에 따라 처분 금액의 일정 비율 또는 정액 중 큰 금액을 위약벌로 지급하며, 그 처분행위로써 다른 주주들에게 대항할 수 없습니다. 제10조는 계약 변경을 주주 전원의 서면 합의로만 허용하므로, 이 기간을 나중에 줄이려면 전원이 동의해야 합니다.`,
      figure: {
        shape: "timeline",
        unit: "년",
        bars: [{ label: "처분 제한", from: 0, to: lockup }],
        gap: { from: 0, to: lockup, label: "몰래 팔면 위약벌 · 거래 무효 주장 가능" },
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
          : `지분 ${dragAlong}%가 팔자고 하면, 나머지도 같은 조건으로 따라 팔아야 해요. 안 따르면 위약벌을 물어요.`,
      formal: `제7의 2조 ①항의 발동 지분율이 ${dragAlong}%로 정해집니다. 이 비율 이상의 찬성이 모이면 반대한 주주도 동일한 조건으로 주식을 매도해야 하며, 이에 응하지 않으면 제8조 ⑥항의 위약벌 대상이 됩니다.`,
      // 빈 트랙에 선만 그으면 볼 것이 없다. 지분 배분을 몰라도 이 답만으로 두 쪽이 나온다 —
      // 기준을 채우는 쪽과, 반대해도 끌려가는 쪽. 선은 정확히 그 경계에 선다.
      figure: {
        shape: "threshold",
        blocks:
          dragAlong >= 100
            ? [{ label: "전원 찬성해야", value: 100 }]
            : [
                { label: "팔자는 쪽", value: dragAlong },
                { label: "반대해도 따라감", value: 100 - dragAlong },
              ],
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

  // ── 제8조 · 위약벌 ──
  // "각 {base}원"이라 다른 주주 수만큼 곱해진다. 1억을 적었는데 3인 팀이면 2억이 된다.
  // 조문을 그대로 읽은 산수이고, 사람들이 가장 자주 놓치는 지점이다.
  if (qid === "penalty" && penaltyBase) {
    const others = MOCK_MEMBERS.length - 1;
    const total = penaltyBase * others;
    out.push({
      id: "penalty",
      plain: `한 사람이 어기면 나머지 ${others}명에게 각각 ${won(penaltyBase)}씩, 합쳐서 ${won(total)}을 냅니다.`,
      formal: `제8조 ①항은 위반 당사자가 다른 당사자들에게 "각 ${penaltyBase.toLocaleString()}원"을 지급하도록 정합니다. 현재 ${MOCK_MEMBERS.length}인 구성에서 위반자를 제외한 ${others}명에게 각각 지급되므로 합계는 ${total.toLocaleString()}원입니다. 같은 금액이 제8조 ③항의 손해배상예정액으로도 쓰이며, 이 경우 다른 주주들은 실제 손해액을 증명하지 않고 청구할 수 있습니다(민법 제398조 ②항).`,
      figure: {
        shape: "magnitude",
        bars: [
          { label: "적어 넣은 금액 (1인당)", value: penaltyBase, text: won(penaltyBase) },
          { label: `실제 지급 합계 (${others}명분)`, value: total, text: won(total) },
        ],
      },
    });
  }

  // ⑤항은 비율과 정액 중 큰 금액을 지급하게 하는데, "각"이 정액에만 붙어 있다.
  // 1인당끼리 비교하는지 총액과 비교하는지 문구만으로는 정해지지 않고, 그에 따라
  // 갈림 지점이 인원수만큼 벌어진다. 한쪽을 골라 단정하지 않고 두 경우를 다 적는다.
  if (qid === "penalty" && penaltyBase && penaltyRate) {
    const others = MOCK_MEMBERS.length - 1;
    // 나눗셈이라 딱 떨어지지 않는다. 화면엔 만 원 단위로 끊어 "약"을 붙이고,
    // 정식 문장에는 원 단위 그대로 둔다.
    const perPersonExact = Math.round(penaltyBase / (penaltyRate / 100));
    const asTotalExact = Math.round((penaltyBase * others) / (penaltyRate / 100));
    const round만 = (n: number) => Math.floor(n / 10_000) * 10_000;
    const perPerson = round만(perPersonExact);
    const asTotal = round만(asTotalExact);
    const approx = (r: number, e: number) => (r === e ? won(e) : `약 ${won(r)}`);
    out.push({
      id: "penalty-threshold",
      plain: `⑤항은 "처분 금액의 ${penaltyRate}%"와 "각 ${won(penaltyBase)}" 중 큰 쪽을 냅니다. 정액에만 "각"이 붙어 있어, 1인당끼리 비교하면 ${approx(perPerson, perPersonExact)}, 합계와 비교하면 ${approx(asTotal, asTotalExact)}부터 비율이 커집니다.`,
      formal: `제8조 ⑤항은 처분 금액의 ${penaltyRate}%와 "각 ${penaltyBase.toLocaleString()}원" 중 큰 금액을 지급하도록 정합니다. 비율 부분에는 "각"이 없고 정액 부분에만 있어, 두 값을 1인당 기준으로 비교하는지 합계 기준으로 비교하는지가 문구로 확정되지 않습니다. 1인당 기준이면 처분 금액 ${perPersonExact.toLocaleString()}원, ${others}명 합계 기준이면 ${asTotalExact.toLocaleString()}원에서 비율이 정액을 넘어섭니다.`,
      figure: {
        shape: "threshold",
        blocks: [
          { label: "1인당 기준", value: perPersonExact },
          { label: `${others}명 합계 기준`, value: asTotalExact },
        ],
        line: perPersonExact,
        lineLabel: `${penaltyRate}%가 정액을 넘는 지점`,
      },
    });
  }

  return out;
}
