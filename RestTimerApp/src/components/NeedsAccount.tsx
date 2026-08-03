import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Icon } from './Icon';
import { useAccount } from '../cloud/AccountContext';
import { colors, HAIRLINE, radius, sized, spacing, type } from '../theme';

/**
 * What Insights and Streaks show when there is nothing to show them from.
 *
 * Both tabs read data that only exists per account, so signed out they are
 * genuinely empty. The honest thing is to say why and where to fix it, rather
 * than draw a streak of zero and a week of empty boxes — those look like a
 * verdict on the user, when in fact the app simply isn't recording anything.
 *
 * It deliberately does not offer a sign-in button. That lives in exactly one
 * place, on Settings, and a second entry point into the same sheet is a second
 * thing to keep in step for no benefit.
 */
export function NeedsAccount({
  /** What this tab says when signed out. Written per screen — see src/copy.ts. */
  empty,
}: {
  empty: { title: string; body: string };
}) {
  const { status } = useAccount();

  // The unconfigured case is instructions rather than voice, so it's fixed here
  // and doesn't rotate or vary by tab: there is exactly one thing to do about
  // it, and it's the same thing on both screens.
  const { title, body } =
    status === 'unconfigured'
      ? {
          title: 'Not switched on yet',
          body:
            'Accounts need a Firebase project. FIREBASE_SETUP.md walks through ' +
            'it — about ten minutes, and free.',
        }
      : empty;

  return (
    <View style={styles.card}>
      <View style={styles.tile}>
        <Icon name="user" color={colors.faintOnDark} size={20} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.hairline,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  tile: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.ink,
    borderWidth: HAIRLINE,
    borderColor: colors.hairline,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  title: { ...sized(type.title, 20), color: colors.white, textAlign: 'center' },
  body: {
    ...type.helper,
    fontSize: 14,
    color: colors.mutedOnDark,
    lineHeight: 20,
    textAlign: 'center',
  },
});
