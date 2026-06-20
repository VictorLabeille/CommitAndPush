# Modèle de données

Source : `src/store/types.ts`. Tous les `id` sont des UUID string ; tous les timestamps sont en epoch ms.

## Entités

```ts
interface Exercise {
  id: string;
  name: string;            // ex: "Développé couché"
  isArchived: boolean;     // soft delete (§6.1)
  createdAt: number;
}

interface Routine {
  id: string;
  name: string;            // ex: "Push Day"
  exerciseIds: string[];   // ordre = ordre d'affichage par défaut
  isArchived: boolean;     // archivage réversible
  createdAt: number;
}

interface WorkoutSession {
  id: string;
  routineId: string | null;            // null = séance libre
  routineName: string;                 // COPIE FIGÉE du nom à l'instant T
  startTime: number;
  endTime: number | null;
  durationOverrideMin: number | null;  // correction manuelle de la durée
  status: 'active' | 'completed';
  exercises: WorkoutExercise[];
}

interface WorkoutExercise {
  exerciseId: string;
  exerciseName: string;                // COPIE FIGÉE du nom à l'instant T
  status: 'active' | 'skipped';
  orderIndex: number;
  sets: WorkoutSet[];
}

interface WorkoutSet {
  id: string;
  weight: number;          // kg, décimales OK (2.5). 0 = poids de corps
  reps: number;            // entier ≥ 0
  completed: boolean;      // true quand la série est réellement validée ("Fait")
}
```

## Relations & cycle de vie

```
Exercise ─┐ (référencé par id)
          ├──< Routine.exerciseIds
          └──< WorkoutExercise.exerciseId (+ nom figé)

Routine ──> startSession() ──> WorkoutSession (active)
                                   │ finishSession()
                                   ▼
                              WorkoutSession (completed)  ∈ sessions[]
```

- `activeSession` : au plus une séance en cours (persistée en continu).
- `sessions[]` : historique des séances `completed`.

## Copie figée du nom (intégrité référentielle — §6.1)

`WorkoutExercise.exerciseName` et `WorkoutSession.routineName` sont des **instantanés** pris au démarrage de la séance (ou à l'ajout d'un exercice). Conséquence : **renommer ou archiver** un exercice/routine **n'altère jamais** les séances déjà enregistrées.

| Action | Effet sur les listes de sélection | Effet sur l'historique |
|---|---|---|
| Archiver un exercice | disparaît des sélecteurs | reste lisible (nom figé) |
| Renommer un exercice | nouveau nom affiché | inchangé |
| Archiver/supprimer une routine | masquée / retirée | inchangé |

## Persistance

Seules ces 4 collections sont persistées (`partialize`) — l'état d'UI ne l'est pas. Le schéma porte une `version` et une fonction `migrate` (squelette) pour les évolutions futures.
