import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, HAIRLINE, radius, tabular, type } from '../theme';

/** Quick-select row. One hairline frame, one filled cell — no boxes-in-boxes. */
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
    <View style={styles.frame}>
      {options.map((option, i) => {
        const selected = option === value;
        return (
          <Pressable
            key={option}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={`${label} ${format(option)}`}
            onPress={() => onChange(option)}
            style={({ pressed }) => [
              styles.cell,
              i > 0 && styles.divided,
              selected && styles.selected,
              pressed && styles.pressed,
            ]}>
            <Text style={[styles.text, selected && styles.textSelected]}>
              {format(option)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    flexDirection: 'row',
    borderWidth: HAIRLINE,
    borderColor: colors.hairline,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  cell: { flex: 1, height: 46, alignItems: 'center', justifyContent: 'center' },
  divided: { borderLeftWidth: HAIRLINE, borderLeftColor: colors.hairline },
  selected: { backgroundColor: colors.surfaceAlt },
  pressed: { opacity: 0.6 },
  text: { ...type.body, ...tabular, color: colors.faint },
  textSelected: { color: colors.chalk, fontWeight: '700' },
});
