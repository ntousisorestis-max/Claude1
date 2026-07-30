import React from 'react';
import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { colors, HAIRLINE, radius, spacing, TAP_TARGET, type } from '../theme';

type Variant = 'chalk' | 'outline' | 'quiet' | 'quit';

type Props = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  /** Fills the available space — the mid-workout "Done with Set" slab. */
  slab?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
};

/**
 * Actions are chalk, never coloured — hue in this app is reserved for lock
 * state, so a green button would read as "unlocked" at a glance.
 */
export function BigButton({
  label,
  onPress,
  variant = 'chalk',
  slab = false,
  disabled = false,
  style,
}: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        slab && styles.slab,
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}>
      <Text
        style={[
          styles.label,
          variant === 'chalk' && styles.labelChalk,
          variant === 'quiet' && styles.labelQuiet,
          variant === 'quit' && styles.labelQuit,
          slab && styles.labelSlab,
        ]}>
        {slab ? label.toUpperCase() : label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: TAP_TARGET,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  slab: { flex: 1, borderRadius: radius.lg },
  chalk: { backgroundColor: colors.chalk },
  outline: {
    borderWidth: HAIRLINE,
    borderColor: colors.hairline,
    backgroundColor: colors.surface,
  },
  quiet: { backgroundColor: 'transparent' },
  quit: { backgroundColor: 'transparent' },
  pressed: { opacity: 0.6 },
  disabled: { opacity: 0.25 },

  label: { ...type.action, color: colors.chalk },
  labelChalk: { color: colors.bg },
  labelQuiet: { ...type.label, color: colors.muted },
  labelQuit: { ...type.label, color: colors.quit },
  labelSlab: { fontSize: 30, fontWeight: '700', letterSpacing: 1.5 },
});
