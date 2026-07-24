## Task 1: 리포트 산출 로직 + 근거/법률 정리 문서

문서 리서치 태스크. TDD 대상 아님(단위 테스트 불가한 산문 산출물) — 검증은 아래 콘텐츠 체크리스트로 대신한다.

**Files:**
- Create: `docs/report-logic-and-references.md`

**참고 소스(작성 전 반드시 읽을 것):**
- [lib/gap.ts](../../../lib/gap.ts) — 갭 산출 알고리즘 전체(`pairGap`, `computeGapSummary`, `CAT_WEIGHTS`, `toGapScore`, alignment 정규화 공식).
- [docs/AI_기반_공동창업팀_운영_합의_진단_및_합의안_생성_플랫폼CoSync_보고서.md](../../AI_기반_공동창업팀_운영_합의_진단_및_합의안_생성_플랫폼CoSync_보고서.md) — 기존 서비스 근거 서술.
- [app/gap-report/page.tsx](../../../app/gap-report/page.tsx)의 `SCRIPTS` 내 `stat`/`stake` 필드 — 이미 인용된 통계·법 조항(예: "민법 제718조", "하버드 와서만 교수 65%", "동업 분쟁 40%").

- [ ] **Step 1: 갭 산출 로직 섹션 초안 작성**

`gap.ts`의 실제 코드를 근거로 다음을 서술한다(추상적 요약 금지, 실제 공식·상수 기입):
- 문항→카테고리 매핑과 카테고리 가중치 `CAT_WEIGHTS`(코드에서 그대로 옮김).
- 한 문항의 두 답변 갭 정의: 같으면 0, toxicPair면 3, 아니면 `|옵션차|`.
- 문항 갭 = 모든 멤버 쌍 중 **최악(max)** 갭.
- 카테고리 갭 `G_i` = 답변된 문항 평균, `rawScore = Σ W'_i × G_i`.
- 정합도 `overallAlignment = round((1 − rawScore / (answeredWeight × 3)) × 100)`, 미진단 카테고리는 가중치 정규화에서 제외.
- `toGapScore` 구간: ≥85 LOW / ≥65 MID / ≥45 HIGH / else CRITICAL.

- [ ] **Step 2: 근거/법률 리서치 섹션 작성(외부 리서치 포함)**

`SCRIPTS`에 이미 인용된 통계·판례를 1차 출처로 삼고, **웹 리서치로 원출처를 확인·보강**한다(WebSearch/WebFetch 사용). 각 주장에 출처를 붙인다:
- 동업/지분 분쟁 관련 통계(예: 동업 분쟁 발생률, 지분 문제 비중).
- 관련 법 조항(민법 제718조 등 이탈·정산 관련), 주주간 계약의 법적 성격.
- 스타트업 실패 원인 통계(인적 갈등, 비전 불일치 비중).
확인 불가한 수치는 "출처 미확인"으로 표기하고 삭제하지 말 것(신뢰도 관리).

- [ ] **Step 3: 문서 구조 확정**

문서는 다음 목차를 갖는다:
```markdown
# CoSync 리포트 산출 로직 및 근거 자료

## 1. 개요 — 무엇을 산출하는가
## 2. 진단 문항 구조 (20문항 · 카테고리 · 가중치)
## 3. 갭/정합도 산출 공식 (코드 기준)
## 4. 갭 등급(LOW~CRITICAL) 및 해석
## 5. 근거 통계 및 법률 리서치 (출처 포함)
## 6. 한계 및 향후 고도화 (LLM 기반 근거 제시형 확장)
```

- [ ] **Step 4: 콘텐츠 체크리스트 검증**

다음을 모두 만족하는지 자가 점검:
- `CAT_WEIGHTS` 값이 `gap.ts` 코드와 일치.
- 정합도 공식이 코드와 일치(정규화 항 포함).
- 5장 각 주장에 출처(링크 또는 "미확인") 표기.
- 파일이 `docs/report-logic-and-references.md`에 존재.

Run: `test -f docs/report-logic-and-references.md && grep -c "출처" docs/report-logic-and-references.md`
Expected: 파일 존재, "출처" 1회 이상 매치.

- [ ] **Step 5: Commit**

```bash
git add docs/report-logic-and-references.md
git commit -m "docs: report scoring logic and legal/statistical references"
```

---

