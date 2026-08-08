import assert from "node:assert/strict";
import test from "node:test";
import { GLOSSARY, TERM_RE } from "./glossary.ts";

test("긴 말이 먼저 잡힌다 — 경업금지가 경업으로 쪼개지지 않는다", () => {
  assert.deepEqual("퇴사 후 경업금지 기간".split(TERM_RE), ["퇴사 후 ", "경업금지", " 기간"]);
});

test("사전에 있는 말만 조각으로 떨어진다", () => {
  assert.deepEqual("액면가로 매수한다".split(TERM_RE), ["", "액면가", "로 매수한다"]);
  assert.deepEqual("합의가 필요합니다".split(TERM_RE), ["합의가 필요합니다"]);
});

// 뜻풀이도 사용자 노출 문자열이다 — 값을 권하는 표현이 들어가면 안 된다(변호사법 제109조).
test("뜻풀이에 권고 표현이 없다", () => {
  const BANNED = ["권장", "추천", "통상", "업계 평균", "바람직", "하는 것이 좋", "권고"];
  for (const [term, desc] of Object.entries(GLOSSARY)) {
    for (const word of BANNED) {
      assert.ok(!desc.includes(word), `${term}: 금지 표현 "${word}"`);
    }
  }
});
