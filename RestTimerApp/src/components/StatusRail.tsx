import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { blocker } from '../blocking';
import { BLOCKABLE_APPS } from '../state/workoutReducer';
import { colors, HAIRLINE, radius, spacing, TAP_TARGET, type } from '../theme';

/**
 * The lock state, as a full-width rail rather than a badge.
 *
 * It is the only coloured thing on the screen, so it can be read from across a
 * room without focusing on it — which is the point, since the whole app is
 * about knowing whether your phone is currently a brick.
 *
 * Phase 1 only: tapping it previews the shield you'd hit when opening a blocked
 * app. Once real Screen Time shielding is live that affordance disappears,
 * because iOS draws the real thing over the real app.
 */
export function StatusRail({ selectedAppIds }: { selectedAppIds: string[] }) {
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
  const tone = locked ? colors.locked : colors.free;
  const status = locked
    ? `${apps.length} ${apps.length === 1 ? 'app' : 'apps'} blocked`
    : 'Apps unlocked';

  return (
    <>
      <Pressable
        accessibilityRole={isMock && locked ? 'button' : 'text'}
        accessibilityLabel={
          isMock && locked ? `${status}. Preview the block screen.` : status
        }
        disabled={!isMock || !locked}
        onPress={() => setPreview(true)}
        style={({ pressed }) => [styles.rail, pressed && styles.pressed]}>
        <View style={[styles.bar, { backgroundColor: tone }]} />
        <View style={styles.railRow}>
          <Text style={[styles.status, { color: tone }]}>
            {status.toUpperCase()}
          </Text>
          {isMock && locked ? <Text style={styles.preview}>PREVIEW</Text> : null}
        </View>
      </Pressable>

      <Modal
        visible={preview}
        animationType="fade"
        onRequestClose={() => setPreview(false)}>
        <View
          style={[
            styles.shield,
            { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.xl },
          ]}>
          <View style={[styles.bar, styles.shieldBar]} />
          <View style={styles.shieldBody}>
            <Text style={styles.shieldLabel}>BLOCKED</Text>
            <Text style={styles.shieldTitle}>Finish your set first.</Text>
            <View style={styles.shieldApps}>
              {apps.length ? (
                apps.map(app => (
                  <View key={app.id} style={styles.shieldApp}>
                    <View style={[styles.monogram, { borderColor: app.tint }]}>
                      <Text style={[styles.monogramText, { color: app.tint }]}>
                        {app.name.slice(0, 1)}
                      </Text>
                    </View>
                    <Text style={styles.shieldAppName}>{app.name}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.shieldAppName}>No apps selected</Text>
              )}
            </View>
          </View>
          <View style={styles.shieldFoot}>
            <Text style={styles.shieldNote}>
              Simulated. In Phase 2, iOS draws this over the real app.
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => setPreview(false)}
              style={({ pressed }) => [styles.dismiss, pressed && styles.pressed]}>
              <Text style={styles.dismissText}>Back to workout</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  rail: { gap: spacing.sm },
  bar: { height: 3, borderRadius: 2 },
  railRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  status: { ...type.label },
  preview: { ...type.label, color: colors.faint },
  pressed: { opacity: 0.55 },

  shield: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.lg,
    justifyContent: 'space-between',
  },
  shieldBar: { backgroundColor: colors.locked },
  shieldBody: { flex: 1, justifyContent: 'center', gap: spacing.md },
  shieldLabel: { ...type.label, color: colors.locked },
  shieldTitle: { ...type.title, color: colors.chalk, fontSize: 38, letterSpacing: -1 },
  shieldApps: { gap: spacing.sm, marginTop: spacing.md },
  shieldApp: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  monogram: {
    width: 34,
    height: 34,
    borderRadius: radius.md,
    borderWidth: HAIRLINE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monogramText: { fontSize: 16, fontWeight: '700' },
  shieldAppName: { ...type.body, color: colors.muted },
  shieldFoot: { gap: spacing.md },
  shieldNote: { ...type.body, fontSize: 13, color: colors.faint },
  dismiss: {
    minHeight: TAP_TARGET,
    borderRadius: radius.md,
    borderWidth: HAIRLINE,
    borderColor: colors.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dismissText: { ...type.action, color: colors.chalk },
});
