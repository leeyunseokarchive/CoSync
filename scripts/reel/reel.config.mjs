// 릴스 대본. 자막·타이밍·씬을 여기서만 고치면 make-reel.mjs가 그대로 빌드한다.
// 촬영 대상: 배포 실사이트의 **실제 무료 진단 플로우** (/onboarding → 진단 → /gap-report).
// 로그인 없이 접근 가능한 범위만 쓰므로 실사용자 데이터가 잡히지 않는다.
export const BASE_URL = "https://cosync-d7dd7.web.app";

export const W = 1080;
export const H = 1920;
export const FPS = 30;
export const SHOT = { width: 540, height: 960 };

// 인스타 UI가 y≈1560부터 화면을 덮는다. 자막은 그 위에서 끝나야 한다.
export const SAFE_BOTTOM = 1545;

// mascot.png 브랜드 가이드에 정의된 컬러 시스템.
const INDIGO = "#4F46E5";
const YELLOW = "#FDE047";
const INK = "#14121F";
const AMBER = "#F59E0B";

// ── 진단 플로우 조작 헬퍼 ───────────────────────────────────────────
// 보기를 고르면 자동으로 다음 문항으로 넘어간다. 일부 문항은 조건부로
// 건너뛰므로 번호가 연속하지 않는다. 목표 문항이 보일 때까지 계속 답한다.
const pick = async (page, n = 1) => {
  const opt = page.locator("button,label").filter({ hasText: new RegExp(`^\\s*${n}\\.`) }).first();
  if (await opt.count()) await opt.click({ timeout: 3000 }).catch(() => {});
  await page.waitForTimeout(400);
  const next = page.getByRole("button", { name: /다음|계속|완료|결과 보기/ }).first();
  if (await next.count()) await next.click({ timeout: 2500 }).catch(() => {});
  await page.waitForTimeout(850);
};

const startDiagnosis = async (page) => {
  await page.goto(`${BASE_URL}/onboarding`, { waitUntil: "load" });
  await page.waitForTimeout(2000);
  await page
    .getByRole("button", { name: /무료 진단 시작/ })
    .or(page.getByRole("link", { name: /무료 진단 시작/ }))
    .first()
    .click({ timeout: 5000 });
  await page.waitForTimeout(2000);
};

// choice: 어떤 보기를 골라 밀지. 조건부 문항은 답에 따라 열리고 닫힌다.
const advanceTo = async (page, re, max = 14, choice = 1) => {
  for (let i = 0; i < max; i++) {
    const txt = await page.evaluate(() => document.body.innerText).catch(() => "");
    if (re.test(txt)) return;
    await pick(page, choice);
  }
};

// 가중치 최고 카테고리(지분 & 보상)는 추가 진단 Q17~Q20에 있다.
// 기본 12문항을 다 통과해야 "추가 진단 계속하기"가 열린다.
// (?goTo= 파라미터는 진행 상태가 있어야 먹히므로 직접 점프는 불가)
const toDeepQuestion = async (page, re) => {
  for (let i = 0; i < 14 && !page.url().includes("complete"); i++) await pick(page, 1);
  await page.waitForTimeout(600);
  await page
    .getByRole("button", { name: /추가 진단 계속/ })
    .or(page.getByRole("link", { name: /추가 진단 계속/ }))
    .first()
    .click({ timeout: 4000 })
    .catch(() => {});
  await page.waitForTimeout(2200);
  await advanceTo(page, re, 12);
};

// 팀 갭 리포트에는 실제 팀원 이름이 뜬다. 공개 영상이므로 표시되는 이름만
// A·B·C로 치환한다. 진단 응답·일치율·히트맵 등 데이터는 전부 실제 값 그대로다.
// Firestore 실시간 구독이 DOM을 다시 그리므로 MutationObserver로 계속 적용한다.
const ANONYMIZE = ({ subs, exacts }) => {
  const swap = (t) => {
    // 아바타 이니셜("황")처럼 한 글자짜리는 부분 치환하면 "상황" 같은 단어까지
    // 망가진다. 텍스트 노드 전체가 정확히 일치할 때만 바꾼다.
    const exact = exacts.find(([from]) => t.trim() === from);
    if (exact) return t.replace(exact[0], exact[1]);
    for (const [from, to] of subs) if (t.includes(from)) t = t.split(from).join(to);
    return t;
  };
  let observer;
  const apply = () => {
    observer?.disconnect(); // 자기 변경으로 재귀 호출되는 것을 막는다
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    for (const n of nodes) {
      const next = swap(n.nodeValue);
      if (next !== n.nodeValue) n.nodeValue = next;
    }
    observer?.observe(document.body, { childList: true, subtree: true, characterData: true });
  };
  observer = new MutationObserver(apply);
  apply();
};

