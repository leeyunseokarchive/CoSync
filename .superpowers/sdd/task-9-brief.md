### Task 9: 최종 렌더 및 검증

**Files:**
- Create: `out/CoSyncIntro.mp4`

**Interfaces:**
- Consumes: Task 7의 `CoSyncIntro` 컴포지션(오디오 포함, Task 8).

- [ ] **Step 1: 렌더**

```bash
cd "/Users/leeyunseok/Desktop/Projects/CoSync-intro-video"
npx remotion render CoSyncIntro out/CoSyncIntro.mp4
```

Expected: 렌더 진행률 100%까지 에러 없이 완료, `out/CoSyncIntro.mp4` 생성.

- [ ] **Step 2: 해상도/길이/오디오 검증**

```bash
ffprobe -v error -show_entries stream=width,height,codec_type -show_entries format=duration -of default=noprint_wrappers=1 out/CoSyncIntro.mp4
```

Expected: `width=1080`, `height=1920`, 비디오/오디오 스트림 모두 존재, `duration`이 30.0 근처(±0.1초).

- [ ] **Step 3: 최종 확인**

산출물 경로 `~/Desktop/Projects/CoSync-intro-video/out/CoSyncIntro.mp4`를 사용자에게 안내하고, 직접 재생해서 6개 씬/자막/BGM이 의도대로 나오는지 확인받는다. 수정 요청이 있으면 해당 Task로 돌아가 반복.

- [ ] **Step 4: Commit**

```bash
cd "/Users/leeyunseok/Desktop/Projects/CoSync-intro-video"
git add -A
git commit -m "chore: render final CoSync intro video (30s, 1080x1920)"
```

---

## Self-Review Notes

- **Spec coverage**: 파이프라인(에뮬레이터→시딩→캡처→합성→렌더) 전체가 Task 1~9로 매핑됨. 스토리보드 6컷 = Scene1~6. BGM 승인 절차 = Task 8 Step 1. 최종 산출물 경로/해상도 = Task 9.
- **Type consistency**: `ScreenScene`의 props(`screenshot`, `caption`, `durationInFrames`)가 Task 6의 4개 스크린샷 씬에서 동일하게 사용됨. `IntroVideo`의 `SCENES` 배열 duration 합계(120+150+150+180+150+150=900)가 `Root.tsx`의 `durationInFrames={900}`와 일치.
- **범위 밖 이슈 발견**: CoSync 클라이언트(`lib/firebase.ts`)에 에뮬레이터 연결 코드가 전혀 없었음 — 시딩만으로는 화면에 데이터가 보이지 않으므로 Task 1로 추가함(스펙에 없던 내용이지만 파이프라인이 실제로 동작하려면 필수).
