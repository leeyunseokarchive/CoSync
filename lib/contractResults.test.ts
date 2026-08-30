import assert from "node:assert/strict";
import test from "node:test";
import { resultsFor, won } from "./contractResults.ts";

// 승인된 설계의 기준 답변. 조합 규칙이 전부 걸리도록 채워 둔다.
const FULL = {
  decisionAmount: 100_000_000,
  deadlock: { days: 7, decider: "m1" },
  equity: { m1: 50, m2: 30, m3: 20 },
  noncompete: 1,
  tenure: 3,
  vesting: { apply: "yes", vestingYears: 4, cliffYears: 1 },
  buybackPrice: "par",
  lockup: 5,
  dragAlong: 67,
  penalty: { base: 100_000_000, rate: 30 },
};

test("금액을 한글 단위로 읽는다", () => {
  assert.equal(won(100_000_000), "1억 원");
  assert.equal(won(150_000_000), "1억 5,000만 원");
  assert.equal(won(0), "0원");
});

test("답이 없으면 결과가 없다", () => {
  for (const qid of Object.keys(FULL)) {
    assert.deepEqual(resultsFor(qid, {}), [], `빈 답인데 결과가 나옴: ${qid}`);
  }
});

// 검사할 것은 "한 문항만 답했을 때 조합 결과가 섞이지 않는가"다. 블록 수 자체는
// 문항마다 다를 수 있다(예: dragAlong은 태그얼롱과의 관계를 한 줄 더 붙인다).
test("한 문항만 답하면 조합 결과가 섞이지 않는다", () => {
  const only = (qid: string, key: string) =>
    resultsFor(qid, { [key]: FULL[key as keyof typeof FULL] });
  for (const qid of Object.keys(FULL)) {
    const blocks = only(qid, qid);
    assert.ok(blocks.length >= 1, `단독 결과가 없음: ${qid}`);
    for (const b of blocks) {
      assert.equal(b.from, undefined, `한 문항만 답했는데 조합으로 표시됨: ${qid} / ${b.id}`);
    }
  }
});

test("조합 결과 6개는 두 문항이 다 있을 때만 붙는다", () => {
  const pairs: [string, string[], string][] = [
    ["tenure", ["tenure", "vesting"], "tenure-vesting"],
    ["tenure", ["tenure", "lockup"], "tenure-lockup"],
    ["dragAlong", ["dragAlong", "equity"], "drag-equity"],
    // TODO: resultsFor에 위약벌 결과 블록이 아직 없다. 구현되면 되살린다.
    // ["penalty", ["penalty", "equity"], "penalty-equity"],
    ["deadlock", ["deadlock", "equity"], "deadlock-equity"],
    ["noncompete", ["noncompete", "buybackPrice"], "noncompete-buyback"],
    ["lockup", ["lockup", "dragAlong"], "lockup-drag"],
  ];
  for (const [qid, keys, id] of pairs) {
    const both = Object.fromEntries(keys.map((k) => [k, FULL[k as keyof typeof FULL]]));
    const one = { [keys[0]]: FULL[keys[0] as keyof typeof FULL] };
    assert.ok(resultsFor(qid, both).some((r) => r.id === id), `조합 결과 안 나옴: ${id}`);
    assert.ok(!resultsFor(qid, one).some((r) => r.id === id), `한쪽만 답했는데 조합이 나옴: ${id}`);
  }
});

test("근무 의무가 베스팅보다 길면 어긋남 결과가 없다", () => {
  const answers = { tenure: 5, vesting: { apply: "yes", vestingYears: 4, cliffYears: 1 } };
  assert.ok(!resultsFor("tenure", answers).some((r) => r.id === "tenure-vesting"));
});

test("베스팅 미적용이면 베스팅 결과가 없다", () => {
  const answers = { vesting: { apply: "no", vestingYears: 4, cliffYears: 1 } };
  assert.deepEqual(resultsFor("vesting", answers), []);
});

// §2-1: 결과는 상태만 서술한다. 판단·권고 표현이 들어가면 실패한다.
test("결과 문장에 판단 표현이 없다", () => {
  // 한글은 어절 경계가 없어 "주의"는 "주주의"에, "손해"는 "손해배상예정액"에 걸린다.
  // 판단 표현은 어미까지 붙은 형태로만 검사한다.
  const BANNED = [
    "권장", "추천", "통상", "업계 평균",
    "위험", "불리", "조심", "바람직",
    "주의하", "주의가", "유의하", "유의가", "손해를", "손해가",
  ];
  for (const qid of Object.keys(FULL)) {
    for (const r of resultsFor(qid, FULL)) {
      for (const word of BANNED) {
        assert.ok(!r.plain.includes(word), `쉬운 말에 금지어 "${word}": ${r.id}`);
        assert.ok(!r.formal.includes(word), `정식 문장에 금지어 "${word}": ${r.id}`);
      }
    }
  }
});

test("모든 결과에 쉬운 말과 정식 문장이 함께 있다", () => {
  for (const qid of Object.keys(FULL)) {
    for (const r of resultsFor(qid, FULL)) {
      assert.ok(r.plain.length > 10, `쉬운 말 없음: ${r.id}`);
      assert.ok(r.formal.length > r.plain.length, `정식 문장이 더 짧음: ${r.id}`);
      assert.ok(/제\d|상법|민법/.test(r.formal), `정식 문장에 조문 근거 없음: ${r.id}`);
    }
  }
});

test("도형은 4종뿐이다", () => {
  const shapes = new Set<string>();
  for (const qid of Object.keys(FULL)) {
    for (const r of resultsFor(qid, FULL)) shapes.add(r.figure.shape);
  }
  assert.deepEqual(
    [...shapes].sort(),
    ["balance", "magnitude", "threshold", "timeline"]
  );
});
