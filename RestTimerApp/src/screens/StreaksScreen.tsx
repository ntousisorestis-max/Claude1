import React from 'react';
import { Animated, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Icon } from '../components/Icon';
import { NeedsAccount } from '../components/NeedsAccount';
import { ProgressBar } from '../components/ProgressBar';
import { StreakRing } from '../components/StreakRing';
import { TAB_BAR_CLEARANCE } from '../components/TabBar';
import { useAccount } from '../cloud/AccountContext';
import {
  CHALLENGE_RUNGS,
  nextRung,
  STREAK_MILESTONES,
  type Rung,
} from '../cloud/milestones';
import { EMPTY_STREAKS, STREAKS } from '../copy';
import { useEnter } from '../hooks/useEnter';
import {
  HAIRLINE,
  radius,
  sized,
  spacing,
  tabular,
  themed,
  type,
  useColors,
} from '../theme';

/** 24pt between sections, matching Insights. `spacing.lg` is 22. */
const SECTION_GAP = 24;
/** 16pt inside every card. */
const CARD_PAD = 16;

/**
 * Consistency, as opposed to Insights' arithmetic.
 *
 * The split between the two tabs is the whole design, and it is a split of
 * *kind* rather than of quantity: Insights is what has accumulated — totals,
 * an average, a chart, records — and this is whether you keep turning up.
 * Nothing here is a sum of minutes or sets, and nothing on Insights is a
 * calendar. The one number that used to appear on both — the current streak, in
 * Insights' fourth tile — now lives here alone.
 *
 * ## A day counts if a workout finished on it
 *
 * Not sets, not minutes. That threshold is deliberate: the point of a streak is
 * showing up, and one you can lose by having a short session punishes exactly
 * the day somebody most needed a reason to go.
 *
 * ## Two ladders, doing different jobs
 *
 * The milestone card measures the streak against the calendar; the challenge
 * measures workouts against themselves. Both draw a bar, which is the risk —
 * two stacked bars can read as the same thing twice — so they are pointedly
 * different shapes: the milestone is a thin line under a countdown, the
 * challenge is a fat bar that is the card's main event.
 *
 * ## What a challenge here can and cannot see
 *
 * "Finished every set you planned" is `setsCompleted >= plannedSets`, both
 * measured by this app on this device. That is the only kind of challenge that
 * can exist here. Anything about what somebody did *in another app* — scrolling
 * avoided, apps left unopened — is unobservable by construction: iOS hands back
 * an opaque selection token and never says what is in it. See WorkoutRecord.
 */
export function StreaksScreen() {
  const styles = useStyles();
  const colors = useColors();
  const { status, streak, currentStreak, trainedToday, totals } = useAccount();

  const enterHero = useEnter();
  const enterRing = useEnter(80);
  const enterMilestone = useEnter(160);
  const enterChallenge = useEnter(220);
  const enterShield = useEnter(280);
  const enterFoot = useEnter(340);

  const signedIn = status === 'signed-in';

  // Measured against the *best* streak, not the current one. A milestone
  // already passed in March shouldn't reappear as a target in April — the
  // ladder tracks what has been proved, and the ring above it is where things
  // actually stand today.
  const milestone = nextRung(STREAK_MILESTONES, streak.bestStreak);
  const challenge = nextRung(CHALLENGE_RUNGS, totals.fullWorkouts);

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Animated.View style={[styles.hero, enterHero]}>
        <Text style={styles.masthead}>
          Streaks<Text style={styles.stop}>.</Text>
        </Text>
      </Animated.View>

      {signedIn ? (
        <>
          {/* 1 — the ring, which measures today */}
          <Animated.View style={enterRing}>
            <StreakRing
              streak={currentStreak}
              trainedToday={trainedToday}
              line={ringLine(currentStreak, trainedToday)}
            />
          </Animated.View>

          {/* 2 — how far to the next rung */}
          <Animated.View style={[styles.card, enterMilestone]}>
            <MilestoneCard rung={milestone} best={streak.bestStreak} />
          </Animated.View>

          {/* 3 — the one active challenge */}
          <Animated.View style={[styles.card, enterChallenge]}>
            <ChallengeCard rung={challenge} done={totals.fullWorkouts} />
          </Animated.View>

          {/* 4 — the rule, stated rather than implied */}
          <Animated.View style={[styles.shield, enterShield]}>
            <View style={styles.shieldTile}>
              <Icon name="shield" color={colors.textOnAccent} size={20} />
            </View>
            <View style={styles.shieldText}>
              <Text style={styles.shieldTitle}>{STREAKS.shield.title}</Text>
            </View>
          </Animated.View>

          {/* 5 */}
          <Animated.View style={enterFoot}>
            <Text style={styles.footer}>{STREAKS.footer}</Text>
          </Animated.View>
        </>
      ) : (
        <Animated.View style={enterRing}>
          <NeedsAccount empty={EMPTY_STREAKS} />
        </Animated.View>
      )}
    </ScrollView>
  );
}

/**
 * The next milestone, and the distance to it.
 *
 * The number that leads is the *target*, not the best. A card headed by what
 * has already been done is a trophy; this one is meant to be a direction.
 */
