### Task 4: analysis 문서 갱신

**Files:**
- Modify: `docs/shareholder-agreement-template-analysis.md`

**Interfaces:**
- Consumes: (없음)
- Produces: (없음)

- [ ] **Step 1: "현재 합의서 양식(Phase 1 반영)" 절 추가**

`## 3. CoSync 현재 조항 ↔ 표준 조항 매핑 표` **바로 앞**에 새 절을 삽입:

```markdown
## 2-b. 현재 합의서 양식 (Phase 1 반영)

합의서 문서([app/agreement/document/page.tsx](../app/agreement/document/page.tsx))는 Phase 1에서 계약서 형식으로 격상되었다.

- **전문**(당사자·목적·작성일), **제N조 (제목)** 본문 조항, **일반조항**(효력·시행 / 분쟁의 해결), **서명란**을 갖춘다.
- 문서 하단에 **[별지] 주주간계약서 조항 초안**([lib/annexClauses.ts](../lib/annexClauses.ts))이 조항 문장 형태로 렌더된다. 지분·양도제한·베스팅·tag/drag·경업금지·교착·위약벌을 담되, 미정 수치는 `[  ]` 빈칸으로 남긴다.
- 별지는 `DRAFT · 변호사 검토 전 법적 효력 없음` 배지와 최하단 비법률 디스클레이머를 함께 표기한다.
- 별지 빈칸은 **Phase 3(하드 항목 데이터 수집) → Phase 4(값 주입)** 에서 심층 진단 결과로 채워진다. 진단을 진행하지 않은 팀은 해당 빈칸만 비운 채로 합의안·계약서가 생성된다. 아래 4장의 정보 목록이 그 입력이다.
```

- [ ] **Step 2: 4장 도입부에 Phase 연결 한 줄 추가**

`## 4. 완성도 향상을 위한 보완 필수 정보 목록` 바로 아래 문단 끝에 한 문장 추가:

```markdown
(이 목록은 Phase 3에서 수집하고 Phase 4에서 별지 조항의 `[  ]` 빈칸을 채우는 데 쓰인다.)
```

- [ ] **Step 3: Commit**

```bash
git add docs/shareholder-agreement-template-analysis.md
git commit -m "docs: analysis 문서에 Phase 1 합의서 양식·별지 반영"
```

---

## Self-Review

**Spec coverage:**
- 전문 → Task 2 Step 2 ✓
- 제N장→제N조 순차 번호 → Task 2 Step 1·3 ✓ (빈 카테고리 시에도 index 기반 1부터 연속)
- 일반조항(효력·시행 / 분쟁해결) → Task 2 Step 3 ✓
- 서명란 → Task 2 Step 4 ✓
- 별지 조항 초안 골격 + 빈칸 + DRAFT 배지 → Task 1 + Task 3 ✓
- 최하단 작은 글씨 디스클레이머 → Task 3 Step 3 ✓
- lib/annexClauses.ts seam → Task 1 ✓
- 인쇄 처리(break-before, DRAFT 배지 흑백 가시성, print-color-adjust) → Task 3 Step 4 ✓
- analysis 문서 갱신 → Task 4 ✓
- 데이터 모델 불변 → 전 Task가 기존 데이터만 사용, 신규 파일은 정적 배열 ✓
- 검증(확정/미확정·결측·조 번호·PDF) → Task 2·3 스크린샷 + 빌드 ✓

**Placeholder scan:** 모든 코드 스텝에 실제 코드/문구 포함. "TODO/TBD" 없음. `[  ]`는 의도된 계약 빈칸(플레이스홀더 아님).

**Type consistency:** `AnnexClause {id,title,body}`가 Task 1 정의 ↔ Task 3 사용(`c.id`,`c.title`,`c.body`) 일치. `renderWithBlanks(body: string)` 정의·호출 일치. `chapters` 계산(Task 2 Step 1) ↔ 사용(Step 3) 일치.
