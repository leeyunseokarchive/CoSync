# 진행 상황

## 2026-08-04

### 1. 사업계획서용 목업 페이지 — 투자 결정 기준 설정

파일: `app/mockup/investment/page.tsx`

- 요청: 사업계획서 제출용 인웹사진. "질문 선택 → 운영 기준 설정 → 합의 내용 저장" 흐름 보이는 데스크탑 한 화면 목업.
- 기존 CoSync 디자인 시스템(레이아웃/컬러/폰트/카드/버튼) 그대로 재사용, 신규 스타일 생성 안 함.
- 재사용 컴포넌트: `TopNav`, `CircleAvatar`, `.card`, `.btn-primary`, `.input`, `.info-box`, `.question-step`, `.gap-breadcrumb`.
- 구성: 브레드크럼 + STEP 3/10 배지 + 제목/설명 → 카드 3개(투자 검토 기준 / 최종 결정 방식 / 의견 차이 처리) 가로 배치 → 추가 합의 내용 카드(전체 너비) → 가이드 카드 + CTA.
- 피드백 반영: 팀원 협업 정체성 보완 위해 우상단에 "팀원 응답 현황" 카드 추가 — 아바타 3명 + 응답 완료/대기 pill.
- 1920×1080 한 화면에 스크롤 없이 수납 확인 (Playwright 스크린샷, scrollHeight 1080).
- 이후 사용자가 직접 문구 일부 수정함(카테고리명 "운영 기준 설정 > 의사결정 및 권한" → "합의세션 > 의사결정 및 권한", 제목/설명 간소화, 팀원 응답 현황 카드 제거, 라디오에 "기타" 옵션 추가, 하단 가이드 카드 제거하고 CTA만 남김). 현재 파일 상태는 사용자 수정본이 최종.

### 2. 합의안 생성 예시 PDF

파일: `docs/합의안_예시.pdf`, 소스: `app/mockup/agreement/page.tsx`

- 요청: 실제 합의안 생성 페이지(`app/agreement/document`)에서 나오는 결과물이 어떤 모습인지 PDF로 확인.
- `app/agreement/document/page.tsx`는 Firestore 실데이터 의존이라, 동일 마크업/CSS에 예시 데이터만 채운 정적 목업(`app/mockup/agreement`) 별도 생성.
- 조항 텍스트는 하드코딩이 아니라 실제 로직(`lib/agreementClauses.ts`의 `buildClauses` + `CLAUSE_TEMPLATES`)을 그대로 통과시켜 생성 — 실서비스 출력과 문구 동일.
- 예시 팀 "팀 코싱크", 멤버 김대표(CEO)/이개발(CTO)/박기획(COO), 6개 카테고리 20개 조항 + 별지(주주간계약서 조항 초안 7개) 포함.
- Playwright `page.pdf()`로 A4 4페이지 출력 (`localhost:3000/mockup/agreement`, 이미 떠 있던 사용자 dev 서버 사용). print 미디어 배경색 안 먹던 문제 → `html, body { background: #fff !important }` 추가해 수정.
- 별지가 `break-before: page`라 3페이지 하단 여백 많이 남음 — 실서비스도 동일 동작.

### 미해결/참고

- `app/mockup/investment/page.tsx`는 사용자가 세션 중 직접 수정 중 — 최신 요구사항 재확인 필요할 수 있음.
- `app/mockup/`, `docs/합의안_예시.pdf` 모두 아직 git add/commit 안 됨 (untracked).
