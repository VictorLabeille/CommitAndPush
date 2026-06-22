import type { Exercise, Routine, WorkoutSession } from '@/store/types';
import {
  BACKUP_APP,
  BACKUP_VERSION,
  backupFilename,
  buildBackup,
  type BackupData,
  parseBackup,
  shouldRemind,
  unsavedCount,
} from '../backup';

const ex = (id: string, name: string): Exercise => ({
  id,
  name,
  isArchived: false,
  createdAt: 0,
});

const routine = (id: string, name: string, exerciseIds: string[]): Routine => ({
  id,
  name,
  exerciseIds,
  isArchived: false,
  createdAt: 0,
});

const session = (id: string, endTime: number): WorkoutSession => ({
  id,
  routineId: null,
  routineName: 'Séance libre',
  startTime: endTime - 1000,
  endTime,
  durationOverrideMin: null,
  status: 'completed',
  exercises: [],
});

const sampleData = (): BackupData => ({
  exercises: [ex('e1', 'Développé couché'), ex('e2', 'Tractions 💪')],
  routines: [routine('r1', 'Push', ['e1'])],
  sessions: [session('s1', 1000), session('s2', 2000)],
  activeSession: null,
});

describe('buildBackup / parseBackup', () => {
  it('fait un aller-retour fidèle (round-trip)', () => {
    const data = sampleData();
    const parsed = parseBackup(buildBackup(data, 123));
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.version).toBe(BACKUP_VERSION);
      expect(parsed.data).toEqual(data);
    }
  });

  it('préserve les caractères spéciaux (accents / emoji)', () => {
    const data = sampleData();
    const parsed = parseBackup(buildBackup(data, 0));
    expect(parsed.ok && parsed.data.exercises[1].name).toBe('Tractions 💪');
  });

  it('écrit l’enveloppe attendue', () => {
    const env = JSON.parse(buildBackup(sampleData(), 999));
    expect(env.app).toBe(BACKUP_APP);
    expect(env.schemaVersion).toBe(BACKUP_VERSION);
    expect(env.exportedAt).toBe(999);
  });

  it('refuse un JSON invalide', () => {
    expect(parseBackup('{pas du json')).toEqual({ ok: false, reason: expect.any(String) });
  });

  it('refuse un fichier d’une autre app', () => {
    const txt = JSON.stringify({ app: 'autre', schemaVersion: 1, data: {} });
    const r = parseBackup(txt);
    expect(r.ok).toBe(false);
  });

  it('refuse une sauvegarde trop récente', () => {
    const txt = JSON.stringify({
      app: BACKUP_APP,
      schemaVersion: BACKUP_VERSION + 1,
      data: sampleData(),
    });
    const r = parseBackup(txt);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toMatch(/récente/);
  });

  it('refuse une structure invalide (collections manquantes)', () => {
    const txt = JSON.stringify({ app: BACKUP_APP, schemaVersion: 1, data: { exercises: 'nope' } });
    expect(parseBackup(txt).ok).toBe(false);
  });

  it('accepte une version ancienne connue (migration en aval)', () => {
    const txt = JSON.stringify({ app: BACKUP_APP, schemaVersion: 1, data: sampleData() });
    const r = parseBackup(txt);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.version).toBe(1);
  });

  it('tolère activeSession absent (→ null)', () => {
    const { activeSession, ...rest } = sampleData();
    void activeSession;
    const txt = JSON.stringify({ app: BACKUP_APP, schemaVersion: BACKUP_VERSION, data: rest });
    const r = parseBackup(txt);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.activeSession).toBeNull();
  });
});

describe('backupFilename', () => {
  it('formate AAAA-MM-JJ avec extension .json', () => {
    // 2026-06-22 (heure locale) — on vérifie le motif, robuste au fuseau.
    expect(backupFilename(Date.now())).toMatch(/^commit-and-push-sauvegarde-\d{4}-\d{2}-\d{2}\.json$/);
  });
});

describe('unsavedCount / shouldRemind', () => {
  const sessions = [session('s1', 1000), session('s2', 2000), session('s3', 3000)];

  it('compte tout si jamais sauvegardé', () => {
    expect(unsavedCount(sessions, null)).toBe(3);
  });

  it('ne compte que les séances postérieures au dernier export', () => {
    expect(unsavedCount(sessions, 1500)).toBe(2); // s2, s3
    expect(unsavedCount(sessions, 3000)).toBe(0);
  });

  it('déclenche le rappel au seuil', () => {
    expect(shouldRemind(4)).toBe(false);
    expect(shouldRemind(5)).toBe(true);
    expect(shouldRemind(9)).toBe(true);
  });
});
