# CoSync 합의서·계약서 기능 — 진행 상황 (Process / Handoff)

> 목적: 심층질문 → 전문 합의안 → 주주간계약서(SHA) 조항 초안까지 이어지는 기능을 단계적으로 구현. 이 문서는 다음 세션이 이어서 작업할 수 있게 결정·완료·다음 할 일을 정리한다.
> 최종 갱신: 2026-07-24 (Phase 1 완료 후)

## 1. 큰 그림 (비전)

```
온보딩 진단(20문항)
   ↓  충돌/차이 감지 = gap-report
심층 질문 페이지 (대화 스크립트로 실제 "합의" 도출)
   · 지분/베스팅/이탈/경업 등 무거운 주제까지 파고듦
   ↓  합의 완료
전문 합의안 (운영 합의서, 계약서 형식)
   +
[별지] 주주간계약서 조항 초안
   · 심층 진단 결과로 조항 빈칸이 채워짐
   · 진단 안 한 팀은 해당 빈칸만 [  ]로 비운 채 생성
```

## 2. 확정된 핵심 결정

- **정체성 = 프리-리걸 정렬 문서 + 형식만 계약서화** (Option A). 본문(제N조)은 소프트 "~하기로 한다" 운영 합의. 우리 차별점 = 숨은 갈등 발굴.
- **별지 = 완성 계약 조항 초안** (사용자가 Option B 선택). 실제 SHA 조항 문장으로 렌더. 단 **비타협 안전장치** 동반:
  - 별지 상단 `DRAFT · 변호사 검토 전 법적 효력 없음` 배지(크게, 흑백 인쇄에도 보임).
  - 미정 수치는 반드시 `[  ]` 빈칸 — 허위 확정 금지 (테스트로 불변식 강제).
  - 최하단 작은 글씨 디스클레이머: `본 문서는 구성원 간 자율적 운영 합의로, 법적 계약(주주간계약서 등)을 대체하지 않습니다. 별지 조항은 표준 실무를 참고한 초안이며 변호사 검토 후 효력이 발생합니다.`
- **당사자 신원정보(주민번호·주소) 수집 안 함** — 프리-리걸 유지. 이름·역할만.
- **데이터 수집은 심층질문에서** — 별지 빈칸 값(베스팅 기간, 경업금지 년수, 위약 금액, 지분% 등)은 Phase 3에서 모으고 Phase 4에서 채운다.

## 3. 4-Phase 로드맵

| Phase | 내용 | 상태 |
|---|---|---|
| **1** | 합의서 양식 계약서화 (전문·제N조·서명란·별지 골격·디스클레이머) | ✅ **완료** (main 머지) |
| **2** | 심층 질문 페이지 전문화 (합의 대화 경험 개선) | ⬜ 미착수 |
| **3** | 하드 항목 데이터 수집 (베스팅·leaver·양도제한·tag/drag·경업·위약·이사회 등) + 데이터모델 확장 | ⬜ 미착수 |
| **4** | 별지 = 심층 진단 결과로 조항 빈칸 자동 채움 (Phase 3 의존) | ⬜ 미착수 |

## 4. Phase 1 — 완료 내역 (main)

문서:
- 스펙: [docs/superpowers/specs/2026-07-24-agreement-contract-format-design.md](specs/2026-07-24-agreement-contract-format-design.md)
- 플랜: [docs/superpowers/plans/2026-07-24-agreement-contract-format.md](plans/2026-07-24-agreement-contract-format.md)
- 리서치: [docs/shareholder-agreement-template-analysis.md](../shareholder-agreement-template-analysis.md) — 20문항 ↔ SHA 필수조항 매핑, 정식 계약서화에 필요한 정보 14종(§4)

커밋 (main):
- `fe56c56` — `lib/annexClauses.ts` + 테스트 (별지 SHA 조항 초안 7개, 빈칸 불변식)
- `fadc43b` — 본문 계약서화: 전문·제N장→제N조(순차번호 버그 fix)·일반조항(효력/분쟁)·서명란
- `8a3bc8e` — 별지 조항 렌더 + DRAFT 배지 + `renderWithBlanks`(빈칸 회색강조) + 디스클레이머 + 인쇄 CSS
- `d3ab27b` — analysis 문서에 Phase 1 반영
- (`8b0c00d` — 동시 세션이 SDD 실행기록 + 무관한 `marketing/` 파일을 묶어 커밋. 합의서 코드와 무관.)

