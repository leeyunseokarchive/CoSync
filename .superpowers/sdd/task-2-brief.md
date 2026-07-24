## Task 2: 주주간 계약서 양식 분석 문서

문서 리서치 태스크. TDD 대상 아님 — 검증은 콘텐츠 체크리스트.

**Files:**
- Create: `docs/shareholder-agreement-template-analysis.md`

**참고 소스:**
- [lib/agreementClauses.ts](../../../lib/agreementClauses.ts) — 현재 20문항 × 4옵션 조항 템플릿(`CLAUSE_TEMPLATES`)과 카테고리(`CAT_LABELS`). 우리가 이미 커버하는 항목 파악용.
- 웹 리서치: 실제 주주간 계약서(SHA, Shareholders' Agreement)·동업 계약서 표준 양식.

- [ ] **Step 1: 외부 표준 양식 리서치(외부 리서치 포함)**

WebSearch/WebFetch로 주주간 계약서의 공통 필수 조항을 조사한다. 최소 다음 항목의 유무·표준 문구를 정리:
- 당사자/주식 보유 현황, 지분 구조.
- 이사회 구성·의결 정족수, 주요 경영사항 사전동의(reserved matters).
- 지분 양도 제한(우선매수권 ROFR, 동반매도권 tag-along, 동반매각요구권 drag-along).
- 이탈/퇴사 시 지분 처리(good leaver / bad leaver, 매수청구·강제매도).
- 베스팅(vesting)·클리프(cliff), 경업금지, 비밀유지.
- 교착(deadlock) 해소, 분쟁 해결(중재/관할).

- [ ] **Step 2: 우리 조항과의 매핑 표 작성**

`CLAUSE_TEMPLATES`/`CAT_LABELS`(agreementClauses.ts)를 열어 우리가 **이미 커버 / 부분 커버 / 미커버**하는 표준 조항을 표로 매핑한다:
```markdown
| 표준 필수 조항 | 우리 커버 여부 | 대응 문항/카테고리 | 보완 제안 |
|---|---|---|---|
```

- [ ] **Step 3: 문서 구조 확정**

```markdown
# 주주간 계약서 표준 양식 분석 및 CoSync 조항 매핑

## 1. 주주간 계약서란 (법적 성격·목적)
## 2. 공통 필수 조항 목록 (표준 문구 포함)
## 3. CoSync 현재 조항 ↔ 표준 조항 매핑 표
## 4. 완성도 향상을 위한 보완 필수 정보 목록
## 5. 출처
```

- [ ] **Step 4: 콘텐츠 체크리스트 검증**

- 2장에 ROFR/tag-along/drag-along/vesting/good-bad leaver/deadlock 항목 모두 포함.
- 3장 매핑 표가 실제 `CAT_LABELS` 카테고리를 참조.
- 5장에 출처 링크.

Run: `test -f docs/shareholder-agreement-template-analysis.md && grep -Eic "tag-along|drag-along|vesting|우선매수" docs/shareholder-agreement-template-analysis.md`
Expected: 파일 존재, 매치 수 1 이상.

- [ ] **Step 5: Commit**

```bash
git add docs/shareholder-agreement-template-analysis.md
git commit -m "docs: shareholder agreement standard clauses analysis and clause mapping"
```

---

