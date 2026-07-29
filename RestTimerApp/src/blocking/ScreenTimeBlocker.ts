import { NativeModules } from 'react-native';
import type { Blocker } from './Blocker';

/**
 * PHASE 2 — iOS Screen Time blocking.
 *
 * This is the JS half only. The native half is a Swift module
 * (`RestTimerScreenTime`) wrapping FamilyControls + ManagedSettings, plus a
 * DeviceActivityMonitor extension for re-shielding while backgrounded.
 *
 * It is NOT wired up yet, and it cannot be finished without account-level
 * setup on the Apple Developer side:
 *
 *   1. The `com.apple.developer.family-controls` entitlement must be requested
 *      from and approved by Apple, then added to the App ID + provisioning
 *      profile. There is no way around this — the frameworks refuse to
 *      authorize without it.
 *   2. Authorization does not work reliably in the Simulator; testing needs a
 *      real device signed with that profile.
 *   3. Reliable re-locking when the countdown ends (while the user is off in
 *      TikTok) needs a second target: a DeviceActivityMonitor app extension
 *      with its own bundle ID + entitlement, sharing an App Group with the app.
 *   4. Apple never reveals *which* apps the user picked. `pickApps()` returns
 *      nothing useful; only the count of selected items is readable.
 *
 * Until (1) lands, `getBlocker()` falls back to MockBlocker automatically
 * because the native module will not be present.
 */

type ScreenTimeNativeModule = {
  isAuthorized(): Promise<boolean>;
  requestScreenTimePermission(): Promise<boolean>;
  presentAppPicker(): Promise<void>;
  lockApps(): Promise<void>;
  unlockApps(): Promise<void>;
};

export const ScreenTimeNative: ScreenTimeNativeModule | undefined =
  NativeModules.RestTimerScreenTime;

class ScreenTimeBlockerImpl implements Blocker {
  readonly kind = 'screen-time' as const;

  private locked = false;
  private listeners = new Set<(locked: boolean) => void>();

  private get native(): ScreenTimeNativeModule {
    if (!ScreenTimeNative) {
      throw new Error(
        'RestTimerScreenTime native module is not linked. See ScreenTimeBlocker.ts.',
      );
    }
    return ScreenTimeNative;
  }

  isAuthorized() {
    return this.native.isAuthorized();
  }

  requestPermission() {
    return this.native.requestScreenTimePermission();
  }

  pickApps() {
    return this.native.presentAppPicker();
  }

  async lockApps(): Promise<void> {
    await this.native.lockApps();
    this.setLocked(true);
  }

  async unlockApps(): Promise<void> {
    await this.native.unlockApps();
    this.setLocked(false);
  }

  subscribe(listener: (locked: boolean) => void): () => void {
    this.listeners.add(listener);
    listener(this.locked);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private setLocked(next: boolean) {
    if (this.locked === next) {
      return;
    }
    this.locked = next;
    this.listeners.forEach(l => l(next));
  }
}

export const ScreenTimeBlocker = new ScreenTimeBlockerImpl();
