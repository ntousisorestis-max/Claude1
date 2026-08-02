import React from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { BigButton } from '../components/BigButton';
import { Icon, type IconName } from '../components/Icon';
import { SetTicks } from '../components/SetTicks';
import { useCountUp } from '../hooks/useCountUp';
import { useEnter } from '../hooks/useEnter';
import { useWorkout } from '../state/WorkoutContext';
import {
  colors,
  describeDuration,
  formatMMSS,
  radius,
  sized,
  spacing,
  tabular,
  type,
} from '../theme';

/** Also flooded: the workout is over, so the phone is yours again. */
export function CompleteScreen() {
  const {
    state: { config, setsCompleted, totalRestSeconds, totalLockedSeconds },
    newWorkout,
  } = useWorkout();

  const enterHero = useEnter();
  const enterReclaimed = useEnter(90);
  const enterCard = useEnter(170);

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

          <SetTicks
            total={config.totalSets}
            completed={setsCompleted}
            current={0}
            onAccent
          />
        </Animated.View>

        <Animated.View style={enterReclaimed}>
          <TimeReclaimed seconds={totalLockedSeconds} />
        </Animated.View>

        <Animated.View style={[styles.card, enterCard]}>
          <Row icon="dumbbell" label="EXERCISE" value={config.exerciseName || '—'} />
          <Row
            icon="check"
            label="SETS COMPLETED"
            value={`${setsCompleted} of ${config.totalSets}`}
          />
          <Row
            icon="clock"
            label="TIME SPENT RESTING"
            value={formatMMSS(totalRestSeconds)}
          />
        </Animated.View>
      </View>

      <BigButton label="New workout" onPress={newWorkout} variant="ink" />
    </View>
  );
}

/**
 * The one number this screen is actually about.
 *
 * It counts how long the apps were *locked* — the time the phone was out of
 * reach — and it is deliberately not shown while it accrues. A live counter
 * during rest would turn the reward into a scoreboard, and would put a number
 * on screen at exactly the moment the app wants you looking away from it.
 *
 * Session-only: reset by the next Start, never stored.
 */
function TimeReclaimed({ seconds }: { seconds: number }) {
  const { value, unit } = describeDuration(seconds);
  const counted = useCountUp(value);

  return (
    <View style={styles.reclaimed}>
      <View style={styles.reclaimedLabel}>
        <Icon name="phone" color={colors.mutedOnAccent} size={15} />
        <Text style={styles.reclaimedEyebrow}>TIME RECLAIMED</Text>
      </View>

      <Text style={styles.reclaimedLead}>You kept your phone down for</Text>
      {/* Number and unit are separate so only the number moves — animating the
          whole string would flicker the word between singular and plural. */}
      <Text style={styles.reclaimedValue}>
        {counted} {unit}.
      </Text>
    </View>
  );
}

function Row({
  icon,
  label,
  value,
}: {
  icon: IconName;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.rowLabelGroup}>
        <Icon name={icon} color={colors.faintOnDark} size={15} strokeWidth={1.9} />
        <Text style={styles.rowLabel}>{label}</Text>
      </View>
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
  headline: {
    ...sized(type.mega, 52),
    color: colors.white,
    marginBottom: spacing.sm,
  },

  reclaimed: { gap: spacing.xs },
  reclaimedLabel: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  reclaimedEyebrow: { ...type.tag, color: colors.mutedOnAccent },
  reclaimedLead: {
    ...type.helper,
    fontSize: 17,
    color: colors.mutedOnAccent,
    marginTop: spacing.sm,
  },
  reclaimedValue: { ...sized(type.display, 38), ...tabular, color: colors.white },

  card: {
    backgroundColor: colors.ink,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
  },
  rowLabelGroup: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  rowLabel: { ...type.tag, color: colors.faintOnDark },
  rowValue: {
    ...type.body,
    ...tabular,
    fontWeight: '800',
    color: colors.accentText,
    flexShrink: 1,
    textAlign: 'right',
  },
});
