/**
 * Store Zustand unique, persisté sur AsyncStorage (middleware `persist`).
 *
 * - `version` + `migrate` (squelette) pour absorber les futurs changements de schéma.
 * - `partialize` : seules les DONNÉES métier sont persistées (l'état d'UI — onglet,
 *   recherche, sheets, mode édition — reste local aux écrans).
 * - écritures debouncées + flush immédiat sur actions critiques (§6.4).
 *
 * Les mutations de séance réutilisent les transformations pures de `sessionOps`
 * (aucune logique métier dans les vues).
 */
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { BACKUP_VERSION, migrateData, type BackupData } from '@/logic/backup';
import { DEFAULT_EXPORT_TEMPLATE } from '@/logic/exportText';
import { newId } from '@/utils/id';
import * as ops from './sessionOps';
import { debouncedStorage, flushStorage } from './storage';
import type {
  Exercise,
  Routine,
  WorkoutExerciseStatus,
  WorkoutSession,
} from './types';

interface PersistedState {
  exercises: Exercise[];
  routines: Routine[];
  sessions: WorkoutSession[]; // historique (séances completed)
  activeSession: WorkoutSession | null;
  lastBackupAt: number | null; // horodatage du dernier export (rappel de sauvegarde)
  exportTemplate: string; // template du texte d'export AI Coach (personnalisable)
}

interface AppState extends PersistedState {
  _hasHydrated: boolean;
  setHasHydrated: (v: boolean) => void;

  // --- Exercices ---
  addExercise: (name: string) => void;
  renameExercise: (id: string, name: string) => void;
  archiveExercise: (id: string) => void; // soft delete (§6.1)

  // --- Routines ---
  addRoutine: (name: string, exerciseIds: string[]) => void;
  updateRoutine: (id: string, name: string, exerciseIds: string[]) => void;
  archiveRoutine: (id: string) => void;
  unarchiveRoutine: (id: string) => void;
  deleteRoutine: (id: string) => void;

  // --- Cycle de vie de la séance active ---
  startSession: (routine: Routine | null) => void;
  abandonSession: () => void;
  finishSession: () => string | null; // renvoie l'id de la séance terminée (navigation)

  // --- Édition de la séance active ---
  addExerciseToActive: (exercise: Exercise) => void;
  setActiveExerciseStatus: (exerciseId: string, status: WorkoutExerciseStatus) => void;
  moveActiveExercise: (exerciseId: string, dir: -1 | 1) => void;
  addActiveSet: (exerciseId: string) => void;
  updateActiveSet: (
    exerciseId: string,
    setId: string,
    patch: Partial<{ weight: number; reps: number }>,
  ) => void;
  toggleActiveSet: (exerciseId: string, setId: string) => boolean; // false si reps ≤ 0

  // --- Historique (édition complète) ---
  renameSession: (id: string, name: string) => void;
  setSessionDuration: (id: string, min: number | null) => void;
  deleteSession: (id: string) => void;
  editAddSet: (id: string, exerciseId: string) => void;
  editRemoveSet: (id: string, exerciseId: string, setId: string) => void;
  editUpdateSet: (
    id: string,
    exerciseId: string,
    setId: string,
    patch: Partial<{ weight: number; reps: number }>,
  ) => void;
  editToggleSet: (id: string, exerciseId: string, setId: string) => boolean;
  editExerciseStatus: (id: string, exerciseId: string, status: WorkoutExerciseStatus) => void;

  // --- Sauvegarde / restauration ---
  markBackedUp: () => void; // marque les données comme sauvegardées (après export)
  // remplace TOUT (import) ; applique le template d'export s'il est présent dans la sauvegarde
  replaceAll: (version: number, data: BackupData, exportTemplate?: string) => void;

  // --- Réglages ---
  setExportTemplate: (template: string) => void;
  resetExportTemplate: () => void; // restaure le template par défaut
}

/** Applique une transformation à la séance active si elle existe. */
const onActive =
  (fn: (s: WorkoutSession) => WorkoutSession) =>
  (state: AppState): Partial<AppState> =>
    state.activeSession ? { activeSession: fn(state.activeSession) } : {};

