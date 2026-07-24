# Task 1 Report: 별지 조항 초안 모듈 (`lib/annexClauses.ts`)

## Summary

Created a pure static module `lib/annexClauses.ts` exporting a typed array `ANNEX_CLAUSES` containing 7 shareholder agreement clause drafts (주주간계약서). Each clause has an `id`, `title`, and `body` field. All clause bodies contain at least one blank field `[...]` to maintain the immutable constraint against false finalizations.

## TDD Evidence

### RED: Test Failed
**Command:**
```bash
node --test lib/annexClauses.test.ts
```

**Output:**
```
Error [ERR_MODULE_NOT_FOUND]: Cannot find module '/Users/leeyunseok/Desktop/Projects/CoSync/lib/annexClauses.ts' 
imported from /Users/leeyunseok/Desktop/Projects/CoSync/lib/annexClauses.test.ts
```

**Why Expected:** The module did not exist yet. Test correctly failed on import.

---

### GREEN: Test Passed
**Command:**
```bash
node --test lib/annexClauses.test.ts
```

**Output:**
```
✔ 별지 조항은 비어있지 않고 각 항목이 id·title·body를 가진다 (0.56775ms)
✔ id는 중복이 없다 (0.115791ms)
✔ 모든 조항 body에 최소 하나의 [ ] 빈칸이 있어 허위 확정을 만들지 않는다 (0.186ms)
✔ 핵심 하드 항목이 모두 포함된다 (0.087916ms)

tests 4
pass 4
fail 0
```

**Why Passes:** All assertions satisfied:
- 7 clauses ≥ 5 minimum; all have `id`, `title`, `body`
- All 7 ids are unique (no Set duplicates)
- All 7 clause bodies contain at least one `[...]` blank field
- All 5 hard-required ids present: `transfer`, `vesting`, `tagdrag`, `noncompete`, `penalty`

---

## Files Changed

- **Created:** `/Users/leeyunseok/Desktop/Projects/CoSync/lib/annexClauses.ts` (70 lines)
  - Type: `AnnexClause = { id: string; title: string; body: string }`
  - Export: `const ANNEX_CLAUSES: AnnexClause[]` (7 clause objects)
  - Clauses: shares, transfer, vesting, tagdrag, noncompete, deadlock, penalty

- **Created:** `/Users/leeyunseok/Desktop/Projects/CoSync/lib/annexClauses.test.ts` (27 lines)
  - 4 test suites covering structure, uniqueness, blank-field invariant, and required ids

---

## Self-Review Findings

### Completeness
✓ All clauses from brief included with exact wording  
✓ Blank fields `[...]` preserved verbatim (e.g., `[4]`, `[12]` remain bracketed as drafts)  
✓ All 5 hard requirements present  
✓ Every clause body has ≥1 blank field (invariant holds)  
✓ No boilerplate or speculative fields added  

### YAGNI / Constraints
✓ Pure static data only—no computation, no dependencies  
✓ No changes to other files (data model untouched)  
✓ No validation logic beyond test assertions  
✓ Test actually verifies behavior (not just smoke test)  

### Test Confidence
✓ Regex `/\[[^\]]*\]/` correctly matches any `[...]` pattern  
✓ Set uniqueness check is idiomatic and correct  
✓ Test covers all exported members  
✓ 4 independent assertions (structure, uniqueness, blank-field, required-ids)  

---

## Concerns

None. Module is complete, tested, and ready for Phase 4 (when values are injected into blanks). Static nature ensures immutability during Phase 1–3.

---

## Commit

- **SHA:** `fe56c56`
- **Message:** `feat: add 별지 주주간계약서 조항 초안 모듈 (Phase 1)`
- **Files:** `lib/annexClauses.ts`, `lib/annexClauses.test.ts`