const NAME_MAP = {
  subs: [
    ["이윤석", "A"],
    ["정정훈", "B"],
    ["황주명", "C"],
  ],
  exacts: [["황", "C"]], // 헤더 아바타 이니셜
};

const loginAndOpenReport = async (page) => {
  const id = process.env.CO_ID;
  const pw = process.env.CO_PW;
  if (!id || !pw) throw new Error("CO_ID / CO_PW 환경변수가 필요합니다 (계정 정보는 코드에 두지 않는다)");

  await page.goto(`${BASE_URL}/login`, { waitUntil: "load" });
  await page.waitForTimeout(2200);
  await page.locator('input[type="email"], input[placeholder*="@"]').first().fill(id);
  await page.locator('input[type="password"]').first().fill(pw);
  await page.getByRole("button", { name: /로그인/ }).first().click();
  await page.waitForTimeout(4500);

  await page.goto(`${BASE_URL}/gap-report`, { waitUntil: "load" });
  // ponytail: 실시간 구독이 화면을 여러 번 다시 그린다. 충분히 기다렸다가
  // 익명화를 걸어야 스크롤 도중 레이아웃이 밀리지 않는다.
  await page.waitForTimeout(7000);
  await page.evaluate(ANONYMIZE, NAME_MAP);
  // ponytail: 게이지·막대·히트맵 진입 애니메이션이 스크롤과 겹쳐 흔들려 보인다.
  await page.addStyleTag({
    content: `*,*::before,*::after{animation:none!important;transition:none!important}`,
  });
  await page.waitForTimeout(1500);
};

// ── 씬 ──────────────────────────────────────────────────────────────
// enter(): 녹화는 되지만 잘라낼 준비 구간. steps: 실제로 쓸 구간.
export const SCENES = [
  {
    // 빈도 1위 문항. 돈도 규모도 필요 없이 모든 초기 팀이 겪는다.
    // "매번 이유는 있어요" 가 핵심 — 정당해서 말을 못 꺼내고 쌓이는 마찰.
    // 조건부 문항이라 보기 4번으로 밀어야 열린다.
    id: "delay",
    enter: async (page) => {
      await startDiagnosis(page);
      await advanceTo(page, /개발 일정이 이번 달도 밀렸/, 12, 4);
    },
    steps: [{ hold: 1700 }, { scroll: 160, ms: 1200 }, { hold: 2000 }],
    captions: [
      { from: 0.2, to: 1.9, html: `파트너 일정이<br>이번 달도 밀렸어요` },
      { from: 2.1, to: 3.9, html: `근데 <em>매번 이유는 있어요</em>` },
    ],
    narration: "narration/me-2-delay.wav",
  },
  {
    // 두 번째 훅. 지분 파이차트가 시각적으로 가장 강한 문항.
    id: "equity",
    enter: async (page) => {
      await startDiagnosis(page);
      await advanceTo(page, /지분 20%|이탈 시 지분/);
    },
    steps: [{ hold: 1700 }, { scroll: 170, ms: 1300 }, { hold: 2500 }],
    captions: [
      { from: 0.2, to: 2.3, html: `2년 같이 한 파트너가<br>나간다고 합니다` },
      { from: 2.5, to: 4.9, html: `지분 <em>20%</em>,<br>근데 정해둔 기준이 없어요` },
    ],
    narration: "narration/me-3-equity.wav",
  },
  {
    // 페이오프. 팀 전원이 진단한 뒤의 실제 갭 리포트.
    // 일치율 → 히트맵 → 고위험 충돌 카드 순으로 훑는다.
    id: "report",
    enter: loginAndOpenReport,
    // ponytail: 멀리 빠르게 이동 → 길게 정지를 반복하면 컷이 끊겨 보인다.
    // 이동 시간을 늘리고 정지를 짧게 잡아 계속 흐르는 느낌으로 만든다.
    steps: [
      // ponytail: 픽셀 좌표로 보내면 Firestore 실시간 구독이 화면을 다시
      // 그릴 때 레이아웃이 밀려 엉뚱한 곳에 멈춘다. 요소 기준으로 찾아간다.
      // ponytail: 멈췄다 가기를 반복하면 뻑뻑하다. 한 번에 이어서 내려간다.
      { hold: 400 },
      { target: "급여 기준", ms: 6000, offset: 260, correct: true },
      { hold: 2600 },
    ],
    captions: [
      { from: 0.2, to: 2.7, html: `팀원도 하면<br><mark>일치율</mark>이 나와요` },
      { from: 2.9, to: 5.5, html: `20개 문항이<br><em>일치 / 차이 / 충돌</em>로` },
      { from: 5.8, to: 8.7, html: `같은 질문에<br>셋 다 <em>다른 답</em>` },
    ],
    narration: "narration/me-4-report.wav",
  },
];

