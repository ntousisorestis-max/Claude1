import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, TAP_TARGET } from '../theme';

type Props = {
  label: string;
  value: number;
  onChange: (next: number) => void;
  step?: number;
  min?: number;
  max?: number;
  /** Rendered next to the number, e.g. "sets" or "s". */
  unit?: string;
};

export function Stepper({
  label,
  value,
  onChange,
  step = 1,
  min = 0,
  max = Number.MAX_SAFE_INTEGER,
  unit,
}: Props) {
  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        <StepButton
          symbol="−"
          accessibilityLabel={`Decrease ${label}`}
          onPress={() => onChange(value - step)}
          disabled={value <= min}
        />
        <View style={styles.valueBox}>
          <Text style={styles.value}>{value}</Text>
          {unit ? <Text style={styles.unit}>{unit}</Text> : null}
        </View>
        <StepButton
          symbol="+"
          accessibilityLabel={`Increase ${label}`}
          onPress={() => onChange(value + step)}
          disabled={value >= max}
        />
      </View>
    </View>
  );
}

function StepButton({
  symbol,
  onPress,
  disabled,
  accessibilityLabel,
}: {
  symbol: string;
  onPress: () => void;
  disabled: boolean;
  accessibilityLabel: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.stepButton,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}>
      <Text style={styles.stepSymbol}>{symbol}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  label: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  stepButton: {
    width: TAP_TARGET,
    height: TAP_TARGET,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepSymbol: { color: colors.text, fontSize: 28, fontWeight: '800' },
  pressed: { opacity: 0.6 },
  disabled: { opacity: 0.3 },
  valueBox: {
    flex: 1,
    height: TAP_TARGET,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  value: { color: colors.text, fontSize: 26, fontWeight: '800' },
  unit: { color: colors.textMuted, fontSize: 15, fontWeight: '600' },
});
