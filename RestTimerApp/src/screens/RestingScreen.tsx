import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BigButton } from '../components/BigButton';
import { ProgressRing } from '../components/ProgressRing';
import { SetTicks } from '../components/SetTicks';
import { StatusRail } from '../components/StatusRail';
import { useCountdown } from '../hooks/useCountdown';
import { useWorkout } from '../state/WorkoutContext';
import { colors, formatMMSS, spacing, tabular, type } from '../theme';

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
      <StatusRail selectedAppIds={config.selectedAppIds} />

      <View style={styles.head}>
        <Text style={styles.title}>Rest</Text>
        <Text style={styles.sub}>Scroll away.</Text>
      </View>

      <View style={styles.dial}>
        <ProgressRing progress={secondsLeft / config.restSeconds}>
          <Text style={styles.clock}>{formatMMSS(secondsLeft)}</Text>
          <Text style={styles.until}>UNTIL LOCK</Text>
        </ProgressRing>
      </View>

      <View style={styles.foot}>
        <SetTicks
          total={config.totalSets}
          completed={setsCompleted}
          current={currentSet + 1}
        />
        <BigButton label="Skip Rest" onPress={endRest} variant="outline" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.md,
  },
  head: { gap: 2, paddingTop: spacing.md },
  title: { ...type.title, fontSize: 32, color: colors.chalk },
  sub: { ...type.body, color: colors.muted },
  dial: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  clock: {
    ...type.display,
    ...tabular,
    fontSize: 76,
    color: colors.chalk,
  },
  until: { ...type.label, color: colors.faint, marginTop: spacing.xs },
  foot: { gap: spacing.md },
});
