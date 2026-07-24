## Task 5: 문서 생성 페이지 UI 폴리시 (텍스트 상향)

[app/agreement/document/page.tsx](../../../app/agreement/document/page.tsx) 하단 인라인 `<style>`의 조항 본문·제목 폰트를 키운다. 조항 본문(`.doc-chapter li`)이 핵심.

**Files:**
- Modify: `app/agreement/document/page.tsx` (인라인 `<style>` 블록만)

- [ ] **Step 1: 폰트 크기 매핑대로 수정**

| 셀렉터 | 기존 | 신규 |
|---|---|---|
| `.doc-header h1` | `clamp(1.5rem, 4vw, 2rem)` | `clamp(1.7rem, 4.5vw, 2.4rem)` |
| `.doc-meta` | `0.85rem` | `0.95rem` |
| `.doc-chapter h2` | `1.05rem` | `1.2rem` |
| `.doc-chapter li` | `0.92rem` | `1.05rem` |
| `.doc-party` | `0.9rem` | `1rem` |
| `.doc-parties-label` | `0.78rem` | `0.85rem` |
| `.doc-confirmed-note` | `0.88rem` | `1rem` |

예시(Edit): `.doc-chapter li { font-size: 0.92rem;` → `.doc-chapter li { font-size: 1.05rem;`.

- [ ] **Step 2: 인쇄(PDF) 레이아웃 회귀 확인**

`@media print` 블록은 폰트 크기를 재정의하지 않으므로 상향값이 그대로 인쇄에 반영된다. `.agreement-doc`의 `max-width: 820px`는 유지 — A4 인쇄 시 조항이 잘리지 않는지 육안 확인 대상(Task 6 이후).

Run: `npm run build`
Expected: 빌드 성공.

- [ ] **Step 3: Commit**

```bash
git add app/agreement/document/page.tsx
git commit -m "style: enlarge clause and heading text on agreement document page"
```

---

