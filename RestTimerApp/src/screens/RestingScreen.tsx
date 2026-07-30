import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BigButton } from '../components/BigButton';
import { ProgressRing } from '../components/ProgressRing';
import { SetTicks } from '../components/SetTicks';
import { StatusTag } from '../components/StatusTag';
import { useCountdown } from '../hooks/useCountdown';
import { useWorkout } from '../state/WorkoutContext';
import { colors, formatMMSS, spacing, tabular, type } from '../theme';

/** The one flooded screen: your apps are open, and you can see that from across the room. */
export function RestingScreen() {
  const {
    state: { config, currentSet, setsCompleted, restEndsAt },
    endRest,
  } = useWorkout();

  // endRest is also what the countdown calls at zero — the reducer ignores it
  // if we're no longer resting, so a late tick can't skip a set.
  const secondsLeft = useCountdown(restEndsAt, endRest);

  return (
    <View style={styles.screen}>
      <StatusTag selectedAppIds={config.selectedAppIds} onLime />

      <View style={styles.head}>
        <Text style={styles.title}>scroll time</Text>
        <Text style={styles.sub}>go be delulu for a sec</Text>
      </View>

      <View style={styles.dial}>
        <ProgressRing
          progress={secondsLeft / config.restSeconds}
          color={colors.ink}
          trackColor="rgba(11,11,15,0.15)">
          <Text style={styles.clock}>{formatMMSS(secondsLeft)}</Text>
          <Text style={styles.until}>TILL IT LOCKS</Text>
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
