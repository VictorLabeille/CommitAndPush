import { findOutliers } from '../outlier';
import { makeExercise, makeSession, makeSet } from './fixtures';

const EID = 'exo-squat';
const history = [
  makeSession({
    endTime: 2000,
    exercises: [makeExercise('Squat', [makeSet(80, 10), makeSet(100, 5), makeSet(60, 8, false)], 'active', EID)],
  }),
];

describe('findOutliers', () => {
  it('rien sans historique', () => {
    expect(findOutliers(EID, 0, { weight: 800, reps: 10 }, [])).toEqual([]);
  });

  it('rien dans la tolérance de ±50 %', () => {
    expect(findOutliers(EID, 0, { weight: 120, reps: 5 }, history)).toEqual([]);
    expect(findOutliers(EID, 0, { weight: 40, reps: 15 }, history)).toEqual([]);
  });

  it('signale un poids hors tolérance (faute de frappe 800 au lieu de 80)', () => {
    expect(findOutliers(EID, 0, { weight: 800, reps: 10 }, history)).toEqual([
      { field: 'weight', value: 800, reference: 80 },
    ]);
  });

  it('signale des reps hors tolérance', () => {
    expect(findOutliers(EID, 0, { weight: 80, reps: 100 }, history)).toEqual([
      { field: 'reps', value: 100, reference: 10 },
    ]);
  });

  it('compare à la série de même rang', () => {
    expect(findOutliers(EID, 1, { weight: 100, reps: 5 }, history)).toEqual([]);
    expect(findOutliers(EID, 1, { weight: 40, reps: 5 }, history)).toEqual([
      { field: 'weight', value: 40, reference: 100 },
    ]);
  });

  it('au-delà des séries passées, compare à la dernière série validée (non validées ignorées)', () => {
    expect(findOutliers(EID, 5, { weight: 100, reps: 5 }, history)).toEqual([]);
    expect(findOutliers(EID, 5, { weight: 40, reps: 5 }, history).map((o) => o.field)).toEqual(['weight']);
  });

  it('ne compare jamais le poids de corps (0 kg)', () => {
    expect(findOutliers(EID, 0, { weight: 0, reps: 10 }, history)).toEqual([]);
    const pdc = [makeSession({ exercises: [makeExercise('Squat', [makeSet(0, 10)], 'active', EID)] })];
    expect(findOutliers(EID, 0, { weight: 20, reps: 10 }, pdc)).toEqual([]);
  });
});
