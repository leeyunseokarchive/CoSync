### Task 1 Report: Firebase 에뮬레이터 연결 배선

**Change:** `lib/firebase.ts` rewritten to match the brief's code block verbatim.
- Added `connectAuthEmulator`/`connectFirestoreEmulator` imports and `getFunctions` (`functions` export, currently unused elsewhere in the app but kept per brief).
- Added a guarded block: when `NEXT_PUBLIC_USE_FIREBASE_EMULATOR === "1"` and a global flag isn't already set, connects `auth` to `http://127.0.0.1:9099` and `db` to `127.0.0.1:8080`, then sets `globalThis.__cosyncEmulatorConnected = true` to avoid reconnecting on HMR/re-import.
- No env var set → behavior unchanged (connects to production Firebase as before). No regression.

**Verification:**
- `npx tsc --noEmit -p .` — passed clean, no type errors.
- `firebase --version` → 15.3.1 (CLI present). `firebase.json` already has `emulators` config for `auth` (9099), `firestore` (8080), `ui` (4000), matching the brief.
- Attempted `firebase emulators:start --only firestore,auth`: **failed** — `Error: firebase-tools no longer supports Java version before 21. Please install a JDK at version 21 or above`. Machine has Java 17 (Temurin). Emulators could not actually be started in this environment, so the curl-to-4000/full end-to-end check from Step 2 could not be performed.
- As a substitute check: ran `NEXT_PUBLIC_USE_FIREBASE_EMULATOR=1 npm run dev` (Next.js 16.1.6, Turbopack). Dev server started cleanly (`✓ Ready in 722ms`), and `GET /login` (a page that imports `auth` from `lib/firebase`) returned `200` with no compile or runtime errors in the server log. This confirms the emulator-connection code path executes without throwing even when the emulator isn't reachable (the SDK calls just point the client at a host/port; they don't require an active connection at call time).
- Killed the dev server afterward; did not leave background processes running.

**Commit:** `e1b73a2189357254243ed9c40a9e3c6498d4f857` — "feat: add opt-in Firebase emulator connection for local demo capture" — `lib/firebase.ts` only (1 file changed, 15 insertions, 2 deletions). Other unrelated pending changes in the working tree (deleted files, modified pages, `.firebase` cache) were left untouched/unstaged, per the brief's `git add lib/firebase.ts` instruction.

**Concerns:**
- Full end-to-end emulator verification (Step 2's exact `curl 127.0.0.1:4000/firestore` check) could not run because this machine's Java (17) doesn't meet firebase-tools' new requirement (JDK 21+). Whoever runs Task 3 (actual capture) needs a JDK 21+ install, or the emulator step will fail the same way. This is an environment gap, not a code issue — the wiring itself type-checks and doesn't throw at runtime.
- `functions` export is unused elsewhere in the codebase today; harmless, included because the brief's code block specifies it verbatim.
