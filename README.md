# CoSync

팀 단위 협업 진행 상황을 관리하고, 인원 간 성향/업무방식 격차(Gap)를 분석하여 최종 합의안을 도출하는 B2B SaaS 웹 서비스.

🔗 **서비스 바로가기**: [cosync-d7dd7.web.app](https://cosync-d7dd7.web.app/)

---

## 1. 프로젝트 개요

CoSync는 극초기 창업 팀이나 프로젝트 팀 환경에서 발생하는 다음 문제들을 예방하고 해결하기 위해 만들어졌습니다.
- 구성원 간 업무 방식 및 비전의 차이(Gap)
- 민감한 주제(지분, 역할, 이탈 시 조건 등)에 대한 사전 합의 부재
- 막연한 약속으로 인한 추후 분쟁

이를 해결하기 위해:
- **시나리오 진단**: 20개의 핵심 질문(역할, 의사결정, 보상 등)에 대한 개별 응답 수집
- **격차(Gap) 분석**: 팀원 간 응답 데이터를 기반으로 일치/불일치/충돌 항목 시각화
- **팀 합의(Consensus) 세션**: 갭이 있는 항목에 대해 제안하고 투표하여 최종 규약 완성
- **문서화**: 완성된 합의서를 버전별로 관리하고 PDF로 내보내기

---

## 2. 주요 기능 및 업무 흐름 (Flow)

**합의(Consensus)** 기능을 포함한 전체 사용자 흐름입니다.

1. **온보딩 및 진단 (`/onboarding/diagnosis`)**
   - 유저별로 20개의 시나리오 문항에 답변 (6개 카테고리)
2. **갭 리포트 (`/gap-report`)**
   - 팀원들의 응답을 비교하여 "자동 합의", "제안 필요(차이)", "충돌" 상태를 분석 및 시각화
3. **합의 세션 (`/consensus`)**
   - 갭이 발생한 항목들에 대해 멤버들이 각자의 대안을 제안(Propose)
   - 제안된 초안(템플릿 기반)에 대해 전원 동의(Vote) 시 해당 항목 합의 완료
4. **전원 확정 (`/agreement/confirm`)**
   - 모든 항목이 타결되면, 참여자 전원이 최종적으로 합의안 내용에 확정 서명(체크)
5. **합의서 뷰어 및 내보내기 (`/agreement/document`)**
   - 확정된 최종 합의서(문서 형태)를 열람
   - 브라우저 인쇄 기능을 활용한 PDF 내보내기 지원
6. **버전 관리 및 히스토리 (`/agreement/history`, `/agreement/diff`)**
   - 과거에 합의했던 문서들의 버전(v1.0, v2.0...) 히스토리 조회
   - 이전 버전과 현재 버전 간의 조항 변경점(Diff) 비교

---

## 3. 요금제 및 권한 모델 (Pricing & Plan)

CoSync는 **Free(무료)**와 **Premium(유료)** 두 가지 플랜으로 나누어 제공됩니다.

### 1) Free 플랜 (기본)
- **기능 제한:** 온보딩 시나리오 진단, 갭 리포트 열람까지만 지원합니다.
- **제한 사항:** "합의 세션 시작하기" 버튼을 누를 시 프리미엄 플랜 구독을 위한 **사전 신청 팝업**이 노출되며, 이후 단계로 진입할 수 없습니다.

### 2) Premium 플랜 (유료)
- **전체 기능 해제:** 진단 결과를 바탕으로 **합의 세션(Consensus)**에 진입할 수 있습니다.
- **합의 프로세스:** 멤버별 대안 제안, 전원 동의(Vote)를 통한 항목별 타결.
- **최종 산출물:** 모든 갭 항목 타결 시 합의서를 생성 및 버저닝하고, PDF로 내보낼 수 있는 전체 프로세스를 지원합니다.

- 우선은 현재 CoSync에 있는 세 계정만 Premium 상태로 돌려놨습니다.

### 3) 구독 데이터 필드
사용자의 구독 권한 정보는 Firestore의 `users` 컬렉션에서 두 가지 필드를 통해 세분화되어 관리됩니다.

- **`plan` (`"free" | "premium"`)**: 사용자가 가입하거나 선택한 **서비스 등급(Tier)**을 의미합니다. 어떤 수준의 기능 권한이 부여되는지를 나타냅니다.
- **`subscriptionStatus` (`"active" | "past_due" | "canceled" | "expired"`)**: 해당 플랜의 **실제 결제 및 구독 라이프사이클 상태**를 의미합니다. 
  - `"active"`: 결제가 정상적으로 완료되어 구독이 활성화된 상태
  - `"past_due"`: 결제 실패나 연체로 인한 유예 기간 상태
  - `"canceled"`: 사용자가 구독을 취소했으나 아직 남은 기간이 유효한 상태
  - `"expired"`: 구독 기간이 완전히 종료된 상태
  - 이 필드를 통해 단순한 등급(plan)뿐만 아니라 실제 결제 상태에 따른 세밀한 권한 제어가 가능합니다.

---

## 4. 기술 스택 및 아키텍처

- **Frontend**: Next.js 16 (App Router), React 18
- **Language**: TypeScript
- **Styling**: Vanilla CSS (CSS-in-JS 방식으로 각 페이지별 캡슐화 적용)
- **Backend/DB**: Firebase (Auth, Firestore)
- **Deployment**: Firebase Hosting (Static Export - `output: "export"`)

### 아키텍처 특징 (Static SPA)
본 프로젝트는 Next.js를 사용하지만 서버 사이드 렌더링(SSR)이나 API 라우트 없이 **100% 정적 배포(Static Export)** 됩니다.
- 데이터베이스 읽기/쓰기는 전적으로 Client-side Firebase SDK를 통해 이루어집니다.
- Firestore Security Rules(`firestore.rules`)를 통해 유저 권한 및 보안을 통제합니다.
- 합의문 초안 생성 시 LLM 서버 비용 및 API 통신 딜레이를 없애기 위해 **템플릿 기반(Deterministic Korean clause templates)** 엔진(`lib/agreementClauses.ts`)을 자체 구현하여 클라이언트에서 즉시 렌더링합니다.

---

## 5. 데이터 스키마 (Firestore)

- `users/{uid}`: 유저 기본 정보, 소속된 `teamIds[]`
- `teams/{teamId}`: 팀 정보, 진척도, `gapScore`
- `teams/{teamId}/members/{uid}`: 팀 내 멤버 정보, 20문항에 대한 응답(`answers`)
- `teams/{teamId}/agreements/{version}`: 생성된 합의문 스냅샷 (조항 텍스트 데이터 보관)
- `teams/{teamId}/consensus/{fieldId}`: 개별 문항에 대한 합의 세션 상태 (진행 중인 제안, 멤버별 투표 찬반 상태 등)

---

## 6. 로컬 개발 서버 실행 방법

### 1) 패키지 설치
```bash
npm install
```

### 2) 환경 변수 설정
최상단에 `.env.local` 파일을 생성하고 Firebase 구성 값을 입력합니다.
```env
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
```

### 3) 서버 실행
```bash
npm run dev
```
→ http://localhost:3000 에 접속하여 확인 가능합니다.

---

## 7. 빌드 및 Firebase 배포

1. 빌드 (정적 파일 생성)
   ```bash
   npm run build
   ```
   *(`out/` 디렉토리에 정적 파일이 생성됩니다.)*

2. Firebase CLI 배포
   ```bash
   firebase deploy --only hosting
   ```

---

## 8. 업데이트 히스토리 (Release Notes)

### [7월 9일] 합의 세션 및 합의안 생성, 출력 기능 추가, 코드 리펙토링

**1. 합의 세션(Consensus) 기능 추가**
- 갭 리포트(또는 프리뷰 페이지)에서 '합의 세션 시작하기' 버튼 클릭 시, 유료 사용자(`plan: premium`)에 한해 합의 세션(`/consensus`) 페이지로 이동
- 무료 사용자(`plan: free`)일 경우 결제 시스템 연동 전 임시 조치로 '사전 신청 유도 팝업' 노출 및 진입 차단
- 진단 시 팀원 간 이미 의견이 **일치(Match)했던 항목은 별도의 논의 없이 자동으로 합의안 내용에 반영**됨
- 불일치(차이, 충돌) 항목에 대해서는 팀원 중 누구나 먼저 타협안(제공된 초안 템플릿 기반)을 제안(Propose) 가능
- 제안된 타협안에 대해 다른 팀원들은 동의(Approve) 또는 거절/재논의(Reject/Reopen) 투표 가능
- 모든 불일치 항목이 전원 동의를 얻어 해결(Resolved) 상태가 되면, 최종 합의안 생성 단계로 진입 가능

**2. 합의안 확정 및 문서화(Agreement) 기능 추가**
- 합의안 초안이 생성되면 전원 확정 페이지(`/agreement/confirm`)로 이동하며, 완성된 전체 조항에 대해 팀원 모두가 최종 동의(체크) 서명 진행
- 팀원 전원의 서명이 완료되면 해당 합의안의 상태가 확정 대기에서 '최종 확정(Confirmed)'으로 변경되며, 새로운 버전(v1.0, v2.0 등)으로 정식 업로드
- 합의서 뷰어(`/agreement/document`)에서 브라우저 인쇄 기능을 활용해 깔끔한 서식의 **PDF 내보내기** 지원
- 과거에 확정된 합의서 내역을 조회(`/agreement/history`)하고, 이전 버전과 최신 버전 간의 조항 변경점(Diff)을 비교(`/agreement/diff`)할 수 있는 **버전 관리 기능** 포함

**3. 코드 디자인 및 로직 리펙토링**
- **로그인 페이지 DOM 구조 정상화**: `app/login/page.tsx` 내 잘못 닫힌 `</div>` 태그를 제거하고 `</form>`을 추가하여 Next.js 빌드 시 발생하던 ECMAScript 파싱 에러 해결
- **TypeScript 타입 및 참조 최적화**: 
  - `app/actions/consensus.ts` 및 `app/actions/team.ts`: Firebase transaction 인자의 implicit `any` 타입 에러 해결
  - `app/onboarding/diagnosis/complete/page.tsx`: `React` 전역 객체(UMD global) 에러를 `useState` 직접 import 방식으로 수정
  - `app/workspace/page.tsx`: 정의되지 않은 `teamRef` 참조 에러를 `doc(db, "teams", targetTeam.id)`으로 수정
- **Firebase Admin SDK 모듈화 마이그레이션**: `lib/firebase-admin.ts`에서 v14 모듈형 API (`firebase-admin/app` 등)를 사용하도록 마이그레이션하여 패키지 호환성 및 타입 정의 에러 수정