export const CARDS = {
  // 훅 카드는 맨 앞에 붙는다 (make-reel.mjs 의 order 참조).
  // 훅이 약속하는 건 "숫자"와 "얼마나 다른가" 둘 뿐이고, 갭 리포트가 그걸 갚는다.
  // 그래서 6가지 나열 같은 건 약속하지 않는다.
  hook: {
    dur: 3.0,
    narration: "narration/me-1-hook.wav",
    html: `
      <div class="card card--hook">
        <div class="hook-bg"><img src="HOOK_BG_SRC" alt=""></div>
        <div class="hook-veil"></div>
        <div class="hook-body">
          <div class="pill-tag">창업팀 진단</div>
          <div class="lead">3분이면 <em>숫자로</em> 나와요</div>
          <h1>우리 팀 생각,<br><em class="warn">얼마나 일치할까?</em></h1>
        </div>
      </div>`,
  },
  cta: {
    dur: 3.4,
    narration: "narration/me-5-cta.wav",
    html: `
      <div class="card card--cta">
        <div class="mascot"><img src="MASCOT_SRC" alt=""></div>
        <h1>숨겨진 동업 리스크<br><em>무료 진단</em></h1>
        <div class="row">
          <span class="pill">약 3분</span>
        </div>
        <div class="link">프로필 링크에서 →</div>
      </div>`,
  },
};

