// 릴스 빌드: 실사이트 무료 진단 플로우 녹화 → 자막/카드 렌더 → ffmpeg 합성.
//   node scripts/reel/make-reel.mjs
// 결과: docs/reel/cosync-reel.mp4 (1080x1920)
//
// 이 ffmpeg 빌드에는 libass/freetype이 없어 subtitles·drawtext 필터를 못 쓴다.
// 그래서 자막은 Chromium에서 투명 PNG로 렌더한 뒤 overlay 필터로 합성한다.
import { chromium } from "playwright";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdirSync, rmSync, writeFileSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { BASE_URL, W, H, FPS, SHOT, CARDS, SCENES, CSS } from "./reel.config.mjs";

const CAP_FADE = 0.18; // 자막 알파 페이드 (초)
const XFADE = 0.3;     // 씬 사이 크로스페이드 (초)

const run = promisify(execFile);
const ROOT = resolve(import.meta.dirname, "../..");
const WORK = resolve(ROOT, "docs/reel/build");
const OUT = resolve(ROOT, "docs/reel/cosync-reel.mp4");

rmSync(WORK, { recursive: true, force: true });
mkdirSync(WORK, { recursive: true });

const ff = (args) => run("ffmpeg", ["-y", "-loglevel", "error", ...args]);

// ── 1. 자막/카드 렌더 ───────────────────────────────────────────────
// ponytail: mascot.png는 브랜드 가이드 시트 전체(1254x1254)라 잘라 쓰면
// 옆 카드 경계선이 딸려 들어온다. logo.png가 투명 배경 + 흰 얼굴이 살아있는
// 단독 캐릭터라 그대로 쓴다. (logo(TP).png는 얼굴까지 투명해서 보라 위에서 뚫린다)
const mascot = `data:image/png;base64,${readFileSync(resolve(ROOT, "logo.png")).toString("base64")}`;

const shooter = await chromium.launch();
const page0 = await shooter.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });

async function shoot(bodyHtml, file, transparent) {
  await page0.setContent(
    `<!doctype html><meta charset="utf-8"><style>${CSS}</style>${bodyHtml.replace("MASCOT_SRC", mascot)}`,
    { waitUntil: "load" }
  );
  await page0.waitForTimeout(350);
  await page0.screenshot({ path: file, omitBackground: transparent });
}

// ponytail: 훅 카드는 배경으로 실제 진단 화면을 쓰므로 녹화가 끝난 뒤에 만든다.
for (const [name, card] of Object.entries(CARDS)) {
  if (name === "hook") continue;
  await shoot(card.html, `${WORK}/card-${name}.png`, false);
}
for (const scene of SCENES) {
  for (const [i, cap] of scene.captions.entries()) {
    await shoot(
      `<div class="cap-layer"><div class="scrim"></div><div class="cap-wrap"><div class="cap">${cap.html}</div></div></div>`,
      `${WORK}/cap-${scene.id}-${i}.png`,
      true
    );
  }
}
console.log("captions/cards rendered");

// ── 2. 실사이트 씬 녹화 ─────────────────────────────────────────────
// ponytail: 스크롤을 순간이동시키면 컷이 튄다. 엄지로 미는 느낌으로 보간한다.
//
// target(문자열)을 주면 그 글자를 가진 요소를 찾아 거기로 간다.
// 픽셀 좌표로 보내면 Firestore 실시간 구독이 화면을 다시 그릴 때마다
// 레이아웃이 밀려서 엉뚱한 곳에 멈춘다. 요소 기준이면 그 영향을 안 받는다.
const GLIDE = async ([to, ms, target, offset, correct]) => {
  const gap = offset ?? 120;
  const find = () =>
    [...document.querySelectorAll("h1,h2,h3,h4,div,span,p")]
      .filter((e) => e.textContent.trim().startsWith(target))
      .sort((a, b) => a.textContent.length - b.textContent.length)[0];

  const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
  const run = (dest, dur) =>
    new Promise((done) => {
      const from = window.scrollY;
      const t0 = performance.now();
      (function step(now) {
        const t = Math.min((now - t0) / dur, 1);
        window.scrollTo(0, from + (dest - from) * ease(t));
        t < 1 ? requestAnimationFrame(step) : done();
      })(t0);
    });

  let dest = to;
  if (target) {
    const el = find();
    if (el) dest = el.getBoundingClientRect().top + window.scrollY - gap;
  }
  await run(dest, ms);

  // ponytail: 재는 것과 도착하는 것 사이에 화면이 또 다시 그려지면 요소가
  // 밀린다. 한 번 재는 걸로는 못 맞으므로 도착 후 다시 재서 보정한다.
  // 보정에 쓰는 시간도 씬 예산에 포함된다. 길게 잡으면 보정이 끝나기 전에
  // 촬영 구간이 끝나버리므로 짧게(최대 ~0.7초) 유지한다.
  if (target && correct) {
    for (let i = 0; i < 2; i++) {
      await new Promise((r) => setTimeout(r, 140));
      const el = find();
      if (!el) break;
      const delta = el.getBoundingClientRect().top - gap;
      if (Math.abs(delta) < 24) break;
      await run(window.scrollY + delta, 220);
    }
  }
};

