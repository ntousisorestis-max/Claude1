import React from 'react';
import { Animated, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Icon } from '../components/Icon';
import { NeedsAccount } from '../components/NeedsAccount';
import { WeekStrip } from '../components/WeekStrip';
import { useAccount } from '../cloud/AccountContext';
import { useEnter } from '../hooks/useEnter';
import {
  colors,
  HAIRLINE,
  radius,
  sized,
  spacing,
  tabular,
  type,
} from '../theme';

/**
 * Days trained in a row.
 *
 * A day counts if at least one workout finished on it — not sets, not minutes.
 * That threshold is the whole design: the point of a streak is showing up, and
 * a streak you can lose by having a short session is a streak that punishes
 * exactly the day you most needed a reason to go.
 *
 * No badges and no challenges here yet, on purpose. Both are ways of making the
 * number mean more, and the number has to be right first.
 */
export function StreaksScreen() {
  const { status, streak, currentStreak, trainedToday, days, today } = useAccount();

  const enter = useEnter();
  const enterBody = useEnter(80);

  const signedIn = status === 'signed-in';

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Animated.View style={[styles.hero, enter]}>
        <Text style={styles.eyebrow}>CONSISTENCY</Text>
        <Text style={styles.masthead}>
          Streaks<Text style={styles.stop}>.</Text>
        </Text>
        <Text style={styles.heroSub}>
          One finished workout a day is all it takes to keep it alive.
        </Text>
      </Animated.View>

      <Animated.View style={[styles.body, enterBody]}>
        {signedIn ? (
          <>
            {/* The current streak is the screen — hence a card built around the
                number rather than a row of equal tiles. */}
            <View
              style={styles.current}
              accessibilityRole="text"
              accessibilityLabel={`Current streak: ${currentStreak} ${
                currentStreak === 1 ? 'day' : 'days'
              }`}>
              <View style={styles.flame}>
                <Icon
                  name="flame"
                  color={currentStreak > 0 ? colors.accent : colors.faintOnDark}
                  size={30}
                  strokeWidth={1.7}
                />
              </View>
              <Text style={styles.currentValue}>{currentStreak}</Text>
              <Text style={styles.currentUnit}>
                {currentStreak === 1 ? 'day streak' : 'day streak'}
              </Text>
              <Text style={styles.currentNote}>
                {statusLine(currentStreak, trainedToday)}
              </Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>LAST SEVEN DAYS</Text>
              <WeekStrip today={today} trainedDays={days.map(day => day.day)} />
            </View>

            <View style={styles.best}>
              <View style={styles.bestTile}>
                <Icon name="trophy" color={colors.accentText} size={20} />
              </View>
              <View style={styles.bestText}>
                <Text style={styles.bestLabel}>BEST EVER</Text>
                <Text style={styles.bestValue}>
                  {streak.bestStreak}{' '}
                  <Text style={styles.bestUnit}>
                    {streak.bestStreak === 1 ? 'day' : 'days'}
                  </Text>
                </Text>
              </View>
            </View>

            <Text style={styles.note}>
              Days are your phone's local days, and a streak isn't broken until a
              whole one goes by without a finished workout — so it still stands
              the morning after.
            </Text>
          </>
        ) : (
          <NeedsAccount what="Your streak" />
        )}
      </Animated.View>
    </ScrollView>
  );
}

/**
 * The line under the number.
 *
 * Four states, and the difference between them matters more than the number
 * does: "done for today" and "today is still open" are the same integer and
 * completely different situations to be in.
 */
function statusLine(current: number, trainedToday: boolean): string {
  if (current === 0) {
    return 'Finish a workout today to start one.';
  }
  if (trainedToday) {
    return current === 1
      ? 'Day one is done. Come back tomorrow.'
      : 'Today is in. Nothing left to do.';
  }
  return 'Still alive — one workout today keeps it going.';
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

  current: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: HAIRLINE,
    borderColor: colors.hairline,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    gap: 2,
  },
  flame: {
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: colors.accentWash,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  currentValue: { ...sized(type.mega, 68), ...tabular, color: colors.white },
  currentUnit: { ...type.tag, color: colors.accentText },
  currentNote: {
    ...type.helper,
    fontSize: 14,
    color: colors.mutedOnDark,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: spacing.sm,
  },

  card: {
    backgroundColor: colors.surface,
    borderWidth: HAIRLINE,
    borderColor: colors.hairline,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.md,
  },
  cardTitle: { ...sized(type.tag, 10), color: colors.accentText },

  best: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: HAIRLINE,
    borderColor: colors.hairline,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  bestTile: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.accentWash,
    borderWidth: HAIRLINE,
    borderColor: colors.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bestText: { flex: 1, gap: 3 },
  bestLabel: { ...sized(type.tag, 10), color: colors.accentText },
  bestValue: { ...sized(type.title, 24), ...tabular, color: colors.white },
  bestUnit: { ...type.body, fontWeight: '600', color: colors.mutedOnDark },

  note: {
    ...type.helper,
    fontSize: 13,
    color: colors.faintOnDark,
    lineHeight: 18,
    marginTop: spacing.xs,
  },
});
