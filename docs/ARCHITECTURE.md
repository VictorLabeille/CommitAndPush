# Architecture

## Vue d'ensemble

Application **Expo / React Native** (SDK 56, TypeScript strict) **offline-first**, sans backend. Navigation par fichiers (**expo-router**), état global et persistance via **Zustand + middleware `persist`** adossé à **AsyncStorage**.

Principe directeur : **séparation stricte UI / logique / store**. Aucune logique métier dans les composants de vue — elle vit dans `src/logic` (fonctions pures testées) et `src/store` (état + transformations).

## Arborescence

```
src/
├── app/                      # routes expo-router (file-based)
│   ├── _layout.tsx           # racine : polices, gate d'hydratation, GestureHandlerRoot, flush AppState,
│   │                         #   notifs du rappel d'étirements, Stack
│   ├── (tabs)/               # barre d'onglets
│   │   ├── _layout.tsx       #   Bibliothèque · Séance · Stats · Historique
│   │   ├── index.tsx         #   Séance (Entraînement) — onglet par défaut
│   │   ├── library.tsx       #   Bibliothèque
│   │   ├── stats.tsx         #   Stats
│   │   └── history.tsx       #   Historique (liste)
│   ├── workout/summary.tsx   # Bilan (stack au-dessus des onglets → barre masquée)
│   ├── history/[id].tsx      # Détail / édition d'une séance
│   ├── settings.tsx          # Réglages : sauvegarde, texte d'export, rappel d'étirements
│   ├── export-template.tsx   # Édition du texte d'export
│   └── rest-day.tsx          # Décision du jour de repos (ouvert par notif)
├── store/
│   ├── types.ts              # modèles de données (Exercise, Routine, WorkoutSession…)
│   ├── store.ts              # store Zustand unique + persist (version, migrate, partialize)
│   ├── sessionOps.ts         # transformations PURES et immuables d'une séance
│   ├── selectors.ts          # helpers de dérivation (recherche, filtres, tri)
│   └── storage.ts            # AsyncStorage debouncé (+ flush)
├── logic/                    # LOGIQUE MÉTIER PURE (testée)
│   ├── volume.ts             # computeVolume, computeDurationMin
│   ├── exportText.ts         # buildExportText
│   ├── ghost.ts              # ghostFor, lastCompletedSets
│   ├── outlier.ts            # valeurs aberrantes à la validation d'une série
│   ├── restPlan.ts           # planification du rappel d'étirements
│   ├── reorder.ts            # moveItem, moveInGroup
│   ├── backup.ts · stats.ts  # sauvegarde JSON, indicateurs de l'onglet Stats
│   ├── format.ts             # fmt/parse (date, nombre, volume, chrono, libellé de série)
│   └── __tests__/            # tests unitaires (cas du cahier §9)
├── theme/                    # tokens (couleurs/rayons/espacements) + typographie + polices
├── components/
│   ├── ui/                   # kit réutilisable (Button, Card, BottomSheet, …)
│   ├── library/              # ExerciseRow, RoutineCard, RoutineEditorSheet, RoutineSummarySheet
│   ├── workout/              # ChronoHeader, ExerciseCard, SetRow, AddExerciseSheet, ExportSheet
│   ├── history/              # SessionCard, SetChip
│   ├── backup/               # BackupReminder
│   └── settings/             # TemplateChoiceSheet
├── notifications/            # I/O expo-notifications (canal, permission, planification)
└── hooks/                    # useChrono, useKeyboardHeight / useKeyboardTop, useRestNotifications
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

ainsi que des métadonnées et réglages persistés : `lastBackupAt` (rappel de sauvegarde),
`exportTemplate` (texte d'export), `restReminder` et `restDecision` (rappel d'étirements).

L'**état d'UI** (onglet courant, section de la Bibliothèque, vue archives, requêtes de recherche, sheet ouverte, mode édition de l'historique, brouillons de saisie) **n'est pas persisté** : il vit en `useState` local aux écrans.

Les mutations de séance (ajout/validation/suppression de série, ignorer, réorganiser…) sont implémentées une seule fois dans `sessionOps.ts` (fonctions pures renvoyant une nouvelle `WorkoutSession`) et réutilisées par les actions de la **séance active** comme par l'**édition d'historique** — pas de duplication.

## Persistance (cahier §6.4)

- `persist` sérialise en JSON vers AsyncStorage via une storage **debouncée (~300 ms)** (`storage.ts`) pour éviter une écriture à chaque frappe.
- **Flush immédiat** sur les actions critiques (validation de série, fin de séance) et au passage en **arrière-plan** (`AppState`, dans `_layout.tsx`) → la séance active reprend à l'identique après un kill.
- `version` + `migrate` (squelette) absorbent les futurs changements de schéma.
- **Gate d'hydratation** : l'app n'est rendue qu'une fois le store réhydraté et les polices chargées (sinon splash natif).

## Navigation

- Les 3 onglets vivent dans le groupe `(tabs)`. La **séance active** est dans l'onglet Séance et persiste au changement d'onglet (état dans le store).
- Le **Bilan** (`workout/summary`) et le **détail d'historique** (`history/[id]`) sont des écrans de la pile racine, **au-dessus** des onglets → la barre d'onglets est naturellement masquée et un bouton retour est disponible. Idem pour **Réglages**, **texte d'export** et **jour de repos** (`rest-day`).
- `rest-day` est aussi atteint par **tap sur une notification** : la route voyage dans `data.url` et `useRestNotifications` la pousse, app froide comprise.

## Choix techniques notables

Repris du `README.md` le 2026-09-19, quand celui-ci est devenu une vitrine en anglais.

- **Partage de texte : l'API `Share` de React Native**, pas `expo-sharing`. L'export vise l'« AI
  Coach » de Google Health, qui lit du **texte** : il faut l'intent `ACTION_SEND text/plain`.
  `expo-sharing`, pourtant dans la stack imposée, ne partage que des **fichiers** — il ne peut pas
  faire ce travail. Le presse-papier reste assuré par `expo-clipboard`.
- **Réorganisation des exercices par Monter / Descendre**, comme le prototype de référence.
  `react-native-draggable-flatlist` est installé (stack imposée) mais **non câblé**, par prudence
  vis-à-vis de Reanimated v4 sous le SDK 56. Le vrai glisser-déposer se branchera plus tard sans
  toucher au modèle de données : c'est `logic/reorder.ts` qui porte l'ordre, pas la vue.
- **Bottom sheets et clavier : décaler depuis le conteneur, pas depuis la fenêtre.** Les sheets
  sont rendus dans l'écran, pas dans une `Modal`. Dans un onglet, leur conteneur s'arrête
  au-dessus de la barre d'onglets. Décaler de la hauteur du clavier laissait donc un vide de la
  hauteur de cette barre (≈ 98 dp, constaté le 2026-10-01 ; le correctif `b4fb3ef` de juin ne le
  couvrait pas). `BottomSheet` mesure son conteneur (`measureInWindow`) et se décale de
  `bas du conteneur − haut du clavier` (`useKeyboardTop`). Conséquence connue : un sheet ouvert
  depuis un onglet ne recouvre pas la barre d'onglets.
- **Notifications : `expo-notifications`, I/O isolée dans `src/notifications/`.** La planification
  est pure (`logic/restPlan.ts`) ; `hooks/useRestNotifications.ts`, monté dans le layout racine,
  remplace toutes les notifs planifiées préfixées `rest-` à chaque changement pertinent et route
  les taps via `data.url`. Les dépendances du hook sont des signatures (nombre de séances, début
  de la séance active), pas les objets : la séance active change à chaque saisie.
- **Heure exacte des notifs : `SCHEDULE_EXACT_ALARM`.** Déclarée dans `app.json`, mais refusée par
  défaut depuis Android 14 : à accorder dans Paramètres › Applis › Commit & Push › Alarmes et
  rappels. Sans elle, `expo-notifications` bascule sur une alarme inexacte (retard possible de
  quelques minutes). `USE_EXACT_ALARM` est écartée : réservée aux applis réveil/agenda.
