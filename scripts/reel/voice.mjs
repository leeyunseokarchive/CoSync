// 목소리만 다시 처리해서 기존 영상에 갈아끼운다. 재녹화·재렌더 없이 ~30초.
//   node scripts/reel/voice.mjs
// 아래 PARAMS 만 고치면 된다.
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { resolve } from "node:path";
import { CARDS, SCENES, FPS } from "./reel.config.mjs";

const PARAMS = {
  pitch: 1.12,      // 톤. 1.0=원본, 1.08=이전, 1.14=더 높게
  tempo: 1.25,      // 최종 속도
  declick: 1.7,     // 침소리 제거 임계값. 낮을수록 강함(1.2~2.5)
  hp: 130,          // 파열음 컷 Hz. 높일수록 강함(110~160)
  presence: 3,      // 명료도 dB @3.2kHz
  air: 1.5,         // 밝기 dB @6.5kHz
  lufs: -15,        // 문장별 목표 라우드니스
  // ponytail: 문장마다 읽은 속도가 달라 같은 배율로는 균일해지지 않는다.
  // 1.0 기준, 낮추면 그 문장만 느려진다.
  lead: 0.35,      // 첫 문장만 늦게 시작 (도입부 여유)
  adj: { hook: 1, delay: 1, equity: 0.90, report: 1, cta: 1 },
};

const SRC = {
  hook: "노은동로234번길-1.m4a",
  delay: "노은동로234번길 4-2.m4a",
  equity: "노은동로234번길 5-3.m4a",
  report: "노은동로234번길 7-4.m4a",
  cta: "노은동로234번길 8-5.m4a",
};

const XFADE = 0.3;
const run = promisify(execFile);
const ROOT = resolve(import.meta.dirname, "../..");
const WORK = `${ROOT}/docs/reel/build`;
const NAR = `${ROOT}/docs/reel/narration`;
const DL = "/Users/t2025-m0051/Downloads";
const OUT = `${ROOT}/docs/reel/cosync-reel.mp4`;
const ff = (a) => run("ffmpeg", ["-y", "-loglevel", "error", ...a]);
const dur = async (f) =>
  Number((await run("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", f])).stdout);
const probe = async (f, af, re, dflt) => {
  const r = await run("ffmpeg", ["-hide_banner", "-i", f, "-af", af, "-f", "null", "-"]).catch((e) => e);
  return Number((r.stderr || "").match(re)?.[1] ?? dflt);
};
const lufs = (f) => probe(f, "loudnorm=print_format=summary", /Input Integrated:\s*(-?[\d.]+)/, -14);
const peak = (f) => probe(f, "astats=metadata=1", /Peak level dB:\s*(-?[\d.]+)/, -1);

const p = PARAMS;
// ponytail: 힘은 피치가 아니라 압축+EQ로 낸다. asetrate 피치 시프트는
// 포먼트까지 밀어올려 "AI 낀 소리"를 만든다. 피치는 살짝만.
const chainFor = (id) =>
  `highpass=f=${p.hp}:poles=2,highpass=f=${p.hp}:poles=2,` +
  // ponytail: declick 은 반드시 압축 앞. 뒤에 두면 압축이 침소리를 키운다.
  `adeclick=w=65:o=80:a=3:t=${p.declick}:b=3:m=add,` +
  // 게이트로 숨소리를 지우고, 쉼 길이는 늘려 한 템포 쉬는 느낌을 만든다.
  `agate=threshold=0.006:ratio=2:attack=10:release=350,` +
  `acompressor=threshold=-24dB:ratio=3.5:attack=5:release=120:makeup=3,` +
  `equalizer=f=2500:t=q:w=1.4:g=4,equalizer=f=180:t=q:w=1:g=-3,` +
  `silenceremove=start_periods=1:start_duration=0:start_threshold=-40dB:stop_periods=-1:stop_duration=0.45:stop_threshold=-40dB,` +
  `asetrate=48000*${p.pitch},aresample=48000,atempo=${((p.tempo * p.adj[id]) / p.pitch).toFixed(4)},` +
  `loudnorm=I=${p.lufs}:TP=-1.5,apad=pad_dur=0.2`;

const order = ["hook", ...SCENES.map((s) => s.id), "cta"];
const NUM = { hook: 1, delay: 2, equity: 3, report: 4, cta: 5 };
for (const id of order) {
  const out = `${NAR}/me-${NUM[id]}-${id}.wav`;
  await ff(["-i", `${DL}/${SRC[id]}`, "-af", chainFor(id), "-ar", "48000", out]);
  // ponytail: 라우드니스와 피크 중 더 보수적인 게인을 쓴다. 피크만 맞추면
  // 파일마다 체감 음량이 4dB씩 어긋나고, 라우드니스만 맞추면 클리핑한다.
  const g = Math.min(p.lufs - (await lufs(out)), -1.3 - (await peak(out)));
  await ff(["-i", out, "-af", `volume=${g.toFixed(2)}dB`, "-ar", "48000", `${out}.tmp.wav`]);
  await run("mv", [`${out}.tmp.wav`, out]);
  console.log(`${id.padEnd(7)} ${(await dur(out)).toFixed(2)}s  ${(await lufs(out)).toFixed(1)} LUFS`);
}

// 씬 시작 시각 (크로스페이드 겹침 반영)
const durs = [];
for (const n of order) durs.push(await dur(`${WORK}/seg-${n}.mp4`));
const starts = [];
{ let t = 0; for (const d of durs) { starts.push(t); t += d - XFADE; } }

const inputs = order.flatMap((id) => ["-i", `${NAR}/me-${NUM[id]}-${id}.wav`]);
const chain = order
  .map((_, i) => `[${i + 1}:a]adelay=${Math.round((starts[i] + 0.15 + (i === 0 ? p.lead : 0)) * 1000)}:all=1[a${i}]`)
  .concat(
    `${order.map((_, i) => `[a${i}]`).join("")}amix=inputs=${order.length}:normalize=0[m]`,
    `[m]loudnorm=I=-14:TP=-1.5:LRA=11,aresample=48000[aout]`
  )
  .join(";");

await ff(["-i", `${WORK}/silent.mp4`, ...inputs, "-filter_complex", chain,
  "-map", "0:v", "-map", "[aout]", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k",
  "-movflags", "+faststart", OUT]);
console.log(`✓ ${(await dur(OUT)).toFixed(1)}s`);
