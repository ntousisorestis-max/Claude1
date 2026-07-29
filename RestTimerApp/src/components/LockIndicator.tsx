import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { blocker } from '../blocking';
import { BLOCKABLE_APPS } from '../state/workoutReducer';
import { colors, radius, spacing } from '../theme';

/**
 * Shows whether apps are currently shielded, and — in Phase 1 only — lets you
 * tap through to a simulated "you tried to open TikTok" screen.
 *
 * Phase 1 can't actually intercept another app, so the overlay is opt-in
 * rather than something that ambushes the workout UI. When the real Screen
 * Time blocker is live (`blocker.kind === 'screen-time'`), iOS draws its own
 * shield over the real app and the simulate affordance disappears.
 */
export function LockIndicator({ selectedAppIds }: { selectedAppIds: string[] }) {
  const [locked, setLocked] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const isMock = blocker.kind === 'mock';

  useEffect(() => blocker.subscribe(setLocked), []);

  useEffect(() => {
    if (!locked) {
      setShowOverlay(false);
    }
  }, [locked]);

  const names = BLOCKABLE_APPS.filter(a => selectedAppIds.includes(a.id));
  const label = locked
    ? `🔒 ${names.length || 'Selected'} app${names.length === 1 ? '' : 's'} blocked`
    : '🔓 Apps unlocked';

  return (
    <>
      <Pressable
        accessibilityRole={isMock && locked ? 'button' : 'text'}
        accessibilityLabel={
          isMock && locked ? `${label}. Tap to preview the block screen.` : label
        }
        disabled={!isMock || !locked}
        onPress={() => setShowOverlay(true)}
        style={({ pressed }) => [
          styles.pill,
          locked ? styles.pillLocked : styles.pillUnlocked,
          pressed && styles.pressed,
        ]}>
        <Text style={[styles.pillText, locked && styles.pillTextLocked]}>
          {label}
        </Text>
        {isMock && locked ? <Text style={styles.hint}>tap to test</Text> : null}
      </Pressable>

      <Modal
        visible={showOverlay}
        animationType="fade"
        transparent={false}
        onRequestClose={() => setShowOverlay(false)}>
        <View style={styles.overlay}>
          <Text style={styles.overlayIcon}>🔒</Text>
          <Text style={styles.overlayTitle}>Blocked until your set is done</Text>
          <Text style={styles.overlayBody}>
            {names.length
              ? names.map(a => `${a.emoji} ${a.name}`).join('   ')
              : 'No apps selected'}
          </Text>
          <Text style={styles.overlayNote}>
            This is the Phase 1 simulation. In Phase 2 iOS draws this shield over
            the real app.
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => setShowOverlay(false)}
            style={({ pressed }) => [styles.dismiss, pressed && styles.pressed]}>
            <Text style={styles.dismissText}>Back to workout</Text>
          </Pressable>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  pillLocked: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderColor: colors.locked,
  },
  pillUnlocked: {
    backgroundColor: 'rgba(74, 222, 128, 0.10)',
    borderColor: colors.accentDark,
  },
  pillText: { color: colors.accent, fontSize: 14, fontWeight: '700' },
  pillTextLocked: { color: colors.locked },
  hint: { color: colors.textMuted, fontSize: 12 },
  pressed: { opacity: 0.7 },
  overlay: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  overlayIcon: { fontSize: 72 },
  overlayTitle: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
  },
  overlayBody: {
    color: colors.locked,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  overlayNote: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
    maxWidth: 320,
  },
  dismiss: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceAlt,
  },
  dismissText: { color: colors.text, fontSize: 16, fontWeight: '700' },
});
