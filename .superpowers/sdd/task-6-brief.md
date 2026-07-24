## Task 6: Playwright 인웹 캡쳐

에뮬레이터 + 시드 + `next dev` 위에서 `/questions`, `/consensus`, `/agreement/document` 세 페이지를 로그인 플로우로 캡쳐한다. 이전 intro-video 계획의 검증된 패턴을 그대로 따른다.

**Files:**
- Create: `scripts/capture-screenshots.mjs`
- Create(산출물): `docs/captures/2026-07-24/{questions,consensus,agreement-document}.png`

**Consumes:** Task 3(‎`/questions` 라우트), Task 4·5(폴리시된 페이지), 시드 데이터(`demo-team-b`, `owner@demo.local`/`demopass123!`).

- [ ] **Step 1: Playwright 설치**

```bash
npm i -D playwright
npx playwright install chromium
```
Expected: chromium 다운로드 완료.

- [ ] **Step 2: 캡쳐 스크립트 작성**

로그인 페이지 입력 셀렉터는 이전 계획에서 확인된 `getByPlaceholder("example@cosync.com")`(이메일)을 재사용하되, 실제 [app/login/page.tsx](../../../app/login/page.tsx)의 placeholder/버튼 텍스트를 열어 확인 후 맞춘다.

Create `scripts/capture-screenshots.mjs`:

```js
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const BASE_URL = "http://localhost:3000";
const TEAM = "demo-team-b";
const OUT = "docs/captures/2026-07-24";

const SHOTS = [
  { name: "questions", path: `/questions?teamId=${TEAM}` },
  { name: "consensus", path: `/consensus?teamId=${TEAM}` },
  { name: "agreement-document", path: `/agreement/document?teamId=${TEAM}` },
];

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });

  // 로그인
  await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle" });
  await page.getByPlaceholder("example@cosync.com").fill("owner@demo.local");
  await page.getByPlaceholder(/비밀번호|password/i).fill("demopass123!");
  await page.getByRole("button", { name: /로그인/ }).click();
  await page.waitForLoadState("networkidle");

  for (const shot of SHOTS) {
    await page.goto(`${BASE_URL}${shot.path}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1200); // 실시간 구독 데이터 렌더 대기
    await page.screenshot({ path: `${OUT}/${shot.name}.png`, fullPage: true });
    console.log(`captured ${shot.name}`);
  }

  await browser.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
```

- [ ] **Step 3: 에뮬레이터 + 시드 + dev 서버 기동**

별도 터미널/백그라운드로:
```bash
export JAVA_HOME="/opt/homebrew/opt/openjdk@21"
export PATH="$JAVA_HOME/bin:$PATH"
firebase emulators:start --only firestore,auth > /tmp/emu.log 2>&1 &
npx tsx scripts/seed.ts
NEXT_PUBLIC_USE_FIREBASE_EMULATOR=1 npm run dev > /tmp/dev.log 2>&1 &
```
Run(준비 확인): `sleep 8 && curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/login`
Expected: `200`.

- [ ] **Step 4: 캡쳐 실행**

Run: `node scripts/capture-screenshots.mjs`
Expected: 콘솔에 `captured questions` / `captured consensus` / `captured agreement-document` 3줄. `docs/captures/2026-07-24/`에 PNG 3개 생성.

- [ ] **Step 5: 캡쳐 육안 검증**

세 PNG를 열어 확인:
- `questions.png`: 심층질문 카드가 충돌→차이 순으로 렌더, 대화 스크립트/팁 표시.
- `consensus.png`: 본문 글자가 이전보다 큼(라벨/조항 프리뷰 가독성).
- `agreement-document.png`: 조항 본문 `1.05rem`으로 확대, 제목 강조, 인쇄 폭 유지.
`demo-team-b`에 데이터가 비어 캡쳐가 빈 화면이면 `scripts/seed.ts`가 해당 팀에 진단/합의/확정 합의서를 채우는지 확인하고 재시드.

- [ ] **Step 6: 정리 + Commit**

```bash
pkill -f "firebase emulators" || true
pkill -f "next dev" || true
git add scripts/capture-screenshots.mjs docs/captures/2026-07-24
git commit -m "chore: add in-app screenshot capture script and capture questions/consensus/document pages"
```

---

## Self-Review

**1. Spec coverage:**
- TODO 리포트 로직/법률 md → Task 1 ✅
- TODO 주주간 계약서 양식 md → Task 2 ✅
- TODO 심층 질문 페이지 제작 + 캡쳐 → Task 3(제작) + Task 6(캡쳐) ✅
- TODO 합의 페이지 UI 개선 + 캡쳐 → Task 4 + Task 6 ✅
- TODO 문서 생성 페이지 UI 개선 + 캡쳐 → Task 5 + Task 6 ✅
- "텍스트 크게" → Task 4·5 폰트 매핑 ✅
- "reference/CoSync UI 참고" → Global Constraints + Task 4·5·6 육안 비교 ✅

**2. Placeholder scan:** 문서 태스크(1·2)는 외부 리서치 산문이라 완전한 최종 텍스트를 사전 확정할 수 없으므로 목차·소스·체크리스트로 구체화했다(TDD 미적용을 명시). 코드 태스크(3·4·5·6)는 실제 코드/정확한 치환값 포함.

**3. Type consistency:** `selectDeepQuestions(members: OnboardingAnswers[]) → DeepQuestionItem[]`, `QuestionDef.field: keyof OnboardingAnswers`, `SCRIPTS: Record<string, ScriptEntry>` — Task 3 인터페이스·테스트·페이지·import 전반에서 이름 일치. `getIssueStatus` 반환 `IssueStatus`("match"|"diff"|"conflict"|"unanswered") 기준으로 셀렉터 분기 일관.

**주의(실행 시 확인 필요):**
- Task 3 Step 8/9: `useTeamMembers` 멤버 객체의 답변 필드명(`onboardingAnswers` 가정)은 gap-report의 실제 접근자와 맞춰야 함 — 다르면 매핑 수정.
- Task 6 Step 2: 로그인 placeholder/버튼 텍스트는 `app/login/page.tsx` 실제 값으로 확정.
- Task 6: `/agreement/document`는 프로필 `plan === "premium"`이 아니면 `/agreement/preview`로 리다이렉트됨 — 시드의 `owner` 프로필이 premium인지 확인(아니면 시드에서 설정).
