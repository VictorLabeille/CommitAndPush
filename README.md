# Commit & Push

**A gym log that owes nothing to a server.**

A native Android app for tracking strength training: routines, sessions, sets and reps, history and
stats. No account, no backend, no sync — everything lives on the phone. The only thing that ever
leaves it is a text summary you choose to share at the end of a session, through the phone's own
share sheet, to Google Health's AI Coach.

The interface is in French.

**Expo SDK 56 · React Native 0.85 · TypeScript (strict) · expo-router · Zustand persisted to
AsyncStorage**

## What it refuses to do

The shape of this app is mostly a list of things it does not have. No sign-up, because a training
log is not worth an account. No server, because the data is three kilobytes and belongs on the
device. No API integration with the coach, because a block of text shared through the OS does the
job and breaks on nobody's schedule.

Two decisions that cost more than they look:

- **Exercise and routine names are frozen into history.** Rename a routine today and last month's
  sessions still read the way they happened. History is a record, not a view over current data.
- **State survives being killed.** Writes are debounced at around 300 ms and flushed on every set
  validation, at the end of a session, and when the app goes to the background. Reopen it
  mid-session and you are exactly where you left off, down to the running clock.

## Getting started

```bash
npm install
npx expo start          # scan the QR code with Expo Go (SDK 56)
# or: npm run android / npm run ios
```

React Native 0.85 wants Node ≥ 20.19.4. It installs and bundles under 20.19.2, but prefer Node 22
LTS for native builds.

| Command | What it does |
| --- | --- |
| `npm start` | Expo dev server |
| `npm test` | unit tests on the business logic |
| `npm run typecheck` | `tsc --noEmit`, strict |
| `npm run lint` | ESLint |

## How it is put together

```
src/
├── app/          expo-router routes — library · session · history · stats, plus settings
├── store/        persisted Zustand store and the pure session operations
├── logic/        the business logic: volume, export text, backup, stats, ghost sets — pure, tested
├── theme/        design tokens and typography
├── components/   reusable kit, then library / workout / history
└── hooks/        useChrono and friends
```

The rule that holds it up: **no business logic in a view**. Anything that computes lives in
`logic/`, has no React in it, and is tested — including `buildExportText`, which is pinned
character for character, because the coach reads the text and a stray space changes what it sees.

## Repository map

| Path | What is there |
| --- | --- |
| `docs/ARCHITECTURE.md` | Layers, state, persistence, navigation |
| `docs/DATA-MODEL.md` | Entities, relations, referential integrity |
| `docs/BUSINESS-RULES.md` | The business rules, and the export format |
| `docs/SCREENS.md` | Every screen, described |
| `design_handoff_commit_and_push/` | The brief and HTML prototype used as the visual oracle. Not shipped |
| `AGENTS.md` | Conventions and hard rules for anyone — human or agent — working on this repo |

Documentation is in French; this page is not.

## Licence

[MIT](LICENSE).
