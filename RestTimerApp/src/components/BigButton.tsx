import React from 'react';
import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { colors, radius, spacing, TAP_TARGET } from '../theme';

type Props = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  /** Fills the available space — used for the mid-workout "Done with Set". */
  huge?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
};

export function BigButton({
  label,
  onPress,
  variant = 'primary',
  huge = false,
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
        huge && styles.huge,
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}>
      <Text
        style={[
          styles.label,
          variant === 'secondary' && styles.labelSecondary,
          variant === 'ghost' && styles.labelGhost,
          variant === 'danger' && styles.labelDanger,
          huge && styles.labelHuge,
        ]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: TAP_TARGET,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  huge: {
    flex: 1,
    borderRadius: radius.lg,
  },
  primary: { backgroundColor: colors.accent },
  secondary: { backgroundColor: colors.surfaceAlt },
  danger: { backgroundColor: 'transparent' },
  ghost: { backgroundColor: 'transparent' },
  pressed: { opacity: 0.7, transform: [{ scale: 0.99 }] },
  disabled: { opacity: 0.35 },
  label: {
    color: colors.bg,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  labelSecondary: { color: colors.text },
  labelGhost: { color: colors.textMuted, fontSize: 16, fontWeight: '600' },
  labelDanger: { color: colors.danger, fontSize: 16, fontWeight: '700' },
  labelHuge: { fontSize: 34, fontWeight: '900' },
});
