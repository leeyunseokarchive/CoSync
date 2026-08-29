// 릴스용 앱 화면 녹화. /mockup/* 라우트만 사용 — 실데이터 접근 없음.
//   node scripts/record-reel.mjs
// 결과: docs/reel/raw/*.webm → ffmpeg으로 1080x1920 변환은 별도 단계.
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE_URL = "http://localhost:3000";
const OUT = "docs/reel/raw";
// 9:16. 540x960을 그대로 찍고 후반에 2배 업스케일 → 1080x1920.
const SIZE = { width: 540, height: 960 };

mkdirSync(OUT, { recursive: true });

// ponytail: 스크롤 위치를 순간이동시키면 영상에서 컷이 튀어 보인다.
// 사람이 엄지로 미는 속도(약 900px/s)로 rAF 보간해서 내린다.
async function glide(page, targetY, ms = 1200) {
  await page.evaluate(
    ([to, dur]) =>
      new Promise((done) => {
        const from = window.scrollY;
        const t0 = performance.now();
        const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
        (function step(now) {
          const t = Math.min((now - t0) / dur, 1);
          window.scrollTo(0, from + (to - from) * ease(t));
          t < 1 ? requestAnimationFrame(step) : done();
        })(t0);
      }),
    [targetY, ms]
  );
}

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: SIZE,
  deviceScaleFactor: 1,
  recordVideo: { dir: OUT, size: SIZE },
  reducedMotion: "no-preference",
});
const page = await context.newPage();

// ponytail: next dev 배지가 좌하단에 박혀서 영상에 그대로 찍힌다. 라우트마다
// 새로 주입해야 하므로 addInitScript로 건다. zoom은 540px 뷰포트 글씨가
// 폰에서 안 읽혀서 넣은 것 — 레이아웃 breakpoint는 그대로 두고 확대만 한다.
await page.addInitScript(() => {
  const style = document.createElement("style");
  style.textContent = `
    nextjs-portal, #__next-build-watcher, [data-nextjs-toast] { display: none !important; }
    html { zoom: 1.1; }
  `;
  document.addEventListener("DOMContentLoaded", () => document.head.appendChild(style));
});

// ponytail: 진단 문항 화면. 문제 제기 구간.
await page.goto(`${BASE_URL}/mockup/questions`, { waitUntil: "load" });
await page.waitForTimeout(2500);
await glide(page, 500, 1400);
await page.waitForTimeout(1200);

// ponytail: 합의 세션. "주 1회 vs 주 2회" 갭이 드러나는 핵심 컷이라
// 스크롤을 멈추고 충분히 머무른다.
await page.goto(`${BASE_URL}/mockup/consensus`, { waitUntil: "load" });
await page.waitForTimeout(2500);
await glide(page, 900, 1600);
await page.waitForTimeout(2500);
await glide(page, 1300, 1000);
await page.waitForTimeout(2000);

// ponytail: 합의서. 결과물 컷.
await page.goto(`${BASE_URL}/mockup/agreement`, { waitUntil: "load" });
await page.waitForTimeout(2000);
await glide(page, 1200, 2000);
await page.waitForTimeout(1500);

await context.close();
await browser.close();
console.log(`done → ${OUT}`);