// ponytail: 뷰포트는 540으로 두고(모바일 레이아웃 유지) 디바이스 픽셀 밀도만
// 2배로 올려 1080 네이티브로 녹화한다. 540으로 찍어 후반에 확대하면 없는 픽셀을
// 만들어내는 것이라 글자 가장자리가 뭉개진다.
const browser = await chromium.launch({ args: ["--force-device-scale-factor=2"] });
for (const scene of SCENES) {
  const ctx = await browser.newContext({
    viewport: SHOT,
    deviceScaleFactor: 2,
    recordVideo: { dir: `${WORK}/raw-${scene.id}`, size: { width: W, height: H } },
  });
  const page = await ctx.newPage();

  // ponytail: 목표 화면까지 클릭해 들어가는 과정도 영상에 찍힌다.
  // 그 준비 구간 길이를 재뒀다가 뒤에서 잘라낸다.
  const t0 = Date.now();
  await scene.enter(page);
  scene.trim = (Date.now() - t0) / 1000 + 0.3;

  for (const step of scene.steps) {
    if (step.scroll !== undefined || step.target) {
      await page.evaluate(GLIDE, [step.scroll, step.ms, step.target, step.offset, step.correct]).catch(() => {});
    }
    if (step.hold) await page.waitForTimeout(step.hold);
  }

  const video = page.video();
  await ctx.close();
  scene.raw = await video.path();
  scene.dur = scene.captions.at(-1).to + 0.5;
  console.log(`recorded ${scene.id}  trim=${scene.trim.toFixed(1)}s  use=${scene.dur.toFixed(1)}s`);
}
await browser.close();

// ── 2-b. 훅 카드 (배경에 실제 진단 화면을 깐다) ─────────────────────
if (CARDS.hook) {
  const bg = `${WORK}/hook-bg.png`;
  // 첫 씬의 녹화본에서 한 프레임 뽑아 쓴다. 훅에서 흐릿하던 화면이
  // 바로 다음 컷에서 선명해지는 연결이 생긴다.
  await ff(["-ss", String(SCENES[0].trim + 0.3), "-i", SCENES[0].raw, "-frames:v", "1",
    "-vf", `scale=${W}:${H}`, bg]);
  const bgData = `data:image/png;base64,${readFileSync(bg).toString("base64")}`;
  await shoot(CARDS.hook.html.replace("HOOK_BG_SRC", bgData), `${WORK}/card-hook.png`, false);
  console.log("hook card rendered");
}
await shooter.close();

// ── 3. 씬별 자막 합성 ───────────────────────────────────────────────
const parts = [];

for (const [name, card] of Object.entries(CARDS)) {
  const out = `${WORK}/seg-${name}.mp4`;
  await ff([
    "-loop", "1", "-i", `${WORK}/card-${name}.png`, "-t", String(card.dur),
    // ponytail: zoompan 주의점 두 가지.
    //  1) x/y 기본값이 0,0 이라 좌상단 기준으로 확대된다 → 중앙으로 고정.
    //  2) x/y를 정수 픽셀로 반올림해서 프레임마다 1px씩 튄다(흔들림).
    //     입력을 4배로 키워두면 반올림 오차가 1/4로 줄어 눈에 안 보인다.
    "-vf",
    `scale=${W * 4}:${H * 4}:flags=lanczos,` +
      `zoompan=z='min(zoom+0.0006,1.06)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)'` +
      `:d=${Math.round(card.dur * FPS)}:s=${W}x${H}:fps=${FPS},format=yuv420p`,
    "-c:v", "libx264", "-crf", "18", "-r", String(FPS), out,
  ]);
  parts.push({ name, out });
}

for (const scene of SCENES) {
  // ponytail: 자막 PNG는 한 장짜리 이미지라 그대로 넣으면 페이드를 걸 수 없다.
  // -loop 로 씬 길이만큼 늘려야 fade 필터가 자기 타임라인을 갖는다.
  const inputs = ["-i", scene.raw];
  scene.captions.forEach((_, i) =>
    inputs.push("-loop", "1", "-framerate", String(FPS), "-t", String(scene.dur),
      "-i", `${WORK}/cap-${scene.id}-${i}.png`)
  );

  let chain =
    `[0:v]trim=${scene.trim}:${scene.trim + scene.dur},setpts=PTS-STARTPTS,` +
    `scale=${W}:${H}:flags=lanczos,fps=${FPS}[v0]`;

  // 자막을 즉시 켜고 끄면 툭툭 깜빡이는 것처럼 보인다. 알파를 페이드시킨다.
  scene.captions.forEach((cap, i) => {
    chain +=
      `;[${i + 1}:v]format=rgba,` +
      `fade=t=in:st=${cap.from}:d=${CAP_FADE}:alpha=1,` +
      `fade=t=out:st=${(cap.to - CAP_FADE).toFixed(2)}:d=${CAP_FADE}:alpha=1[c${i}]`;
  });
  scene.captions.forEach((cap, i) => {
    chain += `;[v${i}][c${i}]overlay=0:0:enable='between(t,${cap.from},${cap.to})'[v${i + 1}]`;
  });
  const last = `[v${scene.captions.length}]`;

  const out = `${WORK}/seg-${scene.id}.mp4`;
  await ff([
    ...inputs, "-filter_complex", chain,
    "-map", last, "-c:v", "libx264", "-crf", "18",
    "-pix_fmt", "yuv420p", "-r", String(FPS), out,
  ]);
  parts.push({ name: scene.id, out });
}

