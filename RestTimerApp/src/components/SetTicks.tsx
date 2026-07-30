import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useReduceMotion } from '../hooks/useReduceMotion';
import { colors, radius } from '../theme';

/**
 * One chunky block per set, filled as they're banked.
 *
 * The tick you just earned springs up as it fills — the only reward the app
 * gives for finishing a set, so it's worth the frame.
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
  const reduceMotion = useReduceMotion();
  const pop = useRef(new Animated.Value(1)).current;
  const justBanked = useRef(completed);

  useEffect(() => {
    if (completed === justBanked.current) {
      return;
    }
    justBanked.current = completed;
    if (reduceMotion || completed === 0) {
      pop.setValue(1);
      return;
    }
    pop.setValue(0);
    const animation = Animated.spring(pop, {
      toValue: 1,
      speed: 14,
      bounciness: 14,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [completed, pop, reduceMotion]);

  return (
    <View
      style={styles.row}
      accessibilityRole="progressbar"
      accessibilityLabel={`${completed} of ${total} sets complete`}>
      {Array.from({ length: total }, (_, i) => {
        const index = i + 1;
        const done = index <= completed;
        const active = !done && index === current;
        const newest = index === completed;

        return (
          <Animated.View
            key={index}
            style={[
              styles.tick,
              onLime ? styles.emptyOnLime : styles.emptyOnInk,
              done && (onLime ? styles.doneOnLime : styles.doneOnInk),
              active && (onLime ? styles.activeOnLime : styles.activeOnInk),
              newest && {
                transform: [
                  {
                    scaleY: pop.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.35, 1],
                    }),
                  },
                ],
              },
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
