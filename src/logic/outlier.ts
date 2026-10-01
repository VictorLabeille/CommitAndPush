/**
 * Contrôle des valeurs aberrantes à la validation d'une série — logique PURE.
 *
 * Décision du 2026-10-01 : on AVERTIT (confirmation), on ne bloque jamais. La référence
 * est l'historique de l'exercice, pas des bornes fixes : une valeur est suspecte si elle
 * s'écarte de plus de 50 % de la série correspondante de la dernière séance.
 *
 * Série correspondante = même rang dans les séries validées de la dernière perf (cf.
 * `lastCompletedSets`) ; au-delà, la dernière série validée. Poids et reps sont
 * contrôlés indépendamment. Le poids de corps (0 kg) n'est jamais comparé : passer de
 * PdC à lesté (ou l'inverse) n'est pas une erreur de saisie.
 */
import type { WorkoutSession, WorkoutSet } from '@/store/types';
import { lastCompletedSets } from './ghost';

/** Écart relatif toléré (0.5 = ±50 %). */
export const OUTLIER_TOLERANCE = 0.5;

export interface Outlier {
  field: 'weight' | 'reps';
  value: number;
  reference: number;
}

function deviates(value: number, reference: number): boolean {
  if (value <= 0 || reference <= 0) return false;
  return Math.abs(value - reference) / reference > OUTLIER_TOLERANCE;
}

/** Valeurs suspectes de la série `set` (rang `index`, base 0) ; tableau vide si rien. */
export function findOutliers(
  exerciseId: string,
  index: number,
  set: Pick<WorkoutSet, 'weight' | 'reps'>,
  sessions: WorkoutSession[],
): Outlier[] {
  const previous = lastCompletedSets(exerciseId, sessions);
  if (!previous || previous.length === 0) return [];
  const ref = previous[Math.min(index, previous.length - 1)];

  const out: Outlier[] = [];
  if (deviates(set.weight, ref.weight)) out.push({ field: 'weight', value: set.weight, reference: ref.weight });
  if (deviates(set.reps, ref.reps)) out.push({ field: 'reps', value: set.reps, reference: ref.reps });
  return out;
}
