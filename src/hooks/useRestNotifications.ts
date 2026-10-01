import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { planRestNotifications } from '@/logic/restPlan';
import { ensurePermission, setupNotifications, syncScheduled } from '@/notifications/restNotifications';
import { useStore } from '@/store/store';

/**
 * Tient les notifs du rappel d'étirements à jour et route les taps. À monter une fois,
 * dans le layout racine, quand la navigation est prête (`ready`).
 *
 * Replanifie à chaque changement d'état pertinent ET à chaque retour au premier plan
 * (le jour a pu changer, cf. `logic/restPlan.ts`).
 */
export function useRestNotifications(ready: boolean) {
  const settings = useStore((s) => s.restReminder);
  const decision = useStore((s) => s.restDecision);
  // Signatures plutôt que les objets : la séance active change à chaque saisie, et seul
  // compte le jour des séances (pas leur contenu).
  const sessionCount = useStore((s) => s.sessions.length);
  const activeStart = useStore((s) => s.activeSession?.startTime ?? null);
  const [foregroundTick, setForegroundTick] = useState(0);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') setForegroundTick((t) => t + 1);
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    (async () => {
      await setupNotifications();
      if (settings.enabled && !(await ensurePermission())) return;
      if (cancelled) return;
      const { sessions, activeSession } = useStore.getState();
      await syncScheduled(
        planRestNotifications({ now: Date.now(), settings, decision, sessions, activeSession }),
      );
    })();
    return () => {
      cancelled = true;
    };
  }, [ready, settings, decision, sessionCount, activeStart, foregroundTick]);

  // Tap sur une notif → route portée par `data.url` (app froide comprise).
  useEffect(() => {
    if (!ready) return;
    const redirect = (notification: Notifications.Notification) => {
      const url = notification.request.content.data?.url;
      if (typeof url === 'string') router.push(url as never);
    };
    const last = Notifications.getLastNotificationResponse();
    if (last?.notification) {
      redirect(last.notification);
      Notifications.clearLastNotificationResponseAsync();
    }
    const sub = Notifications.addNotificationResponseReceivedListener((r) => redirect(r.notification));
    return () => sub.remove();
  }, [ready]);
}
