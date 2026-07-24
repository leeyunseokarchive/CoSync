import assert from "node:assert/strict";
import test from "node:test";
import { ANNEX_CLAUSES } from "./annexClauses.ts";

test("별지 조항은 비어있지 않고 각 항목이 id·title·body를 가진다", () => {
  assert.ok(ANNEX_CLAUSES.length >= 5);
  for (const c of ANNEX_CLAUSES) {
    assert.ok(c.id && c.title && c.body, `누락 필드: ${JSON.stringify(c)}`);
  }
});

test("id는 중복이 없다", () => {
  const ids = ANNEX_CLAUSES.map((c) => c.id);
  assert.equal(new Set(ids).size, ids.length);
});

test("모든 조항 body에 최소 하나의 [ ] 빈칸이 있어 허위 확정을 만들지 않는다", () => {
  for (const c of ANNEX_CLAUSES) {
    assert.match(c.body, /\[[^\]]*\]/, `빈칸 없는 조항: ${c.id}`);
  }
});

test("핵심 하드 항목이 모두 포함된다", () => {
  const ids = new Set(ANNEX_CLAUSES.map((c) => c.id));
  for (const need of ["transfer", "vesting", "tagdrag", "noncompete", "penalty"]) {
    assert.ok(ids.has(need), `누락: ${need}`);
  }
});
