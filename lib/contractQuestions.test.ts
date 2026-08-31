import assert from "node:assert/strict";
import test from "node:test";
import {
  CONTRACT_QUESTIONS,
  QUESTION_GROUPS,
  MOCK_MEMBERS,
  validateAllocation,
  tenureWarning,
  fillPreview,
  choiceLabel,
  type QuestionTemplate,
} from "./contractQuestions.ts";

test("질문은 15개이고 id가 중복되지 않는다", () => {
  assert.equal(CONTRACT_QUESTIONS.length, 15);
  const ids = CONTRACT_QUESTIONS.map((q) => q.id);
  assert.equal(new Set(ids).size, ids.length);
});

test("확정 9개 / 제안 6개로 나뉜다", () => {
  const proposed = CONTRACT_QUESTIONS.filter((q) => q.proposed);
  assert.deepEqual(
    proposed.map((q) => q.id),
    ["identity", "structure", "ipTransfer", "vesting", "noncompete", "buybackPrice"]
  );
  assert.equal(CONTRACT_QUESTIONS.length - proposed.length, 9);
});

test("모든 질문에 정보 카드 2종(무엇인가·정하지 않으면)이 있다", () => {
  for (const q of CONTRACT_QUESTIONS) {
    assert.ok(q.info.what?.length > 20, `조항 설명 없음: ${q.id}`);
    assert.ok(q.info.ifUnset?.length > 20, `미설정 시 설명 없음: ${q.id}`);
  }
});

// 변호사법 제109조가 막는 건 "법률 판단"이지 "실무 관행 서술"이 아니다.
// 2차 변호사 자문에서 경계가 명확해졌다:
//   "법적으로 이렇게 해야지만 안전합니다"           → 위반 가능
//   "통상적으로 이런 경우가 많고, 투자에 더 유리할 것 같다" → 가능
//   "완전 초기 설립 단계 스타트업은 대표 혼자 특별 결의 정족수 66.7% 이상을
//    권고하는 경우가 많다 — 이거를 투자자들이 좋아하는 정도는 넣어도 괜찮을 것 같은데"
// 그래서 "통상"·"권고"·"추천" 같은 관행 서술은 풀고, 법률 판단 단정만 막는다.
// 업계 평균처럼 근거 없는 수치 단정은 그대로 금지한다(marketing 톤 규칙과 같은 이유).
test("법률 판단을 단정하는 표현이 사용자 노출 문자열에 없다", () => {
  const BANNED = [
    "법적으로",        // "법적으로 이렇게 해야 안전합니다"
    "해야 안전",
    "안전합니다",
    "위법",
    "적법",
    "업계 평균",       // 근거 없는 수치 단정
  ];
  for (const q of CONTRACT_QUESTIONS) {
    const surfaces = [q.title, q.desc, q.info.what, q.info.ifUnset, q.info.low ?? "", q.info.high ?? ""];
    for (const text of surfaces) {
      for (const word of BANNED) {
        assert.ok(!text.includes(word), `${q.id}: 금지 표현 "${word}" — ${text.slice(0, 60)}`);
      }
    }
  }
});

test("모든 질문의 group이 QUESTION_GROUPS에 존재한다", () => {
  const groupIds = new Set(QUESTION_GROUPS.map((g) => g.id));
  for (const q of CONTRACT_QUESTIONS) {
    assert.ok(groupIds.has(q.group), `알 수 없는 그룹: ${q.id} -> ${q.group}`);
  }
});

// 미리보기 블록 안의 모든 문자열을 한 줄씩 뽑는다. 표는 셀 단위로 편다.
function previewStrings(q: (typeof CONTRACT_QUESTIONS)[number]): string[] {
  return q.preview.blocks.flatMap((b) =>
    b.kind === "table" ? [...b.head, ...b.rows.flat()] : b.kind === "ellipsis" ? [] : [b.text]
  );
}

