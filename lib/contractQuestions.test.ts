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

test("질문은 16개이고 id가 중복되지 않는다", () => {
  assert.equal(CONTRACT_QUESTIONS.length, 16);
  const ids = CONTRACT_QUESTIONS.map((q) => q.id);
  assert.equal(new Set(ids).size, ids.length);
});

test("확정 9개 / 제안 7개로 나뉜다", () => {
  const proposed = CONTRACT_QUESTIONS.filter((q) => q.proposed);
  assert.deepEqual(
    proposed.map((q) => q.id),
    ["structure", "identity", "shareType", "ipTransfer", "vesting", "noncompete", "buybackPrice"]
  );
  assert.equal(CONTRACT_QUESTIONS.length - proposed.length, 9);
});

test("모든 질문에 정보 카드 2종(무엇인가·정하지 않으면)이 있다", () => {
  for (const q of CONTRACT_QUESTIONS) {
    assert.ok(q.info.what?.length > 20, `조항 설명 없음: ${q.id}`);
    assert.ok(q.info.ifUnset?.length > 20, `미설정 시 설명 없음: ${q.id}`);
  }
});

// 변호사법 제109조 리스크 — 특정 값을 권하거나 업계 평균을 단정하는 문구를 두지 않는다.
test("권고·통계 단정 표현이 사용자 노출 문자열에 없다", () => {
  const BANNED = ["권장", "추천", "통상", "업계 평균", "일반적으로 씁니다", "하는 것이 좋", "권고"];
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

test("종류주식은 고른 내용을 괄호로 덧붙여 조문에 들어간다", () => {
  const t = CONTRACT_QUESTIONS.find((q) => q.id === "shareType")!
    .template as Extract<QuestionTemplate, { type: "choice" }>;
  assert.equal(choiceLabel(t, "common"), "보통주식");
  assert.equal(choiceLabel(t, { id: "preferred", sub: [] }), "종류주식");
  assert.equal(choiceLabel(t, { id: "preferred", sub: ["redeemable", "convertible"] }), "종류주식 (상환주식·전환주식)");
  assert.equal(choiceLabel(t, "없는값"), null);
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
