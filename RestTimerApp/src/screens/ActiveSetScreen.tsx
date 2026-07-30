import React from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { BigButton } from '../components/BigButton';
import { SetTicks } from '../components/SetTicks';
import { StatusRail } from '../components/StatusRail';
import { useWorkout } from '../state/WorkoutContext';
import { colors, pad2, spacing, tabular, type } from '../theme';

export function ActiveSetScreen() {
  const {
    state: { config, currentSet, setsCompleted },
    finishSet,
    endWorkout,
  } = useWorkout();

  const confirmEnd = () =>
    Alert.alert('End workout?', 'Your apps will be unlocked.', [
      { text: 'Keep going', style: 'cancel' },
      { text: 'End workout', style: 'destructive', onPress: endWorkout },
    ]);

  return (
    <View style={styles.screen}>
      <StatusRail selectedAppIds={config.selectedAppIds} />

      <View style={styles.head}>
        <Text style={styles.exercise} numberOfLines={2}>
          {config.exerciseName}
        </Text>
        {/* Terse for the eye, spelled out for screen readers. */}
        <View
          style={styles.counter}
          accessibilityLabel={`Set ${currentSet} of ${config.totalSets}`}>
          <Text style={styles.current}>{pad2(currentSet)}</Text>
          <Text style={styles.total}>/{pad2(config.totalSets)}</Text>
        </View>
        <SetTicks
          total={config.totalSets}
          completed={setsCompleted}
          current={currentSet}
        />
      </View>

      <BigButton label="Done with Set" onPress={finishSet} slab />

      <BigButton label="End Workout" onPress={confirmEnd} variant="quit" />
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
  head: { gap: spacing.md, paddingTop: spacing.md },
  exercise: { ...type.title, fontSize: 32, color: colors.chalk },
  counter: { flexDirection: 'row', alignItems: 'baseline' },
  current: { ...type.display, ...tabular, color: colors.chalk },
  total: { ...type.display, ...tabular, fontSize: 38, color: colors.faint },
});
