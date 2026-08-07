// 주주간계약서 합의 항목 질문 정의.
// 조문 원문은 reference/계약서 샘플/최종 계약서 샘플.md 인용 — 임의 수정 금지.
// 빈칸 목록 근거: reference/계약서 샘플/최종 계약서 필수 내용 정리.md D절
// 설계: docs/superpowers/specs/2026-08-07-contract-question-templates-design.md

export type QuestionTemplate =
  | { type: "amount"; presets: { label: string; value: number }[]; defaultValue?: number }
  | { type: "duration"; unit: "일" | "개월" | "년"; presets: number[]; baseValue?: number; defaultValue?: number }
  | { type: "percent"; marks: { value: number; label: string }[]; defaultValue?: number }
  | { type: "choice"; variant?: "person"; options: { id: string; label: string; desc: string }[] }
  | { type: "matrix"; variant: "text" | "allocation"; chips?: string[] }
  | { type: "fields"; fields: { key: string; label: string; placeholder: string; kind?: "text" | "date" | "number" }[] }
  | { type: "composite"; parts: { key: string; label: string; template: QuestionTemplate }[] };

export type ContractQuestion = {
  id: string;
  group: string;
  article: string;      // 화면 표시용 조문 번호
  articleTag: string;   // eyebrow 영문 태그
  proposed: boolean;    // true면 `제안` 배지 — 사용자 확정 전 후보 문항
  consensus: boolean;   // false면 합의 대상 아닌 사실정보
  title: string;
  desc: string;
  template: QuestionTemplate;
  preview: string[];    // 조문 원문. {0} {1} 이 치환 자리
  reference?: { advice?: string; lowRisk?: string; highRisk?: string };
};

export const QUESTION_GROUPS = [
  { id: "basics", ko: "계약 기본", en: "Contract Basics" },
  { id: "decision", ko: "의사결정", en: "Decision & Deadlock" },
  { id: "equity", ko: "역할·지분", en: "Roles & Equity" },
  { id: "tenure", ko: "근무·이탈", en: "Tenure & Exit" },
  { id: "transfer", ko: "처분·제재", en: "Transfer & Penalty" },
];

export const MOCK_MEMBERS = [
  { id: "m1", name: "김민준", role: "나 (본인)", self: true },
  { id: "m2", name: "이서연", role: "공동창업자", self: false },
  { id: "m3", name: "박도윤", role: "공동창업자", self: false },
];

// 지분 배분 합계 검증. 빈 값은 0으로 센다.
export function validateAllocation(values: Record<string, number>) {
  const total = Object.values(values).reduce((sum, v) => sum + (Number(v) || 0), 0);
  return { total, ok: total === 100, remaining: 100 - total };
}

// 베이스 5조②가 "3년 이내 퇴사" 기준이라, 5조① 근무 의무가 3년 미만이면 두 항이 어긋난다.
// 차단하지 않고 알리기만 한다.
export function tenureWarning(years: number): string | null {
  if (!years || years >= 3) return null;
  return "제5조 ②항은 3년 기준으로 작성되어 있습니다. 3년 미만으로 정하면 두 항의 기준이 달라집니다.";
}

// "{0}" 자리를 값으로 치환하고, 하이라이트할 조각을 filled로 표시한다.
// 값이 없으면 빈칸 기호를 남긴다.
export function fillPreview(template: string, values: (string | null)[]) {
  const parts: { text: string; filled: boolean }[] = [];
  let last = 0;
  const re = /\{(\d)\}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(template))) {
    if (m.index > last) parts.push({ text: template.slice(last, m.index), filled: false });
    const v = values[Number(m[1])];
    parts.push(v ? { text: v, filled: true } : { text: "[  ]", filled: false });
    last = m.index + m[0].length;
  }
  if (last < template.length) parts.push({ text: template.slice(last), filled: false });
  return parts;
}

