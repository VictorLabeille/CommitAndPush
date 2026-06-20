/**
 * Sélecteurs / helpers PURS dérivant les collections du store.
 * Les composants sélectionnent les tableaux bruts (références stables) puis
 * dérivent via ces helpers + useMemo (pas de logique dans les vues).
 */
import type { Exercise, Routine, WorkoutSession } from './types';

/** Recherche par sous-chaîne, insensible à la casse (règle transverse). */
export function matchesSearch(name: string, query: string): boolean {
  return name.toLowerCase().includes(query.trim().toLowerCase());
}

export function filterByName<T extends { name: string }>(items: T[], query: string): T[] {
  const q = query.trim();
  return q ? items.filter((i) => matchesSearch(i.name, q)) : items;
}

/** Exercices visibles (non archivés) pour les listes de sélection. */
export function visibleExercises(exercises: Exercise[]): Exercise[] {
  return exercises.filter((e) => !e.isArchived);
}

export function activeRoutines(routines: Routine[]): Routine[] {
  return routines.filter((r) => !r.isArchived);
}

export function archivedRoutines(routines: Routine[]): Routine[] {
  return routines.filter((r) => r.isArchived);
}

/** Historique trié par date décroissante. */
export function sortedSessions(sessions: WorkoutSession[]): WorkoutSession[] {
  return [...sessions].sort((a, b) => b.startTime - a.startTime);
}

/** Aperçu des noms d'exercices d'une routine (résout les noms courants). */
export function routinePreview(routine: Routine, exercises: Exercise[]): string {
  const names = routine.exerciseIds
    .map((id) => exercises.find((e) => e.id === id)?.name)
    .filter((n): n is string => !!n);
  return names.join(' · ');
}
