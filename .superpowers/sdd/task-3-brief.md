### Task 3: 별지 조항 초안 + DRAFT 배지 + 최하단 디스클레이머

**Files:**
- Modify: `app/agreement/document/page.tsx` (import + JSX + `<style>`)

**Interfaces:**
- Consumes: `ANNEX_CLAUSES`(Task 1).
- Produces: (없음)

- [ ] **Step 1: import 추가**

파일 상단 import 목록([12행 `groupByChapter` import 부근](../../../app/agreement/document/page.tsx#L12))에 추가:

```tsx
import { ANNEX_CLAUSES } from "../../../lib/annexClauses";
```

- [ ] **Step 2: 빈칸 강조 렌더 헬퍼 추가**

`fmtDate` 정의([16-17행](../../../app/agreement/document/page.tsx#L16-L17)) 아래에 추가 (`[...]` 토큰을 회색 표시로 감싸 미확정임을 시각화):

```tsx
function renderWithBlanks(body: string): React.ReactNode {
  return body.split(/(\[[^\]]*\])/g).map((part, i) =>
    /^\[[^\]]*\]$/.test(part) ? (
      <mark key={i} className="doc-blank">{part}</mark>
    ) : (
      <React.Fragment key={i}>{part}</React.Fragment>
    )
  );
}
```

(`React`는 [5행](../../../app/agreement/document/page.tsx#L5)에서 이미 import됨.)

- [ ] **Step 3: 별지 + 디스클레이머 JSX 삽입**

`</footer>`(현재 [111행](../../../app/agreement/document/page.tsx#L111)) **바로 아래**, `</article>` 위에 삽입:

```tsx
              <section className="doc-annex">
                <div className="doc-annex-badge">DRAFT · 변호사 검토 전 법적 효력 없음</div>
                <h2 className="doc-annex-title">[별지] 주주간계약서 조항 초안</h2>
                <ol className="doc-annex-list">
                  {ANNEX_CLAUSES.map((c, i) => (
                    <li key={c.id}>
                      <span className="doc-annex-clause-title">제{i + 1}조 ({c.title})</span>{" "}
                      <span className="doc-annex-clause-body">{renderWithBlanks(c.body)}</span>
                    </li>
                  ))}
                </ol>
              </section>

              <p className="doc-disclaimer">
                본 문서는 구성원 간 자율적 운영 합의로, 법적 계약(주주간계약서 등)을 대체하지 않습니다. 별지 조항은 표준 실무를 참고한 초안이며 변호사 검토 후 효력이 발생합니다.
              </p>
```

- [ ] **Step 4: 별지·디스클레이머 CSS 추가**

`<style>` 블록의 `@media print` **앞**에 추가:

```css
        .doc-annex { margin-top: 40px; padding-top: 28px; border-top: 2px dashed #cbd5e1; break-before: page; }
        .doc-annex-badge { display: inline-block; border: 1.5px solid #b45309; color: #b45309; font-weight: 700; font-size: 0.78rem; letter-spacing: 0.5px; padding: 4px 10px; border-radius: 6px; margin-bottom: 14px; }
        .doc-annex-title { font-size: 1.2rem; font-weight: 800; color: #0f172a; margin-bottom: 16px; }
        .doc-annex-list { list-style: none; display: flex; flex-direction: column; gap: 14px; }
        .doc-annex-list li { font-size: 1rem; line-height: 1.8; color: #334155; }
        .doc-annex-clause-title { font-weight: 700; color: #0f172a; }
        .doc-blank { background: #f1f5f9; color: #94a3b8; font-weight: 600; border-radius: 4px; padding: 0 2px; }
        .doc-disclaimer { margin-top: 28px; font-size: 0.76rem; line-height: 1.6; color: #94a3b8; }
```

`@media print` 블록 안에 배지가 흑백에서도 보이도록 추가:

```css
          .doc-annex-badge { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .doc-blank { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
```

- [ ] **Step 5: 타입체크**

Run: `npx tsc --noEmit`
Expected: 종료 코드 0, 출력 없음.

- [ ] **Step 6: 스크린샷 검증**

```bash
node scripts/capture-screenshots.mjs
```
Expected: `docs/captures/2026-07-24/agreement-document.png`에 [별지] 주주간계약서 조항 초안(제1조~제7조), `DRAFT` 배지, `[  ]` 빈칸 회색 표시, 최하단 작은 글씨 디스클레이머가 보임.

- [ ] **Step 7: 정적 export 빌드 확인 (별지 import가 export를 깨지 않는지)**

Run: `npm run build`
Expected: 빌드 성공(`✓ Compiled`, export 완료).

- [ ] **Step 8: Commit**

```bash
git add app/agreement/document/page.tsx
git commit -m "feat: 별지 주주간계약서 조항 초안 + DRAFT 배지 + 디스클레이머 (Phase 1)"
```

---

