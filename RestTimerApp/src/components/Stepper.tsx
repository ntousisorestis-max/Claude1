import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, tabular, TAP_TARGET, type } from '../theme';

type Props = {
  label: string;
  value: number;
  onChange: (next: number) => void;
  step?: number;
  min?: number;
  max?: number;
  unit?: string;
};

/**
 * Borderless: the number carries the weight, the controls sit either side of
 * it. Boxing every field is what made the old setup screen read as busy.
 */
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
    <View style={styles.row}>
      <StepKey
        symbol="−"
        accessibilityLabel={`Decrease ${label}`}
        onPress={() => onChange(value - step)}
        disabled={value <= min}
      />
      <View style={styles.value}>
        <Text style={styles.number}>{value}</Text>
        {unit ? <Text style={styles.unit}>{unit}</Text> : null}
      </View>
      <StepKey
        symbol="+"
        accessibilityLabel={`Increase ${label}`}
        onPress={() => onChange(value + step)}
        disabled={value >= max}
      />
    </View>
  );
}

function StepKey({
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
        styles.key,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}>
      <Text style={styles.symbol}>{symbol}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  key: {
    width: TAP_TARGET,
    height: TAP_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
  },
  symbol: { fontSize: 30, fontWeight: '400', color: colors.muted },
  pressed: { opacity: 0.5 },
  disabled: { opacity: 0.2 },
  value: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: 6,
  },
  number: {
    ...tabular,
    fontSize: 44,
    fontWeight: '700',
    letterSpacing: -1.5,
    color: colors.chalk,
  },
  unit: { ...type.label, color: colors.faint },
});
