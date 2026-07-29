import notifee, {
  AndroidImportance,
  AuthorizationStatus,
  TimestampTrigger,
  TriggerType,
} from '@notifee/react-native';

/**
 * Backup local notification for when rest ends while the user is off in
 * another app.
 *
 * It is *scheduled with the OS* rather than fired from a JS timer, because by
 * the time rest ends our JS thread is usually suspended behind whatever the
 * user is scrolling.
 */

const CHANNEL_ID = 'rest-timer';
const NOTIFICATION_ID = 'rest-over';

let channelReady: Promise<string> | null = null;

async function ensureChannel(): Promise<string> {
  if (!channelReady) {
    channelReady = notifee.createChannel({
      id: CHANNEL_ID,
      name: 'Rest timer',
      importance: AndroidImportance.HIGH,
    });
  }
  return channelReady;
}

export async function requestNotificationPermission(): Promise<boolean> {
  try {
    const settings = await notifee.requestPermission();
    return settings.authorizationStatus >= AuthorizationStatus.AUTHORIZED;
  } catch (err) {
    console.warn('[rest-timer] notification permission failed', err);
    return false;
  }
}

/** Schedule the "rest over" alert for `endsAt` (wall-clock ms). */
export async function scheduleRestOverNotification(
  endsAt: number,
  nextSet: number,
  totalSets: number,
) {
  try {
    await ensureChannel();
    const trigger: TimestampTrigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: Math.max(Date.now() + 1000, endsAt),
    };
    await notifee.createTriggerNotification(
      {
        id: NOTIFICATION_ID,
        title: 'Rest over — apps locked 🔒',
        body: `Start set ${nextSet} of ${totalSets}.`,
        android: { channelId: CHANNEL_ID, pressAction: { id: 'default' } },
        ios: { sound: 'default' },
      },
      trigger,
    );
  } catch (err) {
    // A missing notification must never break the workout loop.
    console.warn('[rest-timer] could not schedule notification', err);
  }
}

/** Called when rest is skipped or the workout ends early. */
export async function cancelRestOverNotification() {
  try {
    await notifee.cancelTriggerNotification(NOTIFICATION_ID);
  } catch (err) {
    console.warn('[rest-timer] could not cancel notification', err);
  }
}
