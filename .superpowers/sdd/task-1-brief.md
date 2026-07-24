### Task 1: Firebase 에뮬레이터 연결 배선 (CoSync 클라이언트)

**Files:**
- Modify: `/Users/leeyunseok/Desktop/Projects/CoSync/lib/firebase.ts`

**Interfaces:**
- Produces: `NEXT_PUBLIC_USE_FIREBASE_EMULATOR` 환경변수가 `"1"`일 때 `auth`/`db`가 `127.0.0.1:9099`, `127.0.0.1:8080` 에뮬레이터에 연결됨. 변수가 없으면 기존과 동일하게 프로덕션에 연결(회귀 없음).

- [ ] **Step 1: `lib/firebase.ts`에 에뮬레이터 연결 분기 추가**

```ts
import { initializeApp, getApps } from "firebase/app";
import { connectAuthEmulator, getAuth } from "firebase/auth";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";

const firebaseConfig = {
  apiKey: "AIzaSyDIJw3leCw1Ay1wYBgB7jTgLj8lwZkHuOs",
  authDomain: "cosync-d7dd7.firebaseapp.com",
  projectId: "cosync-d7dd7",
  storageBucket: "cosync-d7dd7.firebasestorage.app",
  messagingSenderId: "542201096247",
  appId: "1:542201096247:web:864ef9700f0491e92377b2"
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app);

declare global {
  // eslint-disable-next-line no-var
  var __cosyncEmulatorConnected: boolean | undefined;
}

if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === "1" && !globalThis.__cosyncEmulatorConnected) {
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
  globalThis.__cosyncEmulatorConnected = true;
}
```

- [ ] **Step 2: 검증 — 에뮬레이터 기동 후 dev 서버가 실제로 에뮬레이터를 바라보는지 확인**

```bash
cd "/Users/leeyunseok/Desktop/Projects/CoSync"
firebase emulators:start --only firestore,auth &
sleep 5
NEXT_PUBLIC_USE_FIREBASE_EMULATOR=1 npm run dev &
sleep 5
curl -s http://127.0.0.1:4000/firestore 2>&1 | head -5
```

Expected: 에뮬레이터 UI(4000 포트)가 응답하고, `npm run dev` 콘솔에 에러 없음. (브라우저에서 `http://localhost:3000`을 열어 개발자도구 Network 탭에 `127.0.0.1:8080`/`127.0.0.1:9099` 요청이 찍히면 배선 성공 — Task 3 캡처 단계에서 최종 확인.)

- [ ] **Step 3: Commit**

```bash
cd "/Users/leeyunseok/Desktop/Projects/CoSync"
git add lib/firebase.ts
git commit -m "feat: add opt-in Firebase emulator connection for local demo capture"
```

---

