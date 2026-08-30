// 주주간계약서 합의 항목 질문 정의.
// 조문 원문은 reference/계약서 샘플/최종 계약서 샘플.md 인용 — 임의 수정 금지.
// 빈칸 목록 근거: reference/계약서 샘플/최종 계약서 필수 내용 정리.md D절
// 설계: docs/superpowers/specs/2026-08-07-contract-question-templates-design.md

// 고르면 하위 내용을 복수로 고르게 하는 선택지. 종류주식처럼 한 단계 더 들어가는 항목에만 sub를 붙인다.
// formal은 조문에 들어갈 법률 용어다. 화면은 쉬운 말(label)로 두고 계약서만 정식 명칭으로 채운다.
export type ChoiceOption = {
  id: string;
  label: string;
  desc: string;
  sub?: { label: string; options: { id: string; label: string; desc: string; formal?: string }[] };
};

// sub가 있는 선택지를 고르면 값이 객체가 된다. 그 외에는 지금처럼 문자열이다.
export type ChoiceValue = string | { id: string; sub: string[] };

export type QuestionTemplate =
  | { type: "amount"; presets: { label: string; value: number }[] }
  | { type: "duration"; unit: "일" | "개월" | "년"; presets: number[]; baseValue?: number }
  | { type: "percent"; marks: { value: number; label: string }[] }
  | { type: "choice"; variant?: "person"; options: ChoiceOption[] }
  | { type: "matrix"; variant: "text" | "allocation"; chips?: string[] }
  | { type: "fields"; fields: { key: string; label: string; placeholder: string; kind?: "text" | "date" | "number" }[] }
  | { type: "composite"; parts: { key: string; label: string; template: QuestionTemplate }[] }
  | { type: "consent"; items: string[] };

// 미리보기는 조문 전체를 실제 계약서 지면처럼 보여준다.
// 마크다운 표 기호를 그대로 노출하지 않기 위해 블록으로 구조화한다.
// 모든 문자열의 {0} {1} 자리가 답변으로 치환된다.
export type PreviewBlock =
  | { kind: "para"; text: string; indent?: boolean }  // 조문 본문. indent면 호(號) 목록
  | { kind: "table"; head: string[]; rows: string[][] }
  | { kind: "sign"; text: string }                    // 서명란처럼 좌측 정렬 고정폭 줄
  | { kind: "ellipsis" };                             // 생략 구간 표시

export type PreviewDoc = {
  article: string;              // "제3의 2조 (회사 설립 시까지 동업자들의 역할과 업무분담)"
  blocks: PreviewBlock[];
};

// 사이드 정보 카드에 실리는 내용.
// 원칙: 사실과 구조만 서술한다. 특정 값을 권하거나 업계 평균을 단정하지 않는다.
// 구체적 권고는 변호사법 제109조가 금지하는 법률사무 취급에 해당할 수 있다.
export type QuestionInfo = {
  what: string;      // 이 조항이 무엇이고 어떻게 작동하는가
  ifUnset: string;   // 정하지 않고 두면 어떤 규칙이 적용되는가
  low?: string;      // 값을 낮게 정하면 생기는 일
  high?: string;     // 값을 높게 정하면 생기는 일
};

export type ContractQuestion = {
  id: string;
  group: string;
  article: string;      // 화면 표시용 조문 번호
  articleTag: string;   // eyebrow 영문 태그
  topic: string;        // 조문 번호 대신 화면에 세우는 우리말 주제목 (ex. 지분 배분)
  proposed: boolean;    // true면 `제안` 배지 — 사용자 확정 전 후보 문항
  consensus: boolean;   // false면 합의 대상 아닌 사실정보

  title: string;
  desc: string;
  template?: QuestionTemplate;
  preview: PreviewDoc;  // 이 답변이 들어가는 조문 전체
  info: QuestionInfo;
};

// 그룹 이름은 조문 번호가 아니라 사람들이 쓰는 말로 둔다.
export const QUESTION_GROUPS = [
  { id: "basics", ko: "기본", en: "Basics" },
  { id: "roles", ko: "역할&책임", en: "Roles & Responsibilities" },
  { id: "decision", ko: "의사결정&권한", en: "Decision & Authority" },
  { id: "equity", ko: "지분&보상", en: "Equity & Compensation" },
  { id: "tenure", ko: "이탈&정리", en: "Departure & Settlement" },
  { id: "misc", ko: "기타", en: "Misc" },
];

// 제2조 ①항이 전원 동의를 요구하는 7가지. 조문 문구는 원문 그대로 두고,
// plain 에 초보자용 한 줄을 붙여 같은 배열을 조문 미리보기와 안내 드롭다운이 함께 쓴다.
// {0} = 제2조 ① 7호의 기준 금액.
export const CONSENT_ITEMS: { plain: string; text: string }[] = [
  { plain: "회사 규칙(정관) 고치기", text: "정관의 변경" },
  { plain: "주식을 새로 찍거나 스톡옵션 주기 — 지분이 묽어지는 일", text: "주식 및 주식관련 사채의 발행, 주식매수선택권 부여 등 자본금의 증감을 가져올 수 있는 행위" },
  { plain: "번 돈을 나눠 갖기(배당)", text: "배당의 결정" },
  { plain: "하던 사업을 바꾸거나 새 사업 시작하기", text: "주된 사업의 변경, 신규 사업의 진출" },
  { plain: "사업 접기, 회사를 팔거나 합치기", text: "사업의 중단 또는 포기, 사업양수도, 합병, 분할, 분할합병, 주식의 포괄적 교환 또는 이전, 영업의 양도·양수, 위탁경영 기타 회사조직의 근본적인 변경" },
  { plain: "창업자·경영진이나 그 가족과 회사가 거래하기", text: "회사와 주요 경영진 및 이들의 특수관계인과의 거래 또는 계약" },
  { plain: "{0}을 넘는 돈을 투자하기", text: "회사가 {0}을 초과하여 투자하는 행위" },
];

export const MOCK_MEMBERS = [
  { id: "m1", name: "김민준", role: "나 (본인)", self: true },
  { id: "m2", name: "이서연", role: "공동창업자", self: false },
  { id: "m3", name: "박도윤", role: "공동창업자", self: false },
];

