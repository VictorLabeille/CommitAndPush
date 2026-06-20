import { computeDurationMin, computeVolume } from '../volume';
import { makeExercise, makeSession, makeSet } from './fixtures';

describe('computeVolume (cahier §6.3)', () => {
  it('somme weight × reps sur les séries validées des exercices actifs', () => {
    const session = makeSession({
      exercises: [
        makeExercise('Développé couché', [
          makeSet(80, 10),
          makeSet(80, 10),
          makeSet(80, 10),
          makeSet(80, 10, false), // série non validée -> exclue
        ]),
      ],
    });
    expect(computeVolume(session)).toBe(2400); // 3 × (80 × 10)
  });

  it('exclut les exercices ignorés', () => {
    const session = makeSession({
      exercises: [
        makeExercise('Développé couché', [makeSet(80, 10), makeSet(80, 10), makeSet(80, 10)]),
        makeExercise('Curl', [makeSet(50, 10)], 'skipped'),
      ],
    });
    expect(computeVolume(session)).toBe(2400); // l'exercice ignoré n'est pas compté
  });

  it('le poids de corps (0 kg) contribue 0 au volume', () => {
    const session = makeSession({
      exercises: [makeExercise('Tractions', [makeSet(0, 12), makeSet(0, 10)])],
    });
    expect(computeVolume(session)).toBe(0);
  });

  it('renvoie 0 pour une séance sans série validée', () => {
    const session = makeSession({
      exercises: [makeExercise('Squat', [makeSet(100, 5, false)])],
    });
    expect(computeVolume(session)).toBe(0);
  });

  it('combine les cas (validé + non validé + ignoré + poids de corps)', () => {
    const session = makeSession({
      exercises: [
        makeExercise('Développé', [makeSet(80, 10), makeSet(80, 10), makeSet(80, 10)]), // 2400
        makeExercise('Curl', [makeSet(50, 10)], 'skipped'), // exclu
        makeExercise('Tractions', [makeSet(0, 12)]), // +0
        makeExercise('Squat', [makeSet(100, 5), makeSet(100, 5, false)]), // +500
      ],
    });
    expect(computeVolume(session)).toBe(2900);
  });
});

describe('computeDurationMin', () => {
  it('utilise durationOverrideMin quand renseigné', () => {
    const session = makeSession({ durationOverrideMin: 42 });
    expect(computeDurationMin(session)).toBe(42);
  });

  it('calcule (endTime − startTime) en minutes sinon', () => {
    const start = new Date(2026, 0, 1, 8, 0, 0).getTime();
    const session = makeSession({ startTime: start, endTime: start + 65 * 60000 });
    expect(computeDurationMin(session)).toBe(65);
  });
});
