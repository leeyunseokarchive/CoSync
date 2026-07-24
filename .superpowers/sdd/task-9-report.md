# Task 9 Report: 최종 렌더 및 검증

## Step 1: 렌더

```
cd /Users/leeyunseok/Desktop/Projects/CoSync-intro-video
npx remotion render CoSyncIntro out/CoSyncIntro.mp4
```

Result: success, no errors.

- Composition: CoSyncIntro
- Codec: h264
- Concurrency: 6x
- Rendered: 900/900 frames
- Encoded: 900/900 frames
- Output: `out/CoSyncIntro.mp4`, 7 MB (reported by CLI), exact size 7,015,618 bytes
- Render wall-clock: roughly 15s once bundling finished (bundling itself took longer)
- Non-fatal warning (expected, not a bug): Remotion logged "The audio with src /public/audio/bgm.mp3 has changed it's volume. Prefer the callback syntax..." — cosmetic dev-console warning about the BGM fade-in/out implementation from Task 8, does not affect output.

## Step 2: ffprobe 검증

```
ffprobe -v error -show_entries stream=width,height,codec_type -show_entries format=duration -of default=noprint_wrappers=1 out/CoSyncIntro.mp4
```

Output:
```
codec_type=video
width=1080
height=1920
codec_type=audio
duration=30.058667
```

Check against expected:
- width=1080 — PASS
- height=1920 — PASS
- video stream present — PASS
- audio stream present — PASS
- duration ~30.0s (±0.1s) — 30.059s, PASS (0.059s over, within tolerance)

ffmpeg/ffprobe were already installed (Homebrew, ffmpeg 7.1.1) — no install step needed.

## Step 3: 시각적 스팟체크

Extracted frames with `ffmpeg -ss <t> -i out/CoSyncIntro.mp4 -frames:v 1 <out>.png` at t=2s, 10s, 20s, 28s, plus extra frames at 18.5s/19s/19.5s/20.5s/21s to double check t=20s.

- **t=2s**: Scene 1 (hook) — dark background, bold gray Korean text "지분은?" ("What about equity?") centered. Matches intended opening hook.
- **t=10s**: A screen scene — browser mockup showing the CoSync "GAP REPORT" dashboard (인식 격차 리포트) with a purple header, "81%" gauge, team insight summary text, and a caption below reading "누가 어디서 다르게 생각하는지 한눈에" ("See at a glance who thinks differently, where"). Caption + screenshot + browser chrome all rendering correctly.
- **t=20s**: Landed on a very brief black frame between two screen-scene segments. Checked adjacent frames (18.5s, 19s, 19.5s, 20.5s, 21s) — all show continuous, correct content: a "팀 합의 세션" (Agreement Session) screen mockup with caption "차이 나는 부분만, 팀원 전원 합의로 좁혀갑니다", transitioning to a "창업 팀 간 구조적 합의안" (Structural Founding Team Agreement) document view with caption "합의된 내용은 문서로, 버전까지 관리". The exact t=20.0s frame is coincidental single-frame black gap (likely a crossfade midpoint), not a stuck/broken scene — confirmed by neighboring frames showing normal content on both sides.
- **t=28s**: Outro/end card — CoSync pretzel-shaped logo icon on white card, dark background, tagline "CoSync — 창업은 신뢰가 아니라 실전입니다." ("CoSync — Startup is not about trust, it's about execution.")

All 6 scenes, Korean captions, and BGM (confirmed present via ffprobe audio stream) appear to be rendering as intended. No visual glitches, missing assets, or frozen/corrupt frames found.

## Step 4: Commit

```
cd /Users/leeyunseok/Desktop/Projects/CoSync-intro-video
git add -A
git commit -m "chore: render final CoSync intro video (30s, 1080x1920)"
```

**Result: no commit created.** `git status` showed "nothing to commit, working tree clean" before running `git add -A`. Reason: `.gitignore` in this repo explicitly excludes `out/` (`# Ignore the output video from Git but not videos you import into src/.` / `out`), so `out/CoSyncIntro.mp4` is intentionally untracked and git sees no changes to stage. Per the repo's own convention the rendered video is not meant to be committed — only the source (scenes, Root composition, BGM asset) is tracked, and that was already committed in prior tasks. I did not force an empty/no-op commit since there was genuinely nothing to add.

Latest commit on the repo remains: `afbec0b` ("feat: add background music with fade in/out") from Task 8 — no new commit hash was produced for Task 9 because the render output is gitignored by design.

## File size

`out/CoSyncIntro.mp4`: 7,015,618 bytes (~6.7 MiB / 7 MB)

## Concerns

- The `git commit` step in the brief assumes the rendered mp4 would be a trackable artifact, but the project's `.gitignore` excludes `out/`. This is very likely intentional (video binaries don't belong in git history), so I'm flagging it rather than treating it as a failure. If the intent was truly to commit the binary video file, the `.gitignore` entry would need to be removed/adjusted first — but I did not do this unilaterally since it looks like a deliberate repo convention.
- Minor: Remotion emitted a repeated console warning about setting audio volume imperatively rather than via the callback syntax (from Task 8's BGM fade in/out implementation). It's non-blocking and cosmetic, surfaced only in the render CLI log, not in the final video.
- Otherwise the render, resolution/duration/audio checks, and visual spot-check all passed cleanly.
