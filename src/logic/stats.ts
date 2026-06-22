/**
 * Statistiques dérivées de l'historique — logique PURE et testée (spec « stats » du
 * 2026-06-22, bloc B). Aucune dépendance UI. Dates en HEURE LOCALE, semaines lundi→dimanche.
 *
 * Conventions métier (cadrage) :
 * - « top set » d'un exercice = la série VALIDÉE la plus lourde (départage aux reps) ;
 * - seules les séries `completed` des exercices `active` comptent ;
 * - progression suivie par IDENTITÉ d'exercice (un renommage n'interrompt pas la courbe) ;
 * - poids de corps (0 kg) : la courbe « poids » est plate → la vue bascule sur les reps.
 */
import type { WorkoutSession } from '@/store/types';
import { computeDurationMin } from './volume';

const DAY_MS = 86_400_000;

/** Numéro de jour LOCAL (DST-safe : décale l'UTC du fuseau avant de diviser). */
function localDayNumber(ts: number): number {
  const d = new Date(ts);
  return Math.floor((d.getTime() - d.getTimezoneOffset() * 60_000) / DAY_MS);
}

/** Index de semaine aligné LUNDI (1970-01-01 = jeudi → +3). Semaines consécutives = +1. */
function weekIndex(ts: number): number {
  return Math.floor((localDayNumber(ts) + 3) / 7);
}

/** Top set d'un exercice dans une séance (série validée la plus lourde), ou null. */
function topSetOf(
  session: WorkoutSession,
  exerciseId: string,
): { weight: number; reps: number } | null {
  const ex = session.exercises.find((e) => e.exerciseId === exerciseId && e.status === 'active');
  if (!ex) return null;
  let best: { weight: number; reps: number } | null = null;
  for (const s of ex.sets) {
    if (!s.completed) continue;
    if (!best || s.weight > best.weight || (s.weight === best.weight && s.reps > best.reps)) {
      best = { weight: s.weight, reps: s.reps };
    }
  }
  return best;
}

/** Fenêtre fixe (cadrage) pour la moyenne de séances par semaine. */
export const AVG_WINDOW_WEEKS = 4;

/** Moyenne de séances par semaine sur les 4 dernières semaines (dénominateur fixe = 4). */
export function avgSessionsPerWeek(sessions: WorkoutSession[], now: number): number {
  const since = now - AVG_WINDOW_WEEKS * 7 * DAY_MS;
  const n = sessions.filter((s) => s.startTime >= since).length;
  return n / AVG_WINDOW_WEEKS;
}

/** Répartition des séances par jour : 7 entrées, index 0 = lundi … 6 = dimanche. */
export function weekdayCounts(sessions: WorkoutSession[]): number[] {
  const counts = [0, 0, 0, 0, 0, 0, 0];
  for (const s of sessions) {
    const idx = (new Date(s.startTime).getDay() + 6) % 7; // lun=0 … dim=6
    counts[idx]++;
  }
  return counts;
}

/** Durée moyenne d'une séance (minutes, arrondie), via `computeDurationMin`. */
export function avgDurationMin(sessions: WorkoutSession[]): number {
  if (sessions.length === 0) return 0;
  const total = sessions.reduce((acc, s) => acc + computeDurationMin(s), 0);
  return Math.round(total / sessions.length);
}

function presentWeeks(sessions: WorkoutSession[]): Set<number> {
  const set = new Set<number>();
  for (const s of sessions) set.add(weekIndex(s.startTime));
  return set;
}

/**
 * Série en cours = nombre de semaines consécutives (jusqu'à la semaine courante, avec une
 * grâce pour la semaine en cours encore vide) ayant ≥ 1 séance. 0 si interrompue.
 */
export function currentStreak(sessions: WorkoutSession[], now: number): number {
  const set = presentWeeks(sessions);
  const cw = weekIndex(now);
  let w: number;
  if (set.has(cw)) w = cw;
  else if (set.has(cw - 1)) w = cw - 1;
  else return 0;
  let count = 0;
  while (set.has(w)) {
    count++;
    w--;
  }
  return count;
}

/** Meilleure série de semaines consécutives avec ≥ 1 séance (record historique). */
export function bestStreak(sessions: WorkoutSession[]): number {
  const weeks = [...presentWeeks(sessions)].sort((a, b) => a - b);
  let best = 0;
  let run = 0;
  let prev: number | null = null;
  for (const w of weeks) {
    run = prev !== null && w === prev + 1 ? run + 1 : 1;
    if (run > best) best = run;
    prev = w;
  }
  return best;
}

/** Record (PR) d'un exercice : meilleure série validée jamais réalisée (poids, puis reps). */
export function personalRecord(
  exerciseId: string,
  sessions: WorkoutSession[],
): { weight: number; reps: number } | null {
  let best: { weight: number; reps: number } | null = null;
  for (const s of sessions) {
    const top = topSetOf(s, exerciseId);
    if (!top) continue;
    if (!best || top.weight > best.weight || (top.weight === best.weight && top.reps > best.reps)) {
      best = top;
    }
  }
  return best;
}

export interface ProgressPoint {
  at: number; // startTime de la séance
  weight: number; // poids du top set
  reps: number; // reps du top set
}

/** Évolution du top set d'un exercice, séance par séance (ordre chronologique croissant). */
export function exerciseProgression(
  exerciseId: string,
  sessions: WorkoutSession[],
): ProgressPoint[] {
  const points: ProgressPoint[] = [];
  for (const s of sessions) {
    const top = topSetOf(s, exerciseId);
    if (top) points.push({ at: s.startTime, weight: top.weight, reps: top.reps });
  }
  return points.sort((a, b) => a.at - b.at);
}

/**
 * Ids des exercices ayant un historique (≥ 1 série validée), du plus récemment réalisé au
 * plus ancien. Sert au sélecteur de progression et à la liste des records (les noms sont
 * résolus côté vue, archivés tolérés et taggés).
 */
export function exercisesWithHistory(sessions: WorkoutSession[]): string[] {
  const lastSeen = new Map<string, number>();
  for (const s of sessions) {
    for (const ex of s.exercises) {
      if (ex.status !== 'active') continue;
      if (!ex.sets.some((st) => st.completed)) continue;
      if (s.startTime > (lastSeen.get(ex.exerciseId) ?? 0)) {
        lastSeen.set(ex.exerciseId, s.startTime);
      }
    }
  }
  return [...lastSeen.entries()].sort((a, b) => b[1] - a[1]).map(([id]) => id);
}
