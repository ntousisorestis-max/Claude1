import { Platform } from 'react-native';
import type { Blocker } from './Blocker';
import { MockBlocker } from './MockBlocker';
import { ScreenTimeBlocker, ScreenTimeNative } from './ScreenTimeBlocker';

/**
 * Picks the best blocker available at runtime.
 *
 * Phase 1: the native module isn't linked, so this is always MockBlocker.
 * Phase 2: once the Swift module ships (and the family-controls entitlement is
 * approved), iOS builds get real shielding with no other code change.
 */
export function getBlocker(): Blocker {
  if (Platform.OS === 'ios' && ScreenTimeNative) {
    return ScreenTimeBlocker;
  }
  return MockBlocker;
}

export const blocker = getBlocker();
export { MockBlocker };
export type { Blocker };
