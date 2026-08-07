import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { BrandIcon } from './BrandIcon';
import { Icon } from './Icon';
import { usePressScale } from '../hooks/usePressScale';
import { useReduceMotion } from '../hooks/useReduceMotion';
import {
  HAIRLINE,
  legibleOn,
  radius,
  spacing,
  themed,
  type,
  useColors,
} from '../theme';
import type { BlockableApp } from '../state/types';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * One app, on or off.
 *
 * Shared by the exercise cards and the Settings list, which want the same
 * pill for different jobs — an exercise's own picks versus the selection that
 * seeds new exercises. Only the label and the optional remove control differ,
 * so they differ as props rather than as a second copy of the component.
 */
export function AppPill({
  app,
  checked,
  /** What a screen reader announces. The two call sites mean different things. */
  label,
  onPress,
  /** Custom apps only: shows a × that deletes the app everywhere. */
  onRemove,
}: {
  app: BlockableApp;
  checked: boolean;
  label: string;
  onPress: () => void;
  onRemove?: () => void;
}) {
  const styles = useStyles();
  const colors = useColors();
  // The brand colours were picked to read on a near-black pill. On a near-white
  // one TikTok's lands at 1.67:1 — a logo you cannot see. `legibleOn` keeps the
  // hue and walks the channels down until it clears; on the dark theme nothing
  // needs moving and it returns the colour untouched.
  const tint = legibleOn(app.tint, colors.raised);
  const reduceMotion = useReduceMotion();
  const pressScale = usePressScale({ depth: 0.94, haptic: true });
  const pop = useRef(new Animated.Value(1)).current;
  const first = useRef(true);

  // Springs when you toggle it, so picking your apps has some snap to it.
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (reduceMotion) {
      return;
    }
    pop.setValue(checked ? 0.88 : 1.06);
    const animation = Animated.spring(pop, {
      toValue: 1,
      speed: 18,
      bounciness: 16,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [checked, pop, reduceMotion]);

  return (
    <Animated.View style={[{ transform: [{ scale: pop }] }, pressScale.style]}>
      <Pressable
        {...pressScale.handlers}
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
        // react-native-web doesn't derive aria-checked from accessibilityState.
        aria-checked={checked}
        accessibilityLabel={label}
        onPress={onPress}
        style={[styles.app, checked && styles.appOn]}
      >
        {app.brand ? (
          <BrandIcon
            id={app.brand}
            // Full brand colour when it's going to be blocked, drained when not.
            color={checked ? tint : colors.faint}
            hole={checked ? colors.raised : colors.surface}
          />
        ) : (
          // Apps added by hand have no logo to draw.
          <View
            style={[
              styles.monogram,
              { borderColor: checked ? tint : colors.hairline },
            ]}
          >
            <Text
              style={[
                styles.monogramText,
                { color: checked ? tint : colors.faint },
              ]}
            >
              {app.name.slice(0, 1).toUpperCase()}
            </Text>
          </View>
        )}

        <Text style={[styles.appName, checked && styles.appNameOn]}>
          {app.name}
        </Text>

        {/* A tick, not just a border colour. On a wrapped grid of five, "which
            of these is on" has to be answerable without comparing outlines. */}
        <View style={[styles.mark, checked && styles.markOn]}>
          {checked ? (
            <Icon
              name="check"
              color={colors.textOnAccent}
              size={11}
              strokeWidth={2.6}
            />
          ) : null}
        </View>

        {onRemove ? <RemoveMark name={app.name} onPress={onRemove} /> : null}
      </Pressable>
    </Animated.View>
  );
}

/** The one tappable in the app that had no press feel of its own. */
function RemoveMark({ name, onPress }: { name: string; onPress: () => void }) {
  const styles = useStyles();
  const press = usePressScale({ depth: 0.82, haptic: true });

  return (
    <AnimatedPressable
      {...press.handlers}
      accessibilityRole="button"
      accessibilityLabel={`Remove ${name}`}
      onPress={onPress}
      hitSlop={8}
      style={[styles.remove, press.style]}
    >
      <Text style={styles.removeMark}>×</Text>
    </AnimatedPressable>
  );
}

const useStyles = themed(colors =>
  StyleSheet.create({
    app: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      borderRadius: radius.pill,
      backgroundColor: colors.surface,
      borderWidth: HAIRLINE,
      borderColor: colors.hairline,
    },
    appOn: { backgroundColor: colors.raised, borderColor: colors.accent },
    appName: { ...type.body, fontWeight: '600', color: colors.faint },
    appNameOn: { color: colors.white },
    monogram: {
      width: 20,
      height: 20,
      borderRadius: radius.sm,
      borderWidth: 1.5,
      alignItems: 'center',
      justifyContent: 'center',
    },
    monogramText: { fontSize: 11, fontWeight: '800' },
    mark: {
      width: 18,
      height: 18,
      borderRadius: 9,
      borderWidth: 1.5,
      borderColor: colors.hairline,
      alignItems: 'center',
      justifyContent: 'center',
    },
    markOn: { backgroundColor: colors.accent, borderColor: colors.accent },
    remove: { paddingLeft: spacing.xs },
    removeMark: { fontSize: 20, lineHeight: 22, color: colors.faint },
  }),
);
