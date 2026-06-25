import { fmtTime } from '../format';
import { buildExportText, DEFAULT_EXPORT_TEMPLATE } from '../exportText';
import { makeExercise, makeSession, makeSet } from './fixtures';

describe('buildExportText — template par défaut (cahier §7 + Horaire)', () => {
  it('respecte le template au caractère près (filtres + formats)', () => {
    const start = new Date(2026, 5, 20, 10, 0, 0).getTime(); // 20/06/2026 10:00
    const session = makeSession({
      startTime: start,
      endTime: start + 65 * 60000, // 65 minutes -> fin 11:05
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
      '- Horaire : 10:00 – 11:05',
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

describe('buildExportText — template personnalisé', () => {
  it('substitue toutes les variables disponibles', () => {
    const start = new Date(2026, 5, 20, 18, 30, 0).getTime();
    const session = makeSession({
      routineName: 'Push Day',
      startTime: start,
      endTime: start + 50 * 60000, // fin 19:20
      exercises: [makeExercise('Squat', [makeSet(100, 5)])],
    });
    const tpl =
      '{routine} le {date} de {debut} à {fin} ({duree} min, {volume} kg)\n{exercices}';
    expect(buildExportText(session, tpl)).toBe(
      'Push Day le 20/06/2026 de 18:30 à 19:20 (50 min, 500 kg)\n1. Squat : 100kg x 5',
    );
  });

  it('laisse les tokens inconnus tels quels', () => {
    const session = makeSession({ exercises: [] });
    expect(buildExportText(session, 'Date {date}, inconnu {bidon}')).toContain('inconnu {bidon}');
  });

  it('calcule l’heure de fin depuis (début + durée) si endTime est absent', () => {
    const start = new Date(2026, 5, 20, 10, 0, 0).getTime();
    const session = { ...makeSession({ startTime: start, durationOverrideMin: 90 }), endTime: null };
    expect(buildExportText(session, '{debut} {fin}')).toBe('10:00 11:30');
  });

  it('expose un template par défaut non vide', () => {
    expect(DEFAULT_EXPORT_TEMPLATE).toContain('{exercices}');
  });
});

describe('fmtTime', () => {
  it('formate l’heure locale en HH:MM (24 h, zéros)', () => {
    expect(fmtTime(new Date(2026, 5, 20, 9, 5, 0).getTime())).toBe('09:05');
    expect(fmtTime(new Date(2026, 5, 20, 18, 0, 0).getTime())).toBe('18:00');
  });
});
