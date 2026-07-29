import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BigButton } from '../components/BigButton';
import { useWorkout } from '../state/WorkoutContext';
import { colors, formatMMSS, radius, spacing } from '../theme';

export function CompleteScreen() {
  const {
    state: { config, setsCompleted, totalRestSeconds },
    newWorkout,
  } = useWorkout();

  const finishedAll = setsCompleted >= config.totalSets;

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.emoji}>{finishedAll ? '🏆' : '👍'}</Text>
        <Text style={styles.title}>
          {finishedAll ? 'Workout Complete!' : 'Workout Ended'}
        </Text>
        <Text style={styles.subtitle}>🔓 Apps unlocked — scroll freely.</Text>
      </View>

      <View style={styles.card}>
        <Row label="Exercise" value={config.exerciseName || '—'} />
        <Row label="Sets completed" value={`${setsCompleted} of ${config.totalSets}`} />
        <Row label="Total rest" value={formatMMSS(totalRestSeconds)} />
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
  container: {
    flex: 1,
    padding: spacing.lg,
    gap: spacing.lg,
    justifyContent: 'center',
  },
  hero: { alignItems: 'center', gap: spacing.sm },
  emoji: { fontSize: 64 },
  title: { color: colors.text, fontSize: 34, fontWeight: '900' },
  subtitle: { color: colors.accent, fontSize: 16, fontWeight: '700' },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.md,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md },
  rowLabel: { color: colors.textMuted, fontSize: 16, fontWeight: '600' },
  rowValue: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
    flexShrink: 1,
    textAlign: 'right',
  },
});
