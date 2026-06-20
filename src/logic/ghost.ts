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
import type { WorkoutSession } from '@/store/types';
import { fmtNum } from './format';

export function ghostFor(exerciseId: string, sessions: WorkoutSession[]): string | null {
  const completed = sessions
    .filter((s) => s.status === 'completed')
    .sort((a, b) => (b.endTime ?? 0) - (a.endTime ?? 0));

  for (const session of completed) {
    const ex = session.exercises.find(
      (x) => x.exerciseId === exerciseId && x.sets.some((st) => st.completed),
    );
    if (ex) {
      const parts = ex.sets
        .filter((st) => st.completed)
        .map((st) => (st.weight === 0 ? 'PdC' : fmtNum(st.weight) + 'kg') + '×' + st.reps);
      return 'Dern. : ' + parts.join(', ');
    }
  }
  return null;
}
