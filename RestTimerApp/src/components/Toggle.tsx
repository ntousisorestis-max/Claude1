import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, type } from '../theme';

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
  return (
    <Pressable
      accessibilityRole="switch"
      // Both, deliberately: `accessibilityState` is what native reads, and
      // react-native-web does not derive `aria-checked` from it, so a screen
      // reader in a browser would never hear the on/off state.
      accessibilityState={{ checked: value }}
      aria-checked={value}
      accessibilityLabel={label}
      onPress={() => onChange(!value)}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <View style={styles.text}>
        <Text style={styles.label}>{label}</Text>
        {help ? <Text style={styles.help}>{help}</Text> : null}
      </View>

      <View style={[styles.track, value && styles.trackOn]}>
        <View style={[styles.thumb, value && styles.thumbOn]} />
      </View>
    </Pressable>
  );
}

const TRACK_W = 52;
const TRACK_H = 30;
const THUMB = 24;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    minHeight: 44,
  },
  pressed: { opacity: 0.8 },
  text: { flex: 1, gap: 2 },
  label: { ...type.body, fontWeight: '600', color: colors.white },
  help: { ...type.helper, fontSize: 13, color: colors.mutedOnDark },

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
    backgroundColor: colors.faintOnDark,
  },
  thumbOn: {
    backgroundColor: colors.white,
    // Slides right by the track's free space.
    transform: [{ translateX: TRACK_W - THUMB - 6 }],
  },
});
