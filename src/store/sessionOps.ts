/**
 * Transformations PURES et immuables d'une WorkoutSession.
 *
 * Mutualisées entre la séance active et l'édition d'une séance d'historique :
 * les actions du store sont ainsi de fines enveloppes, et aucune logique métier
 * ne vit dans les composants de vue.
 */
import { newId } from '@/utils/id';
import type { WorkoutExercise, WorkoutExerciseStatus, WorkoutSession } from './types';

function reindex(exercises: WorkoutExercise[]): WorkoutExercise[] {
  return exercises.map((e, i) => ({ ...e, orderIndex: i }));
}

function mapExercise(
  session: WorkoutSession,
  exerciseId: string,
  fn: (e: WorkoutExercise) => WorkoutExercise,
): WorkoutSession {
  return {
    ...session,
    exercises: session.exercises.map((e) => (e.exerciseId === exerciseId ? fn(e) : e)),
  };
}

/** Ajoute un exercice à la séance (no-op s'il y est déjà). Nom figé à l'instant T. */
export function addExerciseToSession(
  session: WorkoutSession,
  exercise: { id: string; name: string },
): WorkoutSession {
  if (session.exercises.some((e) => e.exerciseId === exercise.id)) return session;
  const ex: WorkoutExercise = {
    exerciseId: exercise.id,
    exerciseName: exercise.name,
    status: 'active',
    orderIndex: session.exercises.length,
    sets: [],
  };
  return { ...session, exercises: [...session.exercises, ex] };
}

export function addSet(session: WorkoutSession, exerciseId: string): WorkoutSession {
  return mapExercise(session, exerciseId, (e) => ({
    ...e,
    sets: [...e.sets, { id: newId(), weight: 0, reps: 0, completed: false }],
  }));
}

/** Suppression de série — autorisée uniquement en édition d'historique (§6.5). */
export function removeSet(
  session: WorkoutSession,
  exerciseId: string,
  setId: string,
): WorkoutSession {
  return mapExercise(session, exerciseId, (e) => ({
    ...e,
    sets: e.sets.filter((st) => st.id !== setId),
  }));
}

export function updateSet(
  session: WorkoutSession,
  exerciseId: string,
  setId: string,
  patch: Partial<{ weight: number; reps: number }>,
): WorkoutSession {
  return mapExercise(session, exerciseId, (e) => ({
    ...e,
    sets: e.sets.map((st) => {
      if (st.id !== setId) return st;
      const next = { ...st, ...patch };
      // Modifier les reps à ≤ 0 dévalide automatiquement la série (§6.5).
      if (next.reps <= 0) next.completed = false;
      return next;
    }),
  }));
}

export function setSetCompleted(
  session: WorkoutSession,
  exerciseId: string,
  setId: string,
  completed: boolean,
): WorkoutSession {
  return mapExercise(session, exerciseId, (e) => ({
    ...e,
    sets: e.sets.map((st) => (st.id === setId ? { ...st, completed } : st)),
  }));
}

export function setExerciseStatus(
  session: WorkoutSession,
  exerciseId: string,
  status: WorkoutExerciseStatus,
): WorkoutSession {
  return mapExercise(session, exerciseId, (e) => ({ ...e, status }));
}

/** Déplace un exercice (dir = -1 monter, +1 descendre) puis réindexe. */
export function moveExercise(
  session: WorkoutSession,
  exerciseId: string,
  dir: -1 | 1,
): WorkoutSession {
  const idx = session.exercises.findIndex((e) => e.exerciseId === exerciseId);
  if (idx < 0) return session;
  const target = idx + dir;
  if (target < 0 || target >= session.exercises.length) return session;
  const arr = [...session.exercises];
  [arr[idx], arr[target]] = [arr[target], arr[idx]];
  return { ...session, exercises: reindex(arr) };
}
