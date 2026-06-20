/**
 * Modèles de données — cahier des charges §4.
 *
 * Conventions :
 * - tous les `id` sont des UUID string ;
 * - tous les timestamps sont en epoch ms (number).
 *
 * Décision clé : `WorkoutExercise.exerciseName` et `WorkoutSession.routineName`
 * figent une COPIE du nom à l'instant T. Renommer ou archiver un exercice/routine
 * ne corrompt donc jamais l'historique (cf. §6.1, intégrité référentielle).
 */

export interface Exercise {
  id: string;
  name: string; // ex: "Développé couché"
  isArchived: boolean; // soft delete (§6.1)
  createdAt: number;
}

export interface Routine {
  id: string;
  name: string; // ex: "Push Day"
  exerciseIds: string[]; // ordre = ordre d'affichage par défaut
  isArchived: boolean; // archivage réversible (masquée de l'écran Entraînement)
  createdAt: number;
}

export type WorkoutSessionStatus = 'active' | 'completed';
export type WorkoutExerciseStatus = 'active' | 'skipped';

export interface WorkoutSet {
  id: string;
  weight: number; // kg, décimales autorisées (ex: 2.5). 0 accepté = poids de corps
  reps: number; // entier ≥ 0
  completed: boolean; // true quand l'utilisateur valide la série ("Fait")
}

export interface WorkoutExercise {
  exerciseId: string;
  exerciseName: string; // copie figée du nom à l'instant T
  status: WorkoutExerciseStatus;
  orderIndex: number;
  sets: WorkoutSet[];
}

export interface WorkoutSession {
  id: string;
  routineId: string | null; // null si séance libre
  routineName: string; // copie figée du nom à l'instant T
  startTime: number;
  endTime: number | null;
  durationOverrideMin: number | null; // si l'utilisateur corrige la durée
  status: WorkoutSessionStatus;
  exercises: WorkoutExercise[];
}
