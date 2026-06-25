/**
 * Sauvegarde / restauration complète — logique PURE et testée (cahier : spec
 * « sauvegarde » du 2026-06-22). Aucune I/O ici : l'écriture/lecture de fichier et le
 * partage vivent dans l'écran Réglages ; le store consomme `migrateData`/`parseBackup`.
 *
 * Enveloppe de fichier : { app, schemaVersion, exportedAt, data, exportTemplate? }. `data` =
 * les 4 collections métier ; `exportTemplate` est un réglage utilisateur optionnel (le template
 * du texte d'export AI Coach) joint pour être portable d'un appareil à l'autre. L'horodatage de
 * sauvegarde `lastBackupAt` reste une méta du store (absent de l'enveloppe).
 */
import type { Exercise, Routine, WorkoutSession } from '@/store/types';

export interface BackupData {
  exercises: Exercise[];
  routines: Routine[];
  sessions: WorkoutSession[];
  activeSession: WorkoutSession | null;
}

/** Marqueur d'app et version de schéma (= version du store, cf. `store.ts`). */
export const BACKUP_APP = 'commit-and-push';
export const BACKUP_VERSION = 2;
/** Seuil de séances non sauvegardées au-delà duquel on rappelle d'exporter. */
export const REMIND_THRESHOLD = 5;

/**
 * Migration PURE des collections d'une version de schéma vers la version courante.
 * Réutilisée par le middleware `persist` (rehydratation) ET par l'import de sauvegarde.
 * v1 → v2 : aucune transformation des collections (l'ajout `lastBackupAt` est géré côté
 * store). Le squelette absorbe les futures évolutions.
 */
export function migrateData(data: Partial<BackupData>, _fromVersion: number): BackupData {
  return {
    exercises: data.exercises ?? [],
    routines: data.routines ?? [],
    sessions: data.sessions ?? [],
    activeSession: data.activeSession ?? null,
  };
}

const pad = (x: number) => String(x).padStart(2, '0');

/** Nom de fichier : `commit-and-push-sauvegarde-AAAA-MM-JJ.json` (date locale, sûre en FS). */
export function backupFilename(now: number): string {
  const d = new Date(now);
  return `commit-and-push-sauvegarde-${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}.json`;
}

/**
 * Sérialise l'enveloppe de sauvegarde (indentée = lisible ; UTF-8 préserve accents/emoji).
 * `exportTemplate` n'est écrit que s'il est fourni (clé omise par `JSON.stringify` si undefined).
 */
export function buildBackup(data: BackupData, now: number, exportTemplate?: string): string {
  return JSON.stringify(
    { app: BACKUP_APP, schemaVersion: BACKUP_VERSION, exportedAt: now, data, exportTemplate },
    null,
    2,
  );
}

export type ParseResult =
  | { ok: true; version: number; data: BackupData; exportTemplate?: string }
  | { ok: false; reason: string };

/**
 * Valide un texte de sauvegarde. Ne migre PAS (renvoie `version` + `data` bruts ; la
 * migration est faite par le store au moment du remplacement). Refus net et explicite sur
 * tout problème → l'appelant n'altère jamais les données existantes.
 */
export function parseBackup(text: string): ParseResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, reason: 'Fichier illisible (JSON invalide).' };
  }
  if (!raw || typeof raw !== 'object') {
    return { ok: false, reason: 'Format de fichier non reconnu.' };
  }
  const env = raw as Record<string, unknown>;
  if (env.app !== BACKUP_APP) {
    return { ok: false, reason: 'Ce fichier n’est pas une sauvegarde Commit & Push.' };
  }
  const version = env.schemaVersion;
  if (typeof version !== 'number' || version < 1) {
    return { ok: false, reason: 'Version de sauvegarde inconnue.' };
  }
  if (version > BACKUP_VERSION) {
    return { ok: false, reason: 'Sauvegarde trop récente : mets l’application à jour.' };
  }
  const d = env.data as Record<string, unknown> | undefined;
  if (!d || typeof d !== 'object') {
    return { ok: false, reason: 'Données de sauvegarde absentes.' };
  }
  if (!Array.isArray(d.exercises) || !Array.isArray(d.routines) || !Array.isArray(d.sessions)) {
    return { ok: false, reason: 'Structure de sauvegarde invalide.' };
  }
  if (d.activeSession != null && typeof d.activeSession !== 'object') {
    return { ok: false, reason: 'Structure de sauvegarde invalide.' };
  }
  return {
    ok: true,
    version,
    data: {
      exercises: d.exercises as Exercise[],
      routines: d.routines as Routine[],
      sessions: d.sessions as WorkoutSession[],
      activeSession: (d.activeSession as WorkoutSession | null) ?? null,
    },
    // Réglage optionnel : appliqué à l'import seulement s'il est présent (sauvegardes anciennes).
    exportTemplate: typeof env.exportTemplate === 'string' ? env.exportTemplate : undefined,
  };
}

/**
 * Nombre de séances enregistrées depuis la dernière sauvegarde (toutes si jamais
 * sauvegardé). Sert au rappel. Dérivé de l'historique, pas de compteur séparé.
 */
export function unsavedCount(sessions: WorkoutSession[], lastBackupAt: number | null): number {
  if (lastBackupAt == null) return sessions.length;
  return sessions.filter((s) => (s.endTime ?? s.startTime) > lastBackupAt).length;
}

/** Faut-il rappeler de sauvegarder ? */
export function shouldRemind(count: number): boolean {
  return count >= REMIND_THRESHOLD;
}
