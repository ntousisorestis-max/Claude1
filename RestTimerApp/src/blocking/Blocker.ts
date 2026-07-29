/**
 * The one interface the rest of the app knows about.
 *
 * Phase 1 fulfils it with MockBlocker (an in-app overlay). Phase 2 swaps in
 * ScreenTimeBlocker (FamilyControls + ManagedSettings) without any screen or
 * reducer change.
 */
export interface Blocker {
  /** Human-readable name, shown on the Setup screen so it's obvious which is live. */
  readonly kind: 'mock' | 'screen-time';

  /** True once the OS has granted whatever permission blocking needs. */
  isAuthorized(): Promise<boolean>;

  /** Prompt for permission. Resolves to the resulting authorization state. */
  requestPermission(): Promise<boolean>;

  /**
   * Let the user choose which apps to shield.
   * Mock: no-op (the Setup screen's checkbox list stands in).
   * iOS Phase 2: presents FamilyActivityPicker.
   */
  pickApps(): Promise<void>;

  /** Start shielding the selected apps. */
  lockApps(): Promise<void>;

  /** Stop shielding. Must be safe to call when already unlocked. */
  unlockApps(): Promise<void>;

  /**
   * Observe the shield state. Returns an unsubscribe function.
   * The mock blocker uses this to drive the in-app overlay; the real one
   * reports state but has nothing to render.
   */
  subscribe(listener: (locked: boolean) => void): () => void;
}
