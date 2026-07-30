import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { blocker } from '../blocking';
import { BLOCKABLE_APPS } from '../state/workoutReducer';
import { colors, radius, spacing, TAP_TARGET, type } from '../theme';

/**
 * The lock state as a sticker chip.
 *
 * The screen's own colour already says locked-or-free — this just spells it
 * out. On a lime ground it goes black-on-black-outline; on a dark ground it's
 * lime. Phase 1 only: tap while locked to preview the shield you'd hit opening
 * a blocked app.
 */
export function StatusTag({
  selectedAppIds,
  onLime = false,
}: {
  selectedAppIds: string[];
  onLime?: boolean;
}) {
  const [locked, setLocked] = useState(false);
  const [preview, setPreview] = useState(false);
  const isMock = blocker.kind === 'mock';
  // targetSdk 36 draws modals edge to edge behind the Android system bars.
  const insets = useSafeAreaInsets();

  useEffect(() => blocker.subscribe(setLocked), []);

  useEffect(() => {
    if (!locked) {
      setPreview(false);
    }
  }, [locked]);

  const apps = BLOCKABLE_APPS.filter(a => selectedAppIds.includes(a.id));
  const text = locked
    ? `PHONE LOCKED · ${apps.length} APP${apps.length === 1 ? '' : 'S'}`
    : 'PHONE UNLOCKED';

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
          onLime ? styles.chipOnLime : styles.chipOnInk,
          pressed && styles.pressed,
        ]}>
        <Text style={[styles.chipText, onLime ? styles.textOnLime : styles.textOnInk]}>
          {text}
        </Text>
        {isMock && locked ? <Text style={styles.peek}>TAP</Text> : null}
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
            <Text style={styles.shieldTitle}>not yet.</Text>
            <Text style={styles.shieldSub}>finish the set, then scroll.</Text>
          </View>

          <View style={styles.shieldApps}>
            {apps.length ? (
              apps.map(app => (
                <View key={app.id} style={styles.pill}>
                  <View style={[styles.dot, { backgroundColor: app.tint }]} />
                  <Text style={styles.pillText}>{app.name}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.shieldSub}>no apps selected</Text>
            )}
          </View>

          <View style={styles.shieldFoot}>
            <Text style={styles.shieldNote}>
              Simulated. In Phase 2, iOS draws this over the real app.
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => setPreview(false)}
              style={({ pressed }) => [styles.back, pressed && styles.pressed]}>
              <Text style={styles.backText}>back to the set</Text>
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
  chipOnInk: { borderColor: colors.lime, backgroundColor: 'rgba(217,255,61,0.08)' },
  chipOnLime: { borderColor: colors.ink, backgroundColor: 'transparent' },
  chipText: { ...type.tag },
  textOnInk: { color: colors.lime },
  textOnLime: { color: colors.ink },
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
  shieldTitle: { ...type.mega, fontSize: 76, color: colors.lime },
  shieldSub: { ...type.title, fontSize: 22, color: colors.mutedOnDark },
  shieldApps: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.inkSoft,
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
  pillText: { ...type.body, color: colors.white },
  shieldFoot: { gap: spacing.md, marginTop: spacing.lg },
  shieldNote: { ...type.body, fontSize: 13, color: colors.faintOnDark },
  back: {
    minHeight: TAP_TARGET,
    borderRadius: radius.pill,
    backgroundColor: colors.lime,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: { ...type.action, color: colors.ink },
});
