import assert from "node:assert/strict";
import test from "node:test";
import { selectDeepQuestions } from "./deepQuestions.ts";
import type { OnboardingAnswers } from "./gap.ts";

test("멤버 1명 이하면 빈 배열", () => {
  assert.deepEqual(selectDeepQuestions([]), []);
  assert.deepEqual(selectDeepQuestions([{ extraWorkPriority: "1" }]), []);
});

test("일치 문항은 제외, 차이/충돌 문항만 선택하고 충돌을 앞에 둔다", () => {
  // q1 extraWorkPriority toxicPairs [["3","4"]] -> 3 vs 4 = conflict
  // q7 exitVision toxicPairs [["1","3"]]; 1 vs 2 = diff(비독성)
  // extraWorkPrinciple 동일값 -> match(제외)
  const a: OnboardingAnswers = { extraWorkPriority: "3", exitVision: "1", extraWorkPrinciple: "2" };
  const b: OnboardingAnswers = { extraWorkPriority: "4", exitVision: "2", extraWorkPrinciple: "2" };
  const items = selectDeepQuestions([a, b]);
  const fields = items.map((i) => i.def.field);
  assert.ok(fields.includes("extraWorkPriority"));
  assert.ok(fields.includes("exitVision"));
  assert.ok(!fields.includes("extraWorkPrinciple"));
  assert.equal(items[0].status, "conflict"); // 충돌이 맨 앞
  assert.equal(items[0].def.field, "extraWorkPriority");
});
