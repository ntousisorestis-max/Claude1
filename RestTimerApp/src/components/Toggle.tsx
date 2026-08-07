import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { usePressScale } from '../hooks/usePressScale';
import { useReduceMotion } from '../hooks/useReduceMotion';
import { radius, spacing, themed, type } from '../theme';

/**
 * A labelled on/off row.
 *
 * Hand-built rather than RN's `Switch`, whose track and thumb colours are only
 * partly themeable across iOS, Android and web — this one looks the same
 * everywhere and matches the app's pills.
 *
 * The whole row is the target, not just the switch, so it can be hit without
 * aiming.
 */
export function Toggle({
  label,
  help,
  value,
  onChange,
}: {
  label: string;
  help?: string;
  value: boolean;
  onChange: (next: boolean) => void;
}) {
  const styles = useStyles();
  // Flipping a setting is worth a tick; it's the only feedback that it took.
  const pressScale = usePressScale({ depth: 0.98, haptic: true });
  const reduceMotion = useReduceMotion();
  // The thumb used to jump between two static positions. It now travels, which
  // is the difference between a checkbox and a switch.
  const slide = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    const target = value ? 1 : 0;
    if (reduceMotion) {
      slide.setValue(target);
      return;
    }
    const animation = Animated.spring(slide, {
      toValue: target,
      speed: 16,
      bounciness: 8,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [value, slide, reduceMotion]);

  return (
    <Pressable
      {...pressScale.handlers}
      accessibilityRole="switch"
      // Both, deliberately: `accessibilityState` is what native reads, and
      // react-native-web does not derive `aria-checked` from it, so a screen
      // reader in a browser would never hear the on/off state.
      accessibilityState={{ checked: value }}
      aria-checked={value}
      accessibilityLabel={label}
      onPress={() => onChange(!value)}
      style={styles.row}
    >
      <View style={styles.text}>
        <Text style={styles.label}>{label}</Text>
        {help ? <Text style={styles.help}>{help}</Text> : null}
      </View>

      <Animated.View
        style={[styles.track, value && styles.trackOn, pressScale.style]}
      >
        <Animated.View
          style={[
            styles.thumb,
            value && styles.thumbOn,
            {
              transform: [
                {
                  translateX: slide.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, TRACK_W - THUMB - 6],
                  }),
                },
              ],
            },
          ]}
        />
      </Animated.View>
    </Pressable>
  );
}

const TRACK_W = 52;
const TRACK_H = 30;
const THUMB = 24;

const useStyles = themed(colors =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.md,
      minHeight: 44,
    },
    text: { flex: 1, gap: 2 },
    label: { ...type.body, fontWeight: '600', color: colors.white },
    help: { ...type.helper, fontSize: 13, color: colors.muted },

    track: {
      width: TRACK_W,
      height: TRACK_H,
      borderRadius: radius.pill,
      backgroundColor: colors.raised,
      borderWidth: 1,
      borderColor: colors.hairline,
      padding: 2,
      justifyContent: 'center',
    },
    trackOn: { backgroundColor: colors.accent, borderColor: colors.accent },
    thumb: {
      width: THUMB,
      height: THUMB,
      borderRadius: THUMB / 2,
      backgroundColor: colors.faint,
    },
    /** Position is animated above; this is only the colour change. */
    thumbOn: { backgroundColor: colors.textOnAccent },
  }),
);
