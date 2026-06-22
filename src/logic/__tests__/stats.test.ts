import type {
  WorkoutExercise,
  WorkoutExerciseStatus,
  WorkoutSession,
  WorkoutSet,
} from '@/store/types';
import {
  avgDurationMin,
  avgSessionsPerWeek,
  bestStreak,
  currentStreak,
  exerciseProgression,
  exercisesWithHistory,
  personalRecord,
  weekdayCounts,
} from '../stats';

const DAY = 86_400_000;
let seq = 0;

const set = (weight: number, reps: number, completed = true): WorkoutSet => ({
  id: `set${seq++}`,
  weight,
  reps,
  completed,
});

const ex = (
  exerciseId: string,
  sets: WorkoutSet[],
  status: WorkoutExerciseStatus = 'active',
): WorkoutExercise => ({ exerciseId, exerciseName: exerciseId, status, orderIndex: 0, sets });

const sess = (
  startTime: number,
  exercises: WorkoutExercise[],
  opts: Partial<WorkoutSession> = {},
): WorkoutSession => ({
  id: `sess${seq++}`,
  routineId: null,
  routineName: 'x',
  startTime,
  endTime: startTime + 3_600_000,
  durationOverrideMin: null,
  status: 'completed',
  exercises,
  ...opts,
});

// Mercredi 24/06/2026 12:00 (local) — milieu de semaine, stable vis-à-vis du fuseau/DST.
const NOW = new Date(2026, 5, 24, 12, 0, 0).getTime();

describe('avgSessionsPerWeek', () => {
  it('divise par la fenêtre fixe de 4 semaines', () => {
    const inWindow = [sess(NOW, []), sess(NOW - 2 * DAY, []), sess(NOW - 10 * DAY, []), sess(NOW - 20 * DAY, [])];
    const old = sess(NOW - 40 * DAY, []); // hors fenêtre
    expect(avgSessionsPerWeek([...inWindow, old], NOW)).toBe(1); // 4 / 4
  });
  it('renvoie 0 sans séance', () => {
    expect(avgSessionsPerWeek([], NOW)).toBe(0);
  });
});

describe('weekdayCounts', () => {
  it('range lundi en index 0, mardi en 1', () => {
    const mon = new Date(2026, 5, 22, 12); // on s'aligne sur le lundi
    mon.setDate(mon.getDate() - ((mon.getDay() + 6) % 7));
    const tue = new Date(mon.getTime() + DAY);
    const counts = weekdayCounts([sess(mon.getTime(), []), sess(mon.getTime(), []), sess(tue.getTime(), [])]);
    expect(counts[0]).toBe(2); // lundi
    expect(counts[1]).toBe(1); // mardi
    expect(counts.reduce((a, b) => a + b, 0)).toBe(3);
  });
  it('tableau de 7 zéros sans séance', () => {
    expect(weekdayCounts([])).toEqual([0, 0, 0, 0, 0, 0, 0]);
  });
});

describe('avgDurationMin', () => {
  it('moyenne les durées (override prioritaire)', () => {
    const a = sess(NOW, [], { durationOverrideMin: 40 });
    const b = sess(NOW, [], { durationOverrideMin: 60 });
    expect(avgDurationMin([a, b])).toBe(50);
  });
  it('renvoie 0 sans séance', () => {
    expect(avgDurationMin([])).toBe(0);
  });
});

describe('currentStreak / bestStreak', () => {
  it('compte les semaines consécutives jusqu’à la semaine courante', () => {
    const s = [sess(NOW, []), sess(NOW - 7 * DAY, []), sess(NOW - 14 * DAY, [])];
    expect(currentStreak(s, NOW)).toBe(3);
  });
  it('s’interrompt sur une semaine creuse', () => {
    const s = [sess(NOW, []), sess(NOW - 21 * DAY, [])]; // trou semaines -1 et -2
    expect(currentStreak(s, NOW)).toBe(1);
  });
  it('grâce pour la semaine en cours encore vide', () => {
    const s = [sess(NOW - 7 * DAY, []), sess(NOW - 14 * DAY, [])]; // rien cette semaine
    expect(currentStreak(s, NOW)).toBe(2);
  });
  it('renvoie 0 si rien de récent', () => {
    expect(currentStreak([sess(NOW - 60 * DAY, [])], NOW)).toBe(0);
    expect(currentStreak([], NOW)).toBe(0);
  });
  it('bestStreak = plus longue série consécutive', () => {
    const s = [
      sess(NOW - 70 * DAY, []),
      sess(NOW - 63 * DAY, []),
      sess(NOW - 56 * DAY, []), // run de 3
      sess(NOW - 14 * DAY, []),
      sess(NOW - 7 * DAY, []), // run de 2
    ];
    expect(bestStreak(s)).toBe(3);
  });
});

describe('personalRecord', () => {
  it('retient le poids max, départage par reps', () => {
    const s = [
      sess(1000, [ex('e1', [set(80, 10), set(85, 6)])]),
      sess(2000, [ex('e1', [set(85, 8)])]), // même poids, plus de reps
    ];
    expect(personalRecord('e1', s)).toEqual({ weight: 85, reps: 8 });
  });
  it('ignore les séries non validées', () => {
    const s = [sess(1000, [ex('e1', [set(100, 5, false), set(80, 10)])])];
    expect(personalRecord('e1', s)).toEqual({ weight: 80, reps: 10 });
  });
  it('poids de corps : PR sur les reps', () => {
    const s = [sess(1000, [ex('e1', [set(0, 12)])]), sess(2000, [ex('e1', [set(0, 15)])])];
    expect(personalRecord('e1', s)).toEqual({ weight: 0, reps: 15 });
  });
  it('null si jamais réalisé', () => {
    expect(personalRecord('zzz', [sess(1000, [ex('e1', [set(50, 5)])])])).toBeNull();
  });
});

describe('exerciseProgression', () => {
  it('un top set par séance, en ordre chronologique', () => {
    const s = [
      sess(3000, [ex('e1', [set(85, 5)])]),
      sess(1000, [ex('e1', [set(80, 10), set(82.5, 8)])]),
    ];
    expect(exerciseProgression('e1', s)).toEqual([
      { at: 1000, weight: 82.5, reps: 8 },
      { at: 3000, weight: 85, reps: 5 },
    ]);
  });
  it('exclut les séances skipped ou sans série validée', () => {
    const s = [
      sess(1000, [ex('e1', [set(80, 10)], 'skipped')]),
      sess(2000, [ex('e1', [set(80, 0, false)])]),
      sess(3000, [ex('e1', [set(90, 3)])]),
    ];
    expect(exerciseProgression('e1', s)).toEqual([{ at: 3000, weight: 90, reps: 3 }]);
  });
});

describe('exercisesWithHistory', () => {
  it('ids à série validée, du plus récent au plus ancien', () => {
    const s = [
      sess(1000, [ex('e1', [set(50, 5)])]),
      sess(3000, [ex('e2', [set(60, 5)])]),
      sess(2000, [ex('e3', [set(0, 0, false)])]), // aucune validée → exclu
    ];
    expect(exercisesWithHistory(s)).toEqual(['e2', 'e1']);
  });
  it('liste vide sans historique', () => {
    expect(exercisesWithHistory([])).toEqual([]);
  });
});
