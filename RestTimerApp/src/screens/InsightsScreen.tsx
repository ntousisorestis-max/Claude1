import React from 'react';
import { Animated, ScrollView, StyleSheet, Text, View } from 'react-native';
import { NeedsAccount } from '../components/NeedsAccount';
import { StatCard } from '../components/StatCard';
import { useAccount } from '../cloud/AccountContext';
import { recentDays } from '../cloud/days';
import { EMPTY_INSIGHTS } from '../copy';
import { useEnter } from '../hooks/useEnter';
import { colors, describeSpan, sized, spacing, type } from '../theme';

/**
 * The numbers, once they stop resetting.
 *
 * Everything here is the persisted twin of something the app already counted
 * and then threw away at the end of the session. The arithmetic hasn't changed;
 * only how long it survives has.
 *
 * No charts, deliberately — three numbers this far apart in units have no
 * shared axis, and a sparkline over seven days of workout counts is five
 * pixels of information dressed up as ten.
 */
export function InsightsScreen() {
  const { status, totals, days, today } = useAccount();

  const enter = useEnter();
  // One per block rather than one for the lot: three cards that assemble read
  // as a screen being built, where three cards that arrive together read as a
  // screenshot. Steps of 60ms — small enough that the whole thing is settled
  // inside a third of a second.
  const enterOne = useEnter(80);
  const enterTwo = useEnter(140);
  const enterThree = useEnter(200);
  const enterNote = useEnter(260);

  const signedIn = status === 'signed-in';
  const focus = describeSpan(totals.focusSeconds);

  // "This week" is the same rolling seven days the Streaks strip draws, so the
  // two tabs can never disagree about what a week is.
  const week = new Set(recentDays(today, 7));
  const workoutsThisWeek = days
    .filter(day => week.has(day.day))
    .reduce((sum, day) => sum + day.workouts, 0);

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Animated.View style={[styles.hero, enter]}>
        <Text style={styles.eyebrow}>YOUR NUMBERS</Text>
        <Text style={styles.masthead}>
          Insights<Text style={styles.stop}>.</Text>
        </Text>
        <Text style={styles.heroSub}>
          Every set and every minute your phone stayed down, added up.
        </Text>
      </Animated.View>

      {/* A plain View, so each block below can carry its own entrance. Nesting
          a staggered child inside an animated parent compounds both the fade
          and the travel. */}
      <View style={styles.body}>
        {signedIn ? (
          <>
            <Animated.View style={enterOne}>
              <StatCard
                icon="flame"
                value={focus.value}
                unit={focus.unit}
                label="Time reclaimed"
                caption="All-time. How long your apps were locked while you were working."
              />
            </Animated.View>
            <Animated.View style={enterTwo}>
              <StatCard
                icon="trophy"
                value={String(workoutsThisWeek)}
                unit={workoutsThisWeek === 1 ? 'workout' : 'workouts'}
                label="This week"
                caption="Finished in the last seven days, today included."
              />
            </Animated.View>
            <Animated.View style={enterThree}>
              <StatCard
                icon="check"
                value={String(totals.setsCompleted)}
                unit={totals.setsCompleted === 1 ? 'set' : 'sets'}
                label="Sets completed"
                caption="All-time, across every device you sign in on."
              />
            </Animated.View>
          </>
        ) : (
          // Just the explanation. The session card lives on the Workout tab and
          // only there — showing it here too put the same three numbers on two
          // tabs, which reads as a bug rather than as a summary.
          <Animated.View style={enterOne}>
            <NeedsAccount empty={EMPTY_INSIGHTS} />
          </Animated.View>
        )}

        {/* Signed out there is nothing on this screen for a footnote to be
            about, so there isn't one. */}
        {signedIn ? (
          <Animated.View style={enterNote}>
            <Text style={styles.note}>
              Counted from finished workouts only — a workout you end early
              still counts the sets you did.
            </Text>
          </Animated.View>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },

  hero: { gap: 2 },
  eyebrow: { ...type.tag, color: colors.accentText, marginBottom: spacing.xs },
  masthead: { ...sized(type.display, 42), color: colors.white },
  stop: { color: colors.accent },
  heroSub: {
    ...type.helper,
    fontSize: 14,
    color: colors.mutedOnDark,
    lineHeight: 20,
    marginTop: spacing.sm,
  },

  body: { gap: spacing.md },
  note: {
    ...type.helper,
    fontSize: 13,
    color: colors.faintOnDark,
    lineHeight: 18,
    marginTop: spacing.xs,
  },
});