// ── 스타일 ──────────────────────────────────────────────────────────
// 두꺼운 검은 테두리 자막은 화면을 지저분하게 만든다. 대신 하단 스크림 위에
// 얇은 그림자만 준 굵은 흰 글씨 + 키워드 하이라이트로 간다.
export const CSS = `
  @charset "UTF-8";
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: ${W}px; height: ${H}px;
    font-family: "Apple SD Gothic Neo", sans-serif;
    -webkit-font-smoothing: antialiased;
  }

  .cap-layer { position: absolute; inset: 0; }
  .scrim {
    position: absolute; left: 0; right: 0; bottom: 0; height: 880px;
    background: linear-gradient(to top,
      rgba(9,7,20,.94) 10%, rgba(9,7,20,.80) 38%, rgba(9,7,20,.36) 68%, rgba(9,7,20,0) 100%);
  }
  .cap-wrap {
    position: absolute; left: 0; right: 0; bottom: ${H - SAFE_BOTTOM}px;
    display: flex; justify-content: center; padding: 0 72px;
  }
  .cap {
    font-size: 66px; font-weight: 800; line-height: 1.36;
    text-align: center; color: #fff;
    letter-spacing: -0.035em; word-break: keep-all;
    text-shadow: 0 4px 20px rgba(0,0,0,.45);
  }
  .cap em { font-style: normal; color: ${YELLOW}; }
  .cap mark {
    background: ${INDIGO}; color: #fff;
    padding: .04em .2em .1em; border-radius: 16px;
    -webkit-box-decoration-break: clone; box-decoration-break: clone;
  }

  .card {
    width: ${W}px; height: ${H}px;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    text-align: center; padding: 0 88px; gap: 34px;
  }
  .card h1 {
    font-size: 88px; font-weight: 900; line-height: 1.26;
    letter-spacing: -0.04em; word-break: keep-all;
  }
  .card em { font-style: normal; }

  /* ponytail: 훅 카드 스타일이 빠지면 흰 배경에 검은 글씨로 렌더된다.
     배경·글자색이 여기에만 있으므로 카드를 추가할 때 같이 지우지 말 것.
     배경은 실제 진단 화면(Q3)을 블러 처리해 깐다. 텍스트만 있는 카드는
     인용구 템플릿처럼 보이고, 리서치상 시각 훅이 텍스트 훅보다 강하다.
     흐릿한 화면이 다음 컷에서 선명해지는 연결도 생긴다. */
  .card--hook { background: ${INK}; color: #fff; padding: 0; }
  .card--hook .hook-bg {
    position: absolute; inset: 0; overflow: hidden;
  }
  .card--hook .hook-bg img {
    width: 100%; height: 100%; object-fit: cover;
    /* scale로 살짝 키워야 블러 때문에 가장자리가 비지 않는다 */
    /* 블러가 세면 앱 화면인지 못 알아본다. 형태는 남기고 초점만 흐린다. */
    filter: blur(11px) saturate(1.2) brightness(.92); transform: scale(1.1);
  }
  .card--hook .hook-veil {
    position: absolute; inset: 0;
    background:
      radial-gradient(78% 46% at 50% 52%, rgba(20,18,31,.86) 0%, rgba(20,18,31,.58) 58%, rgba(20,18,31,.30) 100%),
      linear-gradient(180deg, rgba(20,18,31,.55) 0%, rgba(20,18,31,.10) 34%, rgba(20,18,31,.10) 66%, rgba(20,18,31,.62) 100%);
  }
  .card--hook .hook-body {
    position: relative; display: flex; flex-direction: column;
    align-items: center; gap: 30px; padding: 0 84px;
    text-shadow: 0 4px 26px rgba(0,0,0,.75), 0 2px 8px rgba(0,0,0,.6);
  }
  .card--hook .pill-tag {
    font-size: 32px; font-weight: 800; letter-spacing: .12em;
    color: #C7D2FE; padding: 14px 34px; border-radius: 999px;
    background: rgba(129,140,248,.16); border: 2px solid rgba(165,180,252,.38);
  }
  .card--hook .lead {
    font-size: 52px; font-weight: 800; letter-spacing: -.03em;
    color: #E5E7EB;
  }
  /* 훅은 질문이다. 질문이 제일 커야 위계가 맞는다. */
  .card--hook h1 { font-size: 104px; line-height: 1.22; }
  .card--hook em { color: #A5B4FC; }
  .card--hook h1 em.warn {
    color: ${AMBER};
    text-shadow: 0 6px 34px rgba(245,158,11,.35);
  }

  .card--cta {
    background: radial-gradient(120% 80% at 50% 18%, #6D5BF8 0%, ${INDIGO} 55%, #3B32C4 100%);
    color: #fff;
  }
  /* ponytail: logo.png는 배경이 투명하지만 발밑 타원 그림자가 흰색으로 구워져
     있다. 보라 위에 바로 얹으면 그 그림자가 흰 얼룩으로 보이므로 흰 원 안에
     넣어 묻힌다. object-fit: contain 으로 원 정중앙에 맞춘다. */
  .card--cta .mascot {
    width: 380px; height: 380px; border-radius: 50%;
    background: #fff; overflow: hidden;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 24px 64px rgba(0,0,0,.28);
  }
  .card--cta .mascot img {
    width: 320px; height: 320px;
    object-fit: contain; display: block;
  }
  .card--cta em { color: ${YELLOW}; }
  .card--cta .row { display: flex; gap: 18px; }
  .card--cta .pill {
    font-size: 36px; font-weight: 700; padding: 16px 34px;
    border-radius: 999px; background: rgba(255,255,255,.15);
    border: 2px solid rgba(255,255,255,.34);
  }
  .card--cta .link { font-size: 44px; font-weight: 900; margin-top: 6px; }
`;