// 정보 카드 하단에 항상 붙는 문구. 서비스가 법률 자문을 제공하지 않음을 명시한다.
export const INFO_DISCLAIMER =
  "일반적인 법률 정보이며 특정 사안에 대한 법률 자문이 아닙니다. 구체적인 판단이 필요하면 변호사와 상담하세요.";

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

// 선택지 답을 조문에 넣을 한 줄로 만든다. sub를 고른 종류주식은 괄호로 내용을 덧붙인다.
export function choiceLabel(t: Extract<QuestionTemplate, { type: "choice" }>, v: unknown): string | null {
  const id = typeof v === "string" ? v : typeof v === "object" && v ? (v as { id?: string }).id : undefined;
  const opt = t.options.find((o) => o.id === id);
  if (!opt) return null;
  const picked = (typeof v === "object" && v ? (v as { sub?: string[] }).sub : undefined) ?? [];
  const subs = opt.sub ? opt.sub.options.filter((s) => picked.includes(s.id)).map((s) => s.formal ?? s.label) : [];
  return subs.length ? `${opt.label} (${subs.join("·")})` : opt.label;
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
    id: "identity",
    group: "basics",
    article: "전문 · 서명란",
    articleTag: "PARTIES",
    topic: "계약 당사자",
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
    preview: {
      article: "계약 말미 (서명란)",
      blocks: [
        { kind: "para", text: "계약 당사자들은 이상과 같이 본 계약을 체결하고 이를 증명하기 위하여 본 계약서 [  ]부를 작성하여 각각 서명 또는 기명 날인한 후 각 1부씩 보관한다." },
        { kind: "sign", text: "20[  ]년 [  ]월 [  ]일" },
        { kind: "sign", text: "{0} ({1})          (인)" },
        { kind: "sign", text: "주소  {2}" },
        { kind: "sign", text: "이서연 (            )          (인)" },
        { kind: "sign", text: "주소" },
        { kind: "sign", text: "박도윤 (            )          (인)" },
        { kind: "sign", text: "주소" },
      ],
    },
    info: {
      what: "계약의 당사자가 누구인지 특정하는 부분입니다. 이름만으로는 동명이인과 구별되지 않아, 주민등록번호와 주소를 함께 적어 사람을 하나로 특정합니다.",
      ifUnset: "당사자가 특정되지 않은 계약서는 나중에 \"내가 서명한 그 사람이 맞느냐\"는 다툼이 생길 때 이를 증명하기 어렵습니다. 소송에서 상대방을 지정할 때도 이 정보가 쓰입니다.",
    },
  },
  {
    // 2차 변호사 자문에서 가장 강조된 갈래. 이 선택 하나가 이후 문항의 절반을 좌우한다.
    // "그 선택 여부를 ... 가장 초기 당사자 세팅하기 전에 어딘가에 넣어서 고르게 만드는 게 어떨까"
    id: "structure",
    group: "basics",
    article: "전문 · 계약 성격",
    articleTag: "STRUCTURE",
    topic: "계약 성격",
    proposed: true,
    consensus: true,
    title: "투자를 받을 계획이 있나요?",
    desc: "계획에 따라 뒤에 나오는 항목들이 다르게 채워져요. 아직 확실하지 않아도 괜찮습니다. 나중에 바꿀 수 있어요.",
    template: {
      type: "choice",
      options: [
        {
          id: "leader",
          label: "투자 유치를 고려 중이에요",
          desc: "VC·팁스 등 외부 투자를 받으려면 투자자가 대표에게 결정권이 모인 구조를 요구하는 경우가 많습니다.",
        },
        {
          id: "fair",
          label: "매출로 운영할 계획이에요",
          desc: "투자자를 염두에 두지 않으면 모든 주주에게 같은 규칙을 적용하는 합의안을 씁니다. 나중에 투자를 받게 되면 그때 다시 봅니다.",
        },
        {
          // 초기 팀 대부분이 여기다. 답을 강요하면 첫 문항에서 막힌다.
          // 고른 것으로 세되(미응답과 구분된다) 기본값은 채우지 않는다.
          id: "unsure",
          label: "아직 모르겠어요",
          desc: "지금 정하지 않아도 됩니다. 뒤 항목을 직접 채우게 되고, 나중에 이 답을 바꾸면 그때 기본값이 들어갑니다.",
        },
      ],
    },
    preview: {
      article: "계약 전문 (당사자와 계약 성격)",
      blocks: [
        { kind: "para", text: "주주 [ ], [ ], [ ](이하 '주주들'이라 한다)은 회사의 설립 및 운영에 관하여 다음과 같이 합의한다." },
        { kind: "para", text: "본 계약은 {0} 구조를 전제로 한다." },
        { kind: "ellipsis" },
      ],
    },
    info: {
      what: "투자 계획이 합의안의 기본 얼개를 정합니다. 투자를 받는 구조에서는 최종 결정권과 지분 회수권을 대표에게 모으고 근속 의무를 대표 외 주주에게 지우는 형태를 씁니다. 투자를 염두에 두지 않으면 대표를 포함한 전원에게 같은 규칙을 적용하며, 시중에 도는 표준 주주간계약서 대부분이 이 형태입니다.",
      ifUnset: "정하지 않으면 뒤에 나오는 결정권·회수·근속 항목이 서로 다른 전제로 채워질 수 있습니다.",
      low: "전원에게 같은 규칙을 적용하면 대표도 이 합의안의 제재 대상이 되고, 대표가 퇴사하면 그 지분이 다른 주주들에게 넘어갑니다.",
      high: "대표에게 결정권이 모이면 나머지 주주의 재량이 줄어듭니다. 소수 주주가 받아들일 수 있는 범위인지 함께 확인해야 합니다.",
    },
  },
  {
    id: "ipTransfer",
    group: "basics",
    article: "제3조",
    articleTag: "IP TRANSFER",
    topic: "기술·지식재산 이전",
    proposed: true,
    consensus: true,
    title: "지금 각자 가진 기술과 자료 중, 무엇을 회사로 넘기나요?",
    desc: "설립 전에 각자 만들어 둔 코드·디자인·상표·데이터 가운데 회사로 넘길 것을 적습니다. 여기 적은 것은 회사가 세워지는 순간 회사 소유가 됩니다.",
    template: {
      type: "consent",
      items: ["소스코드", "디자인·시안", "상표·브랜드", "도메인·계정", "고객 데이터", "특허·출원"],
    },
    preview: {
      article: "제3조 (회사 설립 후 지식재산 등의 이전)",
      blocks: [
        { kind: "para", text: "① 이 계약 당사자인 주주들이 회사를 설립하여 영위할 사업과 관련하여 보유한 관련 비즈니스, 기술 및 지식재산권은 회사의 설립과 동시에 회사에 그 권리가 이전된다." },
        { kind: "para", text: "② 이전 대상 유형: 소스코드, 디자인·시안, 상표·브랜드, 도메인·계정, 고객 데이터, 특허·출원" },
        { kind: "para", text: "③ 각 주주는 자신이 보유한 위 유형의 지식재산권을 이전하는 것에 {0}." },
      ],
    },
    info: {
      what: "창업 전에 각자 만들어 둔 코드, 디자인, 상표, 데이터의 권리를 회사로 옮기는 조항입니다. 저작권법상 저작물의 권리는 원칙적으로 만든 사람에게 생기므로, 회사로 옮기는 절차를 밟지 않으면 회사가 쓰는 결과물의 권리자가 개인으로 남습니다. 제8조 ①·③항은 이 조항 위반에 위약벌과 손해배상예정액을 걸어 둡니다.",
      ifUnset: "이전 대상이 적혀 있지 않으면 어디까지가 회사 것인지 다투게 됩니다. 만든 사람이 팀을 떠날 때 결과물의 권리를 함께 가지고 나가는 상황이 생기고, 투자·인수 심사에서 권리 귀속이 불분명한 자산은 문제로 잡힙니다.",
    },
  },
  {
    id: "decisionAmount",
    group: "decision",
    article: "제2조 ① 7호",
    articleTag: "SPEND THRESHOLD",
    topic: "큰 투자의 기준 금액",
    proposed: false,
    consensus: true,
    title: "얼마를 넘는 투자부터 전원 동의가 필요한가요?",
    desc: "이 금액을 넘는 투자는 주주 전원이 동의해야 진행할 수 있습니다.",
    template: {
      type: "amount",
      presets: [
        { label: "1천만 원", value: 10000000 },
        { label: "5천만 원", value: 50000000 },
        { label: "1억 원", value: 100000000 },
        { label: "3억 원", value: 300000000 },
      ],
    },
    preview: {
      article: "제2조 (주요 의사결정 합의·협의 사항)",
      blocks: [
        { kind: "para", text: "① 주주들은 다음 각 호의 사항에 관하여는 주주들 전원의 합의로 결정하고, 주주총회 또는 이사회 결의가 필요한 경우 주주들의 합의에 따라 의결권을 행사하여야 한다." },
        ...CONSENT_ITEMS.map((c, i) => ({ kind: "para" as const, indent: true, text: `${i + 1}. ${c.text}` })),
        { kind: "ellipsis" },
      ],
    },
    info: {
      what: "제2조 ①항은 전원 동의가 필요한 사항 7가지를 열거합니다. 7호는 그중 금액으로 선을 긋는 항목으로, 이 선을 넘는 투자는 대표나 담당자가 단독으로 집행할 수 없습니다.",
      ifUnset: "금액 기준이 비면 어떤 투자가 전원 동의 대상인지 판단할 근거가 사라집니다. 그러면 집행 후에 \"이건 전원 동의 사항이었다\"는 다툼이 사후적으로 생깁니다.",
      low: "선이 낮을수록 전원 동의를 거쳐야 하는 건이 많아집니다. 일상적인 지출까지 절차를 밟게 되어 집행 속도가 느려집니다.",
      high: "선이 높을수록 단독 집행 범위가 넓어집니다. 회사 규모에 비해 큰 금액이 다른 주주의 관여 없이 나갈 수 있습니다.",
    },
  },
  {
    id: "deadlock",
    group: "decision",
    article: "제2조 ③ (신설)",
    articleTag: "DEADLOCK",
    topic: "결정이 막혔을 때",
    proposed: false,
    consensus: true,
    title: "전원 동의가 안 되면 며칠 더 이야기하나요?",
    desc: "아래 7가지는 주주 전원이 동의해야 정할 수 있습니다. 한 명이라도 반대해 결정이 멈췄을 때 며칠을 더 이야기할지 정합니다. 그래도 안 되면 대표가 정합니다.",
    // 2차 변호사 자문: 소수 주주를 최종 결정권자로 지정할 수 있게 두면 분쟁이 난다.
    // ("80 10 10인데 10%를 가진 사람을 최종 결정권자로 선택할 수 있게 만드는 건 좀 안 맞는 거죠",
    //  "이게 아예 불가능하게 만드는 게 맞지 않나") 그래서 선택을 없애고 대표로 고정한다.
    template: { type: "duration", unit: "일", presets: [3, 7, 14, 30] },
    preview: {
      article: "제2조 (주요 의사결정 합의·협의 사항)",
      blocks: [
        { kind: "para", text: "① 주주들은 다음 각 호의 사항에 관하여는 주주들 전원의 합의로 결정하고, 주주총회 또는 이사회 결의가 필요한 경우 주주들의 합의에 따라 의결권을 행사하여야 한다." },
        { kind: "ellipsis" },
        { kind: "para", text: "② 주주들은 다음 각 호의 사항에 관하여는 다른 주주에게 사전에 통지하고 이를 협의하여야 한다." },
        { kind: "ellipsis" },
        { kind: "para", text: "③ 제1항 각 호의 사항에 관하여 주주 전원의 합의가 이루어지지 아니하는 경우, 주주들은 {0}간 성실히 협의한다. 위 협의 기간 내에도 합의에 이르지 못한 경우, 해당 사항은 대표이사인 주주의 의사에 따라 결정하는 것으로 하고, 주주들은 그 결정에 따라 주주총회 또는 이사회에서 의결권을 행사하여야 한다." },
      ],
    },
    info: {
      what: "제2조 ①항은 전원 동의를 요구하므로 한 명이 반대하면 결정이 성립하지 않습니다. 이 항은 그 상태가 무한히 이어지지 않도록, 정해진 기간이 지나면 지정된 사람의 판단으로 결론을 내도록 하는 장치입니다.",
      ifUnset: "해소 절차가 없으면 전원이 동의할 때까지 안건이 계류됩니다. 제2조 ①항 2호는 주식·사채 발행을 포함하므로, 투자 유치 안건이 여기서 막히면 자금 조달 자체가 진행되지 않습니다. 제10조는 계약 변경도 전원 서면 합의로만 가능하게 하므로 이 구조를 나중에 바꾸기도 어렵습니다.",
      low: "협의 기간이 짧으면 결론은 빨리 나지만, 반대하는 쪽이 근거를 정리해 설득할 시간이 부족합니다.",
      high: "협의 기간이 길면 논의는 충분해지지만, 그 기간 동안 해당 안건과 연결된 실행이 멈춥니다.",
    },
  },
  {
    id: "roles",
    group: "roles",
    article: "제3의 2조",
    articleTag: "ROLES",
    topic: "역할 분담",
    proposed: false,
    consensus: true,
    title: "각자 담당하는 역할과 업무는 무엇인가요?",
    desc: "본인이 담당하는 역할뿐 아니라 다른 팀원에게 기대하는 역할도 적어 주세요. 기대가 어긋나는 지점이 여기서 드러납니다.",
    template: {
      type: "matrix",
      variant: "text",
      chips: ["대표이사", "제품 총괄", "개발 총괄", "영업·마케팅", "재무·운영", "디자인"],
    },
    preview: {
      article: "제3의 2조 (회사 설립 시까지 동업자들의 역할과 업무분담)",
      blocks: [
        { kind: "para", text: "회사 설립 시까지 각 주주(동업자)가 담당할 역할과 업무는 다음과 같다." },
        {
          kind: "table",
          head: ["이름", "역할 또는 업무 내용"],
          rows: [
            ["김민준", "{0}"],
            ["이서연", "{1}"],
            ["박도윤", "{2}"],
          ],
        },
      ],
    },
    info: {
      what: "회사 설립 시까지 각 동업자가 담당하는 역할과 업무를 표로 남기는 조항입니다. 제5조의 계속근무 의무와 제8조의 위약벌은 이 표에 적힌 역할을 기준으로 이행 여부를 따집니다.",
      ifUnset: "역할이 비어 있으면 무엇을 하지 않았을 때 의무 위반인지 판단할 기준이 없습니다. 담당자가 정해지지 않은 업무는 서로 상대가 할 일이라고 생각한 채 남겨지기 쉽습니다.",
    },
  },
  {
    id: "equity",
    group: "equity",
    article: "전문 · 제3의 3조",
    articleTag: "EQUITY SPLIT",
    topic: "지분 배분",
    proposed: false,
    consensus: true,
    title: "지분을 어떻게 나누나요?",
    desc: "회사 설립 시 발행하는 총 주식의 배분입니다. 합계가 정확히 100%가 되어야 합니다.",
    template: { type: "matrix", variant: "allocation" },
    preview: {
      article: "제3의 3조 (회사 설립시 동업자간의 지분)",
      blocks: [
        { kind: "para", text: "회사 설립 시, 회사가 발행하는 총 주식은 각 주주(동업자)에게 다음과 같이 배분한다." },
        {
          kind: "table",
          head: ["이름", "주식의 종류", "주식수", "비율(%)"],
          rows: [
            ["김민준", "보통주식", "[주식수]", "{0}"],
            ["이서연", "보통주식", "[주식수]", "{1}"],
            ["박도윤", "보통주식", "[주식수]", "{2}"],
            ["합계", "", "", "100"],
          ],
        },
      ],
    },
    info: {
      what: "설립 시 각자가 갖는 주식 비율입니다. 이 비율은 의결권, 배당, 그리고 이 계약의 여러 조항이 참조하는 기준이 됩니다. 제7의 2조의 공동매도요구권 발동 여부도 이 비율로 판단합니다.",
      ifUnset: "지분 비율이 정해지지 않으면 회사 설립 등기 자체를 진행할 수 없습니다.",
      low: "지분율에는 법이 정해 둔 문턱이 몇 개 있습니다. 66.7%는 정관 변경·합병 같은 특별결의를 통과시킬 수 있는 선(상법 제434조), 50.1%는 이사 선임·배당 같은 보통결의를 통과시킬 수 있는 선(제368조), 33.4%는 상대가 특별결의를 밀어붙이는 것을 막을 수 있는 선, 3%는 임시주주총회 소집·회계장부 열람·이사 해임 청구 같은 소수주주권을 쓸 수 있는 선입니다. 각자의 비율이 이 문턱들과 어떤 관계인지 확인해 두면 나중에 계산이 쉬워집니다.",
      high: "한 사람이 과반을 넘으면 보통결의를 단독으로 통과시킬 수 있고, 정확히 반씩 나누면 어느 쪽도 단독으로 통과시킬 수 없습니다. 어느 구조든 제2조 ③항의 데드락 해소 조항과 함께 읽어야 실제 결정 흐름이 보입니다.",
    },
  },
  {
    id: "vesting",
    group: "equity",
    article: "제5조 (강화)",
    articleTag: "VESTING",
    topic: "지분 확정 (베스팅·클리프)",
    proposed: true,
    consensus: true,
    title: "지분을 시간에 따라 단계적으로 확정하나요?",
    desc: "베스팅은 근무 기간에 비례해 지분을 확정하는 방식, 클리프는 그 전에 나가면 한 주도 확정되지 않는 최소 기간입니다.",
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
              { id: "no", label: "적용하지 않는다", desc: "제5조 ②항의 액면가 매수권만으로 이탈 상황을 처리합니다." },
            ],
          },
        },
        {
          key: "vestingYears",
          label: "베스팅 기간",
          template: { type: "duration", unit: "년", presets: [2, 3, 4, 5] },
        },
        {
          key: "cliffYears",
          label: "클리프 기간",
          template: { type: "duration", unit: "년", presets: [1, 2] },
        },
      ],
    },
    preview: {
      article: "제5조 (계속근무)",
      blocks: [
        { kind: "ellipsis" },
        { kind: "para", text: "② 제1항에도 불구하고 주주가 3년 이내에 회사에서 퇴사하는 경우, 다른 주주는 퇴사하는 주주가 보유하고 있는 주식 전부 또는 일부를 퇴사일 당시의 각 지분율에 따라 퇴사하는 주주로부터 액면가로 매수할 수 있는 권리를 가진다." },
        { kind: "para", text: "③ 본 조에 의한 권리행사는 퇴사자가 다른 주주 및 회사에 대하여 부담하는 위약금 등 손해배상의무에 영향을 미치지 아니한다." },
        { kind: "para", text: "④ 주주가 보유한 주식은 본 계약 체결일로부터 {1}에 걸쳐 매월 균등하게 확정되며, 최초 {2}이 경과하기 전에 퇴사하는 경우 확정된 주식이 없는 것으로 본다. (베스팅 {0})" },
      ],
    },
    info: {
      what: "지분을 처음에 전부 확정하지 않고 시간이 지남에 따라 나누어 확정하는 구조입니다. 클리프는 그 앞에 두는 관문으로, 클리프를 넘기기 전에 떠나면 확정된 몫이 없습니다. 이 계약의 제5조 ②항도 3년 내 퇴사 시 액면가 매수권을 두어 비슷한 효과를 내지만, 확정 시점이 단계적으로 나뉘지는 않습니다.",
      ifUnset: "베스팅이 없으면 설립 시 배분한 지분이 근무 기간과 무관하게 그대로 유지됩니다. 짧게 일하고 떠난 사람도 처음 받은 비율을 그대로 보유하게 되며, 이후 투자 유치 과정에서 투자자가 이 구조를 확인하고 조정을 요구하는 경우가 있습니다.",
      low: "베스팅 기간이 짧으면 지분이 빨리 확정되어 각자의 몫이 일찍 안정됩니다. 대신 조기 이탈에 대비하는 효과는 줄어듭니다.",
      high: "기간이 길면 오래 남을수록 확정 몫이 커지는 구조가 됩니다. 대신 그 기간 동안 각자가 실제로 얼마를 가진 것인지 계산이 계속 바뀝니다.",
    },
  },
  {
    id: "noncompete",
    group: "tenure",
    article: "제4조 ②",
    articleTag: "NON-COMPETE",
    topic: "퇴사 후 경업 금지",
    proposed: true,
    consensus: true,
    title: "퇴사 후 몇 년간 경업을 금지하나요?",
    desc: "주주와 임직원 지위를 모두 잃은 날부터 동종 사업을 하지 못하는 기간입니다.",
    template: { type: "duration", unit: "년", presets: [1, 2, 3], baseValue: 1 },
    preview: {
      article: "제4조 (경업의 금지 및 신회사설립금지)",
      blocks: [
        { kind: "para", text: "① 주주는 본계약이 체결된 날로부터 회사가 성립되어 주주의 지위를 갖는 동안 또는 회사의 임직원으로서의 지위를 갖는 동안, 다른 주주들 전원의 사전 서면 동의가 없는 한, 회사가 수행하고 있는 영업부류와 동종 또는 유사한 영업부류에 속하는 회사나 사업을 경영하거나 회사가 수행하고 있는 영업부류와 동종 또는 유사한 영업부류에 속하는 다른 회사(개인 사업체 포함)의 무한책임사원, 이사, 집행임원 또는 피용자가 될 수 없다." },
        { kind: "para", text: "② 주주는 주주의 지위와 회사의 임직원으로서의 지위를 갖지 않게 된 날로부터 {0}의 기간 동안, 다른 주주들 전원의 사전 서면 동의가 없는 한, 자기 또는 제3자의 계산으로 회사의 영업부류에 속하거나 동종 또는 유사한 영업부류에 속하는 회사나 사업을 경영하거나 회사가 수행하고 있는 영업부류와 동종 또는 유사한 영업부류에 속하는 다른 회사(개인 사업체 포함)의 무한책임사원, 이사, 집행임원 또는 피용자가 될 수 없다." },
        { kind: "para", text: "③ 주주는 회사에 재직 중인 기간 및 제2항의 경업금지 기간 동안, 경쟁사업을 영위할 목적으로 신회사를 설립하거나 경쟁사업을 영위하는 회사의 지분을 취득하여서는 아니된다." },
      ],
    },
    info: {
      what: "회사를 떠난 뒤 같은 분야에서 경쟁하지 않기로 하는 약정입니다. 제4조 ①항이 재직 중을, ②항이 퇴사 후를 다룹니다.",
      ifUnset: "상법 제397조의 이사 경업금지는 재직 중에만 적용되고 퇴사 후에는 미치지 않습니다. 퇴사 후 기간을 계약에 적지 않으면 떠난 사람이 곧바로 경쟁 사업을 시작해도 이 계약으로는 막을 근거가 없습니다.",
      low: "기간이 짧으면 떠난 사람의 재취업·재창업이 빨리 자유로워집니다. 회사가 쌓은 정보와 고객 관계가 경쟁 사업으로 옮겨갈 시점도 그만큼 앞당겨집니다.",
      high: "법원은 경업금지 약정의 유효성을 보호할 이익, 재직 기간과 지위, 제한 기간과 지역, 대가 지급 여부 등을 종합해 판단하며, 제한이 과도하면 민법 제103조에 따라 효력을 제한하기도 합니다. 기간을 길게 잡을수록 이 판단을 받을 가능성을 고려하게 됩니다.",
    },
  },
  {
    id: "tenure",
    group: "tenure",
    article: "제5조 ①",
    articleTag: "TENURE",
    topic: "최소 근무 기간",
    proposed: false,
    consensus: true,
    title: "최소 몇 년간 근무 의무를 지나요?",
    desc: "이 기간 안에는 다른 주주 전원의 서면 동의 없이 퇴사할 수 없습니다. 본인 책임이 아닌 비자발적 퇴사는 제외됩니다.",
    template: { type: "duration", unit: "년", presets: [1, 2, 3, 5] },
    preview: {
      article: "제5조 (계속근무)",
      blocks: [
        { kind: "para", text: "① 주주는 본 계약 체결일로부터 사유를 불문하고 {0}간 다른 주주들 전원의 사전 서면 동의 없이 회사에서 퇴사하여서는 아니된다. 단, 해당 주주에게 책임 없는 사유로 인한 비자발적 퇴사에 대하여는 본 조의 적용을 배제한다." },
        { kind: "para", text: "② 제1항에도 불구하고 주주가 3년 이내에 회사에서 퇴사하는 경우, 다른 주주는 퇴사하는 주주가 보유하고 있는 주식 전부 또는 일부를 퇴사일 당시의 각 지분율에 따라 퇴사하는 주주로부터 액면가로 매수할 수 있는 권리를 가진다." },
        { kind: "para", text: "③ 본 조에 의한 권리행사는 퇴사자가 다른 주주 및 회사에 대하여 부담하는 위약금 등 손해배상의무에 영향을 미치지 아니한다." },
      ],
    },
    info: {
      what: "창업자가 일정 기간 회사에 남아 있기로 하는 약정입니다. 이 기간을 어기고 나가면 제8조의 위약벌 대상이 됩니다.",
      ifUnset: "기간이 비면 언제 나가는 것이 위반인지 판단할 수 없어, 제8조가 제5조 위반에 걸어둔 제재도 작동할 대상을 잃습니다.",
      low: "이 계약서 제5조 ②항은 \"3년 이내 퇴사\" 시 다른 주주가 액면가로 매수할 수 있다고 이미 적혀 있습니다. ①항을 3년보다 짧게 정하면 두 항의 기준 연수가 서로 달라지므로, ②항도 함께 손볼지 확인해야 합니다.",
      high: "기간이 길면 그동안 다른 주주 전원의 동의 없이는 퇴사가 계약 위반이 됩니다. 다만 근로관계 자체를 강제할 수는 없으므로, 실제로는 남으라고 강제하기보다 위반에 따른 금전적 책임이 남는 형태로 작동합니다.",
    },
  },
  {
    id: "buybackPrice",
    group: "tenure",
    article: "제5조 ② · 제9조 ③",
    articleTag: "BUYBACK",
    topic: "퇴사자 주식 회수 가격",
    proposed: true,
    consensus: true,
    title: "퇴사하는 사람의 주식을 얼마에 되사나요?",
    desc: "이 계약서는 사유를 가리지 않고 액면가로 매수하도록 적혀 있습니다. 사유에 따라 나눌지 정합니다.",
    template: {
      type: "choice",
      options: [
        { id: "par", label: "사유 불문 액면가", desc: "이 계약서의 현재 문안입니다. 계산이 단순하고 가격 산정 다툼이 없습니다." },
        { id: "split", label: "귀책 여부에 따라 차등", desc: "일반 퇴사와 귀책 퇴사에 다른 가격을 적용합니다. 귀책 사유를 조문에 열거해야 합니다." },
      ],
    },
    preview: {
      article: "제5조 (계속근무) · 제9조 (계약의 해지 및 해제)",
      blocks: [
        { kind: "ellipsis" },
        { kind: "para", text: "② 제1항에도 불구하고 주주가 3년 이내에 회사에서 퇴사하는 경우, 다른 주주는 퇴사하는 주주가 보유하고 있는 주식 전부 또는 일부를 퇴사일 당시의 각 지분율에 따라 퇴사하는 주주로부터 {0}로 매수할 수 있는 권리를 가진다." },
        { kind: "para", text: "③ 본 조에 의한 권리행사는 퇴사자가 다른 주주 및 회사에 대하여 부담하는 위약금 등 손해배상의무에 영향을 미치지 아니한다." },
        { kind: "ellipsis" },
        { kind: "para", text: "제9조 ③ 다른 주주가 전항에 따라 본 계약을 해지 또는 해제하는 경우 본 계약 해지 또는 해제에 대해 귀책사유가 있는 주주는 해당 주주가 보유한 회사의 주식 전부를 다른 주주들이 보유한 주식수에 비례하여 다른 주주들에게 액면가로 양도하여야 한다." },
      ],
    },
    info: {
      what: "퇴사자가 들고 나가는 주식을 남은 주주가 되살 수 있게 하는 조항입니다. 액면가는 주권에 적힌 액수로, 회사 가치가 오른 뒤에도 그대로입니다. 제9조 ③항은 계약을 중대하게 위반해 해지된 경우에도 액면가 양도를 정하고 있습니다.",
      ifUnset: "가격 기준이 없으면 퇴사 시점마다 가격을 새로 협상해야 하고, 합의가 안 되면 주식을 회수하지 못한 채 이탈자가 주주로 남습니다.",
      low: "액면가로 일괄하면 산정이 명확해 다툼이 적습니다. 오래 기여하고 떠나는 사람도 회사 가치 상승분을 받지 못하는 구조가 됩니다.",
      high: "차등을 두면 사유에 따라 결과가 달라지지만, \"귀책\"의 범위를 조문에 구체적으로 열거하지 않으면 그 해당 여부가 새로운 다툼거리가 됩니다.",
    },
  },
  {
    id: "lockup",
    group: "equity",
    article: "제6조",
    articleTag: "LOCK-UP",
    topic: "주식 매각 제한 기간",
    proposed: false,
    consensus: true,
    title: "몇 년간 주식을 팔 수 없나요?",
    desc: "이 기간에는 다른 주주 전원의 서면 동의 없이 주식을 양도·담보 설정할 수 없습니다. 제7조와 제7의 2조에 따른 처분은 예외입니다.",
    template: { type: "duration", unit: "년", presets: [3, 5, 7, 10], baseValue: 5 },
    preview: {
      article: "제6조 (주식의 처분 제한 기간)",
      blocks: [
        { kind: "para", text: "주주는 본 계약의 체결일로부터 {0} 간, 다른 주주 전원의 사전 서면 동의가 없으면, 보유하고 있는 회사의 주식 또는 신주인수권의 전부 또는 일부를 제3자에게 양도 매각하거나 담보를 설정하는 등의 처분행위(이하 '처분행위'라고만 한다)를 하여서는 아니된다. 단, 제7조 및 제7의 2조에 따른 처분행위는 그러하지 아니하다." },
      ],
    },
    info: {
      what: "일정 기간 주식을 팔거나 담보로 잡히지 못하게 묶어두는 조항입니다. 상법 제335조는 주식의 양도를 정관으로 이사회 승인 사항으로 정할 수 있게 하며, 주주 간 계약으로 처분을 제한하는 것은 그와 별개로 당사자들끼리의 약정입니다.",
      ifUnset: "기간이 비면 처분 제한이 언제까지인지 알 수 없어, 제8조 ⑤항이 제6조 위반에 걸어둔 제재도 위반 시점을 특정하기 어려워집니다.",
      low: "기간이 짧으면 각자가 일찍 지분을 현금화할 수 있습니다. 초기에 지분 구성이 바뀌어 모르는 제3자가 주주가 될 가능성도 함께 열립니다.",
      high: "기간이 길수록 지분 구성이 안정됩니다. 동시에 제10조가 계약 변경을 전원 서면 합의로만 허용하므로, 이 기간을 나중에 줄이려 해도 전원이 동의해야 합니다. 제7의 2조 공동매도요구권이 이 기간 중 매각이 가능한 유일한 통로입니다.",
    },
  },
  {
    id: "dragAlong",
    group: "equity",
    article: "제7의 2조 ① (신설)",
    articleTag: "DRAG-ALONG",
    topic: "다 같이 팔기 (드래그얼롱)",
    proposed: false,
    consensus: true,
    title: "몇 % 이상이 동의하면 전원이 함께 팔아야 하나요?",
    desc: "이 비율 이상을 가진 주주가 매각을 결정하면 나머지 주주도 같은 조건으로 함께 팔아야 합니다.",
    template: {
      type: "percent",
      marks: [
        { value: 50, label: "과반" },
        { value: 67, label: "3분의 2" },
        { value: 75, label: "" },
        { value: 100, label: "전원" },
      ],
    },
    preview: {
      article: "제7의 2조 (공동매도요구권)",
      blocks: [
        { kind: "para", text: "① 제6조 및 제7조에도 불구하고, 회사 발행주식총수의 {0}% 이상을 보유한 주주(수인의 주주가 합산하여 위 비율에 이르는 경우를 포함하며, 이하 '매도요구주주'라고 한다)가 보유 주식 전부를 제3자에게 양도하고자 하는 경우, 매도요구주주는 다른 주주들에게 동일한 조건으로 그 보유 주식 전부 또는 일부를 함께 양도할 것을 요구할 수 있는 권리(이하 \"공동매도요구권\"이라고 함)를 가진다." },
        { kind: "para", text: "② 매도요구주주는 양도예정일로부터 30일 이전에 당해 제3자의 신원, 양도주식수, 주당 양도가액, 양도예정일 기타 양도의 주요 조건을 명시하여 다른 주주들에게 서면으로 통지하여야 한다." },
        { kind: "para", text: "③ 제2항의 통지를 받은 다른 주주들은 통지된 조건과 동일한 조건으로 매도요구주주와 함께 보유 주식을 당해 제3자에게 양도하여야 하며, 이를 위해 필요한 서류의 작성·교부 등 제반 절차에 협력하여야 한다." },
        { kind: "para", text: "④ 본 조에 따른 양도의 경우 제7조의 우선매수권 및 공동매도참여권 절차는 적용하지 아니한다." },
      ],
    },
    info: {
      what: "공동매도요구권(드래그얼롱)입니다. 인수자는 보통 지분 전부를 원하므로, 일부 주주가 팔지 않겠다고 하면 거래가 성립하지 않습니다. 이 조항은 정해진 비율 이상이 매각에 나서면 나머지도 같은 조건으로 따라 팔도록 요구할 수 있게 합니다. 제7조의 공동매도참여권(태그얼롱)이 소수 주주가 \"함께 팔 수 있는\" 권리라면, 이쪽은 다수 주주가 \"함께 팔라고 요구하는\" 권리입니다.",
      ifUnset: "이 조항이 없으면 제6조의 처분 제한이 그대로 적용되어, 처분 제한 기간 중에는 주주 전원의 서면 동의가 있어야 매각이 가능합니다. 한 명이 동의하지 않으면 나머지 전원이 원해도 매각이 진행되지 않습니다.",
      low: "발동 비율이 낮으면 적은 지분으로도 전원 매각을 요구할 수 있습니다. 매각을 원하지 않는 주주가 같은 조건으로 팔아야 하는 상황이 더 자주 생깁니다.",
      high: "비율이 높으면 그 문턱을 넘기 어려워 실제로 발동되는 경우가 줄어듭니다. 비율을 100%로 두면 제6조의 전원 동의 요건과 실질적으로 같아집니다.",
    },
  },
  {
    id: "tagAlong",
    group: "equity",
    article: "제7조 ①",
    articleTag: "TAG-ALONG",
    topic: "함께 팔 권리 (태그얼롱)",
    proposed: false,
    consensus: false,
    title: "소수 주주도 같은 조건으로 함께 팔 수 있어요",
    desc: "한 주주가 제3자에게 지분을 처분할 때, 다른 주주들도 같은 가격과 조건으로 동반 매각에 참여할 수 있는 권리입니다. 이 조항은 기본 계약서에 이미 포함되어 있습니다.",
    preview: {
      article: "제7조 (주주의 우선매수권 및 공동매도참여권)",
      blocks: [
        { kind: "para", text: "① 제6조에도 불구하고 주주 외 제3자에게 처분행위를 하고자 하는 주주(이하 '매도주주'라고만 한다)는 매도주주 외의 다른 주주들(이하 '다른 주주들'이라고만 한다)에게 동일한 조건으로 우선하여 매수할 수 있는 권리(이하 \"우선매수권\"이라고 함)와 동일한 조건으로 지분비율에 따라 함께 매도할 수 있는 권리(이하 \"공동매도참여권\"이라고 함)를 보장하여야 한다." },
        { kind: "para", text: "② 매도주주는 처분행위 하는 지분을 제3자에게 처분행위 한다는 요지, 당해 제3자의 신원, 양도주식수, 주당 양도가액, 양도예정일 기타 양도의 주요 조건을 명시하여, 양도예정일로부터 30일 이전에 다른 주주들에게 서면 통지하여야 한다." },
        { kind: "ellipsis" },
      ],
    },
    info: {
      what: "공동매도참여권(태그얼롱)입니다. 한 주주가 지분을 제3자에게 팔기로 했을 때, 다른 주주들도 같은 가격과 조건으로 함께 팔 수 있는 권리입니다. 소수 주주 보호 장치로, 대주주만 유리한 조건에 팔고 나가는 상황을 막습니다. 제7조는 태그얼롱과 우선매수권(먼저 살 수 있는 권리)을 함께 규정하며, 매도 주주는 처분 30일 전에 서면으로 알려야 합니다.",
      ifUnset: "이 조항이 없으면 주주 한 명이 지분을 제3자에게 팔 때 나머지 주주들이 동반 매각을 요청할 근거가 없습니다. 우선매수권도 함께 사라지므로, 모르는 제3자가 아무 제한 없이 주주로 들어올 수 있습니다.",
      low: "보장하지 않으면 계약이 단순해지는 대신, 소수 주주는 대주주가 팔고 나가는 상황에서 같은 조건을 요구하기 어려워집니다.",
      high: "보장하면 매도 주주는 처분 전 반드시 통지 절차를 거쳐야 합니다. 주주 구성이 안정되는 효과가 있지만, 지분 매각 절차가 늘어납니다.",
    },
  },
  {
    id: "penalty",
    group: "misc",
    article: "제8조",
    articleTag: "PENALTIES",
    topic: "위약벌",
    proposed: false,
    consensus: true,
    title: "조항을 어기면 얼마를 내나요?",
    desc: "제8조는 주요 조항 위반에 대한 위약벌과 손해배상예정액을 정합니다. 기준 금액과 처분 비율 두 가지로 모든 항이 채워집니다.",
    preview: {
      article: "제8조 (손해배상 및 위약벌)",
      blocks: [
        { kind: "para", text: "① 이 계약의 어느 당사자가 제3조를 위반하는 경우 위반 당사자는 이 계약의 다른 당사자들에게 손해배상과 별도로 위약벌로서 각 {0}원을 지급하여야 한다." },
        { kind: "para", text: "② 이 계약의 어느 당사자가 제4조 및 제5조를 위반하는 경우 위반 당사자는 다른 주주들에게 손해배상과 별도로 위약벌로서 해당 주식 처분 금액의 {1}%에 해당하는 금액을 지급하여야 한다." },
        { kind: "para", text: "③ 이 계약의 어느 당사자가 제3조 또는 제4조 및 제5조를 위반하는 경우 위반 당사자는 다른 주주들에게 손해배상예정액으로써 각 {0}원을 지급하여야 한다. 단, 손해액이 {0}원을 초과하는 경우에는 다른 주주들은 초과하는 손해액을 입증하여 손해배상을 청구할 수 있다." },
        { kind: "para", text: "④ 각 당사자의 위약벌 지급의무는 이 계약의 이행 및 손해배상의무와 별도로 존재한다." },
        { kind: "para", text: "⑤ 이 계약의 어느 당사자가 제6조 또는 제7조를 위반하여 처분행위를 한 경우 위반 당사자는 다른 주주들에게 손해배상과 별도로 위약벌로서 해당 처분 금액의 {1}%에 해당하는 금액 또는 각 {0}원 중 큰 금액을 지급하여야 하며, 해당 처분행위로써 다른 주주들에게 대항할 수 없다." },
      ],
    },
    info: {
      what: "제8조는 이 계약의 주요 조항 위반에 대한 금전적 제재를 규정합니다. 위약벌(①②⑤)은 위반 자체에 대한 제재금으로 실제 손해 배상과 별도로 청구됩니다. 손해배상예정액(③)은 미리 정해 둔 금액이 배상액이 되어 실제 손해를 따로 증명할 필요가 없습니다(민법 제398조 ②항). 제④항은 위약벌을 물더라도 실제 손해에 대한 배상은 따로 청구할 수 있다고 정합니다.",
      ifUnset: "금액과 비율이 정해지지 않으면 각 조항 위반 시 위약벌 조항이 빈칸인 채로 남습니다. 제재 없이 선언만 있는 계약은 위반 억제력이 약해집니다.",
    },
  },
];

