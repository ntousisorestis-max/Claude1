import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Icon, type IconName } from './Icon';
import { colors, spacing, type } from '../theme';

/**
 * A section's micro-label with its icon.
 *
 * Every screen had the same `{ ...type.tag, color: faintOnDark }` label; this
 * puts the icon on it once instead of four times, and keeps the icon's size
 * and colour tied to the text it belongs to.
 */
export function SectionLabel({
  icon,
  children,
}: {
  icon: IconName;
  children: string;
}) {
  return (
    <View style={styles.row}>
      <Icon name={icon} color={colors.faintOnDark} size={15} strokeWidth={1.9} />
      <Text style={styles.label}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  label: { ...type.tag, color: colors.faintOnDark },
});
