import React from 'react';
import { Animated, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { usePressScale } from '../hooks/usePressScale';
import { colors, radius, spacing, TAP_TARGET, type } from '../theme';

type Variant = 'accent' | 'ink' | 'outlineOnAccent' | 'quiet' | 'danger';

type Props = {
  /** Button text. Say exactly what the tap does — this is also what a
   * screen reader announces. */
  label: string;
  onPress: () => void;
  variant?: Variant;
  /** Fills the space — the mid-workout slab you hit without looking. */
  slab?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
};

/**
 * How far the slab's face sits above its shadow block, in px.
 * Only the slab is extruded — see below.
 */
const LIFT = 8;

/**
 * Two kinds of button, on purpose:
 *
 * - **The slab** (mid-workout "Done with set") is an extruded block: a solid
 *   shadow sits under the face and pressing drives the face down onto it. It's
 *   the one control you hit without looking, so it gets real physical depth.
 * - **Everything else** is flat with a tight violet glow. A chunky offset block
 *   on every button made the screens feel heavy and cluttered.
 *
 * The glow is `shadow*`, which iOS and web render as a coloured shadow. Android
 * can't tint elevation shadows, so it simply gets a clean flat button there.
 */
export function BigButton({
  label,
  onPress,
  variant = 'accent',
  slab = false,
  disabled = false,
  style,
}: Props) {
  // Buttons are the app's primary actions, so they all tick.
  const { handlers, press } = usePressScale({ haptic: !disabled });

  const travel = press.interpolate({
    inputRange: [0, 1],
    outputRange: [0, slab ? LIFT : 0],
  });
  const squash = press.interpolate({
    inputRange: [0, 1],
    outputRange: [1, slab ? 1 : 0.97],
  });

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      onPress={onPress}
      {...handlers}
      disabled={disabled}
      style={[
        styles.wrap,
        slab && styles.wrapSlab,
        // Reserved regardless of `disabled`, so the button can't resize the
        // moment it becomes enabled.
        slab && { paddingRight: LIFT, paddingBottom: LIFT },
        style,
      ]}>
      {slab ? <View style={styles.shadowBlock} /> : null}

      <Animated.View
        style={[
          styles.face,
          styles[variant],
          slab && styles.faceSlab,
          // The glow would read as "still active" on a dimmed button.
          // The slab already has physical depth from its shadow block; a glow
          // on top of it reads as two competing treatments.
          variant === 'accent' && !slab && !disabled && styles.glow,
          variant === 'ink' && !disabled && styles.dropShadow,
          // A distinct off state, not a faded on state.
          disabled && styles.faceDisabled,
          {
            transform: [
              { translateX: travel },
              { translateY: travel },
              { scale: squash },
            ],
          },
        ]}>
        <Text
          style={[
            styles.label,
            variant === 'accent' && styles.labelOnAccent,
            variant === 'ink' && styles.labelOnInk,
            variant === 'outlineOnAccent' && styles.labelOnAccent,
            variant === 'quiet' && styles.labelQuiet,
            variant === 'danger' && styles.labelDanger,
            slab && styles.labelSlab,
            disabled && styles.labelDisabled,
          ]}>
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'relative' },
  wrapSlab: { flex: 1 },
  shadowBlock: {
    position: 'absolute',
    left: LIFT,
    top: LIFT,
    right: 0,
    bottom: 0,
    borderRadius: radius.lg,
    backgroundColor: colors.accentDeep,
  },
  face: {
    minHeight: TAP_TARGET,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  faceSlab: { flex: 1, borderRadius: radius.lg },

  accent: { backgroundColor: colors.accent },
  ink: { backgroundColor: colors.ink },
  outlineOnAccent: { borderWidth: 2, borderColor: colors.white },
  quiet: {},
  danger: {},

  faceDisabled: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.hairline,
  },

  /** Tight, close to the edge — a halo, not a drop shadow. */
  glow: {
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
  },
  dropShadow: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.24,
    shadowRadius: 10,
  },

  label: { ...type.action, color: colors.white },
  labelOnAccent: { color: colors.white },
  labelOnInk: { color: colors.white },
  labelQuiet: { ...type.tag, color: colors.mutedOnDark },
  labelDanger: { ...type.tag, color: colors.danger },
  labelSlab: { fontSize: 34, fontWeight: '900', letterSpacing: -1 },
  labelDisabled: { color: colors.faintOnDark },
});
