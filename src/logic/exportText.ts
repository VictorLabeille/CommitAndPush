/**
 * Génération du texte d'export vers l'« AI Coach » Google Health — cahier §7.
 *
 * Le format doit correspondre AU CARACTÈRE PRÈS au template (reproduit fidèlement
 * depuis la méthode `buildExport` du prototype validé) :
 * - n'inclut que les exercices `active` ayant au moins une série `completed` ;
 * - n'inclut que les séries `completed` ;
 * - séparateur poids/reps « kg x » (x minuscule, espaces), décimale virgule ;
 * - poids de corps exporté littéralement « 0kg x … » (pas de « PdC » à l'export).
 */
import type { WorkoutSession } from '@/store/types';
import { fmtDate, fmtNum, fmtVol } from './format';
import { computeDurationMin, computeVolume } from './volume';

export function buildExportText(session: WorkoutSession): string {
  const L: string[] = [];
  L.push('Coach, voici ma séance de musculation à consigner.');
  L.push(
    'Règle absolue : associe chaque exercice ci-dessous à sa nomenclature standard dans ta base de données Google Health pour éviter les doublons dans mon historique.',
  );
  L.push('');
  L.push('- Date : ' + fmtDate(session.startTime));
  L.push('- Durée totale : ' + computeDurationMin(session) + ' minutes');
  L.push('- Volume total soulevé : ' + fmtVol(computeVolume(session)) + ' kg');
  L.push('');
  L.push('Détail des exercices (Poids x Répétitions) :');
  L.push('');

  let i = 1;
  for (const ex of session.exercises) {
    if (ex.status !== 'active') continue;
    const done = ex.sets.filter((s) => s.completed);
    if (done.length === 0) continue;
    const parts = done.map((s) => fmtNum(s.weight) + 'kg x ' + s.reps);
    L.push(i + '. ' + ex.exerciseName + ' : ' + parts.join(', '));
    i++;
  }

  return L.join('\n');
}
