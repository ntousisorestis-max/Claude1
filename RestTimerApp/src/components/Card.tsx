import React from 'react';
import { StyleSheet, View, type ViewProps, type ViewStyle } from 'react-native';
import { radius, themed } from '../theme';

/**
 * The app's one card: a surface that floats, not a box that's drawn.
 *
 * Every card used to be `colors.surface` plus a hairline border, copy-pasted
 * independently in a dozen places — the exact repetition that made the app
 * read as generic component-library UI rather than something designed. A
 * border says "here is a boundary you are not meant to cross"; a soft shadow
 * says "this is resting slightly above the page", which is the quieter,
 * organic read the app goes for everywhere now.
 *
 * Unopinionated about padding and internal spacing, same as `GlassCard` —
 * those stay with whoever's using it.
 */
export function Card({
  children,
  style,
  ...rest
}: {
  children: React.ReactNode;
  style?: ViewStyle | (ViewStyle | undefined | false)[];
} & Omit<ViewProps, 'style'>) {
  const styles = useStyles();
  return (
    <View
      {...rest}
      style={[styles.card, ...(Array.isArray(style) ? style : [style])]}
    >
      {children}
    </View>
  );
}

const useStyles = themed(colors =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      shadowColor: colors.dropShadow,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.22,
      shadowRadius: 20,
      elevation: 6,
    },
  }),
);
