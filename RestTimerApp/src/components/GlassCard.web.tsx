import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { HAIRLINE, radius, themed } from '../theme';

/**
 * The web twin of GlassCard, which adds the real blur.
 *
 * `backdropFilter` isn't a React Native style property — there's no native
 * equivalent wired up in this app, so widening the shared type for it would
 * offer a property that silently does nothing on a phone. Declared only
 * here, where the web build's styling passes it straight through to the
 * browser as real CSS. See GlassCard.tsx for why native doesn't have it yet.
 */
export function GlassCard({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  const styles = useStyles();
  return <View style={[styles.card, blur, style]}>{children}</View>;
}

const blur = { backdropFilter: 'blur(20px)' } as ViewStyle;

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