function MilestoneCard({ rung, best }: { rung: Rung | null; best: number }) {
  const styles = useStyles();
  if (!rung) {
    return (
      <>
        <Text style={styles.cardTitle}>{STREAKS.milestone.label}</Text>
        <Text style={styles.past}>{STREAKS.milestone.done}</Text>
      </>
    );
  }

  return (
    <>
      <View style={styles.cardHead}>
        <Text style={styles.cardTitle}>{STREAKS.milestone.label}</Text>
        {/* "No best yet" rather than "0 days" — a zero here reads as a score. */}
        <Text style={styles.best}>
          {best > 0 ? (
            <>
              {STREAKS.milestone.bestLabel}{' '}
              <Text style={styles.bestValue}>
                {best} {best === 1 ? 'day' : 'days'}
              </Text>
            </>
          ) : (
            STREAKS.milestone.noBest.toUpperCase()
          )}
        </Text>
      </View>

      <View style={styles.target}>
        <Text style={styles.targetValue}>{rung.target}</Text>
        <Text style={styles.targetUnit}>days</Text>
      </View>

      <ProgressBar
        value={best - rung.from}
        max={rung.target - rung.from}
        label={`${best} of ${rung.target} days toward the next milestone`}
        height={8}
        delay={260}
      />

      <Text style={styles.remaining}>
        {best > 0
          ? `${rung.remaining} more ${
              rung.remaining === 1 ? 'day' : 'days'
            } in a row and it’s yours.`
          : `${rung.remaining} days to your first milestone.`}
      </Text>
    </>
  );
}

/**
 * The challenge. One at a time, cumulative, and it never goes backwards.
 *
 * A consecutive version would reset the moment somebody ended a session early,
 * which is the single thing the app's voice is not allowed to punish. This one
 * costs nothing for a bad day — it just doesn't count — and as a side effect it
 * ratchets cleanly in the security rules rather than needing a counter that can
 * go down.
 */
function ChallengeCard({ rung, done }: { rung: Rung | null; done: number }) {
  const styles = useStyles();
  return (
    <>
      <View style={styles.cardHead}>
        <Text style={styles.cardTitle}>{STREAKS.challenge.label}</Text>
        <Text style={styles.count}>
          <Text style={styles.countNow}>{done}</Text>
          {rung ? <Text style={styles.countOf}> of {rung.target}</Text> : null}
        </Text>
      </View>

      <Text style={styles.challengeTitle}>{STREAKS.challenge.title}</Text>

      {/* No bar once every rung is behind them: a full bar with nothing left to
          fill is the same shape as a bar that hasn't loaded. */}
      {rung ? (
        <ProgressBar
          value={done}
          max={rung.target}
          label={`Finish what you start: ${done} of ${rung.target} workouts`}
          height={14}
          delay={320}
        />
      ) : null}
    </>
  );
}

/**
 * The line under the ring.
 *
 * Four states, and the difference between them matters more than the number
 * does: "done for today" and "today is still open" are the same integer and
 * completely different situations to be in.
 */
function ringLine(current: number, trainedToday: boolean): string {
  if (current === 0) {
    return STREAKS.ring.none;
  }
  if (!trainedToday) {
    return STREAKS.ring.open;
  }
  return current === 1 ? STREAKS.ring.firstDay : STREAKS.ring.banked;
}

const useStyles = themed(colors =>
  StyleSheet.create({
    content: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      // Clears the floating tab pill, which this content scrolls under.
      paddingBottom: TAB_BAR_CLEARANCE,
      gap: SECTION_GAP,
    },

    hero: { gap: 2 },
    masthead: { ...sized(type.display, 42), color: colors.white },
    stop: { color: colors.accent },

    card: {
      backgroundColor: colors.surface,
      borderWidth: HAIRLINE,
      borderColor: colors.hairline,
      borderRadius: radius.lg,
      padding: CARD_PAD,
      gap: spacing.md,
    },
    cardHead: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    cardTitle: { ...sized(type.tag, 10), color: colors.accentText },

    best: { ...sized(type.tag, 10), color: colors.faint },
    bestValue: { color: colors.muted },

    /** Target and unit on one baseline, so "30 days" reads as one thing. */
    target: { flexDirection: 'row', alignItems: 'baseline', gap: 7 },
    targetValue: {
      ...sized(type.display, 40),
      ...tabular,
      color: colors.white,
    },
    targetUnit: { ...type.body, fontWeight: '700', color: colors.muted },

    remaining: {
      ...type.helper,
      fontSize: 14,
      color: colors.muted,
      lineHeight: 20,
    },
    past: {
      ...type.body,
      fontWeight: '600',
      color: colors.white,
      lineHeight: 23,
    },

    count: { flexDirection: 'row', alignItems: 'baseline' },
    countNow: { ...sized(type.title, 22), ...tabular, color: colors.white },
    countOf: { ...type.body, fontWeight: '600', color: colors.faint },

    challengeTitle: { ...sized(type.title, 21), color: colors.white },

    shield: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      backgroundColor: colors.surface,
      borderWidth: HAIRLINE,
      borderColor: colors.hairline,
      borderRadius: radius.lg,
      padding: CARD_PAD,
    },
    shieldTile: {
      width: 44,
      height: 44,
      borderRadius: radius.sm + 2,
      backgroundColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    shieldText: { flex: 1 },
    shieldTitle: {
      ...type.body,
      fontSize: 17,
      fontWeight: '800',
      color: colors.white,
    },

    footer: {
      ...type.helper,
      fontSize: 13,
      color: colors.faint,
      lineHeight: 18,
      textAlign: 'center',
    },
  }),
);
