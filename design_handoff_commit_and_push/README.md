# Handoff : Commit & Push — appli de suivi de musculation

## Overview
**Commit & Push** is a minimalist, **offline-first** strength-training tracker (French UI). No backend, no account: the only "integration" is producing a **structured text summary** at the end of a workout, shared via the phone's native share sheet to Google Health's "AI Coach".

This bundle is the **design reference** for that app: three tabs (Bibliothèque / Entraînement / Historique), a full active-session flow, a post-workout summary with text export, and a complete history with in-place editing.

## About the design files
The files here are **design references created in HTML** — a prototype that shows the intended look and behavior. **They are not production code to copy.** Your task is to **recreate this design in the target codebase** — here, an **Expo / React Native (TypeScript)** app — using its established patterns and the imposed stack (see the cahier des charges).

- `Commit & Push.dc.html` — the interactive prototype. Open it in a browser to click through every screen and state. *(It relies on `support.js`, included; both must sit side-by-side. It is a streaming "Design Component" file — read it for exact markup/values, don't port its runtime.)*
- `CahierDesCharges-Commit & Push.md` — the **source of truth** for stack, data models, business rules, export format, and acceptance criteria. Read it first.
- `README.md` — this file: visual spec + how to drive the build from Claude Code.

## Fidelity
**High-fidelity (hifi).** Final colors, typography, spacing, copy, and interactions. Recreate the UI faithfully with React Native primitives + the imposed libraries. Pixel values below are in CSS px from a ~408 px-wide screen; map them to dp (treat 1px ≈ 1dp) and use a responsive layout (Flexbox).

---

## How to use this in Claude Code

1. **Open your app repo** (or create a fresh Expo app) in the directory you run `claude` from. Drop this whole `design_handoff_commit_and_push/` folder inside the repo so Claude can read it.
2. **Prime the session.** Tell Claude Code, e.g.:
   > "Read `design_handoff_commit_and_push/CahierDesCharges-Commit & Push.md` and `README.md`. They specify a French, offline-first Expo + TypeScript + expo-router + Zustand strength-tracking app. Open `Commit & Push.dc.html` in the browser to see the intended UI. **Before writing view code, propose the file tree and the Zustand store shape and wait for my approval.** Then build incrementally MVP (P0) → V1.1 (P1)."
3. **Confirm the architecture first.** The cahier explicitly requires the agent to validate the **file tree** before generating views — hold it to that.
4. **Build order (matches §8 of the cahier):** store + data models → Bibliothèque (CRUD + search) → Entraînement (active session, sets, chrono, finish) → real-time persistence + resume-after-kill → Bilan + export text → Historique (list + detail + edit). Then P1 polish (ghost data, reorder, skip, FAB search, archiving, full history edit).
5. **Pin the business logic to unit tests** (the cahier requires 3): volume calc, export-text generation, ghost-data resolution. Use the exact cases in §9.
6. **Keep the prototype open as the visual oracle.** When a screen looks off, diff against the HTML and the tokens below.

> Do **not** ship the HTML. It's a reference. The native app must use React Native components, the imposed libraries, and AsyncStorage-backed persistence.

---

## Design tokens

| Token | Hex | Usage |
|---|---|---|
| `bg` | `#E8E2D3` | Warm cream screen background |
| `card` | `#F4F0E6` | Secondary card surfaces |
| `raise` | `#FCFAF3` | Raised surfaces (cards, bottom sheets, tab bar) |
| `ink` | `#20241B` | Primary text |
| `muted` | `#827C68` | Secondary text, inactive icons |
| `green` | `#1E3B2C` | Primary actions, active-session header |
| `green2` | `#2F6A47` | "Validated" set state |
| `gold` | `#B58A36` | Data, ghost data, "Terminer" button, accents |
| `gold-soft` | `#EFE3C6` | Bilan check chip background |
| `border` | `#DCD5C1` | Hairlines / card borders |
| `danger` | `#A2412F` | Destructive actions (delete, abandon) |
| skip badge bg | `#F2E0DA` | "Ignoré" tag |
| validated row tint | `rgba(47,106,71,.10)` | Completed set row background |

**Radii:** inputs/rows 11–13px · cards 14–18px · bottom sheets 26px top · screen/device 44–54px.
**Shadows:** primary buttons `0 12–14px 24–26px -8/-10px rgba(30,59,44,.55)`; sheets none/soft.
**Spacing:** screen gutters 22px · card padding 14–18px · list gaps 10–14px.

## Typography
- **Space Grotesk** — all UI text. Weights: 400/500 body & labels, 600 buttons/section titles, 700 screen titles & numbers-in-UI.
- **Space Mono** — every numeric value: chrono, weight, reps, dates, volume, set counts. Weight 700 for emphasis.
- Scale: screen title 28–30px/700 · card title 18–20px/700 · body 14–16px · labels 10–12px uppercase letter-spacing 1–2.5px · chrono 30px mono · input value 18–20px mono.
- `text-transform: uppercase` + letter-spacing on eyebrow labels (e.g. "PRÊT À POUSSER", "BACK-OFFICE").

## Touch targets
Minimum 48dp. Specific: numeric inputs 50dp tall, "Fait" ✓ 52dp, FAB 62dp, menu/kebab buttons 44–48dp, primary buttons 52–60dp.

---

## Screens / Views

The app is a **bottom tab bar** (cream `raise`, 1px top border, 74dp) with 3 tabs + a home-indicator bar. Tabs: **Bibliothèque** (rows icon), **Séance** (dumbbell icon), **Historique** (clock icon). Active = `green`, inactive = `#A39C88`. Modals are **bottom sheets** (slide up, rounded top, drag handle, scrim `rgba(28,32,22,.42)`).

### 1. Bibliothèque — Exercices
- **Eyebrow** "BACK-OFFICE" + title "Bibliothèque". Segmented control (Exercices | Routines): active segment = `green` fill, cream text; inactive = transparent, muted text; container `card` with `border`, radius 13, 4px pad.
- **Search field** (full-width, 48dp, `raise`, placeholder "Rechercher un exercice…") — instant substring filter, case-insensitive.
- **Exercise rows:** `raise` card, 60dp, gold dot + name (16px/500) + kebab (⋯). Tap kebab → bottom sheet: **Renommer** / **Archiver (supprimer)** (soft delete).
- **States:** empty ("Aucun exercice" + dashed icon), no-results ("Aucun résultat").
- **Bottom CTA:** fixed green button "+ Nouvel exercice" (56dp) → sheet with text input + "Ajouter".

### 2. Bibliothèque — Routines
- **Archive toggle** button "Voir les archives (N)" / "← Routines actives" (active view = green fill).
- **Routine cards:** name (18px/600) + optional "Archivée" badge + mono gold count "N exercices" + muted exercise-name preview + kebab. Kebab sheet (active routine): **Modifier la routine** / **Archiver la routine** / **Supprimer la routine**. For an archived routine: **Désarchiver** / **Supprimer**.
- **Create/Edit sheet:** name input + uppercase hint "Exercices (l'ordre = ordre de sélection)" + **search field** + scrollable checklist (checkbox box turns `green2` with ✓ when selected) + submit ("Créer la routine" / "Enregistrer"). Selection order defines routine order.
- **Empty:** "Aucune routine" / "Aucune routine archivée" variants.

### 3. Entraînement — Repos
- Eyebrow "PRÊT À POUSSER" + title "Entraînement".
- **Routine cards** (radius 18): name (20px/700), gold count, preview, full-width green **"Démarrer ▸"** (54dp). Only non-archived routines.
- **"+ Séance libre"** dashed button → starts a session with no exercises (free workout).
- Empty state when no active routines.

### 4. Entraînement — Séance active
- **Sticky header** (`green`, cream text): live blinking dot + "EN COURS" + routine name; right: **chrono HH:MM:SS** (30px mono) + live "Volume X kg". Full-width **"Terminer la séance"** button in `gold` with dark text. (Header has a subtle drop shadow.)
- **Scrollable exercise cards** (`raise`, radius 18), free scroll (no forced stepper):
  - Name (20px/700) + kebab. Kebab sheet: **Ignorer/Réactiver l'exercice**, **Monter**, **Descendre**.
  - Skipped card: opacity .55 + red "IGNORÉ" badge, body hidden.
  - **Ghost data** line (mono, muted): "Dern. : 80kg×10, 80kg×10, 80kg×9" (see rules §6.2).
  - **Sets table** — grid `24px | 1fr | 1fr | 52px`, header row "N° / POIDS / REPS / FAIT". Each set: index, **weight input** (decimal-pad), **reps input** (number-pad), **✓ "Fait" button** (validates). Validated row: green tint + green ✓ button. **No per-set delete** — an unvalidated set just doesn't count.
  - **"+ Série"** dashed button adds a row.
- **FAB** (62dp, gold, bottom-right): "+" → bottom sheet **"Ajouter un exercice"** with a **search field** over the whole library (already-added exercises hidden).

### 5. Bilan (post-workout)
- Gold check chip + eyebrow "BILAN" + "Séance terminée".
- Two stat tiles: **Durée** (editable — tap opens numeric sheet, writes `durationOverrideMin`) and **Volume** (`green` tile, auto-computed, mono).
- Summary list of active exercises with their completed sets (mono); a muted "Ignorés : …" line if any.
- **Primary CTA** (green, 2-line): "Partager vers AI Coach Google Health" → export sheet.
- Secondary outline: "Enregistrer et fermer" → persists the session as `completed`, returns to Historique.

### 6. Export sheet
- Title "Résumé de séance" + dark code block (`#1c2018` bg, `#D9E4D4` mono text) showing the **exact** export string (see §7 of the cahier — must match to the character). Buttons **Copier** (writes clipboard, toast "Copié…") and **Partager** (native Share Intent; prototype shows a toast).

### 7. Historique — liste
- Eyebrow "JOURNAL" + title "Historique".
- Session cards: mono gold date (JJ/MM/AAAA) + mono duration, name (18px/700), mono "Volume X kg". Sorted by date desc. Tap → detail. Empty state when none.

### 8. Historique — détail (+ edit mode)
- Back button + **"Modifier"** toggle (becomes "Terminer"; green fill when active).
- Date, name, Durée tile (editable), Volume tile.
- **View mode:** read-only exercise list with set chips ("80kg × 10", "PdC × 12" for bodyweight); skipped exercises muted with "· ignoré".
- **Edit mode:** session name input; per-exercise editable cards (same set grid as the active session: weight/reps inputs, ✓ toggle, **✕ to remove a set**, "+ Série", **Ignorer/Réactiver**). Volume recomputes live. Bottom **"Supprimer la séance"** (danger) → confirm sheet.
- **Primary CTA:** "Partager vers AI Coach Google Health" → same export sheet.

---

## Interactions & behavior
- **Navigation:** bottom tabs swap the active screen; the active session lives inside the Séance tab and **persists** if you switch tabs (resume on return). Tab bar is hidden only on the Bilan screen.
- **Bottom sheets:** slide-up (~.26s ease), scrim tap closes; drag handle on top. Used for all menus, create/edit, export, confirmations.
- **Chrono:** ticks every second from `startTime`; freezes at `endTime`.
- **Validation:** a set can only be validated (`completed`) when `reps > 0`; otherwise show an inline toast "Renseigne des répétitions (> 0)". Editing reps to ≤0 un-validates the set.
- **Live recompute:** volume updates instantly as sets are validated/edited (active session header, Bilan, history detail).
- **Toasts:** small dark pill, bottom-center, ~1.9s, for confirmations (added/archived/copied/saved).
- **Confirmations:** "Terminer la séance" and "Supprimer la séance" require a confirm sheet (per §6.6).
- **Search:** every library picker (Exercices, routine selector, FAB) filters by case-insensitive substring; show "Aucun résultat" when empty.

## State management (Zustand + persist)
Single store (or sliced) persisted to **AsyncStorage** with a declared `version` + `migrate` skeleton. Core collections (see cahier §4 for exact interfaces):
- `exercises: Exercise[]` — incl. `isArchived` (soft delete).
- `routines: Routine[]` — incl. `isArchived` (archive/unarchive).
- `sessions: WorkoutSession[]` — completed history.
- `activeSession: WorkoutSession | null` — persisted continuously; **debounce ~300ms** on keystroke writes; must survive an app kill and resume identically.

Derived/business logic (pure, unit-tested): `volume(session)`, `buildExportText(session)`, `ghostFor(exerciseId)`. Frozen-copy rule: `WorkoutExercise.exerciseName` / `WorkoutSession.routineName` are snapshots so renames/archives never corrupt history.

UI-only state (not persisted): current tab, biblio section, archive view, search queries, open sheet, history edit mode, draft inputs.

## Assets
- **Fonts:** Space Grotesk + Space Mono (Google Fonts) — load via `expo-font` / `@expo-google-fonts/space-grotesk` + `space-mono`.
- **Icons:** `@expo/vector-icons` for tab/menu glyphs (prototype draws simple geometric SVGs — replace with vector icons).
- No raster images. No brand assets. The Pixel device frame in the prototype is **presentation chrome only** — the native app is full-screen.

## Files in this bundle
- `Commit & Push.dc.html` — interactive hifi prototype (open in a browser; needs `support.js` alongside).
- `support.js` — runtime for the prototype only (do not port).
- `CahierDesCharges-Commit & Push.md` — full spec: stack, data models, business rules, export template, priorities, acceptance criteria, deliverables.
- `README.md` — this document.
