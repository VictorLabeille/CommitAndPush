/**
 * I/O des notifications du rappel d'étirements (`expo-notifications`). La planification
 * elle-même est pure : `logic/restPlan.ts`.
 */
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { REST_ID_PREFIX, type PlannedNotification } from '@/logic/restPlan';

const CHANNEL_ID = 'rest-reminder';
/** Route ouverte par un tap sur la notif de décision. */
export const DECISION_URL = '/rest-day';

let setupDone = false;

/** Affichage au premier plan + canal Android. Idempotent. */
export async function setupNotifications(): Promise<void> {
  if (setupDone) return;
  setupDone = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
  if (Platform.OS === 'android') {
    // Le canal doit exister AVANT la demande de permission (Android 13+).
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Rappel d’étirements',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }
}

/** Permission accordée ? Ne la demande que si le système l'autorise encore. */
export async function ensurePermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  const asked = await Notifications.requestPermissionsAsync();
  return asked.granted;
}

const CONTENT: Record<PlannedNotification['kind'], Notifications.NotificationContentInput> = {
  decision: {
    title: 'Salle ou étirements ?',
    body: 'Dis-moi ce que tu fais aujourd’hui.',
    data: { url: DECISION_URL },
  },
  stretch: {
    title: 'C’est l’heure des étirements',
    body: 'Jour de repos : on s’étire.',
  },
};

// Les synchronisations s'enchaînent : deux annulations/replanifications concurrentes
// pourraient laisser des doublons.
let queue: Promise<void> = Promise.resolve();

/** Remplace toutes nos notifs planifiées (préfixe `rest-`) par `plan`. */
export function syncScheduled(plan: PlannedNotification[]): Promise<void> {
  queue = queue
    .then(async () => {
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      await Promise.all(
        scheduled
          .filter((n) => n.identifier.startsWith(REST_ID_PREFIX))
          .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
      );
      for (const n of plan) {
        await Notifications.scheduleNotificationAsync({
          identifier: n.id,
          content: CONTENT[n.kind],
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: n.at,
            channelId: CHANNEL_ID,
          },
        });
      }
    })
    .catch((e) => console.warn('[rest-reminder] synchronisation échouée', e));
  return queue;
}
