/**
 * Génération du texte d'export vers l'« AI Coach » Google Health — cahier §7.
 *
 * Le texte est produit à partir d'un TEMPLATE éditable par l'utilisateur (réglage
 * `exportTemplate` du store). Le template est une chaîne libre où des variables
 * `{...}` sont substituées par les données de la séance ; le template par défaut
 * (`DEFAULT_EXPORT_TEMPLATE`) reproduit le format historique du cahier §7 + une ligne
 * « Horaire ».
 *
 * Le bloc détaillé des exercices reste généré par le code (variable `{exercices}`) :
 * - n'inclut que les exercices `active` ayant au moins une série `completed` ;
 * - n'inclut que les séries `completed` ;
 * - séparateur poids/reps « kg x » (x minuscule, espaces), décimale virgule ;
 * - poids de corps exporté littéralement « 0kg x … » (pas de « PdC » à l'export).
 */
import type { WorkoutSession } from '@/store/types';
import { fmtDate, fmtNum, fmtTime, fmtVol } from './format';
import { computeDurationMin, computeVolume } from './volume';

/** Variables substituables dans le template, avec un libellé d'aide pour l'UI. */
export const EXPORT_VARIABLES: { token: string; label: string }[] = [
  { token: '{date}', label: 'Date (JJ/MM/AAAA)' },
  { token: '{debut}', label: 'Heure de début (HH:MM)' },
  { token: '{fin}', label: 'Heure de fin (HH:MM)' },
  { token: '{duree}', label: 'Durée en minutes' },
  { token: '{volume}', label: 'Volume total (kg)' },
  { token: '{routine}', label: 'Nom de la séance' },
  { token: '{exercices}', label: 'Liste détaillée des exercices' },
];

/** Template par défaut : format historique du cahier §7 + ligne « Horaire ». */
export const DEFAULT_EXPORT_TEMPLATE = [
  'Coach, voici ma séance de musculation à consigner.',
  'Règle absolue : associe chaque exercice ci-dessous à sa nomenclature standard dans ta base de données Google Health pour éviter les doublons dans mon historique.',
  '',
  '- Date : {date}',
  '- Horaire : {debut} – {fin}',
  '- Durée totale : {duree} minutes',
  '- Volume total soulevé : {volume} kg',
  '',
  'Détail des exercices (Poids x Répétitions) :',
  '',
  '{exercices}',
].join('\n');

/** Construit le bloc multi-ligne `{exercices}` (numéroté). */
function buildExerciseBlock(session: WorkoutSession): string {
  const lines: string[] = [];
  let i = 1;
  for (const ex of session.exercises) {
    if (ex.status !== 'active') continue;
    const done = ex.sets.filter((s) => s.completed);
    if (done.length === 0) continue;
    const parts = done.map((s) => fmtNum(s.weight) + 'kg x ' + s.reps);
    lines.push(i + '. ' + ex.exerciseName + ' : ' + parts.join(', '));
    i++;
  }
  return lines.join('\n');
}

export function buildExportText(
  session: WorkoutSession,
  template: string = DEFAULT_EXPORT_TEMPLATE,
): string {
  // L'heure de fin retombe sur (début + durée) si `endTime` est absent (séance non
  // terminée), ce qui reste cohérent avec une durée corrigée manuellement.
  const endTs = session.endTime ?? session.startTime + computeDurationMin(session) * 60000;

  const values: Record<string, string> = {
    date: fmtDate(session.startTime),
    debut: fmtTime(session.startTime),
    fin: fmtTime(endTs),
    duree: String(computeDurationMin(session)),
    volume: fmtVol(computeVolume(session)),
    routine: session.routineName,
    exercices: buildExerciseBlock(session),
  };

  // Token inconnu laissé tel quel (debuggable côté utilisateur).
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? values[key] : match,
  );
}
