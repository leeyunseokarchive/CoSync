# Task 3 Report: 별지 주주간계약서 조항 초안 + DRAFT 배지 + 최하단 디스클레이머

## Status: DONE

## Edits Applied (all in `app/agreement/document/page.tsx`)

1. **Step 1 — import**: Added `import { ANNEX_CLAUSES } from "../../../lib/annexClauses";` right after the existing `groupByChapter` import (line 12).
2. **Step 2 — `renderWithBlanks` helper**: Inserted directly below `fmtDate` (verbatim from brief), using the already-imported `React` (line 5) for `React.Fragment` / `React.ReactNode`.
3. **Step 3 — 별지 + 디스클레이머 JSX**: Inserted immediately after `</footer>` and before `</article>` (footer close location matched structurally, not by the brief's stale line number, per task instructions). Renders `ANNEX_CLAUSES` as `제N조 (title)` list items with `renderWithBlanks(c.body)`, DRAFT badge, and the exact disclaimer paragraph.
4. **Step 4 — CSS**: Added `.doc-annex`, `.doc-annex-badge`, `.doc-annex-title`, `.doc-annex-list`, `.doc-annex-list li`, `.doc-annex-clause-title`, `.doc-blank`, `.doc-disclaimer` rules before `@media print`, and added the two `print-color-adjust: exact` rules for `.doc-annex-badge` / `.doc-blank` inside `@media print`. Badge relies on border + bold text (no background fill), so it's visible on grayscale printers regardless of the color-adjust rule.
5. **Extra cleanup**: Deleted the dead `.doc-party { font-size: 1rem; color: #334155; line-height: 1.8; }` rule (the `.doc-party` element was removed from JSX in a previous task). `.doc-parties-label` was left untouched as instructed.

## Verification

- `npx tsc --noEmit` → exit 0, no output.
- `npm run build` → `✓ Compiled successfully`, all 22 static routes generated including `/agreement/document`, no errors.

```
▲ Next.js 16.1.6 (Turbopack)
✓ Compiled successfully in 3.0s
  Running TypeScript ...
✓ Generating static pages using 10 workers (22/22) in 301.2ms
...
├ ○ /agreement/document
...
○  (Static)  prerendered as static content
```

## Files Changed

- `app/agreement/document/page.tsx` (1 file, 38 insertions / 1 deletion)

## Commit

- `8a3bc8e` — `feat: 별지 주주간계약서 조항 초안 + DRAFT 배지 + 디스클레이머 (Phase 1)` (branch: `feat/agreement-contract-format`)

Note: other unrelated modified/untracked files were present in the working tree (`.superpowers/sdd/progress.md`, other task briefs/reports, `next-env.d.ts`, `tsconfig.tsbuildinfo`, untracked `marketing/`) from concurrent work outside this task's scope. These were left untouched — only `app/agreement/document/page.tsx` was staged and committed. (Note: `.superpowers/sdd/task-3-report.md` itself — this file — was found pre-populated with a stale report from an unrelated prior task run; it has been overwritten with this task's actual report.)

## Self-Review

- DRAFT badge present with exact text `DRAFT · 변호사 검토 전 법적 효력 없음`, styled with border + bold color (no background fill), so it survives grayscale printing without depending on background color rendering.
- `[  ]` blanks: `renderWithBlanks` regex-splits clause body text on `[...]` tokens and wraps matches in `<mark className="doc-blank">`, styled with light gray background/text — visually distinct as "not yet determined."
- Disclaimer text sits at the very bottom of `<article>` (after the annex section), matching the required string verbatim, character-for-character.
- Print CSS: `.doc-annex` has `break-before: page` so the annex starts a fresh printed page; badge and blank both get `print-color-adjust: exact` so their border/background render faithfully in printed output.
- No broken JSX: `tsc --noEmit` and full Next.js build both succeeded, confirming the JSX nesting (`</footer>` → new `<section className="doc-annex">` → new `<p className="doc-disclaimer">` → `</article>`) is well-formed.
- Data model untouched — only consumes `ANNEX_CLAUSES` from Task 1's `lib/annexClauses.ts` (7 entries, `제1조`–`제7조`), no changes made there.

## Concerns

None. Playwright screenshot verification (brief Step 6) intentionally skipped per instructions — controller handles visual verification.
