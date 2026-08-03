import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Icon, type IconName } from './Icon';
import { Pop } from './Pop';
import { colors, HAIRLINE, radius, sized, spacing, tabular, type } from '../theme';

/**
 * One number, given room.
 *
 * The Insights tab is three of these stacked. A row of three narrow tiles was
 * the obvious alternative and is what `SessionStats` already does on the
 * Workout tab — but that card is a footnote under an exercise list, whereas
 * here the numbers *are* the screen, and squeezing "4 hours 12 minutes" into a
 * third of a phone's width means abbreviating it into something nobody reads
 * as an achievement.
 */
export function StatCard({
  icon,
  value,
  unit,
  label,
  caption,
}: {
  icon: IconName;
  value: string;
  /** Sits next to the number at a smaller size — "minutes", "sets". */
  unit?: string;
  label: string;
  /** The line underneath that says where the number came from. */
  caption: string;
}) {
  return (
    <View
      style={styles.card}
      accessibilityRole="text"
      accessibilityLabel={`${label}: ${value}${unit ? ` ${unit}` : ''}. ${caption}`}>
      <View style={styles.tile}>
        <Icon name={icon} color={colors.accentText} size={20} />
      </View>

      <View style={styles.body}>
        <Text style={styles.label}>{label.toUpperCase()}</Text>
        <Pop value={value} depth={1.1} style={styles.popped}>
          <View style={styles.figure}>
            <Text style={styles.value}>{value}</Text>
            {unit ? <Text style={styles.unit}>{unit}</Text> : null}
          </View>
        </Pop>
        <Text style={styles.caption}>{caption}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: HAIRLINE,
    borderColor: colors.hairline,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  tile: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.accentWash,
    borderWidth: HAIRLINE,
    borderColor: colors.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, gap: 2 },
  label: { ...sized(type.tag, 10), color: colors.accentText },
  popped: { alignSelf: 'flex-start' },
  // Baseline-aligned, so the unit sits on the number's feet rather than
  // floating in the middle of it.
  figure: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  value: { ...sized(type.display, 34), ...tabular, color: colors.white },
  unit: { ...type.body, fontWeight: '600', color: colors.mutedOnDark },
  caption: {
    ...type.helper,
    fontSize: 13,
    color: colors.faintOnDark,
    lineHeight: 18,
    marginTop: 2,
  },
});
