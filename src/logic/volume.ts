/**
 * Métriques dérivées d'une séance (logique pure, testée) — cahier §6.3.
 */
import type { WorkoutSession } from '@/store/types';

/**
 * Volume total soulevé = Σ (weight × reps) sur TOUTES les séries `completed`
 * des exercices `active`.
 * - les exercices `skipped` sont exclus ;
 * - les séries non validées sont exclues ;
 * - le poids de corps (weight = 0) contribue 0 (comportement attendu).
 */
export function computeVolume(session: WorkoutSession): number {
  let v = 0;
  for (const ex of session.exercises) {
    if (ex.status !== 'active') continue;
    for (const set of ex.sets) {
      if (set.completed) v += set.weight * set.reps;
    }
  }
  return v;
}

/**
 * Durée en minutes : `durationOverrideMin` s'il est renseigné, sinon
 * (endTime − startTime) arrondi (endTime courant si la séance n'est pas finie).
 */
export function computeDurationMin(session: WorkoutSession): number {
  if (session.durationOverrideMin != null) return session.durationOverrideMin;
  const end = session.endTime ?? Date.now();
  return Math.max(0, Math.round((end - session.startTime) / 60000));
}
