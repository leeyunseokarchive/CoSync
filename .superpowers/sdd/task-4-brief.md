### Task 4: Remotion 프로젝트 스캐폴딩 + 정적 에셋 준비

**Files:**
- Create: `/Users/leeyunseok/Desktop/Projects/CoSync-intro-video/` (전체 프로젝트)
- Create: `/Users/leeyunseok/Desktop/Projects/CoSync-intro-video/public/logo.png`
- Create: `/Users/leeyunseok/Desktop/Projects/CoSync-intro-video/public/mascot.png`

**Interfaces:**
- Produces: `npx remotion studio`로 열리는 blank Remotion 프로젝트, `@remotion/media`·`@remotion/google-fonts` 설치 완료.

- [ ] **Step 1: 스캐폴딩**

```bash
cd "/Users/leeyunseok/Desktop/Projects"
npx create-video@latest --yes --blank --no-tailwind CoSync-intro-video
cd CoSync-intro-video
npm i
npx remotion add @remotion/media
npx remotion add @remotion/google-fonts
```

- [ ] **Step 2: 브랜드 에셋 복사**

```bash
mkdir -p "/Users/leeyunseok/Desktop/Projects/CoSync-intro-video/public/screenshots"
cp "/Users/leeyunseok/Desktop/Projects/CoSync/logo.png" "/Users/leeyunseok/Desktop/Projects/CoSync-intro-video/public/logo.png"
cp "/Users/leeyunseok/Desktop/Projects/CoSync/mascot.png" "/Users/leeyunseok/Desktop/Projects/CoSync-intro-video/public/mascot.png"
```

(Task 3에서 캡처한 스크린샷 4장도 `public/screenshots/`에 이미 위치해 있어야 한다.)

- [ ] **Step 3: 검증**

```bash
cd "/Users/leeyunseok/Desktop/Projects/CoSync-intro-video"
ls public/logo.png public/mascot.png public/screenshots/*.png
npx remotion studio --no-open
```

Expected: 5개 파일 경로 모두 출력, Remotion Studio 서버 URL이 에러 없이 출력됨.

- [ ] **Step 4: Commit**

```bash
cd "/Users/leeyunseok/Desktop/Projects/CoSync-intro-video"
git init
git add -A
git commit -m "chore: scaffold Remotion project with brand assets and screenshots"
```

---

