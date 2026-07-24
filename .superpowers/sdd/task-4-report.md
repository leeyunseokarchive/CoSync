# Task 4 Report: Remotion 프로젝트 스캐폴딩 + 정적 에셋 준비

## Ordering note (per controller instruction)

Task 4 (this task) ran before Task 3 (screenshot capture), since Task 3 needs
`public/screenshots/` to exist first. Step 2's mention of 4 pre-existing
screenshots was therefore not applicable; Step 3's verification was adjusted
accordingly (see below). Screenshots will be added and committed in a later task.

## What was created

- Scaffolded `/Users/leeyunseok/Desktop/Projects/CoSync-intro-video/` via
  `npx create-video@latest --yes --blank --no-tailwind CoSync-intro-video`
- `npm i` — 313 packages installed, 0 errors (2 low-severity audit warnings, unrelated to this task)
- `npx remotion add @remotion/media` → added `@remotion/media@4.0.489`
- `npx remotion add @remotion/google-fonts` → added `@remotion/google-fonts@4.0.489`
- `public/screenshots/` directory created (empty — populated by a later task)
- `public/logo.png` copied from `/Users/leeyunseok/Desktop/Projects/CoSync/logo.png` (1,546,218 bytes)
- `public/mascot.png` copied from `/Users/leeyunseok/Desktop/Projects/CoSync/mascot.png` (1,576,830 bytes)

## Verification output (Step 3, adjusted)

```
$ ls public/logo.png public/mascot.png
public/logo.png
public/mascot.png

$ ls -ld public/screenshots
drwxr-xr-x@ 2 leeyunseok  staff  64 Jul 16 14:55 public/screenshots

$ ls public/screenshots/*.png
(no matches — expected, screenshots not captured yet, that's a later task)

$ npx remotion studio --no-open
Server ready - Local: http://localhost:3000, Network: http://172.20.1.65:3000
Building...
Built in 3449ms
```

Studio server started with no errors, then was stopped (it was only started
transiently to confirm a clean boot).

## Commit

Repo: `/Users/leeyunseok/Desktop/Projects/CoSync-intro-video`

`create-video` itself made an initial commit (`95b115f Create new Remotion video`)
during scaffolding — this predates my `git init` call (which reported
"Reinitialized existing Git repository", i.e. a no-op since one already existed).

My commit on top of that, containing the `remotion add` package.json/lock changes
plus the two brand assets:

```
commit ef79bb1
chore: scaffold Remotion project with brand assets and screenshots

Adds @remotion/media and @remotion/google-fonts, plus logo.png and
mascot.png brand assets. public/screenshots/ dir created for a later
task to populate.

4 files changed, 5058 insertions(+), 2 deletions(-)
create mode 100644 package-lock.json
create mode 100644 public/logo.png
create mode 100644 public/mascot.png
```

`git status` afterward: clean working tree.

Note: `public/screenshots/` is empty and git does not track empty directories,
so it does not appear as a tracked path yet — this is expected and will resolve
once the later screenshot-capture task adds files into it.

## Concerns

- The `--no-tailwind` flag passed to `create-video@latest` (v4.0.489) was not
  honored: `package.json` still includes `@remotion/tailwind-v4` and
  `tailwindcss` as dependencies, and `src/index.css` contains
  `@import "tailwindcss";`. This appears to be a behavior/version quirk of the
  current `create-video` CLI rather than something I did — I ran the exact
  command from the brief. Flagging in case a later task assumes Tailwind is
  absent from this project.
- Everything else matches the brief's Step 1/Step 2 exactly, and the adjusted
  Step 3/4 verification described in the task instructions.
