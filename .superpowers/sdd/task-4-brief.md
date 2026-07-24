## Task 4: 합의 페이지 UI 폴리시 (텍스트 상향)

[app/consensus/page.tsx](../../../app/consensus/page.tsx) 하단 인라인 `<style>`의 본문 폰트를 한 단계씩 키운다. 로직/구조 변경 없음. reference `reference/CoSync UI/consensus/screen.png`와 육안 비교.

**Files:**
- Modify: `app/agreement/../consensus/page.tsx` → 실제 경로 `app/consensus/page.tsx` (인라인 `<style>` 블록만)

- [ ] **Step 1: 폰트 크기 매핑대로 수정**

아래 각 셀렉터의 `font-size`를 좌→우로 바꾼다(값만 교체, 나머지 속성 유지). 각 항목은 고유 문자열이라 `Edit`로 정확히 치환 가능:

| 셀렉터 | 기존 | 신규 |
|---|---|---|
| `.consensus-cat-title` | `1.25rem` | `1.4rem` |
| `.consensus-item-label` | `1.05rem` | `1.15rem` |
| `.position-name` | `0.85rem` | `0.95rem` |
| `.position-answer` | `0.95rem` | `1.05rem` |
| `.consensus-note` | `0.95rem` | `1.05rem` |
| `.consensus-clause-preview` | `0.95rem` | `1.05rem` |
| `.vote-proposal-meta` | `0.95rem` | `1.05rem` |
| `.vote-pill` | `0.85rem` | `0.95rem` |
| `.propose-option` | `0.9rem` | `1rem` |
| `.propose-textarea` | `0.95rem` | `1.05rem` |
| `.propose-madlibs` | `0.95rem` | `1.05rem` |
| `.comment-text` | `0.9rem` | `1rem` |
| `.comment-input` | `0.9rem` | `1rem` |
| `.consensus-finalize-hint` | `0.9rem` | `1rem` |

예시(Edit): `.position-answer { font-size: 0.95rem;` → `.position-answer { font-size: 1.05rem;` (해당 규칙 블록 내 `font-size` 한 곳만).

- [ ] **Step 2: 빌드 확인**

Run: `npm run build`
Expected: 빌드 성공(CSS만 바뀌어 타입/컴파일 영향 없음).

- [ ] **Step 3: Commit**

```bash
git add app/consensus/page.tsx
git commit -m "style: enlarge body text on consensus page for readability"
```

> 최종 육안 검증(글자가 실제로 커졌는지, reference와 톤 일치)은 Task 6 캡쳐 결과로 확인한다.

---

