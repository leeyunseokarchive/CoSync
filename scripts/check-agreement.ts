// 합의 기능 순수 로직 셀프체크: npx tsx scripts/check-agreement.ts
import assert from "node:assert";
import { QUESTION_CONFIGS, getTeamIssueStatus } from "../lib/gap";
import { CLAUSE_TEMPLATES, buildClauses, groupByChapter, type ResolvedItem } from "../lib/agreementClauses";
import type { OnboardingAnswers } from "../lib/gap";

// 1. 20필드 × 옵션 1-4 전부 조항 존재
for (const q of QUESTION_CONFIGS) {
  for (const opt of ["1", "2", "3", "4"] as const) {
    const text = CLAUSE_TEMPLATES[q.field]?.[opt];
    assert(text && text.length > 10, `missing clause: ${q.field}[${opt}]`);
  }
}
assert.equal(QUESTION_CONFIGS.length, 20);

// 2. getTeamIssueStatus
assert.equal(getTeamIssueStatus(["1", "1"], []), "match");
assert.equal(getTeamIssueStatus(["1", "2"], []), "diff");
assert.equal(getTeamIssueStatus(["1", "3"], [["1", "3"]]), "conflict");
assert.equal(getTeamIssueStatus(["1", undefined], []), "unanswered");
assert.equal(getTeamIssueStatus(["1", "1", "3"], [["1", "3"]]), "conflict"); // 3인: 최악 쌍
assert.equal(getTeamIssueStatus(["1"], []), "unanswered"); // 1인

// 3. buildClauses: 순서 유지, 편집 텍스트 우선, 미해결 필드 제외
const resolved: Partial<Record<keyof OnboardingAnswers, ResolvedItem>> = {
  salaryStructure: { option: "2", source: "consensus", text: "커스텀 조항." },
  extraWorkPriority: { option: "1", source: "match" },
};
const clauses = buildClauses(resolved);
assert.equal(clauses.length, 2);
assert.equal(clauses[0].field, "extraWorkPriority"); // QUESTION_CONFIGS 순서
assert.equal(clauses[0].text, CLAUSE_TEMPLATES.extraWorkPriority["1"]);
assert.equal(clauses[1].text, "커스텀 조항.");

// 4. groupByChapter: 빈 장 제외, cat 정렬
const chapters = groupByChapter(clauses);
assert.equal(chapters.length, 2);
assert.equal(chapters[0].cat, 0);
assert.equal(chapters[1].cat, 5);

console.log("OK: all agreement logic checks passed");
