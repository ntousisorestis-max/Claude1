import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Icon, type IconName } from './Icon';
import { Pop } from './Pop';
import { colors, describeDuration, HAIRLINE, radius, sized, spacing, type } from '../theme';
import type { SessionTotals } from '../state/types';

/**
 * Three numbers for the session so far.
 *
 * Labelled "this session" rather than "today" on purpose. Nothing here is
 * persisted — there are no accounts and no storage for workout history — so
 * every one of these is zero again after a restart, and a label saying "today"
 * would be a promise the app can't keep.
 */
export function SessionStats({ session }: { session: SessionTotals }) {
  const focus = describeDuration(session.lockedSeconds);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>THIS SESSION</Text>

      <View style={styles.row}>
        <Stat
          icon="check"
          value={String(session.setsCompleted)}
          label="Sets completed"
        />
        <Stat
          icon="flame"
          // "12m" reads at a glance where "12 minutes" wraps in a third of a row.
          value={`${focus.value}${focus.unit.startsWith('min') ? 'm' : 's'}`}
          label="Focus time"
        />
        <Stat
          icon="trophy"
          value={String(session.workoutsFinished)}
          label="Workouts done"
        />
      </View>
    </View>
  );
}

function Stat({
  icon,
  value,
  label,
}: {
  icon: IconName;
  value: string;
  label: string;
}) {
  return (
    <View
      style={styles.stat}
      accessibilityRole="text"
      accessibilityLabel={`${value} ${label}`}>
      <Icon name={icon} color={colors.accent} size={22} strokeWidth={1.9} />
      {/* Left-anchored, so a stat that pops doesn't shove its neighbours. */}
      <Pop value={value} style={styles.popped}>
        <Text style={styles.value}>{value}</Text>
      </Pop>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: HAIRLINE,
    borderColor: colors.hairline,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
    gap: spacing.lg,
  },
  title: { ...type.tag, color: colors.accentText },
  row: { flexDirection: 'row' },
  stat: { flex: 1, gap: spacing.sm },
  popped: { alignSelf: 'flex-start' },
  value: { ...sized(type.title, 28), color: colors.white },
  label: { ...type.helper, fontSize: 13, color: colors.mutedOnDark },
});