/** 구조 선택 답. 고르기 전이거나 "아직 모르겠어요"면 null — 기본값을 채우지 않는다. */
export const structureOf = (answers: Record<string, unknown>): "leader" | "fair" | null => {
  const v = answers.structure;
  const id = typeof v === "string" ? v : (v as { id?: string } | undefined)?.id;
  return id === "leader" || id === "fair" ? id : null;
};

/**
 * 투자를 고려한다고 답했을 때 미리 채워두는 값.
 *
 * 문항을 숨기지 않는 이유: 안 물어도 그 조항은 합의안에 그대로 들어간다. 숨기면
 * 서명할 문서의 내용을 모르고 넘어가고, 변호사가 요구한 리스크 고지를 붙일 자리도
 * 사라진다. 무엇보다 팀원끼리 답을 비교하는 제품이라 숨겨진 항목은 비교에서 빠진다.
 * 그래서 값만 채우고 화면에는 그대로 둔다. 사용자가 언제든 바꿀 수 있다.
 */
export const LEADER_LED_DEFAULTS: Record<string, unknown> = {
  // 협의 기간 기본값. 최종 결정권자는 선택이 아니라 대표로 고정돼 있다.
  deadlock: 7,
  // 변호사: "10억 미만인 경우에는 대표자 혼자 투자를 받을 수 있고, 10억 이상인
  // 경우에는 ... 의사 합치가 안 되는 경우에는 그래도 대표자가 단독으로 결정"
  decisionAmount: 1_000_000_000,
};

/** 기본값이 채워진 문항인지. 화면에서 "이래서 채웠어요" 배지를 띄우는 데 쓴다. */
export const isLeaderLedDefault = (qid: string) => qid in LEADER_LED_DEFAULTS;
