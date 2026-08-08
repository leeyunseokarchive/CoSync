// 결과 카드 시안 캡처. `npx next dev -p 3111` 이 떠 있어야 한다.
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const URL = "http://localhost:3111/mockup/contract-results";
const OUT = "docs/captures/2026-08-08-result-cards";

// 사이드바 항목은 조문 표기로 찾는다. 배열 순서가 바뀌어도 깨지지 않는다.
const SHOTS = [
  { name: "tenure", article: "제5조 ①" },
  { name: "dragalong", article: "제7의 2조 ① (신설)" },
  { name: "penalty", article: "제8조" },
  { name: "deadlock", article: "제2조 ③ (신설)" },
];

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 2 });
  await page.goto(URL, { waitUntil: "networkidle" });

  const jump = async (article) => {
    await page.locator(".cq-side-q", { hasText: article }).first().click();
    await page.waitForTimeout(400);
  };

  for (const shot of SHOTS) {
    await jump(shot.article);
    await page.screenshot({ path: `${OUT}/page-${shot.name}.png`, fullPage: true });
  }

  // 요소 캡처는 고정 푸터가 위에 겹쳐 잘린다. 이 구간에서만 숨긴다.
  await page.addStyleTag({ content: ".cq-footer { display: none !important; }" });
  for (const shot of SHOTS) {
    await jump(shot.article);
    await page.locator(".cr-zone").screenshot({ path: `${OUT}/zone-${shot.name}.png` });
    console.log(`captured ${shot.name}`);
  }

  await browser.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
