import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, tabular, type } from '../theme';

/** Quick-select pills. The chosen one goes solid lime. */
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
      {options.map(option => {
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
  row: { flexDirection: 'row', gap: 8 },
  cell: {
    flex: 1,
    height: 50,
    borderRadius: radius.pill,
    backgroundColor: colors.raised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selected: { backgroundColor: colors.lime },
  pressed: { opacity: 0.85, transform: [{ scale: 0.97 }] },
  text: { ...type.body, ...tabular, fontWeight: '600', color: colors.mutedOnDark },
  textSelected: { color: colors.ink, fontWeight: '800' },
});
