import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, tabular, TAP_TARGET, type } from '../theme';

type Props = {
  label: string;
  value: number;
  onChange: (next: number) => void;
  step?: number;
  min?: number;
  max?: number;
  unit?: string;
};

/** Round keys either side of an oversized numeral. The number is the graphic. */
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
      <Key
        symbol="−"
        accessibilityLabel={`Decrease ${label}`}
        onPress={() => onChange(value - step)}
        disabled={value <= min}
      />
      <View style={styles.value}>
        <Text style={styles.number}>{value}</Text>
        {unit ? <Text style={styles.unit}>{unit}</Text> : null}
      </View>
      <Key
        symbol="+"
        accessibilityLabel={`Increase ${label}`}
        onPress={() => onChange(value + step)}
        disabled={value >= max}
      />
    </View>
  );
}

function Key({
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
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  key: {
    width: TAP_TARGET,
    height: TAP_TARGET,
    borderRadius: radius.pill,
    backgroundColor: colors.inkSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  symbol: { fontSize: 30, fontWeight: '700', color: colors.lime },
  pressed: { opacity: 0.8, transform: [{ scale: 0.96 }] },
  disabled: { opacity: 0.25 },
  value: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: 6,
  },
  number: {
    ...tabular,
    fontSize: 54,
    fontWeight: '900',
    letterSpacing: -2.5,
    color: colors.white,
  },
  unit: { ...type.tag, color: colors.faintOnDark },
});
