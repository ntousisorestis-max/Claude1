import React from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { usePressScale } from '../hooks/usePressScale';
import { colors, radius, tabular, type } from '../theme';

/** Quick-select pills. The chosen one goes solid accent. */
export function Segmented({
  options,
  value,
  onChange,
  format,
  label,
}: {
  options: number[];
  value: number;
  onChange: (next: number) => void;
  format: (n: number) => string;
  label: string;
}) {
  return (
    <View style={styles.row}>
      {options.map(option => (
        <Cell
          key={option}
          option={option}
          selected={option === value}
          label={label}
          format={format}
          onChange={onChange}
        />
      ))}
    </View>
  );
}

function Cell({
  option,
  selected,
  label,
  format,
  onChange,
}: {
  option: number;
  selected: boolean;
  label: string;
  format: (n: number) => string;
  onChange: (next: number) => void;
}) {
  const pressScale = usePressScale({ depth: 0.94, haptic: true });

  return (
    <Animated.View style={[styles.cellWrap, pressScale.style]}>
      <Pressable
        {...pressScale.handlers}
        accessibilityRole="button"
        accessibilityState={{ selected }}
        accessibilityLabel={`${label} ${format(option)}`}
        onPress={() => onChange(option)}
        style={[styles.cell, selected && styles.selected]}>
        <Text style={[styles.text, selected && styles.textSelected]}>
          {format(option)}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8 },
  cellWrap: { flex: 1 },
  cell: {
    flex: 1,
    height: 50,
    borderRadius: radius.pill,
    backgroundColor: colors.raised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selected: { backgroundColor: colors.accent },
  text: { ...type.body, ...tabular, fontWeight: '600', color: colors.mutedOnDark },
  textSelected: { color: colors.white, fontWeight: '800' },
});