// ── 4. 슬라이드 전환으로 이어붙이기 ─────────────────────────────────
// ponytail: 크로스페이드(fade)는 글자 많은 앱 화면끼리 겹치면 이전·다음
// 텍스트가 이중으로 보인다. 슬라이드로 밀면 움직임은 유지되면서 겹침이 없다.
// 훅 카드가 맨 앞, CTA 카드가 맨 뒤. 사이에 씬들이 들어간다.
const order = [...(CARDS.hook ? ["hook"] : []), ...SCENES.map((s) => s.id), "cta"];
const segs = order.map((n) => parts.find((p) => p.name === n).out);

const durs = [];
for (const s of segs) {
  const { stdout } = await run("ffprobe", [
    "-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", s,
  ]);
  durs.push(Number(stdout));
}

const chain = [];
let cur = "[0:v]";
let offset = 0;
for (let i = 1; i < segs.length; i++) {
  offset += durs[i - 1] - XFADE;
  const label = `[x${i}]`;
  chain.push(`${cur}[${i}:v]xfade=transition=slideleft:duration=${XFADE}:offset=${offset.toFixed(3)}${label}`);
  cur = label;
}

const SILENT = `${WORK}/silent.mp4`;
await ff([
  ...segs.flatMap((s) => ["-i", s]),
  "-filter_complex", chain.join(";"),
  "-map", cur, "-c:v", "libx264", "-crf", "18", "-pix_fmt", "yuv420p",
  // ponytail: 태깅을 안 하면 bt470bg(SD PAL)로 잘못 기록되어 색이 틀어진다.
  "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709",
  "-r", String(FPS), "-movflags", "+faststart", SILENT,
]);

// ── 5. 나레이션 얹기 ────────────────────────────────────────────────
// 크로스페이드가 겹치는 만큼 씬 시작 시각이 당겨진다. 그 시각에 맞춰
// 각 나레이션을 지연시킨 뒤 한 트랙으로 합친다.
const narrations = order.map((n) =>
  CARDS[n] ? CARDS[n].narration : SCENES.find((s) => s.id === n)?.narration
);
const starts = [];
{
  let t = 0;
  for (let i = 0; i < durs.length; i++) {
    starts.push(t);
    t += durs[i] - XFADE;
  }
}

const voiced = narrations
  .map((n, i) => (n ? { file: resolve(ROOT, "docs/reel", n), at: starts[i] } : null))
  .filter(Boolean);

if (voiced.length) {
  // ponytail: amix는 기본적으로 입력 수만큼 볼륨을 나눈다(normalize=1).
  // 겹치지 않는 나레이션이라 나눌 이유가 없으므로 꺼야 소리가 안 작아진다.
  // ponytail: TTS 원본이 -28 LUFS 수준이라 그대로 두면 폰에서 안 들린다.
  // 인스타 기준(-14 LUFS)에 맞춰 정규화한다.
  const aChain = voiced
    .map((v, i) => `[${i + 1}:a]adelay=${Math.round((v.at + 0.15) * 1000)}:all=1[a${i}]`)
    .concat(
      `${voiced.map((_, i) => `[a${i}]`).join("")}amix=inputs=${voiced.length}:normalize=0[amix]`,
      `[amix]loudnorm=I=-14:TP=-1.5:LRA=11,aresample=48000[aout]`
    )
    .join(";");

  await ff([
    "-i", SILENT,
    ...voiced.flatMap((v) => ["-i", v.file]),
    "-filter_complex", aChain,
    "-map", "0:v", "-map", "[aout]",
    "-c:v", "copy", "-c:a", "aac", "-b:a", "192k",
    "-movflags", "+faststart", OUT,
  ]);
  console.log(`나레이션 ${voiced.length}개 합성`);
} else {
  await run("cp", [SILENT, OUT]);
}

const { stdout } = await run("ffprobe", [
  "-v", "error", "-show_entries", "format=duration",
  "-of", "default=nw=1:nk=1", OUT,
]);
console.log(`\n✓ ${OUT}  (${Number(stdout).toFixed(1)}s)`);
