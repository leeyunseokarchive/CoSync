# Task 7 Report: Root 컴포지션 조립 + 프레임 검증

## What was created

- **`src/IntroVideo.tsx`** (new) — sequences the 6 existing scene components (`Scene1Hook` ~ `Scene6Outro`) via a `SCENES` array with per-scene durations (120, 150, 150, 180, 150, 150 = 900 frames total), each wrapped in a `<Sequence>` with a running `from` cursor. Written verbatim from the brief's Step 1 code.
- **`src/Root.tsx`** (replaced) — registers `<Composition id="CoSyncIntro" component={IntroVideo} durationInFrames={900} fps={30} width={1080} height={1920} />`. Written verbatim from the brief's Step 2 code (this drops the previous `MyComposition`/`index.css` import, per the brief's explicit replacement).

Scene boundary math (cumulative from durations): Scene1 0–120, Scene2 120–270, Scene3 270–420, Scene4 420–600, Scene5 600–750, Scene6 750–900. All 6 requested still frames (0, 150, 300, 480, 630, 899) fall inside the intended scene ranges.

## Render output (Step 3)

Ran from `/Users/leeyunseok/Desktop/Projects/CoSync-intro-video`:

```
npx remotion still CoSyncIntro out/check/frame-0000.png --frame=0
npx remotion still CoSyncIntro out/check/frame-0150.png --frame=150
npx remotion still CoSyncIntro out/check/frame-0300.png --frame=300
npx remotion still CoSyncIntro out/check/frame-0480.png --frame=480
npx remotion still CoSyncIntro out/check/frame-0630.png --frame=630
npx remotion still CoSyncIntro out/check/frame-0899.png --frame=899
```

All 6 renders completed with no errors ("Rendered 1/1" each). `file out/check/*.png` confirmed all 6 are `PNG image data, 1080 x 1920, 8-bit/color RGB, non-interlaced`.

## Visual confirmation (viewed all 6 stills as images)

- **frame-0000.png (frame 0, Scene1Hook):** Solid dark navy/black background (`#0b0b0f`), no visible text. This is expected, not a bug — `Scene1Hook.tsx` fades each line in via `interpolate(frame, [0, 8, ...], [0, 1, ...])`, so at frame 0 of the line's local sequence, opacity is exactly 0. The background color and absence of other scenes' content confirms it is the Hook scene rendering correctly, just at its very first (invisible-text) frame.
- **frame-0150.png (frame 150, Scene2Diagnosis):** Browser-window mockup showing a "역할 & 책임" (Roles & Responsibilities) question screen, "QUESTION 1/20", multiple choice options, a person icon with speech bubbles, and the caption "막연한 약속 대신, 20개 질문으로 먼저 확인하세요" below. Matches the Diagnosis scene.
- **frame-0300.png (frame 300, Scene3GapReport):** Browser mockup with a purple "GAP REPORT" header, "팀 통합 리포트" subtitle, a "81%" gap donut chart, and caption "누가 어디서 다르게 생각하는지 한눈에". Matches the Gap Report scene.
- **frame-0480.png (frame 480, Scene4Consensus):** Browser mockup showing "팀 합의 세션" (Team Agreement Session), agenda items ("회색지대 업무 배정", "업무 몰입 시간 기대", "퍼포먼스 조치") with 합의 완료/자동 합의 tags, and caption "차이 나는 부분만, 팀원 전원 합의로 좁혀갑니다". Matches the Consensus scene.
- **frame-0630.png (frame 630, Scene5Agreement):** Browser mockup showing a formal document "창업 팀 간 구조적 합의안 / STRUCTURAL FOUNDING TEAM AGREEMENT", version tag "v1 Final", numbered chapters (제1장 역할&책임, 제2장 이탈&회수), and caption "합의된 내용은 문서로, 버전까지 관리". Matches the Agreement document scene.
- **frame-0899.png (frame 899, Scene6Outro):** Centered CoSync pretzel-shaped logo icon on white card, with slogan text "CoSync — 창업은 신뢰가 아니라 실전입니다." below, on dark background. Matches the Outro scene.

All 6 frames landed in their intended scenes with correct content — no scene-order bug, no blank/broken layout beyond the expected fade-in at frame 0.

## Commit (Step 4)

```
git add src/Root.tsx src/IntroVideo.tsx
git commit -m "feat: assemble 30s IntroVideo composition from 6 scenes"
```

Commit hash: `12055c7c48e8513509797a960fd5721b062b3b97`
2 files changed (Root.tsx modified, IntroVideo.tsx created), 43 insertions, 5 deletions.

## Concerns

None blocking. Minor note: frame 0 of the composition is a fully black/text-invisible frame by scene design (intentional fade-in), which is normal for a video with entrance animations but worth knowing if frame 0 is ever used as a thumbnail/poster frame.
