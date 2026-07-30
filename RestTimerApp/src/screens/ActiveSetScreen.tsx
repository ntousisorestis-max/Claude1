import React from 'react';
import { Alert, Animated, StyleSheet, Text, View } from 'react-native';
import { BigButton } from '../components/BigButton';
import { SetTicks } from '../components/SetTicks';
import { StatusTag } from '../components/StatusTag';
import { useEnter } from '../hooks/useEnter';
import { useWorkout } from '../state/WorkoutContext';
import { colors, pad2, spacing, tabular, type } from '../theme';

export function ActiveSetScreen() {
  const {
    state: { config, currentSet, setsCompleted },
    finishSet,
    endWorkout,
  } = useWorkout();

  const enterHead = useEnter();
  const enterSlab = useEnter(70);

  const confirmEnd = () =>
    Alert.alert('bail on this workout?', 'your apps unlock right away.', [
      { text: 'nah, keep going', style: 'cancel' },
      { text: 'bail', style: 'destructive', onPress: endWorkout },
    ]);

  return (
    <View style={styles.screen}>
      <StatusTag selectedAppIds={config.selectedAppIds} />

      <Animated.View style={[styles.head, enterHead]}>
        <Text style={styles.exercise} numberOfLines={2}>
          {config.exerciseName}
        </Text>
        {/* Punchy for the eye, spelled out for screen readers. */}
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
      </Animated.View>

      <Animated.View style={[styles.slabWrap, enterSlab]}>
        <BigButton label="SET DONE" a11yLabel="Done with Set" onPress={finishSet} slab />
      </Animated.View>

      <BigButton label="BAIL" a11yLabel="End Workout" onPress={confirmEnd} variant="bail" />
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
  head: { gap: spacing.md, paddingTop: spacing.sm },
  slabWrap: { flex: 1 },
  exercise: { ...type.display, color: colors.white },
  counter: { flexDirection: 'row', alignItems: 'baseline' },
  current: { ...type.mega, ...tabular, color: colors.lime },
  total: { ...type.mega, ...tabular, fontSize: 46, letterSpacing: -2, color: colors.inkLine },
});
