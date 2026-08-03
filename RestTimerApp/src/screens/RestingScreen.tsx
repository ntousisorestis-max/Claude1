import React, { useEffect, useRef } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { BigButton } from '../components/BigButton';
import { LockStatus } from '../components/LockStatus';
import { ProgressRing } from '../components/ProgressRing';
import { SetTicks } from '../components/SetTicks';
import { useCountdown } from '../hooks/useCountdown';
import { useEnter } from '../hooks/useEnter';
import { useReduceMotion } from '../hooks/useReduceMotion';
import { pick, randomSeed, REST_LINES } from '../copy';
import { useWorkout } from '../state/WorkoutContext';
import { colors, formatMMSS, spacing, tabular, type, sized } from '../theme';

/** Under this many seconds left, the clock starts ticking visibly. */
const URGENT_AT = 5;

/** Biggest the ring is allowed to get, however wide the phone is. */
const MAX_RING = 320;

/** The flooded screen: your apps are open, and you can see that across the room. */
export function RestingScreen() {
  const {
    state: { config, currentSet, setsCompleted, restEndsAt },
    endRest,
  } = useWorkout();

  // endRest is also what the countdown calls at zero — the reducer ignores it
  // if we're no longer resting, so a late tick can't skip a set.
  const secondsLeft = useCountdown(restEndsAt, endRest);
  const enter = useEnter();
  const enterRing = useEnter(70);
  const beat = useHeartbeat(secondsLeft);
  const { width } = useWindowDimensions();

  const line = useRestLine(restEndsAt);

  const nextSet = currentSet + 1;
  const ring = Math.min(MAX_RING, width - spacing.lg * 2);

  return (
    <View style={styles.screen}>
      <LockStatus
        selectedAppIds={config.selectedAppIds}
        caption={`Locking again in ${formatMMSS(secondsLeft)}`}
        onAccent
      />

      <Animated.View style={[styles.head, enter]}>
        <Text style={styles.title}>Scroll away.</Text>
      </Animated.View>

      {/* The ring is the screen. Everything else is a caption to it. */}
      <Animated.View style={[styles.dial, enterRing]}>
        <ProgressRing
          progress={secondsLeft / config.restSeconds}
          size={ring}
          strokeWidth={18}
          // The last second, so the ring releases into the re-lock instead of
          // being cut off by it.
          finishing={secondsLeft <= 1}
          color={colors.white}
          trackColor="rgba(255,255,255,0.22)">
          <Animated.Text style={[styles.clock, { transform: [{ scale: beat }] }]}>
            {formatMMSS(secondsLeft)}
          </Animated.Text>
          <Text style={styles.until}>
            {secondsLeft <= URGENT_AT ? 'LOCKING NOW' : 'REST REMAINING'}
          </Text>
        </ProgressRing>

        <Text style={styles.line}>{line}</Text>
      </Animated.View>

      <View style={styles.foot}>
        <Text style={styles.next}>
          Up next: set {nextSet} of {config.totalSets}
        </Text>
        <SetTicks
          total={config.totalSets}
          completed={setsCompleted}
          current={nextSet}
          onAccent
        />
        <BigButton
          label="Skip rest"
          onPress={endRest}
          variant="outlineOnAccent"
        />
      </View>
    </View>
  );
}

/**
 * One line per rest period, held steady while the clock runs down.
 *
 * Re-picking on every render would flicker through the whole pool four times a
 * second, so it's keyed to the rest period's end time: a new rest, a new line.
 * Stored in a ref rather than state because nothing needs to re-render when it
 * changes — the render that changes it is already happening.
 */
function useRestLine(restEndsAt: number | null): string {
  const chosen = useRef<{ key: number | null; line: string }>({
    key: null,
    line: '',
  });

  if (chosen.current.key !== restEndsAt) {
    chosen.current = { key: restEndsAt, line: pick(REST_LINES, randomSeed()) };
  }
  return chosen.current.line;
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
  // Smaller than it was: the ring outranks it now.
  title: { ...sized(type.display, 34), color: colors.white },
  dial: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.lg },
  clock: { ...sized(type.mega, 84), ...tabular, color: colors.white },
  until: { ...type.tag, color: colors.mutedOnAccent, marginTop: spacing.xs },
  line: {
    ...type.body,
    fontSize: 17,
    fontWeight: '600',
    color: colors.mutedOnAccent,
    textAlign: 'center',
  },
  foot: { gap: spacing.sm },
  next: { ...type.body, fontWeight: '700', color: colors.white },
});
