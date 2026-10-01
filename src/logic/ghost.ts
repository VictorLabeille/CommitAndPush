/**
 * Ghost data (« dernière perf ») — cahier §6.2.
 *
 * Pour un exerciseId donné : prendre la dernière WorkoutSession `completed`
 * (par endTime décroissant) contenant cet exercice avec au moins une série
 * `completed`, puis afficher ses séries validées.
 * Renvoie `null` si l'exercice n'a jamais été réalisé.
 *
 * Affichage (signe « × », « PdC » pour le poids de corps) :
 *   « Dern. : 80kg×10, 80kg×10, 80kg×9 »
 */
import type { WorkoutSession, WorkoutSet } from '@/store/types';
import { fmtNum } from './format';

/**
 * Séries validées de la dernière séance `completed` où l'exercice a au moins une
 * série validée. `null` si l'exercice n'a jamais été réalisé. Référence partagée par
 * le ghost et le contrôle des valeurs aberrantes (`outlier.ts`).
 */
export function lastCompletedSets(exerciseId: string, sessions: WorkoutSession[]): WorkoutSet[] | null {
  const completed = sessions
    .filter((s) => s.status === 'completed')
    .sort((a, b) => (b.endTime ?? 0) - (a.endTime ?? 0));

  for (const session of completed) {
    const ex = session.exercises.find(
      (x) => x.exerciseId === exerciseId && x.sets.some((st) => st.completed),
    );
    if (ex) return ex.sets.filter((st) => st.completed);
  }
  return null;
}

export function ghostFor(exerciseId: string, sessions: WorkoutSession[]): string | null {
  const sets = lastCompletedSets(exerciseId, sessions);
  if (!sets) return null;
  const parts = sets.map((st) => (st.weight === 0 ? 'PdC' : fmtNum(st.weight) + 'kg') + '×' + st.reps);
  return 'Dern. : ' + parts.join(', ');
}
