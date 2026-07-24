### Task 5: 공용 컴포넌트 (Caption, ScreenshotFrame, ScreenScene)

**Files:**
- Create: `src/components/Caption.tsx`
- Create: `src/components/ScreenshotFrame.tsx`
- Create: `src/components/ScreenScene.tsx`

**Interfaces:**
- Produces:
  - `Caption({ text: string, delayFrames?: number })` — 화면 하단 타이포 자막.
  - `ScreenshotFrame({ src: string })` — 브라우저 목업 프레임 안에 스크린샷 렌더.
  - `ScreenScene({ screenshot: string, caption: string, durationInFrames: number })` — Task 6에서 4개 씬이 재사용.
- Consumes: `staticFile`, `Img`(remotion), `@remotion/google-fonts/NotoSansKR`.

- [ ] **Step 1: `src/components/Caption.tsx` 작성**

```tsx
import { useCurrentFrame, interpolate, Easing } from "remotion";
import { loadFont } from "@remotion/google-fonts/NotoSansKR";

const { fontFamily } = loadFont("normal", { weights: ["700", "900"], subsets: ["latin"] });

export const Caption: React.FC<{ text: string; delayFrames?: number }> = ({ text, delayFrames = 0 }) => {
  const frame = useCurrentFrame();
  const local = frame - delayFrames;
  const opacity = interpolate(local, [0, 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const translateY = interpolate(local, [0, 15], [30, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  return (
    <div
      style={{
        position: "absolute",
        bottom: 220,
        left: 60,
        right: 60,
        textAlign: "center",
        opacity,
        translate: `0px ${translateY}px`,
      }}
    >
      <span
        style={{
          fontFamily,
          fontSize: 60,
          fontWeight: 800,
          color: "white",
          lineHeight: 1.35,
          textShadow: "0px 4px 24px rgba(0,0,0,0.55)",
        }}
      >
        {text}
      </span>
    </div>
  );
};
```

- [ ] **Step 2: `src/components/ScreenshotFrame.tsx` 작성**

```tsx
import { Img, staticFile } from "remotion";

export const ScreenshotFrame: React.FC<{ src: string }> = ({ src }) => {
  return (
    <div
      style={{
        position: "absolute",
        top: 160,
        left: 60,
        right: 60,
        bottom: 420,
        borderRadius: 28,
        overflow: "hidden",
        boxShadow: "0px 30px 80px rgba(0,0,0,0.45)",
        border: "6px solid rgba(255,255,255,0.15)",
      }}
    >
      <div style={{ height: 36, background: "#e8e8ec", display: "flex", alignItems: "center", gap: 8, paddingLeft: 16 }}>
        <div style={{ width: 12, height: 12, borderRadius: 6, background: "#ff5f57" }} />
        <div style={{ width: 12, height: 12, borderRadius: 6, background: "#febc2e" }} />
        <div style={{ width: 12, height: 12, borderRadius: 6, background: "#28c840" }} />
      </div>
      <Img src={staticFile(src)} style={{ width: "100%", display: "block" }} />
    </div>
  );
};
```

- [ ] **Step 3: `src/components/ScreenScene.tsx` 작성**

```tsx
import { AbsoluteFill, useCurrentFrame, interpolate, Easing } from "remotion";
import { ScreenshotFrame } from "./ScreenshotFrame";
import { Caption } from "./Caption";

export const ScreenScene: React.FC<{ screenshot: string; caption: string; durationInFrames: number }> = ({
  screenshot,
  caption,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const zoom = interpolate(frame, [0, durationInFrames], [1, 1.06], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.4, 0, 0.2, 1),
  });
  const slideIn = interpolate(frame, [0, 14], [40, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const opacity = interpolate(frame, [0, 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: "#0b0b0f" }}>
      <div style={{ position: "absolute", inset: 0, scale: zoom, translate: `0px ${slideIn}px`, opacity }}>
        <ScreenshotFrame src={screenshot} />
      </div>
      <Caption text={caption} delayFrames={10} />
    </AbsoluteFill>
  );
};
```

- [ ] **Step 4: 렌더 확인 (한 프레임 스틸)**

`src/scenes/Scene2Diagnosis.tsx`가 아직 없으므로, 임시로 `src/Root.tsx`의 기존 blank composition에 `ScreenScene`을 붙여 스틸 렌더로 컴파일 에러가 없는지만 확인한다:

```bash
cd "/Users/leeyunseok/Desktop/Projects/CoSync-intro-video"
npx tsc --noEmit
```

Expected: 타입 에러 없이 종료.

- [ ] **Step 5: Commit**

```bash
cd "/Users/leeyunseok/Desktop/Projects/CoSync-intro-video"
git add src/components
git commit -m "feat: add Caption, ScreenshotFrame, ScreenScene shared components"
```

---

