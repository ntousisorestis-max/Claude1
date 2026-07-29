import type { Blocker } from './Blocker';

/**
 * Phase 1 stand-in for real OS blocking.
 *
 * It shields nothing — it just tracks a boolean and lets <LockOverlay /> render
 * a full-screen "apps blocked" state so the whole loop can be felt end to end
 * before the native work starts.
 */
class MockBlockerImpl implements Blocker {
  readonly kind = 'mock' as const;

  private locked = false;
  private listeners = new Set<(locked: boolean) => void>();

  async isAuthorized(): Promise<boolean> {
    return true;
  }

  async requestPermission(): Promise<boolean> {
    return true;
  }

  async pickApps(): Promise<void> {
    // The Setup screen's checkbox list is the mock picker.
  }

  async lockApps(): Promise<void> {
    this.setLocked(true);
  }

  async unlockApps(): Promise<void> {
    this.setLocked(false);
  }

  isLocked(): boolean {
    return this.locked;
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

export const MockBlocker = new MockBlockerImpl();
