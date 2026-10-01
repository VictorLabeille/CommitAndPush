import { DEFAULT_REST_REMINDER, PLAN_DAYS, dayKey, planRestNotifications } from '../restPlan';
import { makeSession } from './fixtures';

// Mercredi 1er octobre 2026, heure locale.
const at = (h: number, m = 0, dayOffset = 0) => new Date(2026, 9, 1 + dayOffset, h, m).getTime();
const TODAY = dayKey(at(12));

const plan = (over: Partial<Parameters<typeof planRestNotifications>[0]> = {}) =>
  planRestNotifications({
    now: at(10),
    settings: DEFAULT_REST_REMINDER,
    decision: null,
    sessions: [],
    activeSession: null,
    ...over,
  });

describe('planRestNotifications', () => {
  it('rien si le rappel est désactivé', () => {
    expect(plan({ settings: { ...DEFAULT_REST_REMINDER, enabled: false } })).toEqual([]);
  });

  it('une décision par jour à l’heure réglée, aujourd’hui compris', () => {
    const p = plan();
    expect(p).toHaveLength(PLAN_DAYS);
    expect(p[0]).toEqual({ id: `rest-decision-${TODAY}`, kind: 'decision', at: at(14) });
    expect(p[1].at).toBe(at(14, 0, 1));
  });

  it('pas de décision aujourd’hui si l’heure est passée', () => {
    const p = plan({ now: at(15) });
    expect(p).toHaveLength(PLAN_DAYS - 1);
    expect(p[0].at).toBe(at(14, 0, 1));
  });

  it('rien aujourd’hui si une séance a déjà eu lieu ou est en cours', () => {
    const done = makeSession({ startTime: at(8) });
    expect(plan({ sessions: [done] })[0].at).toBe(at(14, 0, 1));
    const active = makeSession({ startTime: at(9), status: 'active', endTime: null });
    expect(plan({ activeSession: active })[0].at).toBe(at(14, 0, 1));
  });

  it('une séance d’un autre jour ne compte pas', () => {
    const yesterday = makeSession({ startTime: at(8, 0, -1) });
    expect(plan({ sessions: [yesterday] })[0].at).toBe(at(14));
  });

  it('« salle » : plus rien aujourd’hui', () => {
    const p = plan({ now: at(14, 5), decision: { day: TODAY, kind: 'gym' } });
    expect(p.every((n) => dayKey(n.at) !== TODAY)).toBe(true);
  });

  it('« étirements » : notif d’étirements à l’heure choisie, plus de décision', () => {
    const p = plan({ now: at(14, 5), decision: { day: TODAY, kind: 'stretch', at: at(20, 30) } });
    expect(p[0]).toEqual({ id: `rest-stretch-${TODAY}`, kind: 'stretch', at: at(20, 30) });
    expect(p.filter((n) => dayKey(n.at) === TODAY)).toHaveLength(1);
  });

  it('« étirements » annulés si une séance est enregistrée ensuite', () => {
    const p = plan({
      now: at(18),
      decision: { day: TODAY, kind: 'stretch', at: at(20, 30) },
      sessions: [makeSession({ startTime: at(17) })],
    });
    expect(p.every((n) => dayKey(n.at) !== TODAY)).toBe(true);
  });

  it('« pas encore » : la décision revient à l’heure repoussée', () => {
    const p = plan({ now: at(14, 5), decision: { day: TODAY, kind: 'snooze', at: at(15, 5) } });
    expect(p[0]).toEqual({ id: `rest-decision-${TODAY}`, kind: 'decision', at: at(15, 5) });
  });

  it('une décision de la veille est ignorée', () => {
    const yesterday = dayKey(at(12, 0, -1));
    expect(plan({ decision: { day: yesterday, kind: 'gym' } })[0].at).toBe(at(14));
  });
});