export const useStore = create<AppState>()(
  persist(
    (set, get) => {
      /** Applique une transformation à une séance d'historique donnée. */
      const onSession = (id: string, fn: (s: WorkoutSession) => WorkoutSession) =>
        set((state) => ({
          sessions: state.sessions.map((s) => (s.id === id ? fn(s) : s)),
        }));

      return {
        exercises: [],
        routines: [],
        sessions: [],
        activeSession: null,
        lastBackupAt: null,
        exportTemplate: DEFAULT_EXPORT_TEMPLATE,
        _hasHydrated: false,
        setHasHydrated: (v) => set({ _hasHydrated: v }),

        // --- Sauvegarde / restauration ---
        markBackedUp: () => {
          set({ lastBackupAt: Date.now() });
          flushStorage();
        },
        replaceAll: (version, data, exportTemplate) => {
          const d = migrateData(data, version);
          set({
            exercises: d.exercises,
            routines: d.routines,
            sessions: d.sessions,
            activeSession: d.activeSession,
            lastBackupAt: Date.now(), // l'état importé est, par définition, « sauvegardé »
            // Sauvegarde ancienne sans template : on garde le template courant intact.
            ...(exportTemplate !== undefined ? { exportTemplate } : {}),
          });
          flushStorage();
        },

        // --- Exercices ---
        addExercise: (name) =>
          set((state) => ({
            exercises: [
              ...state.exercises,
              { id: newId(), name: name.trim(), isArchived: false, createdAt: Date.now() },
            ],
          })),
        renameExercise: (id, name) =>
          set((state) => ({
            exercises: state.exercises.map((e) =>
              e.id === id ? { ...e, name: name.trim() } : e,
            ),
          })),
        archiveExercise: (id) =>
          set((state) => ({
            exercises: state.exercises.map((e) =>
              e.id === id ? { ...e, isArchived: true } : e,
            ),
          })),

        // --- Routines ---
        addRoutine: (name, exerciseIds) =>
          set((state) => ({
            routines: [
              ...state.routines,
              {
                id: newId(),
                name: name.trim(),
                exerciseIds,
                isArchived: false,
                createdAt: Date.now(),
              },
            ],
          })),
        updateRoutine: (id, name, exerciseIds) =>
          set((state) => ({
            routines: state.routines.map((r) =>
              r.id === id ? { ...r, name: name.trim(), exerciseIds } : r,
            ),
          })),
        archiveRoutine: (id) =>
          set((state) => ({
            routines: state.routines.map((r) =>
              r.id === id ? { ...r, isArchived: true } : r,
            ),
          })),
        unarchiveRoutine: (id) =>
          set((state) => ({
            routines: state.routines.map((r) =>
              r.id === id ? { ...r, isArchived: false } : r,
            ),
          })),
        deleteRoutine: (id) =>
          set((state) => ({ routines: state.routines.filter((r) => r.id !== id) })),

        // --- Cycle de vie de la séance active ---
        startSession: (routine) => {
          const now = Date.now();
          const exercises = routine
            ? routine.exerciseIds
                .map((eid, i) => {
                  const ex = get().exercises.find((e) => e.id === eid);
                  if (!ex) return null;
                  return {
                    exerciseId: ex.id,
                    exerciseName: ex.name, // copie figée
                    status: 'active' as const,
                    orderIndex: i,
                    sets: [],
                  };
                })
                .filter((x): x is NonNullable<typeof x> => x !== null)
            : [];
          set({
            activeSession: {
              id: newId(),
              routineId: routine?.id ?? null,
              routineName: routine?.name ?? 'Séance libre',
              startTime: now,
              endTime: null,
              durationOverrideMin: null,
              status: 'active',
              exercises,
            },
          });
          flushStorage();
        },
        abandonSession: () => {
          set({ activeSession: null });
          flushStorage();
        },
        finishSession: () => {
          const s = get().activeSession;
          if (!s) return null;
          const completed: WorkoutSession = {
            ...s,
            endTime: s.endTime ?? Date.now(),
            status: 'completed',
          };
          set((state) => ({
            sessions: [completed, ...state.sessions],
            activeSession: null,
          }));
          flushStorage();
          return completed.id;
        },

        // --- Édition de la séance active ---
        addExerciseToActive: (exercise) =>
          set(onActive((s) => ops.addExerciseToSession(s, exercise))),
        setActiveExerciseStatus: (exerciseId, status) =>
          set(onActive((s) => ops.setExerciseStatus(s, exerciseId, status))),
        moveActiveExercise: (exerciseId, dir) =>
          set(onActive((s) => ops.moveExercise(s, exerciseId, dir))),
        addActiveSet: (exerciseId) => set(onActive((s) => ops.addSet(s, exerciseId))),
        updateActiveSet: (exerciseId, setId, patch) =>
          set(onActive((s) => ops.updateSet(s, exerciseId, setId, patch))),
        toggleActiveSet: (exerciseId, setId) => {
          const s = get().activeSession;
          if (!s) return false;
          const ex = s.exercises.find((e) => e.exerciseId === exerciseId);
          const theSet = ex?.sets.find((st) => st.id === setId);
          if (!theSet) return false;
          // On ne peut valider une série que si reps > 0 (§6.5).
          if (!theSet.completed && theSet.reps <= 0) return false;
          set({ activeSession: ops.setSetCompleted(s, exerciseId, setId, !theSet.completed) });
          flushStorage();
          return true;
        },

        // --- Historique ---
        renameSession: (id, name) => onSession(id, (s) => ({ ...s, routineName: name.trim() })),
        setSessionDuration: (id, min) =>
          onSession(id, (s) => ({ ...s, durationOverrideMin: min })),
        deleteSession: (id) =>
          set((state) => ({ sessions: state.sessions.filter((s) => s.id !== id) })),
        editAddSet: (id, exerciseId) => onSession(id, (s) => ops.addSet(s, exerciseId)),
        editRemoveSet: (id, exerciseId, setId) =>
          onSession(id, (s) => ops.removeSet(s, exerciseId, setId)),
        editUpdateSet: (id, exerciseId, setId, patch) =>
          onSession(id, (s) => ops.updateSet(s, exerciseId, setId, patch)),
        editToggleSet: (id, exerciseId, setId) => {
          const s = get().sessions.find((x) => x.id === id);
          if (!s) return false;
          const ex = s.exercises.find((e) => e.exerciseId === exerciseId);
          const theSet = ex?.sets.find((st) => st.id === setId);
          if (!theSet) return false;
          if (!theSet.completed && theSet.reps <= 0) return false;
          onSession(id, (sess) => ops.setSetCompleted(sess, exerciseId, setId, !theSet.completed));
          return true;
        },
        editExerciseStatus: (id, exerciseId, status) =>
          onSession(id, (s) => ops.setExerciseStatus(s, exerciseId, status)),

        // --- Réglages ---
        setExportTemplate: (template) => set({ exportTemplate: template }),
        resetExportTemplate: () => set({ exportTemplate: DEFAULT_EXPORT_TEMPLATE }),
      };
    },
    {
      name: 'commit-and-push',
      version: BACKUP_VERSION,
      storage: createJSONStorage(() => debouncedStorage),
      partialize: (state): PersistedState => ({
        exercises: state.exercises,
        routines: state.routines,
        sessions: state.sessions,
        activeSession: state.activeSession,
        lastBackupAt: state.lastBackupAt,
        exportTemplate: state.exportTemplate,
      }),
      // Migration via la logique pure partagée avec l'import de sauvegarde (`migrateData`).
      migrate: (persisted, version): PersistedState => {
        const p = (persisted ?? {}) as Partial<PersistedState>;
        return {
          ...migrateData(p, version),
          lastBackupAt: p.lastBackupAt ?? null,
          exportTemplate: p.exportTemplate ?? DEFAULT_EXPORT_TEMPLATE,
        };
      },
      onRehydrateStorage: () => (state) => state?.setHasHydrated(true),
    },
  ),
);
