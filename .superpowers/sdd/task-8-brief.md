### Task 8: BGM 선정 및 통합

**Files:**
- Create: `public/audio/bgm.mp3`
- Modify: `src/IntroVideo.tsx`

**Interfaces:**
- Produces: `IntroVideo`에 `@remotion/media`의 `Audio` 컴포넌트로 배경음악 추가, 0.35 볼륨, 마지막 20프레임 페이드아웃.

- [ ] **Step 1: 로열티프리 BGM 후보 2~3개를 사용자에게 제시하고 승인받기**

(에이전트 실행 시: 업비트/유튜브 오디오 라이브러리 등에서 라이선스 문제 없는 업템포 코퍼레이트 트랙 후보 2~3개의 이름/링크/라이선스 조건을 사용자에게 제시. 사용자가 선택하고 다운로드를 명시적으로 승인하면 다음 단계 진행. 승인 없이 다운로드하지 않는다.)

- [ ] **Step 2: 승인된 트랙을 `public/audio/bgm.mp3`로 저장**

```bash
mkdir -p "/Users/leeyunseok/Desktop/Projects/CoSync-intro-video/public/audio"
# 승인된 트랙을 public/audio/bgm.mp3 경로에 저장 (30초 이상, mp3)
```

- [ ] **Step 3: `src/IntroVideo.tsx`에 오디오 추가**

```tsx
import { AbsoluteFill, Sequence, useCurrentFrame, interpolate } from "remotion";
import { Audio } from "@remotion/media";
import { staticFile } from "remotion";
import { Scene1Hook } from "./scenes/Scene1Hook";
import { Scene2Diagnosis } from "./scenes/Scene2Diagnosis";
import { Scene3GapReport } from "./scenes/Scene3GapReport";
import { Scene4Consensus } from "./scenes/Scene4Consensus";
import { Scene5Agreement } from "./scenes/Scene5Agreement";
import { Scene6Outro } from "./scenes/Scene6Outro";

const SCENES = [
  { Component: Scene1Hook, duration: 120 },
  { Component: Scene2Diagnosis, duration: 150 },
  { Component: Scene3GapReport, duration: 150 },
  { Component: Scene4Consensus, duration: 180 },
  { Component: Scene5Agreement, duration: 150 },
  { Component: Scene6Outro, duration: 150 },
];

const TOTAL_DURATION = SCENES.reduce((sum, s) => sum + s.duration, 0);

const BackgroundMusic: React.FC = () => {
  const frame = useCurrentFrame();
  const volume = interpolate(frame, [0, 20, TOTAL_DURATION - 20, TOTAL_DURATION], [0, 0.35, 0.35, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return <Audio src={staticFile("audio/bgm.mp3")} volume={volume} />;
};

export const IntroVideo: React.FC = () => {
  let cursor = 0;
  return (
    <AbsoluteFill>
      {SCENES.map(({ Component, duration }, i) => {
        const from = cursor;
        cursor += duration;
        return (
          <Sequence key={i} from={from} durationInFrames={duration}>
            <Component />
          </Sequence>
        );
      })}
      <BackgroundMusic />
    </AbsoluteFill>
  );
};
```

- [ ] **Step 4: 검증**

```bash
cd "/Users/leeyunseok/Desktop/Projects/CoSync-intro-video"
npx tsc --noEmit
file public/audio/bgm.mp3
```

Expected: 타입 에러 없음, `bgm.mp3`가 `Audio file` 또는 `MPEG ADTS` 등으로 인식됨(0바이트 아님).

- [ ] **Step 5: Commit**

```bash
cd "/Users/leeyunseok/Desktop/Projects/CoSync-intro-video"
git add src/IntroVideo.tsx public/audio/bgm.mp3
git commit -m "feat: add background music with fade in/out"
```

---

