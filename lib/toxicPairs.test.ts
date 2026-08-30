import assert from "node:assert/strict";
import test from "node:test";
import { QUESTION_CONFIGS } from "./gap.ts";
import { QUESTION_DEFS } from "./deepQuestions.ts";

// toxicPairs를 두 파일에 각각 적어두던 시절 q16·q18이 어긋나, 같은 답 조합이
// 히트맵에선 충돌인데 점수엔 반영되지 않는 상태였다. 출처를 하나로 합친 뒤의 잠금.
test("모든 문항의 toxicPairs가 gap.ts에서 온다", () => {
  for (const def of QUESTION_DEFS) {
    const cfg = QUESTION_CONFIGS.find(q => q.field === def.field);
    assert.ok(cfg, `gap.ts에 설정이 없음: ${def.id} (${def.field})`);
    assert.equal(
      JSON.stringify(def.toxicPairs),
      JSON.stringify(cfg!.toxicPairs),
      `toxicPairs 불일치: ${def.id}`
    );
  }
});

test("두 파일의 문항 수가 같다", () => {
  assert.equal(QUESTION_DEFS.length, QUESTION_CONFIGS.length);
});

test("toxicPair가 가리키는 선택지가 실제로 존재한다", () => {
  for (const def of QUESTION_DEFS) {
    for (const [a, b] of def.toxicPairs) {
      assert.ok(def.optionLabels[a], `${def.id}: 없는 선택지 "${a}"`);
      assert.ok(def.optionLabels[b], `${def.id}: 없는 선택지 "${b}"`);
      assert.notEqual(a, b, `${def.id}: 자기 자신과의 쌍`);
    }
  }
});