주요 파일:
- [lib/annexClauses.ts](../../lib/annexClauses.ts) — `AnnexClause {id,title,body}` 배열 `ANNEX_CLAUSES`. 7개 조항: shares, transfer, vesting, tagdrag, noncompete, deadlock, penalty. **Phase 4 seam**: 여기 값 주입 함수 추가해 `[  ]` 채우면 됨.
- [app/agreement/document/page.tsx](../../app/agreement/document/page.tsx) — 렌더. `renderWithBlanks(body)`가 `[...]` 토큰을 `.doc-blank` 회색으로 표시.

검증: 테스트 6/6, `npx tsc --noEmit` 0, `npm run build` 22 라우트 ✓, 4 태스크 리뷰 + whole-branch 리뷰 all approved.

## 5. 알려진 이슈 / 미해결

- **visual 미검증**: 실제 브라우저 스크린샷 못 찍음. `scripts/capture-screenshots.mjs`가 로그인/데이터에 firestore 에뮬레이터를 쓰는데, 에뮬레이터가 **JDK 21+** 요구 → 이 환경에 없음. 로컬에서 JDK 21 설치 후 `firebase emulators:start --only auth,firestore` + `node scripts/seed.ts` + `NEXT_PUBLIC_USE_FIREBASE_EMULATOR=1 npm run dev` → `node scripts/capture-screenshots.mjs`로 확인 가능.
- **Minor (비차단)**: `.doc-annex-clause-body` 클래스에 CSS 규칙 없음(무해, inert). 베스팅 `[4]`/`[12]`는 의도된 관행 기본값(회색+DRAFT).
- **origin 미push**: `main`이 `origin/main`보다 8 커밋 앞섬. 원격 반영하려면 `git push`.
- **동시 세션 주의**: 다른 세션이 같은 repo에서 작업 중일 수 있음(`marketing/` 커밋). 커밋 전 `git status`/`git log` 확인.

## 6. 다음 할 일 (이어서 진행)

각 Phase는 brainstorming → spec → plan → 구현 흐름을 따른다.

**Phase 2 — 심층 질문 전문화** (독립적, 먼저 하기 쉬움):
- 대상: [app/questions/page.tsx](../../app/questions/page.tsx), [lib/deepQuestions.ts](../../lib/deepQuestions.ts) (SCRIPTS: open/steps/qs/stat/stake/dispute/guide 이미 있음).
- 정할 것: "더 전문적"의 구체 정의 (대화 흐름? 진행률? 합의 확정 UX?).

**Phase 3 — 하드 항목 데이터 수집** (Phase 4의 전제):
- 대상: 새 문항/입력 + 데이터모델 확장. analysis 문서 §4의 정보 14종이 입력 목록.
- 수집 항목(별지 조항별 빈칸): 지분비율·주식수, 베스팅 기간/클리프, good/bad leaver 가격 기준, 양도제한 기간·우선매수 회신일, tag/drag 트리거 %, 경업금지·비밀유지 년수, 교착 협의 기간, 위약벌 금액.
- Firestore 스키마 변경 수반 → 마이그레이션 고려.

**Phase 4 — 별지 빈칸 자동 채움** (Phase 3 의존):
- [lib/annexClauses.ts](../../lib/annexClauses.ts)에 값 주입 함수 추가 (팀 결정값 맵 → `body`의 `[  ]` 치환). 안 채워진 빈칸은 그대로 `[  ]` 유지.
- document 페이지가 그 함수 결과를 렌더하도록 연결.

## 7. 참고 자료 (reference/계약서 샘플/)

- `반드시 포함될 목록.md` — 필수 항목 요지 (역할, 역할 미이행 책임, 이탈, 베스팅/클리프, 지분 처분 제한, Tag-along, 경업금지, 위약벌).
- `스타트업 주주간계약서 10가지 체크리스트.html` (류재언 변호사) — 조항별 표준 문구.
- `2명 이상이 공동창업 시, 필수 항목.html` (JH법률), `주주간계약서 작성 가이드 - OHOOLAW.html` — 조항 예시.
- `[모두싸인 계약서]주주간계약서_v1.0.docx`, `법무법인-별-스타트업-표준-동업계약서.pdf` — 실제 계약서 샘플.
