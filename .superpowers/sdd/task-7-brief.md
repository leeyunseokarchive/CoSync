### Task 7: Root 컴포지션 조립 + 프레임 검증

**Files:**
- Modify: `src/Root.tsx`
- Create: `src/IntroVideo.tsx`

**Interfaces:**
- Consumes: Task 6의 6개 씬 컴포넌트.
- Produces: `Composition id="CoSyncIntro"`, `durationInFrames=900`, `fps=30`, `width=1080`, `height=1920`.

- [ ] **Step 1: `src/IntroVideo.tsx` 작성**

```tsx
import { AbsoluteFill, Sequence } from "remotion";
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
    </AbsoluteFill>
  );
};
```

- [ ] **Step 2: `src/Root.tsx`를 아래로 교체**

```tsx
import { Composition } from "remotion";
import { IntroVideo } from "./IntroVideo";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="CoSyncIntro"
      component={IntroVideo}
      durationInFrames={900}
      fps={30}
      width={1080}
      height={1920}
    />
  );
};
```

- [ ] **Step 3: 씬 경계 스틸 렌더로 검증**

```bash
cd "/Users/leeyunseok/Desktop/Projects/CoSync-intro-video"
mkdir -p out/check
npx remotion still CoSyncIntro out/check/frame-0000.png --frame=0
npx remotion still CoSyncIntro out/check/frame-0150.png --frame=150
npx remotion still CoSyncIntro out/check/frame-0300.png --frame=300
npx remotion still CoSyncIntro out/check/frame-0480.png --frame=480
npx remotion still CoSyncIntro out/check/frame-0630.png --frame=630
npx remotion still CoSyncIntro out/check/frame-0899.png --frame=899
file out/check/*.png
```

Expected: 6개 파일 모두 `PNG image data, 1080 x 1920` 출력, 렌더 에러 없음. 각 프레임이 프레임 0=훅, 150=진단, 300=갭리포트, 480=합의세션, 630=합의서, 899=아웃트로 화면인지 스크린샷을 열어 육안 확인.

- [ ] **Step 4: Commit**

```bash
cd "/Users/leeyunseok/Desktop/Projects/CoSync-intro-video"
git add src/Root.tsx src/IntroVideo.tsx
git commit -m "feat: assemble 30s IntroVideo composition from 6 scenes"
```

---

