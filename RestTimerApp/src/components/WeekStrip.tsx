import React from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Icon } from './Icon';
import { recentDays, weekdayOf } from '../cloud/days';
import { useEnter } from '../hooks/useEnter';
import { colors, HAIRLINE, radius, sized, spacing, type } from '../theme';

/**
 * The last seven days, ticked where they were trained.
 *
 * **Rolling, not Monday-to-Sunday.** A calendar week would put three or four
 * empty boxes to the right of today for most of the week, and an empty box you
 * haven't reached yet looks exactly like one you missed. Seven days ending
 * today means every column is a day that has actually happened, so a blank one
 * always means the same thing.
 */
export function WeekStrip({
  today,
  /** The days that have at least one workout on them. Order doesn't matter. */
  trainedDays,
}: {
  today: string;
  trainedDays: string[];
}) {
  const week = recentDays(today, 7);
  const trained = new Set(trainedDays);

  return (
    <View style={styles.strip}>
      {week.map((day, index) => {
        const done = trained.has(day);
        const isToday = day === today;

        return (
          <Column
            key={day}
            index={index}
            accessibilityRole="text"
            accessibilityLabel={`${weekdayOf(day)}${isToday ? ', today' : ''}: ${
              done ? 'trained' : 'no workout'
            }`}>
            <Text style={[styles.weekday, isToday && styles.weekdayToday]}>
              {/* One letter. Three would need a font size nothing else on the
                  screen uses, and "T" twice is unambiguous in a row that is
                  always in order and always ends today. */}
              {weekdayOf(day).slice(0, 1)}
            </Text>

            <View style={[styles.box, done && styles.boxDone, isToday && styles.boxToday]}>
              {done ? (
                <Icon name="check" color={colors.white} size={16} strokeWidth={2.4} />
              ) : null}
            </View>
          </Column>
        );
      })}
    </View>
  );
}

/**
 * One day, arriving a beat after the one to its left.
 *
 * Thirty milliseconds apart, so the row assembles left to right — the same
 * direction it's read, ending on today. A whole week appearing at once is
 * correct and lifeless; staggering it is the only motion on an otherwise
 * completely still screen.
 *
 * On mount only. It is not keyed on the data, so a day filling in later
 * doesn't re-run the whole row.
 */
function Column({
  index,
  children,
  ...rest
}: {
  index: number;
  children: React.ReactNode;
} & React.ComponentProps<typeof View>) {
  const enter = useEnter(index * 30);

  return (
    <Animated.View {...rest} style={[styles.column, enter]}>
      {children}
    </Animated.View>
  );
}

const BOX = 38;

const styles = StyleSheet.create({
  strip: { flexDirection: 'row', gap: spacing.xs },
  column: { flex: 1, alignItems: 'center', gap: spacing.sm },
  weekday: { ...sized(type.tag, 10), color: colors.faintOnDark },
  weekdayToday: { color: colors.accentText },
  box: {
    width: '100%',
    maxWidth: BOX,
    height: BOX,
    borderRadius: radius.sm,
    borderWidth: HAIRLINE,
    borderColor: colors.hairline,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxDone: { backgroundColor: colors.accent, borderColor: colors.accent },
  // Today gets a ring whether or not it's been trained, so "where am I in this
  // row" never depends on having already been to the gym.
  boxToday: { borderWidth: 2, borderColor: colors.accent },
});
