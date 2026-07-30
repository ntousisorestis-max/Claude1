import React from 'react';
import { Alert, Animated, StyleSheet, Text, View } from 'react-native';
import { BigButton } from '../components/BigButton';
import { SetTicks } from '../components/SetTicks';
import { StatusTag } from '../components/StatusTag';
import { useEnter } from '../hooks/useEnter';
import { useWorkout } from '../state/WorkoutContext';
import { colors, spacing, tabular, type } from '../theme';

export function ActiveSetScreen() {
  const {
    state: { config, currentSet, setsCompleted },
    finishSet,
    endWorkout,
  } = useWorkout();

  const enterHead = useEnter();
  const enterSlab = useEnter(70);

  const confirmEnd = () =>
    Alert.alert('End this workout?', 'Your apps will unlock right away.', [
      { text: 'Keep going', style: 'cancel' },
      { text: 'End workout', style: 'destructive', onPress: endWorkout },
    ]);

  return (
    <View style={styles.screen}>
      <StatusTag selectedAppIds={config.selectedAppIds} />

      <Animated.View style={[styles.head, enterHead]}>
        <Text style={styles.exercise} numberOfLines={2}>
          {config.exerciseName}
        </Text>

        {/* Big for glancing at mid-set, worded so it needs no decoding. */}
        <View accessibilityLabel={`Set ${currentSet} of ${config.totalSets}`}>
          <Text style={styles.setLabel}>SET</Text>
          <View style={styles.counter}>
            <Text style={styles.current}>{currentSet}</Text>
            <Text style={styles.total}> of {config.totalSets}</Text>
          </View>
        </View>

        <SetTicks
          total={config.totalSets}
          completed={setsCompleted}
          current={currentSet}
        />

        <Text style={styles.explain}>
          Your apps stay blocked until you finish this set.
        </Text>
      </Animated.View>

      <Animated.View style={[styles.slabWrap, enterSlab]}>
        <BigButton label="Done with set" onPress={finishSet} slab />
      </Animated.View>

      <BigButton label="End workout" onPress={confirmEnd} variant="danger" />
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
  head: { gap: spacing.sm, paddingTop: spacing.sm },
  slabWrap: { flex: 1 },
  exercise: { ...type.display, color: colors.white },
  setLabel: { ...type.tag, color: colors.faintOnDark, marginBottom: -spacing.xs },
  counter: { flexDirection: 'row', alignItems: 'baseline' },
  current: { ...type.mega, ...tabular, color: colors.lime },
  total: {
    ...type.display,
    ...tabular,
    fontSize: 34,
    color: colors.mutedOnDark,
  },
  explain: { ...type.body, color: colors.mutedOnDark, marginTop: spacing.xs },
});
