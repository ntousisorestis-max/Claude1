import React, { useEffect, useState } from 'react';
import { Animated, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { blocker } from '../blocking';
import { BrandIcon } from './BrandIcon';
import { LockGlyph } from './LockGlyph';
import { allBlockableApps } from '../state/workoutReducer';
import { useWorkout } from '../state/WorkoutContext';
import { usePressScale } from '../hooks/usePressScale';
import { colors, HAIRLINE, radius, spacing, TAP_TARGET, type } from '../theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * What is happening to your apps, right now, in words.
 *
 * The screen's colour already says locked-or-free — this spells it out and,
 * more usefully, names the apps it's talking about, so "blocked" isn't an
 * abstraction you have to trust. The padlock opens and shuts between the two
 * states rather than swapping, which is the only moving part on the set screen.
 *
 * Phase 1 only: tap it while locked to preview the shield you'd hit trying to
 * open one of those apps.
 */
export function LockStatus({
  selectedAppIds,
  onAccent = false,
  /** Replaces the app list underneath — the rest screen puts the countdown here. */
  caption,
}: {
  selectedAppIds: string[];
  onAccent?: boolean;
  caption?: string;
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

  const panelPress = usePressScale({ depth: 0.97, haptic: true });
  const backPress = usePressScale({ haptic: true });

  useEffect(() => blocker.subscribe(setLocked), []);

  useEffect(() => {
    if (!locked) {
      setPreview(false);
    }
  }, [locked]);

  // Reads the full list, so an app the user added is named here and shown on
  // the shield like any preset.
  const apps = allBlockableApps(customApps).filter(a =>
    selectedAppIds.includes(a.id),
  );
  const names = apps.map(a => a.name).join(', ');
  const tappable = isMock && locked;

  const title = locked ? 'Apps Locked' : 'Apps Unlocked';
  const detail =
    caption ?? (names || (locked ? 'No apps selected' : 'Nothing was blocked'));

  return (
    <>
      <AnimatedPressable
        {...panelPress.handlers}
        accessibilityRole={tappable ? 'button' : 'text'}
        accessibilityLabel={
          locked
            ? `${apps.length} apps blocked: ${names || 'none selected'}.${
                tappable ? ' Preview the block screen.' : ''
              }`
            : `Apps unlocked. ${detail}`
        }
        disabled={!tappable}
        onPress={() => setPreview(true)}
        style={[
          styles.panel,
          onAccent ? styles.panelOnAccent : styles.panelOnInk,
          panelPress.style,
        ]}>
        <LockGlyph
          locked={locked}
          color={onAccent ? colors.white : colors.accent}
        />

        <View style={styles.words}>
          <Text style={styles.title}>{title}</Text>
          <Text
            style={[
              styles.detail,
              onAccent ? styles.detailOnAccent : styles.detailOnInk,
            ]}
            numberOfLines={2}>
            {detail}
          </Text>
        </View>

        {tappable ? <Text style={styles.peek}>PREVIEW</Text> : null}
      </AnimatedPressable>

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
            {/* Boxed, or the glyph's own centring would stretch it across the
                width and knock it out of line with the text below. */}
            <View style={styles.shieldGlyph}>
              <LockGlyph locked color={colors.accent} size={64} />
            </View>
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
            <AnimatedPressable
              {...backPress.handlers}
              accessibilityRole="button"
              accessibilityLabel="Back to workout"
              onPress={() => setPreview(false)}
              style={[styles.back, backPress.style]}>
              <Text style={styles.backText}>Back to workout</Text>
            </AnimatedPressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  panel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: HAIRLINE,
  },
  panelOnInk: { backgroundColor: colors.surface, borderColor: colors.hairline },
  panelOnAccent: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderColor: 'rgba(255,255,255,0.28)',
  },
  words: { flex: 1, gap: 2 },
  // White on both grounds — the panel behind it changes, the words don't.
  title: { fontSize: 16, fontWeight: '800', letterSpacing: -0.2, color: colors.white },
  detail: { ...type.helper, fontSize: 13, lineHeight: 18 },
  detailOnInk: { color: colors.mutedOnDark },
  detailOnAccent: { color: colors.mutedOnAccent },
  peek: { ...type.tag, fontSize: 10, color: colors.faintOnDark },

  shield: {
    flex: 1,
    backgroundColor: colors.ink,
    paddingHorizontal: spacing.lg,
    justifyContent: 'space-between',
  },
  shieldTop: { flex: 1, justifyContent: 'center', gap: spacing.sm },
  shieldGlyph: { alignItems: 'flex-start' },
  shieldTitle: { ...type.mega, fontSize: 68, color: colors.accent, marginTop: spacing.lg },
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
