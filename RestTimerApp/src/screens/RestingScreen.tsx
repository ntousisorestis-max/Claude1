import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BigButton } from '../components/BigButton';
import { LockIndicator } from '../components/LockIndicator';
import { ProgressRing } from '../components/ProgressRing';
import { useCountdown } from '../hooks/useCountdown';
import { useWorkout } from '../state/WorkoutContext';
import { colors, formatMMSS, spacing } from '../theme';

export function RestingScreen() {
  const {
    state: { config, currentSet, restEndsAt },
    endRest,
  } = useWorkout();

  // endRest is also what the countdown calls at zero — the reducer ignores it
  // if we're no longer resting, so a late tick can't skip a set.
  const secondsLeft = useCountdown(restEndsAt, endRest);
  const progress = secondsLeft / config.restSeconds;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <LockIndicator selectedAppIds={config.selectedAppIds} />
        <Text style={styles.title}>Rest — scroll away 📱</Text>
        <Text style={styles.subtitle}>
          Set {currentSet} of {config.totalSets} done
        </Text>
      </View>

      <View style={styles.ringWrap}>
        <ProgressRing progress={progress}>
          <Text style={styles.time}>{formatMMSS(secondsLeft)}</Text>
          <Text style={styles.until}>until lock</Text>
        </ProgressRing>
      </View>

      <BigButton label="Skip Rest" onPress={endRest} variant="secondary" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    gap: spacing.lg,
    justifyContent: 'space-between',
  },
  header: { alignItems: 'center', gap: spacing.sm, paddingTop: spacing.lg },
  title: { color: colors.text, fontSize: 28, fontWeight: '900' },
  subtitle: { color: colors.textMuted, fontSize: 17, fontWeight: '600' },
  ringWrap: { alignItems: 'center', justifyContent: 'center' },
  time: {
    color: colors.text,
    fontSize: 64,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  until: { color: colors.textMuted, fontSize: 15, fontWeight: '600' },
});
