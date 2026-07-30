import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { BigButton } from '../components/BigButton';
import { ProgressRing } from '../components/ProgressRing';
import { SetTicks } from '../components/SetTicks';
import { StatusTag } from '../components/StatusTag';
import { useCountdown } from '../hooks/useCountdown';
import { useEnter } from '../hooks/useEnter';
import { useReduceMotion } from '../hooks/useReduceMotion';
import { useWorkout } from '../state/WorkoutContext';
import { colors, formatMMSS, spacing, tabular, type } from '../theme';

/** Under this many seconds left, the clock starts ticking visibly. */
const URGENT_AT = 5;

/** The one flooded screen: your apps are open, and you can see that from across the room. */
export function RestingScreen() {
  const {
    state: { config, currentSet, setsCompleted, restEndsAt },
    endRest,
  } = useWorkout();

  // endRest is also what the countdown calls at zero — the reducer ignores it
  // if we're no longer resting, so a late tick can't skip a set.
  const secondsLeft = useCountdown(restEndsAt, endRest);
  const enter = useEnter();
  const beat = useHeartbeat(secondsLeft);

  return (
    <View style={styles.screen}>
      <StatusTag selectedAppIds={config.selectedAppIds} onLime />

      <Animated.View style={[styles.head, enter]}>
        <Text style={styles.title}>scroll time</Text>
        <Text style={styles.sub}>go be delulu for a sec</Text>
      </Animated.View>

      <View style={styles.dial}>
        <ProgressRing
          progress={secondsLeft / config.restSeconds}
          color={colors.ink}
          trackColor="rgba(11,11,15,0.15)">
          <Animated.Text style={[styles.clock, { transform: [{ scale: beat }] }]}>
            {formatMMSS(secondsLeft)}
          </Animated.Text>
          <Text style={styles.until}>
            {secondsLeft <= URGENT_AT ? 'LOCKING UP' : 'TILL IT LOCKS'}
          </Text>
        </ProgressRing>
      </View>

      <View style={styles.foot}>
        <SetTicks
          total={config.totalSets}
          completed={setsCompleted}
          current={currentSet + 1}
          onLime
        />
        <BigButton
          label="back to it"
          a11yLabel="Skip Rest"
          onPress={endRest}
          variant="outlineOnLime"
        />
      </View>
    </View>
  );
}

/**
 * One pulse per second over the last few seconds of rest.
 *
 * Driven off the second changing rather than a looping animation, so it can't
 * outlive the screen and it lines up exactly with the digits.
 */
function useHeartbeat(secondsLeft: number) {
  const reduceMotion = useReduceMotion();
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (reduceMotion || secondsLeft > URGENT_AT || secondsLeft <= 0) {
      return;
    }
    scale.setValue(1.14);
    const animation = Animated.spring(scale, {
      toValue: 1,
      speed: 12,
      bounciness: 10,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [secondsLeft, scale, reduceMotion]);

  return scale;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    gap: spacing.md,
  },
  head: { paddingTop: spacing.sm },
  title: { ...type.display, fontSize: 50, color: colors.ink },
  sub: { ...type.body, color: colors.mutedOnLime },
  dial: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  clock: { ...type.mega, ...tabular, fontSize: 80, color: colors.ink },
  until: { ...type.tag, color: colors.mutedOnLime, marginTop: spacing.xs },
  foot: { gap: spacing.md },
});
