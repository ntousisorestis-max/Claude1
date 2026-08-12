import React from 'react';
import { Animated, Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { usePressScale } from '../hooks/usePressScale';
import { radius, sized, spacing, themed, type } from '../theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Variant = 'solid' | 'outline';

/**
 * The small pill inside a composer — "Save name", "Add app", "Cancel".
 *
 * Three screens had independently built this exact control (a compact accent
 * pill next to a quiet one) and drifted apart doing it: one used
 * `colors.white` for the label on a solid accent fill, which is the theme's
 * *near-black* text colour in light mode — dark text on violet, unreadable.
 * One shared component means there's only one place left to get it wrong.
 *
 * Not `BigButton`: that's a screen's one primary action at a deliberately
 * generous height. This is the smaller pair that lives *inside* a card,
 * confirming or backing out of whatever the card just opened.
 */
export function PillAction({
  label,
  onPress,
  variant = 'solid',
  disabled = false,
  style,
}: {
  label: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  style?: ViewStyle;
}) {
  const styles = useStyles();
  const press = usePressScale({ depth: 0.95, haptic: !disabled });

  return (
    <AnimatedPressable
      {...press.handlers}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.pill,
        styles[variant],
        disabled && styles.disabled,
        press.style,
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          styles[`${variant}Text`],
          disabled && styles.disabledText,
        ]}
      >
        {label}
      </Text>
    </AnimatedPressable>
  );
}

const useStyles = themed(colors =>
  StyleSheet.create({
    pill: {
      minHeight: 48,
      borderRadius: radius.pill,
      paddingHorizontal: spacing.lg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    solid: { backgroundColor: colors.accent },
    outline: { backgroundColor: colors.raised },
    disabled: { backgroundColor: colors.ink },

    /**
     * 19px bold. White on `accent` is 4.22:1 — over AA's 3.0 for large text,
     * under the 4.5 for body text — and WCAG's line is 18.66px bold.
     */
    text: { ...sized(type.action, 19) },
    solidText: { color: colors.textOnAccent },
    outlineText: { color: colors.muted },
    disabledText: { color: colors.faint },
  }),
);
