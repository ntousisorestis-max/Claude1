import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Icon, type IconName } from './Icon';
import { colors, HAIRLINE, radius, sized, spacing, type } from '../theme';

/**
 * One card on the Settings tab: an icon tile, a heading, a line of
 * explanation, and whatever the section actually contains.
 *
 * The tile is the only place in the app that puts an icon in a filled square.
 * It earns it here because these are the top of a hierarchy — four cards, each
 * about a different thing — where an inline glyph beside the words wouldn't
 * separate them enough to scan.
 */
export function SettingsSection({
  icon,
  mark,
  title,
  description,
  children,
}: {
  icon: IconName;
  /** Drawn in the tile instead of `icon`, for the one section whose subject is
   * the app's own mark — the line-icon dumbbell reads as a capital H at 20px. */
  mark?: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <View style={styles.tile}>
          {mark ?? <Icon name={icon} color={colors.accentText} size={20} />}
        </View>
        <View style={styles.headText}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>
        </View>
      </View>

      {children}
    </View>
  );
}

const TILE = 44;

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: HAIRLINE,
    borderColor: colors.hairline,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.md,
  },
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  tile: {
    width: TILE,
    height: TILE,
    borderRadius: radius.md,
    backgroundColor: colors.accentWash,
    borderWidth: HAIRLINE,
    borderColor: colors.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headText: { flex: 1, gap: 3, paddingTop: 2 },
  title: { ...sized(type.title, 21), color: colors.white },
  description: { ...type.helper, fontSize: 14, color: colors.mutedOnDark, lineHeight: 20 },
});
