# Task 2 Report: 주주간 계약서 양식 분석 문서

## 무엇을 했나

`docs/shareholder-agreement-template-analysis.md`를 브리핑에 명시된 목차 그대로 작성:

1. **주주간 계약서란 (법적 성격·목적)** — 채권적 계약이며 정관과 별개, 당사자 간에만 효력, 위반 시 손해배상/위약벌로 다뤄짐. CoSync 20문항은 "운영 원칙" 영역이고 지분/거버넌스 조항은 별개임을 명시.
2. **공통 필수 조항 목록 (13개 항목, 표준 문구 포함)**: 지분 구조, 이사회 구성·의결권 행사 합의, 사전동의사항(Reserved Matters), 우선매수권(ROFR), 동반매도참여권(Tag-along), 동반매각요구권(Drag-along), Good/Bad Leaver, 베스팅·클리프, 경업금지, 비밀유지, 교착상태 해소(단계적 협의/러시안 룰렛/중재), 분쟁해결(준거법·관할), 위약벌·이행확보장치. 각 항목에 실무 표준 문구 예시 포함.
3. **매핑 표**: `lib/gap.ts`의 실제 `CAT_LABELS` 6개 카테고리(역할&책임/이탈&회수/비전&가치관/조달&운용/의사결정&실행/지분&보상)와 `lib/agreementClauses.ts`의 실제 필드명(예: `equityStructure`, `exitDisputeResolution`, `deadlockTolerance`, `spendingApproval` 등)을 인용해 18개 행으로 매핑. 이미 커버 2건(퇴사 운영 정리, 의사결정 구조), 부분 커버 6건(지분배분 철학, 사전동의사항, Good/Bad Leaver, 교착상태, 보수구조, 투자조달전략), 미커버 10건(지분표, 이사회구성, ROFR, tag-along, drag-along, 베스팅, 경업금지, 비밀유지, 분쟁해결, 위약벌).
4. **보완 필수 정보 목록**: 14개 항목 (지분 구조 원표부터 청산우선권까지).
5. **출처**: 리서치에 사용한 15개 외부 링크 + 내부 소스 2개(`lib/agreementClauses.ts`, `lib/gap.ts`).

## 커버리지 요약 (정직성 원칙)

CoSync 조항 템플릿은 **운영 얼라인먼트**(역할 분담, 퇴사 프로세스, 의사결정 성향, 지분/보상 철학)에 강하지만, 법적 구속력이 필요한 **SHA 핵심 골격**(ROFR/tag-along/drag-along, 베스팅, 경업금지, 비밀유지, 이사회 구성, 위약벌, 분쟁해결)은 대부분 미커버로 정직하게 표기했다. 이는 브리핑에서 예고된 대로다.

## 소스 검증 상태

WebSearch 4회 + WebFetch 4회(모두싸인 블로그, ALBUP 칼럼, ZUZU 가이드, 아틀라스 법무법인 블로그)를 통해 확보한 내용을 바탕으로 작성. 문서 내 "표준 문구 예:" 항목은 원문 그대로의 인용이 아니라, 검색 결과에서 확인한 조항 개념을 바탕으로 재구성한 일반적 실무 관행 예시 문장 — 원문 그대로가 아님을 문서 내에서 구분 표기함. 대법원 판례(2018다223054)는 검색 결과 타이틀/스니펫만 확인했고 원문 PDF 전체를 정독하지 않음 (각주성 인용).

## 체크리스트 검증

```
$ test -f docs/shareholder-agreement-template-analysis.md && echo "FILE EXISTS" && grep -Eic "tag-along|drag-along|vesting|우선매수" docs/shareholder-agreement-template-analysis.md
FILE EXISTS
14
```
파일 존재 확인, 필수 키워드 매치 14건(기대: 1건 이상) — 통과.
2장에 ROFR/tag-along/drag-along/vesting/good-bad leaver/deadlock 모두 포함 확인(육안 검토).
3장 매핑 표가 `CAT_LABELS`의 실제 6개 카테고리명을 그대로 인용 확인.
5장에 15개 출처 링크 포함 확인.

## 커밋

```
09f2d75281686b11459c988b5ad4486d410c91e5
docs: shareholder agreement standard clauses analysis and clause mapping
1 file changed, 146 insertions(+)
create mode 100644 docs/shareholder-agreement-template-analysis.md
```
`docs/shareholder-agreement-template-analysis.md` 단일 파일만 스테이징·커밋. 브랜치 내 다른 미커밋 변경사항(`.superpowers/sdd/progress.md`, `.superpowers/sdd/task-1-brief.md`, `.superpowers/sdd/task-1-report.md`, `docs/superpowers/plans/2026-07-24-cosync-docs-and-ui-polish.md`)은 건드리지 않음.

이 파일(`task-2-report.md`)에는 이전 스프린트의 다른 "Task 2"(시나리오 시드 스크립트) 보고서가 남아 있어서 이번 태스크 내용으로 덮어썼음 — 참고.

## Concerns

없음. 웹 리서치 기반 정성적 분석 문서라 자동화 테스트는 없고, 콘텐츠 체크리스트(브리핑 Step 4)만으로 검증했음. 표준 문구 예시가 실제 계약서 원문 발췌가 아니라 재구성 예시라는 점은 문서·본 보고서에 명시했으므로 법률 자문 대체용으로 오인되지 않도록 사용 시 유의 필요.
