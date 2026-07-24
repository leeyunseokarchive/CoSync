# Task 2 Report: 시나리오 시드 스크립트 확장

## What changed

- `scripts/seed.ts`: fully replaced per brief. Seeds two demo teams into the Firestore/Auth emulators (never production — `FIRESTORE_EMULATOR_HOST`/`FIREBASE_AUTH_EMULATOR_HOST` env vars are set before `initializeApp`):
  - `demo-team-a` ("노트펀치 팀"): 4 members with mixed matching/differing/conflicting onboarding answers across 5 fields (`extraWorkPriority`, `equityStructure`, `decisionFailure`, `growthStrategy`, `fundingRunway`). Consensus subcollection has one `resolved` doc (`extraWorkPriority`, all 4 approved) and one `voting` doc (`equityStructure`, 2/4 approved). The other 3 divergent fields are left unproposed.
  - `demo-team-b` ("얼리버드 팀"): all 4 members answer identically ("1" for every field), and a confirmed `agreements/v1` document is seeded via `buildClauses`, with `status: "confirmed"`.
  - Login account `owner@demo.local` / `demopass123!` (uid `demo-owner`), belonging to both teams (also 3 additional member accounts created for realism).
- `scripts/check-seed.ts`: new verification script asserting team A gap data, consensus statuses (`resolved`/`voting`), and team B's confirmed agreement with exactly 20 clauses.

Diff matches the brief's Step 1 code verbatim (only cosmetic whitespace/quote-style differences from the original file were replaced along with the content).

## Verification (actual run)

Started emulators (JDK 21 pinned):
```
export JAVA_HOME="/opt/homebrew/opt/openjdk@21"
export PATH="$JAVA_HOME/bin:$PATH"
firebase emulators:start --only firestore,auth
```
Output confirmed:
```
✔  All emulators ready! It is now safe to connect your app.
Authentication  127.0.0.1:9099
Firestore       127.0.0.1:8080
```

Ran seed script:
```
$ npx tsx scripts/seed.ts
Seeding demo scenario...
(node:75073) MetadataLookupWarning: received unexpected error = All promises were rejected code = UNKNOWN
Seeding complete: demo-team-a (진행중), demo-team-b (확정 v1.0)
```
(The `MetadataLookupWarning` is firebase-admin's benign GCE-metadata-server probe when running against emulators with no real credentials; harmless, no data impact.)

Ran check script:
```
$ npx tsx scripts/check-seed.ts
(node:75098) MetadataLookupWarning: received unexpected error = All promises were rejected code = UNKNOWN
OK: seed data verified
```
This confirms `demo-team-b`'s confirmed agreement has exactly 20 clauses (out of 21 `QUESTION_CONFIGS` fields — one field's option-"1" template apparently yields no clause text, per `buildClauses`'s skip-if-empty behavior — verified empirically since the assertion passed).

Emulator process killed after verification (`pkill -f "firebase emulators:start"`; confirmed no residual firebase/cloud-firestore-emulator processes with `ps aux`).

## Commit

```
5946c53 feat: seed full demo scenario (gap + consensus + confirmed agreement) for video capture
2 files changed, 197 insertions(+), 35 deletions(-)
create mode 100644 scripts/check-seed.ts
```
Staged only `scripts/seed.ts` and `scripts/check-seed.ts`, per the brief's Step 4 — did not touch pre-existing unrelated uncommitted changes in the working tree (`.firebase/hosting.b3V0.cache`, `app/actions/consensus.ts`, `app/actions/team.ts`, `app/agreement/confirm/page.tsx`, `app/workspace/page.tsx`, `firestore.rules`, `tsconfig.tsbuildinfo`) since those are out of scope for this task.

## Concerns

None. Both scripts ran successfully against the emulator on the first attempt, matched expected console output exactly, and the commit contains only the two intended files.
