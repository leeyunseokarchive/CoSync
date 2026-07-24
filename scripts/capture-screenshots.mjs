import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const BASE_URL = "http://localhost:3000";
const TEAM = "demo-team-b";
const OUT = "docs/captures/2026-07-24";

const SHOTS = [
  // ponytail: seed.ts gives demo-team-b all-matching answers (it's the
  // "fully resolved, confirmed v1 agreement" demo team), so its /questions
  // page is legitimately empty. demo-team-a has the seeded gaps/conflicts,
  // so it's the team that actually renders deep-question cards.
  { name: "questions", path: `/questions?teamId=demo-team-a` },
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
  await page.locator('input[type="password"]').fill("demopass123!");
  await page.getByRole("button", { name: /로그인하기/ }).click();
  await page.waitForLoadState("networkidle");

  for (const shot of SHOTS) {
    // ponytail: firestore realtime listeners keep the network busy, so
    // "networkidle" never resolves on these pages — wait for "load" instead
    // and give the onSnapshot subscriptions time to render.
    await page.goto(`${BASE_URL}${shot.path}`, { waitUntil: "load" });
    await page.waitForTimeout(2500); // 실시간 구독 데이터 렌더 대기
    await page.screenshot({ path: `${OUT}/${shot.name}.png`, fullPage: true });
    console.log(`captured ${shot.name}`);
  }

  await browser.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
