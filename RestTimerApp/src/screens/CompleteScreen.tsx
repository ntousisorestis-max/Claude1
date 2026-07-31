import React from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { BigButton } from '../components/BigButton';
import { SetTicks } from '../components/SetTicks';
import { useEnter } from '../hooks/useEnter';
import { useWorkout } from '../state/WorkoutContext';
import { colors, formatMMSS, radius, spacing, tabular, type } from '../theme';

/** Also flooded: the workout is over, so the phone is yours again. */
export function CompleteScreen() {
  const {
    state: { config, setsCompleted, totalRestSeconds },
    newWorkout,
  } = useWorkout();

  const enterHero = useEnter();
  const enterCard = useEnter(90);

  const finishedAll = setsCompleted >= config.totalSets;

  return (
    <View style={styles.screen}>
      {/* Siblings, not nested — stacking two entry animations would compound
          both the fade and the travel. */}
      <View style={styles.body}>
        <Animated.View style={[styles.hero, enterHero]}>
          <Text style={styles.badge}>{finishedAll ? '🔥' : '👍'}</Text>
          <Text style={styles.headline}>
            {finishedAll ? 'That’s the work.' : 'Called it early.'}
          </Text>
          <Text style={styles.sub}>
            Your phone’s yours again until the next one.
          </Text>

          <SetTicks
            total={config.totalSets}
            completed={setsCompleted}
            current={0}
            onAccent
          />
        </Animated.View>

        <Animated.View style={[styles.card, enterCard]}>
          <Row label="EXERCISE" value={config.exerciseName || '—'} />
          <Row
            label="SETS COMPLETED"
            value={`${setsCompleted} of ${config.totalSets}`}
          />
          <Row label="TIME SPENT RESTING" value={formatMMSS(totalRestSeconds)} />
        </Animated.View>
      </View>

      <BigButton label="New workout" onPress={newWorkout} variant="ink" />
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue} numberOfLines={1}>
        {value}
      </Text>
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
  body: { flex: 1, justifyContent: 'center', gap: spacing.lg },
  hero: { gap: spacing.sm },
  badge: { fontSize: 56 },
  headline: { ...type.mega, fontSize: 52, color: colors.white },
  sub: { ...type.helper, color: colors.mutedOnAccent, marginBottom: spacing.md, lineHeight: 21 },
  card: {
    backgroundColor: colors.ink,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
  },
  rowLabel: { ...type.tag, color: colors.faintOnDark },
  rowValue: {
    ...type.body,
    ...tabular,
    fontWeight: '800',
    color: colors.accent,
    flexShrink: 1,
    textAlign: 'right',
  },
});