test("모든 질문은 조문 제목과 치환 자리를 가진다", () => {
  for (const q of CONTRACT_QUESTIONS) {
    assert.ok(q.preview.article.startsWith("제") || q.preview.article.startsWith("계약"), `조문 제목 이상: ${q.id}`);
    assert.ok(q.preview.blocks.length >= 1, `미리보기 블록 없음: ${q.id}`);
    // consensus:false 정보 문항은 합의 대상이 아니라 빈칸이 없다.
    if (q.consensus) {
      assert.ok(
        previewStrings(q).some((line) => /\{\d\}/.test(line)),
        `치환 자리 없음: ${q.id}`
      );
    }
  }
});

test("미리보기에 마크다운 표 기호가 남아있지 않다", () => {
  for (const q of CONTRACT_QUESTIONS) {
    for (const line of previewStrings(q)) {
      assert.ok(!line.includes("|"), `마크다운 표 잔존: ${q.id} — ${line.slice(0, 40)}`);
    }
  }
});

test("7종 템플릿이 모두 최소 한 번씩 쓰인다", () => {
  const used = new Set(CONTRACT_QUESTIONS.filter((q) => q.template).map((q) => q.template!.type));
  for (const t of ["amount", "duration", "percent", "choice", "matrix", "fields", "composite"]) {
    assert.ok(used.has(t as never), `쓰이지 않은 템플릿: ${t}`);
  }
});

test("멤버별 입력 질문은 팀원 수만큼의 표 행을 가진다", () => {
  for (const q of CONTRACT_QUESTIONS) {
    if (!q.template || q.template.type !== "matrix") continue;
    const table = q.preview.blocks.find((b) => b.kind === "table");
    assert.ok(table && table.kind === "table", `표 블록 없음: ${q.id}`);
    const memberRows = table.rows.filter((r) => MOCK_MEMBERS.some((m) => r[0] === m.name));
    assert.equal(memberRows.length, MOCK_MEMBERS.length, `행 수 불일치: ${q.id}`);
  }
});



test("지분 합계가 100이면 통과한다", () => {
  const r = validateAllocation({ a: 50, b: 30, c: 20 });
  assert.equal(r.total, 100);
  assert.equal(r.ok, true);
  assert.equal(r.remaining, 0);
});

test("지분 합계가 모자라면 남은 양을 알려준다", () => {
  const r = validateAllocation({ a: 50, b: 30, c: 10 });
  assert.equal(r.ok, false);
  assert.equal(r.remaining, 10);
});

test("지분 합계가 넘치면 remaining이 음수가 된다", () => {
  const r = validateAllocation({ a: 60, b: 30, c: 20 });
  assert.equal(r.ok, false);
  assert.equal(r.remaining, -10);
});

test("빈 값은 0으로 세어 초기 상태에서 통과하지 않는다", () => {
  assert.equal(validateAllocation({}).ok, false);
});

test("계속근무 3년 미만이면 5조② 정합성 경고를 낸다", () => {
  const w = tenureWarning(2);
  assert.ok(w);
  assert.match(w, /3년/);
});

test("계속근무 3년 이상이면 경고가 없다", () => {
  assert.equal(tenureWarning(3), null);
  assert.equal(tenureWarning(5), null);
});

test("미리보기는 값이 들어간 조각을 filled로 표시한다", () => {
  const parts = fillPreview("주주들은 {0}일간 협의한다.", ["7"]);
  assert.deepEqual(parts, [
    { text: "주주들은 ", filled: false },
    { text: "7", filled: true },
    { text: "일간 협의한다.", filled: false },
  ]);
});

test("값이 없으면 빈칸 기호를 남기고 filled가 아니다", () => {
  const parts = fillPreview("주주들은 {0}일간 협의한다.", [null]);
  assert.equal(parts[1].text, "[  ]");
  assert.equal(parts[1].filled, false);
});

test("같은 자리를 여러 번 참조해도 모두 치환된다", () => {
  const parts = fillPreview("각 {0}원. 손해액이 {0}원을 초과하면", ["1억"]);
  const filled = parts.filter((p) => p.filled);
  assert.equal(filled.length, 2);
  assert.equal(filled[0].text, "1억");
  assert.equal(filled[1].text, "1억");
});
