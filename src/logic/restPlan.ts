/**
 * Rappel d'étirements des jours de repos — planification PURE et testée.
 *
 * Besoin (2026-10-01) : les jours sans salle, les étirements sont oubliés. Chaque jour à
 * l'heure réglée (14 h par défaut), une notif de DÉCISION ouvre l'écran `rest-day` :
 * - « je vais à la salle » → plus rien ce jour-là ;
 * - « étirements à HH:MM » → une notif d'ÉTIREMENTS à cette heure ;
 * - « je ne sais pas encore » → la notif de décision revient plus tard (30 min / 1 h / 2 h).
 * Une séance enregistrée ou en cours ce jour-là vaut « je vais à la salle » : ni décision,
 * ni étirements.
 *
 * Pourquoi des notifs datées et pas un déclencheur quotidien : un déclencheur quotidien ne
 * sait pas sauter un jour. On planifie donc `PLAN_DAYS` jours d'avance, et l'app replanifie
 * à chaque ouverture et à chaque changement d'état (cf. `useRestNotifications`). Sans
 * ouvrir l'app pendant `PLAN_DAYS` jours, les notifs s'arrêtent.
 */
import type { WorkoutSession } from '@/store/types';

export const PLAN_DAYS = 14;

export interface RestReminderSettings {
  enabled: boolean;
  hour: number;
  minute: number;
}

export const DEFAULT_REST_REMINDER: RestReminderSettings = { enabled: true, hour: 14, minute: 0 };

/** Choix fait sur l'écran de décision, valable pour le jour `day` uniquement. */
export type RestDecision =
  | { day: string; kind: 'gym' }
  | { day: string; kind: 'stretch'; at: number }
  | { day: string; kind: 'snooze'; at: number };

export interface PlannedNotification {
  /** Identifiant stable, préfixé `rest-` (sert aussi à annuler les nôtres seulement). */
  id: string;
  kind: 'decision' | 'stretch';
  at: number;
}

export const REST_ID_PREFIX = 'rest-';

/** Jour local `AAAA-MM-JJ`. */
export function dayKey(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Une séance (historique ou en cours) a-t-elle commencé ce jour-là ? */
export function trainedOn(
  day: string,
  sessions: WorkoutSession[],
  activeSession: WorkoutSession | null,
): boolean {
  if (activeSession && dayKey(activeSession.startTime) === day) return true;
  return sessions.some((s) => dayKey(s.startTime) === day);
}

export function planRestNotifications(input: {
  now: number;
  settings: RestReminderSettings;
  decision: RestDecision | null;
  sessions: WorkoutSession[];
  activeSession: WorkoutSession | null;
}): PlannedNotification[] {
  const { now, settings, sessions, activeSession } = input;
  if (!settings.enabled) return [];

  const today = dayKey(now);
  // Une décision d'un autre jour est périmée.
  const decision = input.decision?.day === today ? input.decision : null;
  const base = new Date(now);
  const plan: PlannedNotification[] = [];

  for (let i = 0; i < PLAN_DAYS; i++) {
    // Construction par composants : robuste aux changements d'heure (pas de + 24 h).
    const at = new Date(
      base.getFullYear(),
      base.getMonth(),
      base.getDate() + i,
      settings.hour,
      settings.minute,
    ).getTime();
    const key = dayKey(at);
    const decisionId = `${REST_ID_PREFIX}decision-${key}`;

    if (i === 0) {
      if (trainedOn(today, sessions, activeSession)) continue;
      if (decision?.kind === 'stretch' && decision.at > now) {
        plan.push({ id: `${REST_ID_PREFIX}stretch-${key}`, kind: 'stretch', at: decision.at });
      }
      if (decision?.kind === 'snooze' && decision.at > now) {
        plan.push({ id: decisionId, kind: 'decision', at: decision.at });
      }
      if (!decision && at > now) plan.push({ id: decisionId, kind: 'decision', at });
      continue;
    }
    plan.push({ id: decisionId, kind: 'decision', at });
  }
  return plan;
}
