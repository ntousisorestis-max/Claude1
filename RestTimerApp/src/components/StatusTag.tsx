import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { blocker } from '../blocking';
import { BrandIcon } from './BrandIcon';
import { allBlockableApps } from '../state/workoutReducer';
import { useWorkout } from '../state/WorkoutContext';
import { colors, radius, spacing, TAP_TARGET, type } from '../theme';

/**
 * The lock state as a sticker chip.
 *
 * The screen's own colour already says locked-or-free — this just spells it
 * out. On a accent ground it goes black-on-black-outline; on a dark ground it's
 * accent. Phase 1 only: tap while locked to preview the shield you'd hit opening
 * a blocked app.
 */
export function StatusTag({
  selectedAppIds,
  onAccent = false,
}: {
  selectedAppIds: string[];
  onAccent?: boolean;
}) {
  const [locked, setLocked] = useState(false);
  const [preview, setPreview] = useState(false);
  const isMock = blocker.kind === 'mock';
  // targetSdk 36 draws modals edge to edge behind the Android system bars.
  const insets = useSafeAreaInsets();
  const {
    state: {
      defaults: { customApps },
    },
  } = useWorkout();

  useEffect(() => blocker.subscribe(setLocked), []);

  useEffect(() => {
    if (!locked) {
      setPreview(false);
    }
  }, [locked]);

  // Reads the full list, so an app the user added is counted on the chip and
  // shown on the shield like any preset.
  const apps = allBlockableApps(customApps).filter(a =>
    selectedAppIds.includes(a.id),
  );
  const text = locked
    ? `${apps.length} APP${apps.length === 1 ? '' : 'S'} BLOCKED`
    : 'APPS UNLOCKED';

  return (
    <>
      <Pressable
        accessibilityRole={isMock && locked ? 'button' : 'text'}
        accessibilityLabel={
          isMock && locked
            ? `${apps.length} apps blocked. Preview the block screen.`
            : 'Apps unlocked'
        }
        disabled={!isMock || !locked}
        onPress={() => setPreview(true)}
        style={({ pressed }) => [
          styles.chip,
          onAccent ? styles.chipOnAccent : styles.chipOnInk,
          pressed && styles.pressed,
        ]}>
        <Text style={[styles.chipText, onAccent ? styles.textOnAccent : styles.textOnInk]}>
          {text}
        </Text>
        {isMock && locked ? (
          <Text style={styles.peek}>TAP TO SEE</Text>
        ) : null}
      </Pressable>

      <Modal
        visible={preview}
        animationType="fade"
        onRequestClose={() => setPreview(false)}>
        <View
          style={[
            styles.shield,
            {
              paddingTop: insets.top + spacing.lg,
              paddingBottom: insets.bottom + spacing.lg,
            },
          ]}>
          <View style={styles.shieldTop}>
            <Text style={styles.shieldLock}>🔒</Text>
            <Text style={styles.shieldTitle}>Blocked</Text>
            <Text style={styles.shieldSub}>
              Finish your set, then these unlock for your rest:
            </Text>
          </View>

          <View style={styles.shieldApps}>
            {apps.length ? (
              apps.map(app => (
                <View key={app.id} style={styles.pill}>
                  {app.brand ? (
                    <BrandIcon id={app.brand} color={app.tint} hole={colors.surface} />
                  ) : (
                    <View style={[styles.dot, { backgroundColor: app.tint }]} />
                  )}
                  <Text style={styles.pillText}>{app.name}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.shieldSub}>No apps selected</Text>
            )}
          </View>

          <View style={styles.shieldFoot}>
            <Text style={styles.shieldNote}>
              This is a preview of the block screen. Nothing is really blocked
              yet — that arrives in Phase 2, when iOS draws this over the app
              itself.
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Back to workout"
              onPress={() => setPreview(false)}
              style={({ pressed }) => [styles.back, pressed && styles.pressed]}>
              <Text style={styles.backText}>Back to workout</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: radius.pill,
    borderWidth: 2,
  },
  chipOnInk: { borderColor: colors.accent, backgroundColor: colors.accentWash },
  chipOnAccent: { borderColor: colors.white, backgroundColor: 'transparent' },
  chipText: { ...type.tag },
  textOnInk: { color: colors.accent },
  textOnAccent: { color: colors.white },
  peek: { ...type.tag, fontSize: 10, color: colors.faintOnDark },
  pressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },

  shield: {
    flex: 1,
    backgroundColor: colors.ink,
    paddingHorizontal: spacing.lg,
    justifyContent: 'space-between',
  },
  shieldTop: { flex: 1, justifyContent: 'center', gap: spacing.sm },
  shieldLock: { fontSize: 72, marginBottom: spacing.sm },
  shieldTitle: { ...type.mega, fontSize: 68, color: colors.accent },
  shieldSub: { ...type.helper, fontSize: 17, color: colors.mutedOnDark, lineHeight: 24 },
  shieldApps: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
  pillText: { ...type.body, fontWeight: '600', color: colors.white },
  shieldFoot: { gap: spacing.md, marginTop: spacing.lg },
  shieldNote: { ...type.helper, fontSize: 13, color: colors.faintOnDark, lineHeight: 19 },
  back: {
    minHeight: TAP_TARGET,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: { ...type.action, color: colors.white },
});
