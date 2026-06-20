/**
 * Petits builders pour construire des séances de test de façon concise.
 */
import type {
  WorkoutExercise,
  WorkoutExerciseStatus,
  WorkoutSession,
  WorkoutSessionStatus,
  WorkoutSet,
} from '@/store/types';

let counter = 0;
const uid = () => `id-${++counter}`;

export function makeSet(weight: number, reps: number, completed = true): WorkoutSet {
  return { id: uid(), weight, reps, completed };
}

export function makeExercise(
  exerciseName: string,
  sets: WorkoutSet[],
  status: WorkoutExerciseStatus = 'active',
  exerciseId = uid(),
  orderIndex = 0,
): WorkoutExercise {
  return { exerciseId, exerciseName, status, orderIndex, sets };
}

export function makeSession(over: Partial<WorkoutSession> = {}): WorkoutSession {
  const startTime = over.startTime ?? new Date(2026, 5, 20, 10, 0, 0).getTime();
  const status: WorkoutSessionStatus = over.status ?? 'completed';
  return {
    id: over.id ?? uid(),
    routineId: over.routineId ?? null,
    routineName: over.routineName ?? 'Séance',
    startTime,
    endTime: over.endTime ?? startTime + 60 * 60000,
    durationOverrideMin: over.durationOverrideMin ?? null,
    status,
    exercises: over.exercises ?? [],
  };
}
