import React from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { BigButton } from '../components/BigButton';
import { Icon, type IconName } from '../components/Icon';
import { Pop } from '../components/Pop';
import { SetTicks } from '../components/SetTicks';
import { useAccount } from '../cloud/AccountContext';
import {
  CUT_SHORT_LINES,
  FINISHED_LINES,
  personalBestLine,
  pick,
} from '../copy';
import { useCountUp } from '../hooks/useCountUp';
import { useEnter } from '../hooks/useEnter';
import { useWorkout } from '../state/WorkoutContext';
import {
  describeDuration,
  formatMMSS,
  radius,
  RECORD_GROUND,
  sized,
  spacing,
  tabular,
  themed,
  type,
  useColors,
} from '../theme';

/**
 * The record banner's ground: the app's ink at a third, over the violet flood.
 *
 * Kept as a named constant because `npm run contrast` checks this exact value
 * against the text that sits on it.
 */

/** Also flooded: the workout is over, so the phone is yours again. */
export function CompleteScreen() {
  const styles = useStyles();
  const {
    state: { config, setsCompleted, totalRestSeconds, totalLockedSeconds },
    newWorkout,
  } = useWorkout();
  const { justSetRecord } = useAccount();

  const enterHero = useEnter();
  const enterReclaimed = useEnter(90);
  const enterCard = useEnter(170);

  const finishedAll = setsCompleted >= config.totalSets;

  // Seeded on the workout rather than randomly, so the line holds still while
  // the count-up animates and the record arrives.
  const seed = setsCompleted + config.totalSets + config.exerciseName.length;
  const subline = finishedAll
    ? pick(FINISHED_LINES, seed)
    : pick(CUT_SHORT_LINES, seed);

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
          <Text style={styles.subline}>{subline}</Text>

          <SetTicks
            total={config.totalSets}
            completed={setsCompleted}
            current={0}
            onAccent
          />
        </Animated.View>

        {/* Arrives a beat after everything else — it depends on the workout
            reaching Firestore and the new streak coming back — so it gets its
            own entrance rather than sharing the hero's. */}
        {justSetRecord != null ? <RecordBanner days={justSetRecord} /> : null}

        <Animated.View style={enterReclaimed}>
          <TimeReclaimed seconds={totalLockedSeconds} />
        </Animated.View>

        <Animated.View style={[styles.card, enterCard]}>
          <Row
            icon="dumbbell"
            label="EXERCISE"
            value={config.exerciseName || '—'}
          />
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
  const styles = useStyles();
  const colors = useColors();
  const { value, unit } = describeDuration(seconds);
  const counted = useCountUp(value);

  return (
    <View style={styles.reclaimed}>
      <View style={styles.reclaimedLabel}>
        <Icon name="phone" color={colors.mutedOnAccent} size={15} />
        <Text style={styles.reclaimedEyebrow}>TIME RECLAIMED</Text>
      </View>

      <Text style={styles.reclaimedLead}>You kept your phone down for</Text>
      {/* One small pop the instant the count-up arrives, so the number lands
          rather than merely stopping. Keyed on reaching the target — not on
          `counted` itself, which changes fifteen times on the way there. */}
      <Pop
        value={counted >= value ? 'landed' : 'counting'}
        depth={1.06}
        style={styles.landed}
      >
        {/* Number and unit are separate so only the number moves — animating
            the whole string would flicker the word between singular and
            plural. */}
        <Text style={styles.reclaimedValue}>
          {counted} {unit}.
        </Text>
      </Pop>
    </View>
  );
}

/**
 * The one flourish in the app.
 *
 * Shown only when a workout has just pushed the best-ever streak past where it
 * was — the single record this app actually keeps, so the only thing it can
 * honestly call a personal best. Signed-out users never see it, because there
 * is nothing keeping their records.
 *
 * It enters on its own timing because it cannot be timed with the rest of the
 * screen: it is waiting on a server.
 */
function RecordBanner({ days }: { days: number }) {
  const styles = useStyles();
  const colors = useColors();
  const enter = useEnter(0);

  return (
    <Animated.View
      style={[styles.record, enter]}
      accessibilityRole="text"
      accessibilityLabel={`New personal best: ${personalBestLine(days)}`}
    >
      <View style={styles.recordTile}>
        <Icon name="trophy" color={colors.textOnAccent} size={18} />
      </View>
      <View style={styles.recordText}>
        <Text style={styles.recordEyebrow}>PERSONAL BEST</Text>
        <Text style={styles.recordLine}>{personalBestLine(days)}</Text>
      </View>
    </Animated.View>
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
  const styles = useStyles();
  const colors = useColors();
  return (
    <View style={styles.row}>
      <View style={styles.rowLabelGroup}>
        <Icon name={icon} color={colors.faint} size={15} strokeWidth={1.9} />
        <Text style={styles.rowLabel}>{label}</Text>
      </View>
      <Text style={styles.rowValue} numberOfLines={1}>
        {value}
      </Text>
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
      gap: spacing.md,
    },
    body: { flex: 1, justifyContent: 'center', gap: spacing.lg },
    hero: { gap: spacing.sm },
    badge: { fontSize: 56 },
    headline: { ...sized(type.mega, 52), color: colors.textOnAccent },
    subline: {
      ...type.helper,
      fontSize: 16,
      color: colors.mutedOnAccent,
      lineHeight: 22,
      marginBottom: spacing.sm,
    },

    /**
     * Sunk into the violet, not floated on top of it.
     *
     * A white wash was the first instinct and it was wrong twice over: it
     * lightens a ground that white text already sits on, dropping the eyebrow to
     * about 4:1 — under AA before the glow touches it — and it makes the one
     * celebratory thing on the screen the *least* legible. Darkening instead
     * takes white to roughly 9:1 and reads as a plaque rather than a smudge.
     */
    record: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      backgroundColor: RECORD_GROUND,
      borderRadius: radius.md,
      padding: spacing.md,
    },
    recordTile: {
      width: 36,
      height: 36,
      borderRadius: radius.sm,
      backgroundColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    recordText: { flex: 1, gap: 2 },
    recordEyebrow: { ...sized(type.tag, 10), color: colors.mutedOnAccent },
    recordLine: { ...type.body, fontWeight: '700', color: colors.textOnAccent },

    reclaimed: { gap: spacing.xs },
    reclaimedLabel: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    reclaimedEyebrow: { ...type.tag, color: colors.mutedOnAccent },
    reclaimedLead: {
      ...type.helper,
      fontSize: 17,
      color: colors.mutedOnAccent,
      marginTop: spacing.sm,
    },
    landed: { alignSelf: 'flex-start' },
    reclaimedValue: {
      ...sized(type.display, 38),
      ...tabular,
      color: colors.textOnAccent,
    },

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
    rowLabelGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    rowLabel: { ...type.tag, color: colors.faint },
    rowValue: {
      ...type.body,
      ...tabular,
      fontWeight: '800',
      color: colors.accentText,
      flexShrink: 1,
      textAlign: 'right',
    },
  }),
);