export const CONTRACT_QUESTIONS: ContractQuestion[] = [
  {
    id: "basics",
    group: "basics",
    article: "전문 · 말미",
    articleTag: "PREAMBLE",
    proposed: true,
    consensus: false,
    title: "회사와 계약의 기본 정보를 알려주세요",
    desc: "계약서 첫 줄과 마지막 줄에 그대로 들어갑니다. 합의가 필요한 값이 아니라 사실 기재입니다.",
    template: {
      type: "fields",
      fields: [
        { key: "company", label: "회사명", placeholder: "코싱크", kind: "text" },
        { key: "date", label: "계약 체결일", placeholder: "", kind: "date" },
        { key: "copies", label: "계약서 부수", placeholder: "3", kind: "number" },
      ],
    },
    preview: [
      "주식회사 {0}(이하 \"회사\"라 한다)의 주주(회사가 성립되기 전에는 주주가 될 발기인이나 동업자를 포함한다)는 회사의 경영 및 주주의 지위 등에 관하여 다음과 같이 계약을 체결한다.",
      "본 주주간계약(이하 \"본 계약\")은 다음 당사자들 사이에 {1}(이하 \"체결일\")로 체결되었다.",
      "계약 당사자들은 이상과 같이 본 계약을 체결하고 이를 증명하기 위하여 본 계약서 {2}부를 작성하여 각각 서명 또는 기명 날인한 후 각 1부씩 보관한다.",
    ],
  },
  {
    id: "identity",
    group: "basics",
    article: "전문 · 서명란",
    articleTag: "PARTIES",
    proposed: true,
    consensus: false,
    title: "본인의 신원 정보를 입력해 주세요",
    desc: "서명란에 들어갑니다. 다른 팀원의 정보는 각자 입력합니다.",
    template: {
      type: "fields",
      fields: [
        { key: "name", label: "이름", placeholder: "김민준", kind: "text" },
        { key: "rrn", label: "주민등록번호", placeholder: "000000-0000000", kind: "text" },
        { key: "address", label: "주소", placeholder: "서울특별시 ...", kind: "text" },
      ],
    },
    preview: ["{0} ({1})      (인)", "주소 {2}"],
  },
  {
    id: "shareType",
    group: "basics",
    article: "전문 · 제3의 3조",
    articleTag: "SHARE TYPE",
    proposed: true,
    consensus: true,
    title: "어떤 종류의 주식을 발행하나요?",
    desc: "전문과 제3의 3조의 지분 표에 들어갑니다. 초기 공동창업 단계에서는 대부분 보통주식입니다.",
    template: {
      type: "choice",
      options: [
        { id: "common", label: "보통주식", desc: "의결권과 배당이 동일한 일반 주식. 초기 창업팀의 기본값입니다." },
        { id: "preferred", label: "종류주식", desc: "우선배당·의결권 제한 등 조건이 붙는 주식. 투자 유치 단계에서 주로 씁니다." },
      ],
    },
    preview: ["| 김민준 | {0} | [주식수] | [비율]% |"],
    reference: {
      advice: "설립 단계 공동창업자 간 계약에서는 보통주식이 일반적입니다. 종류주식은 투자자와의 계약에서 등장합니다.",
    },
  },
  {
    id: "decisionAmount",
    group: "decision",
    article: "제2조 ① 7호",
    articleTag: "SPEND THRESHOLD",
    proposed: false,
    consensus: true,
    title: "얼마를 넘는 투자부터 전원 합의가 필요한가요?",
    desc: "이 금액을 넘는 투자는 주주 전원이 합의해야 진행할 수 있습니다. 낮으면 실행이 느려지고, 높으면 통제가 약해집니다.",
    template: {
      type: "amount",
      presets: [
        { label: "5천만 원", value: 50000000 },
        { label: "1억 원", value: 100000000 },
        { label: "3억 원", value: 300000000 },
      ],
      defaultValue: 100000000,
    },
    preview: ["7. 회사가 {0}을 초과하여 투자하는 행위"],
    reference: {
      advice: "베이스 계약서는 1억 원으로 작성되어 있습니다.",
      lowRisk: "금액이 낮으면 일상적인 지출까지 전원 합의를 거쳐야 해 실행 속도가 떨어집니다.",
      highRisk: "금액이 높으면 큰 규모의 지출이 견제 없이 집행될 수 있습니다.",
    },
  },
  {
    id: "deadlock",
    group: "decision",
    article: "제2조 ③ (신설)",
    articleTag: "DEADLOCK",
    proposed: false,
    consensus: true,
    title: "합의가 안 되면 며칠 협의하고, 누가 결정하나요?",
    desc: "전원 합의 구조는 한 명만 반대해도 멈춥니다. 특히 투자 유치가 걸린 결정이 막히면 사업 자체가 정지합니다. 언젠가는 끝나는 구조가 필요합니다.",
    template: {
      type: "composite",
      parts: [
        {
          key: "days",
          label: "협의 기간",
          template: { type: "duration", unit: "일", presets: [7, 14, 30], defaultValue: 7 },
        },
        {
          key: "decider",
          label: "최종 결정권자",
          template: {
            type: "choice",
            variant: "person",
            options: [
              { id: "m1", label: "김민준", desc: "나 (본인)" },
              { id: "m2", label: "이서연", desc: "공동창업자" },
              { id: "m3", label: "박도윤", desc: "공동창업자" },
            ],
          },
        },
      ],
    },
    preview: [
      "③ 제1항 각 호의 사항에 관하여 주주 전원의 합의가 이루어지지 아니하는 경우, 주주들은 {0}간 성실히 협의한다. 위 협의 기간 내에도 합의에 이르지 못한 경우, 해당 사항은 {1}의 의사에 따라 결정하는 것으로 하고, 주주들은 그 결정에 따라 주주총회 또는 이사회에서 의결권을 행사하여야 한다.",
    ],
    reference: {
      advice: "변호사 예시는 협의 기간 일주일, 최종 결정권자는 대표자입니다.",
      lowRisk: "협의 기간이 너무 짧으면 충분한 논의 없이 한 사람의 결정으로 넘어갑니다.",
      highRisk: "협의 기간이 길면 그 기간 동안 투자 유치나 사업 결정이 멈춥니다.",
    },
  },
  {
    id: "roles",
    group: "equity",
    article: "제3의 2조",
    articleTag: "ROLES",
    proposed: false,
    consensus: true,
    title: "각자 무엇을 맡나요?",
    desc: "회사 설립 시까지 각자가 담당할 역할과 업무입니다. 본인 역할뿐 아니라 다른 팀원에게 기대하는 역할도 적어 주세요. 기대가 어긋나는 지점이 여기서 드러납니다.",
    template: {
      type: "matrix",
      variant: "text",
      chips: ["대표이사", "제품 총괄", "개발 총괄", "영업·마케팅", "재무·운영", "디자인"],
    },
    preview: ["| 김민준 | {0} |", "| 이서연 | {1} |", "| 박도윤 | {2} |"],
  },
  {
    id: "equity",
    group: "equity",
    article: "전문 · 제3의 3조",
    articleTag: "EQUITY SPLIT",
    proposed: false,
    consensus: true,
    title: "지분을 어떻게 나누나요?",
    desc: "회사 설립 시 발행하는 총 주식의 배분입니다. 합계가 정확히 100%가 되어야 합니다.",
    template: { type: "matrix", variant: "allocation" },
    preview: [
      "| 김민준 | 보통주식 | [주식수] | {0}% |",
      "| 이서연 | 보통주식 | [주식수] | {1}% |",
      "| 박도윤 | 보통주식 | [주식수] | {2}% |",
    ],
    reference: {
      advice: "50:50 구조는 의사결정 교착을 만들기 쉽습니다. 제2조 ③항의 데드락 해소 조항과 함께 보세요.",
    },
  },
  {
    id: "noncompete",
    group: "tenure",
    article: "제4조 ②",
    articleTag: "NON-COMPETE",
    proposed: true,
    consensus: true,
    title: "퇴사 후 몇 년간 경업을 금지하나요?",
    desc: "주주와 임직원 지위를 모두 잃은 날부터 동종 사업을 하지 못하는 기간입니다.",
    template: { type: "duration", unit: "년", presets: [1, 2, 3], baseValue: 1, defaultValue: 1 },
    preview: [
      "② 주주는 주주의 지위와 회사의 임직원으로서의 지위를 갖지 않게 된 날로부터 {0}의 기간 동안, 다른 주주들 전원의 사전 서면 동의가 없는 한, 자기 또는 제3자의 계산으로 회사의 영업부류에 속하거나 동종 또는 유사한 영업부류에 속하는 회사나 사업을 경영하거나 (이하 생략)",
    ],
    reference: {
      advice: "베이스 계약서는 1년으로 작성되어 있습니다.",
      highRisk: "기간이 지나치게 길면 직업 선택의 자유를 과도하게 제한한다고 보아 법원이 효력을 제한할 수 있습니다.",
    },
  },
  {
    id: "tenure",
    group: "tenure",
    article: "제5조 ①",
    articleTag: "TENURE",
    proposed: false,
    consensus: true,
    title: "최소 몇 년간 근무 의무를 지나요?",
    desc: "이 기간 안에는 다른 주주 전원의 서면 동의 없이 퇴사할 수 없습니다. 본인 책임이 아닌 비자발적 퇴사는 제외됩니다.",
    template: { type: "duration", unit: "년", presets: [1, 2, 3, 5], defaultValue: 3 },
    preview: [
      "① 주주는 본 계약 체결일로부터 사유를 불문하고 {0}간 다른 주주들 전원의 사전 서면 동의 없이 회사에서 퇴사하여서는 아니된다. 단, 해당 주주에게 책임 없는 사유로 인한 비자발적 퇴사에 대하여는 본 조의 적용을 배제한다.",
    ],
    reference: {
      advice: "베이스 계약서 제5조 ②항이 \"3년 이내 퇴사\"를 기준으로 액면가 매수권을 규정합니다. 3년으로 맞추면 두 항이 자연스럽게 이어집니다.",
    },
  },
  {
    id: "vesting",
    group: "tenure",
    article: "제5조 (강화)",
    articleTag: "VESTING",
    proposed: true,
    consensus: true,
    title: "지분을 시간에 따라 단계적으로 확정하나요?",
    desc: "베스팅은 근무 기간에 비례해 지분을 확정하는 장치입니다. 클리프는 그 전에 나가면 한 주도 확정되지 않는 최소 기간입니다. 조기 이탈자가 지분을 그대로 가져가는 상황을 막습니다.",
    template: {
      type: "composite",
      parts: [
        {
          key: "apply",
          label: "베스팅 적용 여부",
          template: {
            type: "choice",
            options: [
              { id: "yes", label: "적용한다", desc: "근무 기간에 비례해 지분이 단계적으로 확정됩니다." },
              { id: "no", label: "적용하지 않는다", desc: "베이스 계약서 제5조 ②항의 액면가 매수권만으로 처리합니다." },
            ],
          },
        },
        {
          key: "vestingYears",
          label: "베스팅 기간",
          template: { type: "duration", unit: "년", presets: [3, 4, 5], defaultValue: 4 },
        },
        {
          key: "cliffYears",
          label: "클리프 기간",
          template: { type: "duration", unit: "년", presets: [1, 2], defaultValue: 1 },
        },
      ],
    },
    preview: [
      "주주가 보유한 주식은 본 계약 체결일로부터 {1}에 걸쳐 매월 균등하게 확정되며, 최초 {2}이 경과하기 전에 퇴사하는 경우 확정된 주식이 없는 것으로 본다.",
    ],
    reference: {
      advice: "통상 4년 베스팅 / 1년 클리프 구조를 씁니다.",
    },
  },
  {
    id: "buybackPrice",
    group: "tenure",
    article: "제5조 ② · 제9조 ③",
    articleTag: "BUYBACK",
    proposed: true,
    consensus: true,
    title: "퇴사하는 사람의 주식을 얼마에 되사나요?",
    desc: "베이스 계약서는 사유를 가리지 않고 액면가로 매수합니다. 사정이 있어 나가는 경우와 문제를 일으키고 나가는 경우를 다르게 볼지 정해야 합니다.",
    template: {
      type: "choice",
      options: [
        { id: "par", label: "사유 불문 액면가", desc: "베이스 계약서 그대로. 계산이 단순하고 분쟁 여지가 적습니다." },
        { id: "split", label: "귀책 여부에 따라 차등", desc: "일반 퇴사는 시가 또는 평가액, 배임·경쟁사 이직 등 귀책 퇴사는 액면가로 낮춥니다." },
      ],
    },
    preview: [
      "② 제1항에도 불구하고 주주가 3년 이내에 회사에서 퇴사하는 경우, 다른 주주는 퇴사하는 주주가 보유하고 있는 주식 전부 또는 일부를 퇴사일 당시의 각 지분율에 따라 퇴사하는 주주로부터 {0}로 매수할 수 있는 권리를 가진다.",
    ],
    reference: {
      advice: "변호사는 귀책 유무에 따라 회수 가격을 다르게 두는 방식을 권고합니다.",
      lowRisk: "일괄 액면가는 단순하지만, 오래 기여하고 정당하게 떠나는 사람에게 가혹할 수 있습니다.",
      highRisk: "차등 구조는 \"귀책\"의 정의를 두고 다툼이 생길 수 있어 사유를 구체적으로 열거해야 합니다.",
    },
  },
  {
    id: "lockup",
    group: "transfer",
    article: "제6조",
    articleTag: "LOCK-UP",
    proposed: false,
    consensus: true,
    title: "몇 년간 주식을 팔 수 없나요?",
    desc: "이 기간에는 다른 주주 전원의 서면 동의 없이 주식을 양도·담보 설정할 수 없습니다. 우선매수권과 공동매도요구권에 따른 처분은 예외입니다.",
    template: { type: "duration", unit: "년", presets: [3, 5, 7, 10], baseValue: 5, defaultValue: 5 },
    preview: [
      "주주는 본 계약의 체결일로부터 {0} 간, 다른 주주 전원의 사전 서면 동의가 없으면, 보유하고 있는 회사의 주식 또는 신주인수권의 전부 또는 일부를 제3자에게 양도 매각하거나 담보를 설정하는 등의 처분행위를 하여서는 아니된다. 단, 제7조 및 제7의 2조에 따른 처분행위는 그러하지 아니하다.",
    ],
    reference: {
      advice: "베이스 계약서는 5년입니다. 통상 5~10년 사이에서 정합니다.",
      highRisk: "기간이 길수록 엑싯 경로가 좁아집니다. 제7의 2조 공동매도요구권이 유일한 안전판입니다.",
    },
  },
  {
    id: "dragAlong",
    group: "transfer",
    article: "제7의 2조 ① (신설)",
    articleTag: "DRAG-ALONG",
    proposed: false,
    consensus: true,
    title: "몇 % 이상이 동의하면 전원이 함께 팔아야 하나요?",
    desc: "이 비율 이상을 가진 주주가 매각을 결정하면 나머지 주주도 같은 조건으로 함께 팔아야 합니다. 소수 한 명의 반대로 M&A가 막히는 상황을 푸는 장치입니다.",
    template: {
      type: "percent",
      marks: [
        { value: 50, label: "과반" },
        { value: 67, label: "특별결의" },
        { value: 75, label: "" },
        { value: 100, label: "전원" },
      ],
      defaultValue: 67,
    },
    preview: [
      "① 제6조 및 제7조에도 불구하고, 회사 발행주식총수의 {0}% 이상을 보유한 주주(수인의 주주가 합산하여 위 비율에 이르는 경우를 포함하며, 이하 '매도요구주주'라고 한다)가 보유 주식 전부를 제3자에게 양도하고자 하는 경우, 매도요구주주는 다른 주주들에게 동일한 조건으로 그 보유 주식 전부 또는 일부를 함께 양도할 것을 요구할 수 있는 권리를 가진다.",
    ],
    reference: {
      lowRisk: "비율이 낮으면 소수 주주가 원치 않는 매각에 끌려 들어갑니다.",
      highRisk: "비율이 높으면 한 명의 반대로 엑싯이 막혀 이 조항을 넣은 의미가 사라집니다.",
    },
  },
  {
    id: "penalty",
    group: "transfer",
    article: "제8조",
    articleTag: "PENALTY",
    proposed: false,
    consensus: true,
    title: "계약을 어기면 얼마를 무나요?",
    desc: "기준 금액과 비율 두 값을 정하면 제8조의 네 항에 모두 반영됩니다. 제재가 적히지 않은 계약은 선언에 불과합니다.",
    template: {
      type: "composite",
      parts: [
        {
          key: "base",
          label: "위약벌 기준 금액",
          template: {
            type: "amount",
            presets: [
              { label: "3천만 원", value: 30000000 },
              { label: "1억 원", value: 100000000 },
              { label: "5억 원", value: 500000000 },
            ],
            defaultValue: 100000000,
          },
        },
        {
          key: "rate",
          label: "처분 금액 대비 비율",
          template: {
            type: "percent",
            marks: [
              { value: 10, label: "" },
              { value: 30, label: "통상" },
              { value: 50, label: "" },
              { value: 100, label: "전액" },
            ],
            defaultValue: 30,
          },
        },
      ],
    },
    preview: [
      "① 제3조를 위반하는 경우 위반 당사자는 다른 주주들에게 손해배상과 별도로 위약벌로서 각 {0}원을 지급하여야 한다.",
      "② 제4조 및 제5조를 위반하는 경우 위반 당사자는 다른 주주들에게 손해배상과 별도로 위약벌로서 해당 주식 처분 금액의 {1}%에 해당하는 금액을 지급하여야 한다.",
      "③ 제3조 또는 제4조 및 제5조를 위반하는 경우 위반 당사자는 다른 주주들에게 손해배상예정액으로써 각 {0}원을 지급하여야 한다. 단, 손해액이 {0}원을 초과하는 경우에는 다른 주주들은 초과하는 손해액을 입증하여 손해배상을 청구할 수 있다.",
      "⑤ 제6조 또는 제7조를 위반하여 처분행위를 한 경우 위반 당사자는 다른 주주들에게 손해배상과 별도로 위약벌로서 해당 처분 금액의 {1}%에 해당하는 금액 또는 각 {0}원 중 큰 금액을 지급하여야 하며, 해당 처분행위로써 다른 주주들에게 대항할 수 없다.",
    ],
    reference: {
      advice: "통상 1억 원을 기준으로 삼고, 실제 사례는 1천만 원에서 10억 원까지 분포합니다.",
      lowRisk: "금액이 낮으면 어기는 편이 이득인 구조가 되어 제재가 작동하지 않습니다.",
      highRisk: "금액이 지나치게 높으면 법원이 과다하다고 보아 감액할 수 있습니다.",
    },
  },
  {
    id: "jurisdiction",
    group: "transfer",
    article: "제16조 ②",
    articleTag: "JURISDICTION",
    proposed: true,
    consensus: true,
    title: "분쟁이 생기면 어느 법원에서 다투나요?",
    desc: "제1심 관할법원입니다. 보통 회사 소재지나 주주들의 거주지 관할 법원으로 정합니다.",
    template: {
      type: "choice",
      options: [
        { id: "seoul", label: "서울중앙지방법원", desc: "베이스 계약서 기본값. 수도권 소재 회사에서 가장 흔합니다." },
        { id: "local", label: "회사 본점 소재지 관할 법원", desc: "본점이 옮겨가도 자동으로 따라갑니다." },
        { id: "arbitration", label: "대한상사중재원 중재", desc: "비공개로 빠르게 끝나지만 단심제라 불복할 수 없습니다." },
      ],
    },
    preview: ["② 본 계약에 따라 발생한 모든 분쟁의 제1심 관할법원은 {0}으로 지정한다."],
    reference: {
      advice: "베이스 계약서의 \"서울지방법원\"은 현존하지 않는 명칭이라 서울중앙지방법원으로 정정했습니다.",
    },
  },
];
