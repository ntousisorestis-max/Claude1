import React, { useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useReduceMotion } from '../hooks/useReduceMotion';
import { colors, radius, spacing, TAP_TARGET, type } from '../theme';

type Variant = 'lime' | 'ink' | 'outlineOnLime' | 'quiet' | 'bail';

type Props = {
  /** What's printed on the button. Shouty is fine. */
  label: string;
  /**
   * What a screen reader says, when the printed label is too punchy to be
   * clear on its own ("LOCK IN" -> "Start workout").
   */
  a11yLabel?: string;
  onPress: () => void;
  variant?: Variant;
  /** Fills the space — the mid-workout slab you hit without looking. */
  slab?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
};

/** How far the face sits above its shadow, in px. */
const LIFT = 6;
const LIFT_SLAB = 9;

/** Variants that are drawn as a solid extruded block. */
const EXTRUDED: Record<Variant, string | null> = {
  lime: '#7E9E00',
  ink: 'rgba(11,11,15,0.32)',
  outlineOnLime: null,
  quiet: null,
  bail: null,
};

/**
 * Extruded sticker button: a solid shadow block sits under the face, and
 * pressing drives the face down onto it. Release springs it back with a little
 * overshoot, so every tap feels like it actually did something.
 */
export function BigButton({
  label,
  a11yLabel,
  onPress,
  variant = 'lime',
  slab = false,
  disabled = false,
  style,
}: Props) {
  const reduceMotion = useReduceMotion();
  const press = useRef(new Animated.Value(0)).current;

  const lift = slab ? LIFT_SLAB : LIFT;
  const shadowColor = EXTRUDED[variant];
  // Independent of `disabled`: the extrusion reserves layout space, so
  // dropping it when disabled would resize the button the moment it enables.
  const extruded = shadowColor != null;

  const settle = (to: number) => {
    if (reduceMotion) {
      press.setValue(to);
      return;
    }
    Animated.spring(press, {
      toValue: to,
      // Snappy going down, a touch of bounce coming back up.
      speed: to === 1 ? 40 : 20,
      bounciness: to === 1 ? 0 : 10,
      useNativeDriver: true,
    }).start();
  };

  const travel = press.interpolate({
    inputRange: [0, 1],
    outputRange: [0, extruded ? lift : 0],
  });
  const squash = press.interpolate({
    inputRange: [0, 1],
    outputRange: [1, extruded ? 1 : 0.97],
  });

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={a11yLabel ?? label}
      accessibilityState={{ disabled }}
      onPress={onPress}
      onPressIn={() => settle(1)}
      onPressOut={() => settle(0)}
      disabled={disabled}
      style={[
        styles.wrap,
        slab && styles.wrapSlab,
        extruded && { paddingRight: lift, paddingBottom: lift },
        disabled && styles.disabled,
        style,
      ]}>
      {extruded ? (
        <View
          style={[
            styles.shadow,
            { left: lift, top: lift, backgroundColor: shadowColor },
            slab && styles.shadowSlab,
          ]}
        />
      ) : null}

      <Animated.View
        style={[
          styles.face,
          styles[variant],
          slab && styles.faceSlab,
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
            variant === 'lime' && styles.labelOnLime,
            variant === 'ink' && styles.labelOnInk,
            variant === 'outlineOnLime' && styles.labelOnLime,
            variant === 'quiet' && styles.labelQuiet,
            variant === 'bail' && styles.labelBail,
            slab && styles.labelSlab,
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
  disabled: { opacity: 0.3 },
  shadow: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    borderRadius: radius.pill,
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
  shadowSlab: { borderRadius: radius.lg },
  lime: { backgroundColor: colors.lime },
  ink: { backgroundColor: colors.ink },
  outlineOnLime: { borderWidth: 2, borderColor: colors.ink },
  quiet: {},
  bail: {},

  label: { ...type.action, color: colors.white },
  labelOnLime: { color: colors.ink },
  labelOnInk: { color: colors.lime },
  labelQuiet: { ...type.tag, color: colors.mutedOnDark },
  labelBail: { ...type.tag, color: colors.bail },
  labelSlab: { fontSize: 40, fontWeight: '900', letterSpacing: -1.2 },
});
