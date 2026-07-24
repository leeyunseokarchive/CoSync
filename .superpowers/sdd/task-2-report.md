# Task 2 Report: 합의서 본문 계약서화 — 전문·제N조·일반조항·서명란

(Note: this file previously held a stale report from an unrelated earlier "Task 2" run — overwritten with this task's content below.)

## Changes applied

File: `app/agreement/document/page.tsx`

1. **Step 1** — Added `const chapters = doc ? groupByChapter(doc.clauses) : [];` directly below the `const doc = ...` block (after line 40).
2. **Step 2** — Inserted `<section className="doc-preamble">` block (전문) right after `</header>`, containing: purpose statement using `team?.name`, party name/role list (conditional on `members.length > 0`), and 작성일 (conditional on `doc.createdAt`).
3. **Step 3** — Replaced the old `groupByChapter(doc.clauses).map((ch) => ...)` block (which used `제{ch.cat + 1}장.`) with:
   - `chapters.map((ch, ci) => ...)` rendering `제{ci + 1}조 ({ch.label})` — sequential, index-based numbering that no longer skips numbers when a category is empty.
   - Two new fixed 일반조항 sections: `제{chapters.length + 1}조 (효력과 시행)` and `제{chapters.length + 2}조 (분쟁의 해결)`, each with the exact brief wording.
4. **Step 4** — Replaced the `.doc-parties` participant list in the footer with a `.doc-signatures` block (서명란): one row per member with name/role, a signature line, and confirmation status (`전자적 동의 {date}` or `미확정`), plus 작성일 date line. `doc.status === "confirmed"` note (`doc-confirmed-note`) and `doc-generated` footer line were left untouched, directly after the new signatures block.
5. **Step 5** — Added CSS for `.doc-preamble`, `.doc-preamble-body`, `.doc-preamble-parties`, `.doc-preamble-date`, `.doc-general-clause`, `.doc-signatures`, `.doc-signature`, `.doc-signature-name`, `.doc-signature-line`, `.doc-signature-status`, `.doc-signature-date` — placed right after `.doc-clause-num` (end of `.doc-chapter` rule group) and before `.doc-footer`, exactly as specified.

All code inserted verbatim from the brief at the exact insertion points; no data model or Firestore schema changes; no PII fields (주민등록번호/주소) added.

## Type check

Command: `npx tsc --noEmit`
Output: (none)
Exit code: 0

## Step 7 (screenshot) — SKIPPED per controller instructions

Did not start dev server or run `scripts/capture-screenshots.mjs`. Visual verification deferred to the controller after the next task.

## Files changed

- `app/agreement/document/page.tsx` (1 file changed, 55 insertions, 7 deletions)

## Self-review

- Insertion points matched the brief's line references exactly before editing (verified via Read before any Edit).
- No leftover `제{ch.cat + 1}장` — confirmed via post-edit read of lines 73–172; old chapter-render block fully replaced.
- Chapter numbering is sequential and index-based: `제{ci + 1}조` for content chapters, then `제{chapters.length + 1}조` / `제{chapters.length + 2}조` for the two general clauses — continuous from 1 with no gaps regardless of empty categories.
- `doc-confirmed-note` and `doc-generated` footer elements preserved unchanged, still gated on `doc.status === "confirmed"`.
- `doc.createdAt` guards preserved in both the new preamble and the new signature block (matches existing pattern used elsewhere in the file).
- CSS added in the correct location (after `.doc-chapter`-family rules, before `.doc-footer`), matching brief Step 5 exactly, character-for-character.
- No new dependencies, no data model/schema changes, no PII (주민등록번호/주소) introduced — consistent with global constraints.

## Concerns

None. `tsc --noEmit` is clean, all insertion points matched the brief without modification, and the diff is scoped to the single file as required.

## Commit

`fadc43b` — `feat: 합의서 본문 계약서화 — 전문·제N조·일반조항·서명란 (Phase 1)` (branch `feat/agreement-contract-format`)
