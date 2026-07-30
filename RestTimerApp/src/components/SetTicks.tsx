import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, radius } from '../theme';

/**
 * One chunky block per set, filled as they're banked. The whole workout at a
 * glance, no counting words.
 */
export function SetTicks({
  total,
  completed,
  current,
  onLime = false,
}: {
  total: number;
  completed: number;
  current: number;
  onLime?: boolean;
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
            style={[
              styles.tick,
              onLime ? styles.emptyOnLime : styles.emptyOnInk,
              done && (onLime ? styles.doneOnLime : styles.doneOnInk),
              active && (onLime ? styles.activeOnLime : styles.activeOnInk),
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 6 },
  tick: { flex: 1, height: 10, borderRadius: radius.pill },
  emptyOnInk: { backgroundColor: colors.inkLine },
  emptyOnLime: { backgroundColor: 'rgba(11,11,15,0.16)' },
  doneOnInk: { backgroundColor: colors.lime },
  doneOnLime: { backgroundColor: colors.ink },
  activeOnInk: { backgroundColor: colors.limeDim },
  activeOnLime: { backgroundColor: 'rgba(11,11,15,0.5)' },
});
