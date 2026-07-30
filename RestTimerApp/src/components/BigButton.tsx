import React from 'react';
import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
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

export function BigButton({
  label,
  a11yLabel,
  onPress,
  variant = 'lime',
  slab = false,
  disabled = false,
  style,
}: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={a11yLabel ?? label}
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
          variant === 'lime' && styles.labelOnLime,
          variant === 'ink' && styles.labelOnInk,
          variant === 'outlineOnLime' && styles.labelOnLime,
          variant === 'quiet' && styles.labelQuiet,
          variant === 'bail' && styles.labelBail,
          slab && styles.labelSlab,
        ]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: TAP_TARGET,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  slab: { flex: 1, borderRadius: radius.lg },
  lime: { backgroundColor: colors.lime },
  ink: { backgroundColor: colors.ink },
  outlineOnLime: {
    borderWidth: 2,
    borderColor: colors.ink,
    backgroundColor: 'transparent',
  },
  quiet: { backgroundColor: 'transparent' },
  bail: { backgroundColor: 'transparent' },
  // Squash on press — the whole UI should feel physical.
  pressed: { opacity: 0.85, transform: [{ scale: 0.975 }] },
  disabled: { opacity: 0.3 },

  label: { ...type.action, color: colors.white },
  labelOnLime: { color: colors.ink },
  labelOnInk: { color: colors.lime },
  labelQuiet: { ...type.tag, color: colors.mutedOnDark },
  labelBail: { ...type.tag, color: colors.bail },
  labelSlab: { fontSize: 40, fontWeight: '900', letterSpacing: -1.2 },
});
