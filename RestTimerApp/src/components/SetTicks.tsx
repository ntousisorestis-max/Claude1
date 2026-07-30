import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../theme';

/**
 * One tick per set, filled as they're banked — the workout read at a glance,
 * without counting words. Chalk for done, hairline for remaining; the tick you
 * are on is half-height so "doing" is distinct from "done".
 */
export function SetTicks({
  total,
  completed,
  current,
}: {
  total: number;
  completed: number;
  current: number;
}) {
  return (
    <View
      style={styles.row}
      accessibilityRole="progressbar"
      accessibilityLabel={`${completed} of ${total} sets complete`}>
      {Array.from({ length: total }, (_, i) => {
        const index = i + 1;
        const done = index <= completed;
        const active = !done && index === current;
        return (
          <View
            key={index}
            style={[styles.tick, done && styles.done, active && styles.active]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 5, alignItems: 'flex-end', height: 12 },
  tick: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.hairline,
  },
  done: { height: 12, backgroundColor: colors.chalk },
  active: { height: 7, backgroundColor: colors.muted },
});
