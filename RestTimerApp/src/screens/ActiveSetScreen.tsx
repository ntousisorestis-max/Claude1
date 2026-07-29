import React from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { BigButton } from '../components/BigButton';
import { LockIndicator } from '../components/LockIndicator';
import { useWorkout } from '../state/WorkoutContext';
import { colors, spacing } from '../theme';

export function ActiveSetScreen() {
  const {
    state: { config, currentSet },
    finishSet,
    endWorkout,
  } = useWorkout();

  const confirmEnd = () =>
    Alert.alert('End workout?', 'Your apps will be unlocked.', [
      { text: 'Keep going', style: 'cancel' },
      { text: 'End workout', style: 'destructive', onPress: endWorkout },
    ]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <LockIndicator selectedAppIds={config.selectedAppIds} />
        <Text style={styles.exercise} numberOfLines={2}>
          {config.exerciseName}
        </Text>
        <Text style={styles.setCount}>
          Set {currentSet} of {config.totalSets}
        </Text>
      </View>

      <BigButton label="Done with Set" onPress={finishSet} huge />

      <BigButton label="End Workout" onPress={confirmEnd} variant="danger" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    gap: spacing.lg,
  },
  header: { alignItems: 'center', gap: spacing.sm, paddingTop: spacing.lg },
  exercise: {
    color: colors.text,
    fontSize: 34,
    fontWeight: '900',
    textAlign: 'center',
  },
  setCount: { color: colors.textMuted, fontSize: 22, fontWeight: '700' },
});
