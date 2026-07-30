import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BigButton } from '../components/BigButton';
import { SetTicks } from '../components/SetTicks';
import { useWorkout } from '../state/WorkoutContext';
import { colors, formatMMSS, HAIRLINE, spacing, tabular, type } from '../theme';

export function CompleteScreen() {
  const {
    state: { config, setsCompleted, totalRestSeconds },
    newWorkout,
  } = useWorkout();

  const finishedAll = setsCompleted >= config.totalSets;

  return (
    <View style={styles.screen}>
      <View style={styles.top}>
        <View style={[styles.bar, { backgroundColor: colors.free }]} />
        <Text style={styles.status}>APPS UNLOCKED</Text>
      </View>

      <View style={styles.body}>
        <Text style={styles.headline}>
          {finishedAll ? 'Workout complete.' : 'Workout ended.'}
        </Text>

        <SetTicks
          total={config.totalSets}
          completed={setsCompleted}
          current={0}
        />

        <View style={styles.summary}>
          <Row label="EXERCISE" value={config.exerciseName || '—'} />
          <Row label="SETS" value={`${setsCompleted} of ${config.totalSets}`} />
          <Row label="TOTAL REST" value={formatMMSS(totalRestSeconds)} />
        </View>
      </View>

      <BigButton label="New Workout" onPress={newWorkout} />
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
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.lg,
  },
  top: { gap: spacing.sm },
  bar: { height: 3, borderRadius: 2 },
  status: { ...type.label, color: colors.free },
  body: { flex: 1, justifyContent: 'center', gap: spacing.lg },
  headline: { ...type.title, fontSize: 40, letterSpacing: -1.2, color: colors.chalk },
  summary: { marginTop: spacing.sm },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderTopWidth: HAIRLINE,
    borderTopColor: colors.hairline,
  },
  rowLabel: { ...type.label, color: colors.faint },
  rowValue: {
    ...type.body,
    ...tabular,
    fontWeight: '700',
    color: colors.chalk,
    flexShrink: 1,
    textAlign: 'right',
  },
});
