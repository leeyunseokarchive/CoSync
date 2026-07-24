### Task 6: 씬 구현 (6개)

**Files:**
- Create: `src/scenes/Scene1Hook.tsx`
- Create: `src/scenes/Scene2Diagnosis.tsx`
- Create: `src/scenes/Scene3GapReport.tsx`
- Create: `src/scenes/Scene4Consensus.tsx`
- Create: `src/scenes/Scene5Agreement.tsx`
- Create: `src/scenes/Scene6Outro.tsx`

**Interfaces:**
- Consumes: `src/components/ScreenScene.tsx`(Task 5).
- Produces: 각 씬은 프레임 길이가 정해진 독립 컴포넌트 — Task 7의 `IntroVideo`가 이 6개를 순서대로 이어붙인다. 프레임 길이: Scene1=120, Scene2=150, Scene3=150, Scene4=180, Scene5=150, Scene6=150 (합계 900 = 30초 @30fps).

- [ ] **Step 1: `src/scenes/Scene1Hook.tsx` 작성**

```tsx
import { AbsoluteFill, Sequence, useCurrentFrame, interpolate, Easing } from "remotion";
import { loadFont } from "@remotion/google-fonts/NotoSansKR";

const { fontFamily } = loadFont("normal", { weights: ["800", "900"], subsets: ["latin"] });

const LINES = [
  { text: "팀 만들 땐 신났는데...", duration: 35, fontSize: 56 },
  { text: "지분은?", duration: 28, fontSize: 96 },
  { text: "역할은?", duration: 28, fontSize: 96 },
  { text: "그만두면?", duration: 29, fontSize: 96 },
];

const HookLine: React.FC<{ text: string; fontSize: number; durationInFrames: number }> = ({
  text,
  fontSize,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(
    frame,
    [0, 8, durationInFrames - 8, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const scale = interpolate(frame, [0, 10], [0.85, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <div
        style={{
          opacity,
          scale,
          fontFamily,
          fontSize,
          fontWeight: 900,
          color: "white",
          textAlign: "center",
          padding: "0 80px",
          lineHeight: 1.3,
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
};

export const Scene1Hook: React.FC = () => {
  let cursor = 0;
  return (
    <AbsoluteFill style={{ backgroundColor: "#0b0b0f" }}>
      {LINES.map((line) => {
        const from = cursor;
        cursor += line.duration;
        return (
          <Sequence key={line.text} from={from} durationInFrames={line.duration} layout="none">
            <HookLine text={line.text} fontSize={line.fontSize} durationInFrames={line.duration} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
```

- [ ] **Step 2: `src/scenes/Scene2Diagnosis.tsx` 작성**

```tsx
import { ScreenScene } from "../components/ScreenScene";

export const Scene2Diagnosis: React.FC = () => (
  <ScreenScene
    screenshot="screenshots/02-diagnosis.png"
    caption="막연한 약속 대신, 20개 질문으로 먼저 확인하세요"
    durationInFrames={150}
  />
);
```

- [ ] **Step 3: `src/scenes/Scene3GapReport.tsx` 작성**

```tsx
import { ScreenScene } from "../components/ScreenScene";

export const Scene3GapReport: React.FC = () => (
  <ScreenScene
    screenshot="screenshots/03-gap-report.png"
    caption="누가 어디서 다르게 생각하는지 한눈에"
    durationInFrames={150}
  />
);
```

- [ ] **Step 4: `src/scenes/Scene4Consensus.tsx` 작성**

```tsx
import { ScreenScene } from "../components/ScreenScene";

export const Scene4Consensus: React.FC = () => (
  <ScreenScene
    screenshot="screenshots/04-consensus.png"
    caption="차이 나는 부분만, 팀원 전원 합의로 좁혀갑니다"
    durationInFrames={180}
  />
);
```

- [ ] **Step 5: `src/scenes/Scene5Agreement.tsx` 작성**

```tsx
import { ScreenScene } from "../components/ScreenScene";

export const Scene5Agreement: React.FC = () => (
  <ScreenScene
    screenshot="screenshots/05-agreement-document.png"
    caption="합의된 내용은 문서로, 버전까지 관리"
    durationInFrames={150}
  />
);
```

- [ ] **Step 6: `src/scenes/Scene6Outro.tsx` 작성**

```tsx
import { AbsoluteFill, Img, staticFile, useCurrentFrame, interpolate, Easing } from "remotion";
import { loadFont } from "@remotion/google-fonts/NotoSansKR";

const { fontFamily } = loadFont("normal", { weights: ["700", "900"], subsets: ["latin"] });

export const Scene6Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const logoOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const logoScale = interpolate(frame, [0, 20], [0.7, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const textOpacity = interpolate(frame, [20, 35], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: "#0b0b0f", justifyContent: "center", alignItems: "center", flexDirection: "column", gap: 40 }}>
      <Img src={staticFile("logo.png")} style={{ width: 220, opacity: logoOpacity, scale: logoScale }} />
      <div style={{ opacity: textOpacity, fontFamily, fontSize: 44, fontWeight: 800, color: "white", textAlign: "center", padding: "0 90px", lineHeight: 1.4 }}>
        CoSync — 창업은 신뢰가 아니라 실전입니다.
      </div>
    </AbsoluteFill>
  );
};
```

- [ ] **Step 7: 타입 체크**

```bash
cd "/Users/leeyunseok/Desktop/Projects/CoSync-intro-video"
npx tsc --noEmit
```

Expected: 에러 없음.

- [ ] **Step 8: Commit**

```bash
cd "/Users/leeyunseok/Desktop/Projects/CoSync-intro-video"
git add src/scenes
git commit -m "feat: implement 6 scenes (hook, 4 screenshot scenes, outro)"
```

---

