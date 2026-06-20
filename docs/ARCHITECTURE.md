# Architecture

## Vue d'ensemble

Application **Expo / React Native** (SDK 56, TypeScript strict) **offline-first**, sans backend. Navigation par fichiers (**expo-router**), état global et persistance via **Zustand + middleware `persist`** adossé à **AsyncStorage**.

Principe directeur : **séparation stricte UI / logique / store**. Aucune logique métier dans les composants de vue — elle vit dans `src/logic` (fonctions pures testées) et `src/store` (état + transformations).

## Arborescence

```
src/
├── app/                      # routes expo-router (file-based)
│   ├── _layout.tsx           # racine : polices, gate d'hydratation, GestureHandlerRoot, flush AppState, Stack
│   ├── (tabs)/               # barre d'onglets
│   │   ├── _layout.tsx       #   Bibliothèque · Séance · Historique
│   │   ├── index.tsx         #   Séance (Entraînement) — onglet par défaut
│   │   ├── library.tsx       #   Bibliothèque
│   │   └── history.tsx       #   Historique (liste)
│   ├── workout/summary.tsx   # Bilan (stack au-dessus des onglets → barre masquée)
│   └── history/[id].tsx      # Détail / édition d'une séance
├── store/
│   ├── types.ts              # modèles de données (Exercise, Routine, WorkoutSession…)
│   ├── store.ts              # store Zustand unique + persist (version, migrate, partialize)
│   ├── sessionOps.ts         # transformations PURES et immuables d'une séance
│   ├── selectors.ts          # helpers de dérivation (recherche, filtres, tri)
│   └── storage.ts            # AsyncStorage debouncé (+ flush)
├── logic/                    # LOGIQUE MÉTIER PURE (testée)
│   ├── volume.ts             # computeVolume, computeDurationMin
│   ├── exportText.ts         # buildExportText
│   ├── ghost.ts              # ghostFor
│   ├── format.ts             # fmt/parse (date, nombre, volume, chrono, libellé de série)
│   └── __tests__/            # tests unitaires (cas du cahier §9)
├── theme/                    # tokens (couleurs/rayons/espacements) + typographie + polices
├── components/
│   ├── ui/                   # kit réutilisable (Button, Card, BottomSheet, …)
│   ├── library/              # ExerciseRow, RoutineCard, RoutineEditorSheet
│   ├── workout/              # ChronoHeader, ExerciseCard, SetRow, AddExerciseSheet, ExportSheet
│   └── history/              # SessionCard, SetChip
└── hooks/                    # useChrono
```

## Couches

| Couche | Rôle | Dépendances |
|---|---|---|
| **Vues** (`app/`, `components/`) | rendu + interactions | appellent le store et la logique pure |
| **Store** (`store/`) | état global, actions, persistance | utilise `sessionOps` (pur) |
| **Logique** (`logic/`) | calculs métier déterministes | aucune (pure, testable isolément) |

## Gestion d'état

Un **store Zustand unique** (`src/store/store.ts`) contient les collections métier :

```ts
exercises: Exercise[]        routines: Routine[]
sessions: WorkoutSession[]   activeSession: WorkoutSession | null
```

L'**état d'UI** (onglet courant, section de la Bibliothèque, vue archives, requêtes de recherche, sheet ouverte, mode édition de l'historique, brouillons de saisie) **n'est pas persisté** : il vit en `useState` local aux écrans.

Les mutations de séance (ajout/validation/suppression de série, ignorer, réorganiser…) sont implémentées une seule fois dans `sessionOps.ts` (fonctions pures renvoyant une nouvelle `WorkoutSession`) et réutilisées par les actions de la **séance active** comme par l'**édition d'historique** — pas de duplication.

## Persistance (cahier §6.4)

- `persist` sérialise en JSON vers AsyncStorage via une storage **debouncée (~300 ms)** (`storage.ts`) pour éviter une écriture à chaque frappe.
- **Flush immédiat** sur les actions critiques (validation de série, fin de séance) et au passage en **arrière-plan** (`AppState`, dans `_layout.tsx`) → la séance active reprend à l'identique après un kill.
- `version` + `migrate` (squelette) absorbent les futurs changements de schéma.
- **Gate d'hydratation** : l'app n'est rendue qu'une fois le store réhydraté et les polices chargées (sinon splash natif).

## Navigation

- Les 3 onglets vivent dans le groupe `(tabs)`. La **séance active** est dans l'onglet Séance et persiste au changement d'onglet (état dans le store).
- Le **Bilan** (`workout/summary`) et le **détail d'historique** (`history/[id]`) sont des écrans de la pile racine, **au-dessus** des onglets → la barre d'onglets est naturellement masquée et un bouton retour est disponible.
