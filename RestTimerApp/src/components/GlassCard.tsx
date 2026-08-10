import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { HAIRLINE, radius, themed } from '../theme';

/**
 * A translucent card — frosted glass, minus the frost.
 *
 * `colors.glass` lets whatever sits behind the card show through rather than
 * covering it, same as the reference designs this was built from. The actual
 * softening blur only renders on the web build — see `GlassCard.web.tsx` —
 * because there's no blur library installed for a phone, and no native build
 * of this app has ever been compiled to prove one out. This still reads as
 * glass without it: translucent, bordered, rounded, just without the soft
 * focus on whatever's behind it.
 *
 * Unopinionated about padding and internal spacing on purpose — those stay
 * with whoever's using it, same as every other card in the app.
 */
export function GlassCard({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  const styles = useStyles();
  return <View style={[styles.card, style]}>{children}</View>;
}

const useStyles = themed(colors =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.glass,
      borderWidth: HAIRLINE,
      borderColor: colors.hairline,
      borderRadius: radius.lg,
    },
  }),
);
