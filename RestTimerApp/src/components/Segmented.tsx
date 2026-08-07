import React from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { usePressScale } from '../hooks/usePressScale';
import { radius, tabular, themed, type } from '../theme';

/**
 * Quick-select pills. The chosen one goes solid accent.
 *
 * Generic over what is being picked. It started as a rest-time picker and was
 * hardcoded to numbers; the theme choice is three strings and wants exactly the
 * same control, and one row of pills that works for both beats two that drift
 * apart.
 */
export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  format,
  label,
}: {
  options: readonly T[];
  value: T;
  onChange: (next: T) => void;
  format: (option: T) => string;
  label: string;
}) {
  const styles = useStyles();
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

function Cell<T extends string | number>({
  option,
  selected,
  label,
  format,
  onChange,
}: {
  option: T;
  selected: boolean;
  label: string;
  format: (option: T) => string;
  onChange: (next: T) => void;
}) {
  const styles = useStyles();
  const pressScale = usePressScale({ depth: 0.94, haptic: true });

  return (
    <Animated.View style={[styles.cellWrap, pressScale.style]}>
      <Pressable
        {...pressScale.handlers}
        accessibilityRole="button"
        accessibilityState={{ selected }}
        accessibilityLabel={`${label} ${format(option)}`}
        onPress={() => onChange(option)}
        style={[styles.cell, selected && styles.selected]}
      >
        <Text style={[styles.text, selected && styles.textSelected]}>
          {format(option)}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const useStyles = themed(colors =>
  StyleSheet.create({
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
    text: { ...type.body, ...tabular, fontWeight: '600', color: colors.muted },
    textSelected: { color: colors.textOnAccent, fontWeight: '800' },
  }),
);
