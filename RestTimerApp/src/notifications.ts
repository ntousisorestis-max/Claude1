import notifee, {
  AlarmType,
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

const NOTIFICATION_ID = 'rest-over';

/**
 * Two channels, because an Android channel's sound cannot be changed after it
 * is created — the OS owns it from then on. Toggling sound therefore means
 * picking a different channel, not editing one.
 */
const CHANNELS = {
  loud: { id: 'rest-timer', name: 'Rest timer' },
  silent: { id: 'rest-timer-silent', name: 'Rest timer (silent)' },
} as const;

const channelReady: Partial<Record<'loud' | 'silent', Promise<string>>> = {};

async function ensureChannel(withSound: boolean): Promise<string> {
  const key = withSound ? 'loud' : 'silent';
  if (!channelReady[key]) {
    channelReady[key] = notifee.createChannel({
      ...CHANNELS[key],
      importance: withSound ? AndroidImportance.HIGH : AndroidImportance.DEFAULT,
      // `undefined` keeps the system default; `none` silences the channel.
      sound: withSound ? undefined : 'none',
      vibration: withSound,
    });
  }
  return channelReady[key]!;
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
  withSound: boolean = true,
) {
  try {
    const channelId = await ensureChannel(withSound);
    const trigger: TimestampTrigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: Math.max(Date.now() + 1000, endsAt),
      // Android only. Notifee defaults triggers to WorkManager, which the OS
      // batches — far too loose for a 30-120s rest. AlarmManager with
      // ALLOW_WHILE_IDLE also escapes Doze, and needs no extra permission.
      // (SET_EXACT_* would be tighter but pulls in SCHEDULE_EXACT_ALARM, which
      // Android 14+ no longer grants freely. Inexact is fine here: the user is
      // actively scrolling, so the device isn't dozing.)
      alarmManager: { type: AlarmType.SET_AND_ALLOW_WHILE_IDLE },
    };
    await notifee.createTriggerNotification(
      {
        id: NOTIFICATION_ID,
        title: 'Rest over — apps locked 🔒',
        body: `Start set ${nextSet} of ${totalSets}.`,
        android: { channelId, pressAction: { id: 'default' } },
        // Omitting `sound` on iOS delivers the alert silently.
        ios: withSound ? { sound: 'default' } : {},
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
