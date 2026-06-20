import { buildExportText } from '../exportText';
import { makeExercise, makeSession, makeSet } from './fixtures';

describe('buildExportText (cahier §7)', () => {
  it('respecte le template au caractère près (filtres + formats)', () => {
    const start = new Date(2026, 5, 20, 10, 0, 0).getTime(); // 20/06/2026
    const session = makeSession({
      startTime: start,
      endTime: start + 65 * 60000, // 65 minutes
      exercises: [
        makeExercise('Développé couché', [makeSet(80, 10), makeSet(80, 10), makeSet(80, 9)]),
        makeExercise('Tractions', [makeSet(0, 12)]), // poids de corps -> "0kg x 12"
        makeExercise('Curl biceps', [makeSet(15, 10)], 'skipped'), // ignoré -> exclu
        makeExercise('Gainage', [makeSet(0, 0, false)]), // aucune série validée -> exclu
        makeExercise('Squat', [makeSet(100, 5), makeSet(100, 5, false)]), // 2e série non validée -> exclue
      ],
    });

    const expected = [
      'Coach, voici ma séance de musculation à consigner.',
      'Règle absolue : associe chaque exercice ci-dessous à sa nomenclature standard dans ta base de données Google Health pour éviter les doublons dans mon historique.',
      '',
      '- Date : 20/06/2026',
      '- Durée totale : 65 minutes',
      '- Volume total soulevé : 2 820 kg',
      '',
      'Détail des exercices (Poids x Répétitions) :',
      '',
      '1. Développé couché : 80kg x 10, 80kg x 10, 80kg x 9',
      '2. Tractions : 0kg x 12',
      '3. Squat : 100kg x 5',
    ].join('\n');

    expect(buildExportText(session)).toBe(expected);
  });

  it('formate les décimales avec une virgule', () => {
    const start = new Date(2026, 5, 20, 10, 0, 0).getTime();
    const session = makeSession({
      startTime: start,
      endTime: start + 30 * 60000,
      exercises: [makeExercise('Élévations latérales', [makeSet(2.5, 12)])],
    });
    expect(buildExportText(session)).toContain('1. Élévations latérales : 2,5kg x 12');
  });

  it('respecte la durée corrigée manuellement', () => {
    const session = makeSession({ durationOverrideMin: 47, exercises: [] });
    expect(buildExportText(session)).toContain('- Durée totale : 47 minutes');
  });
});
