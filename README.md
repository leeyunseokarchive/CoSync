# CoSync

팀 단위 협업 진행 상황을 관리하고, 팀 간 격차(Gap)를 분석하는 웹 서비스.

---

## 1. 프로젝트 개요

CoSync는 팀 프로젝트 환경에서 다음 문제를 해결하기 위해 만들어졌다.

- 팀별 진행 속도 차이
- 업무 분배 불균형
- 협업 상황 가시성 부족

이를 해결하기 위해:

- 팀별 진행도 추적
- 개인/팀 단위 데이터 관리
- Gap 분석 기능 제공

---

## 2. 주요 기능

- 팀 생성 및 관리
- 팀원 데이터 관리
- 진행도(Progress) 기록
- 팀 간 Gap 분석 (lib/gap.ts 기반)
- Firebase 기반 데이터 저장

---

## 3. 기술 스택

- Frontend: Next.js (App Router)
- Language: TypeScript
- Backend: Firebase (Firestore)
- Deployment: Firebase Hosting

---

## 4. 폴더 구조

```
app/            → 페이지 라우팅
components/     → UI 컴포넌트
lib/            → 로직 (gap, team, firebase 등)
public/         → 정적 파일
```

---

## 5. 실행 방법

### 1) 패키지 설치
```
npm install
```

### 2) 개발 서버 실행
```
npm run dev
```

→ http://localhost:3000 접속

---

## 6. Firebase 설정

1. Firebase 프로젝트 생성
2. `.env.local` 파일 생성 후 아래 값 추가

```
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
```

---

## 7. 빌드 및 배포

### 빌드
```
npm run build
```

### 실행
```
npm start
```

---

## 8. 주의사항

- `.next`, `node_modules`는 Git에 포함하지 않음
- Firebase 설정 없으면 정상 동작 안함

---

## 9. 향후 개선

- 실시간 협업 기능
- 팀 성과 시각화
- 사용자 인증 (Auth)
