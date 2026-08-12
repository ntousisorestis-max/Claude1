import React, { useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { BigButton } from '../components/BigButton';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { LockStatus } from '../components/LockStatus';
import { Pop } from '../components/Pop';
import { SetTicks } from '../components/SetTicks';
import { pick, SKIPPED_REST_LINES } from '../copy';
import { useEnter } from '../hooks/useEnter';
import { useWorkout } from '../state/WorkoutContext';
import { spacing, tabular, themed, type } from '../theme';

export function ActiveSetScreen() {
  const styles = useStyles();
  const {
    state: { config, currentSet, setsCompleted, skippedRest },
    finishSet,
    endWorkout,
  } = useWorkout();

  const enterHead = useEnter();
  const enterSlab = useEnter(70);
  const [confirming, setConfirming] = useState(false);

  return (
    <View style={styles.screen}>
      <LockStatus selectedAppIds={config.selectedAppIds} />

      <Animated.View style={[styles.head, enterHead]}>
        <Text style={styles.exercise} numberOfLines={2}>
          {config.exerciseName}
        </Text>

        {/* Big for glancing at mid-set, worded so it needs no decoding. */}
        <View accessibilityLabel={`Set ${currentSet} of ${config.totalSets}`}>
          <Text style={styles.setLabel}>SET</Text>
          {/* The numeral pops as it advances. It's the one thing on screen
              that changes between sets, and the screen behind it doesn't
              re-mount, so without this the number simply swaps and nothing
              acknowledges that a set was banked. */}
          <Pop value={currentSet} depth={1.09} style={styles.popped}>
            <View style={styles.counter}>
              <Text style={styles.current}>{currentSet}</Text>
              <Text style={styles.total}> of {config.totalSets}</Text>
            </View>
          </Pop>
        </View>

        {/* Seeded on the set, so it holds still for the whole set and differs
            from the last one the user was teased with. */}
        {skippedRest ? (
          <Text style={styles.tease}>
            {pick(SKIPPED_REST_LINES, currentSet)}
          </Text>
        ) : null}

        <SetTicks
          total={config.totalSets}
          completed={setsCompleted}
          current={currentSet}
        />
      </Animated.View>

      {/* The slab is the one control you hit without looking, so it stays
          big — but capped and centred in whatever room is left, rather than
          stretching to fill it. Unbounded, it grew to swallow the whole
          screen on anything taller than a small phone, which read as an
          empty violet slab with a lot of dead air around "End workout"
          rather than a screen with a clear centre of gravity. */}
      <View style={styles.slabArea}>
        <Animated.View style={[styles.slabWrap, enterSlab]}>
          <BigButton label="Done with set" onPress={finishSet} slab />
        </Animated.View>
      </View>

      <BigButton
        label="End workout"
        onPress={() => setConfirming(true)}
        variant="danger"
      />

      <ConfirmDialog
        visible={confirming}
        title="End this workout?"
        message="Your apps unlock right away, and this workout stops where it is."
        confirmLabel="End it now"
        cancelLabel="Keep going"
        onConfirm={() => {
          setConfirming(false);
          endWorkout();
        }}
        onCancel={() => setConfirming(false)}
      />
    </View>
  );
}

const useStyles = themed(colors =>
  StyleSheet.create({
    screen: {
      flex: 1,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
      paddingBottom: spacing.sm,
      gap: spacing.lg,
    },
    head: { gap: spacing.md, paddingTop: spacing.lg },
    slabArea: { flex: 1, justifyContent: 'center' },
    slabWrap: { flex: 1, maxHeight: 420, alignSelf: 'stretch' },
    exercise: { ...type.display, color: colors.white },
    setLabel: { ...type.tag, color: colors.faint, marginBottom: -spacing.xs },
    popped: { alignSelf: 'flex-start' },
    counter: { flexDirection: 'row', alignItems: 'baseline' },
    current: { ...type.mega, ...tabular, color: colors.accent },
    tease: {
      ...type.helper,
      fontSize: 15,
      color: colors.faint,
      fontStyle: 'italic',
      marginTop: spacing.xs,
    },
    total: {
      ...type.display,
      ...tabular,
      fontSize: 34,
      color: colors.muted,
    },
  }),
);
