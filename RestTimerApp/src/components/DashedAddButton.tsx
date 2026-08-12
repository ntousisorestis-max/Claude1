import React from 'react';
import { Animated, Pressable, StyleSheet, Text } from 'react-native';
import { Icon } from './Icon';
import { usePressScale } from '../hooks/usePressScale';
import { radius, spacing, TAP_TARGET, themed, type, useColors } from '../theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * The dashed "add one more" invitation — a new exercise, a new blocked app.
 *
 * Two screens had built this independently: one at 60pt with a literal "+"
 * folded into the label text, one at 52pt with a real plus glyph beside it.
 * Same idea, two heights and two ways of drawing the plus. One component now,
 * at the app's full tap-target height — this is the main way to add the
 * thing it's adding, not an afterthought that earns a smaller target.
 */
export function DashedAddButton({
  label,
  onPress,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  const styles = useStyles();
  const colors = useColors();
  const press = usePressScale({ depth: 0.98, haptic: !disabled });

  return (
    <AnimatedPressable
      {...press.handlers}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      onPress={onPress}
      disabled={disabled}
      style={[styles.add, disabled && styles.addOff, press.style]}
    >
      <Icon name="plus" color={disabled ? colors.faint : colors.accentText} size={18} />
      <Text style={[styles.addText, disabled && styles.addTextOff]}>{label}</Text>
    </AnimatedPressable>
  );
}

const useStyles = themed(colors =>
  StyleSheet.create({
    add: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      minHeight: TAP_TARGET,
      borderRadius: radius.md,
      borderWidth: 1.5,
      borderStyle: 'dashed',
      borderColor: colors.hairline,
    },
    addOff: { opacity: 0.45 },
    addText: { ...type.body, fontWeight: '600', color: colors.accentText },
    addTextOff: { color: colors.faint },
  }),
);
