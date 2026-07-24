### Task 3: 화면 캡처

**Files:**
- Create: `/Users/leeyunseok/Desktop/Projects/CoSync-intro-video/scripts/capture-screenshots.mjs`
- Create: `/Users/leeyunseok/Desktop/Projects/CoSync-intro-video/public/screenshots/02-diagnosis.png`
- Create: `/Users/leeyunseok/Desktop/Projects/CoSync-intro-video/public/screenshots/03-gap-report.png`
- Create: `/Users/leeyunseok/Desktop/Projects/CoSync-intro-video/public/screenshots/04-consensus.png`
- Create: `/Users/leeyunseok/Desktop/Projects/CoSync-intro-video/public/screenshots/05-agreement-document.png`

**Interfaces:**
- Consumes: Task 1(에뮬레이터 배선), Task 2(시드 데이터 — `demo-team-a`, `demo-team-b`, 로그인 `owner@demo.local` / `demopass123!`), Task 4(스캐폴딩된 `CoSync-intro-video` 프로젝트 — 이미 완료됨, 이 태스크는 그 뒤에 실행).
- Produces: 1280x800 PNG 스크린샷 4장.

캡처 방식: 대화형 브라우저 도구는 스크린샷을 화면에 인라인으로만 보여주고 디스크에 파일로 저장하지 않는다 — 확인됨. 대신 Playwright(헤드리스 Chromium)로 실제 로그인 플로우를 거쳐 PNG 파일을 직접 저장한다. 에뮬레이터 계정(`owner@demo.local`)은 이번 시드 스크립트가 만든 테스트 픽스처이며 실제 사용자 자격증명이 아니다.

- [ ] **Step 1: Playwright 설치 (CoSync-intro-video 프로젝트)**

```bash
cd "/Users/leeyunseok/Desktop/Projects/CoSync-intro-video"
npm i -D playwright
npx playwright install chromium
```

- [ ] **Step 2: `scripts/capture-screenshots.mjs` 작성**

```js
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const BASE_URL = "http://localhost:3000";
const OUT_DIR = path.resolve(import.meta.dirname, "..", "public", "screenshots");

const SHOTS = [
  { url: `${BASE_URL}/onboarding/diagnosis`, file: "02-diagnosis.png" },
  { url: `${BASE_URL}/gap-report?teamId=demo-team-a`, file: "03-gap-report.png" },
  { url: `${BASE_URL}/consensus?teamId=demo-team-a`, file: "04-consensus.png" },
  { url: `${BASE_URL}/agreement/document?teamId=demo-team-b`, file: "05-agreement-document.png" },
];

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  await page.goto(`${BASE_URL}/login`);
  await page.getByPlaceholder("example@cosync.com").fill("owner@demo.local");
  await page.getByPlaceholder("••••••••").fill("demopass123!");
  await page.getByRole("button", { name: "로그인하기 →" }).click();
  await page.waitForURL(`${BASE_URL}/workspace`, { timeout: 15000 });

  for (const shot of SHOTS) {
    await page.goto(shot.url, { waitUntil: "networkidle" });
    await page.waitForTimeout(800);
    const outPath = path.join(OUT_DIR, shot.file);
    await page.screenshot({ path: outPath });
    console.log(`saved ${outPath}`);
  }

  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

- [ ] **Step 3: 에뮬레이터 + dev 서버 기동 (CoSync 레포)**

```bash
cd "/Users/leeyunseok/Desktop/Projects/CoSync"
export JAVA_HOME="/opt/homebrew/opt/openjdk@21"
export PATH="$JAVA_HOME/bin:$PATH"
firebase emulators:start --only firestore,auth > /tmp/emu.log 2>&1 &
sleep 8
npx tsx scripts/seed.ts
NEXT_PUBLIC_USE_FIREBASE_EMULATOR=1 npm run dev > /tmp/dev.log 2>&1 &
sleep 8
curl -s http://localhost:3000/login -o /dev/null -w "%{http_code}\n"
```

Expected: `200` 출력.

- [ ] **Step 4: 캡처 스크립트 실행**

```bash
cd "/Users/leeyunseok/Desktop/Projects/CoSync-intro-video"
node scripts/capture-screenshots.mjs
```

Expected: `saved .../02-diagnosis.png` ~ `saved .../05-agreement-document.png` 4줄 출력, 에러 없음.

- [ ] **Step 5: 검증**

```bash
file /Users/leeyunseok/Desktop/Projects/CoSync-intro-video/public/screenshots/*.png
```

Expected: 4개 파일 모두 `PNG image data, 1280 x 800`, 파일 크기 0바이트 아님. 스크린샷 이미지를 열어 각각 온보딩 진단/갭 리포트/합의 세션/합의서 문서 화면이 맞는지, 한글 텍스트가 깨지지 않았는지 육안 확인.

- [ ] **Step 6: 서버 정리 + Commit**

```bash
pkill -f "firebase emulators" || true
pkill -f "next dev" || true
cd "/Users/leeyunseok/Desktop/Projects/CoSync-intro-video"
git add package.json package-lock.json scripts/capture-screenshots.mjs public/screenshots
git commit -m "feat: capture live app screenshots via Playwright for video scenes"
```

---

