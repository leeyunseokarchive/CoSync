import assert from "node:assert/strict";
import test from "node:test";
import { splitPointsFor } from "./deepQuestions.ts";

// q2 extraWorkPrinciple의 toxicPairs는 [["1","3"],["1","4"]].
test("내 답이 toxicPair 한쪽이면 반대쪽을 전부 모은다", () => {
  const [sp] = splitPointsFor({ extraWorkPrinciple: "1" });
  assert.deepEqual(sp.theirs, ["3", "4"]);
});

test("쌍의 반대 방향에서도 잡힌다", () => {
  const [sp] = splitPointsFor({ extraWorkPrinciple: "3" });
  assert.deepEqual(sp.theirs, ["1"]);
});

test("toxicPair에 없는 답은 갈림 지점이 아니다", () => {
  assert.deepEqual(splitPointsFor({ extraWorkPrinciple: "2" }), []);
});

test("무응답은 무시한다", () => {
  assert.deepEqual(splitPointsFor({}), []);
  assert.deepEqual(splitPointsFor({ extraWorkPrinciple: undefined }), []);
});

test("중복 상대는 한 번만 센다", () => {
  for (const sp of splitPointsFor({ extraWorkPrinciple: "1", underperformanceAction: "4" })) {
    assert.equal(new Set(sp.theirs).size, sp.theirs.length, `중복: ${sp.def.id}`);
  }
});
