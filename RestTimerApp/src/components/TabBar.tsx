import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { colors, HAIRLINE, spacing, type } from '../theme';

export type Tab = 'workout' | 'settings';

/**
 * Two tabs, hand-rolled.
 *
 * A navigation library would mean three native dependencies and a router for
 * what is a single piece of state. The workout phase still drives which screen
 * shows inside the Workout tab — this only picks between the two tabs.
 */
export function TabBar({
  active,
  onChange,
}: {
  active: Tab;
  onChange: (tab: Tab) => void;
}) {
  return (
    <View style={styles.bar}>
      <TabButton
        tab="workout"
        label="Workout"
        active={active === 'workout'}
        onPress={onChange}
      />
      <TabButton
        tab="settings"
        label="Settings"
        active={active === 'settings'}
        onPress={onChange}
      />
    </View>
  );
}

function TabButton({
  tab,
  label,
  active,
  onPress,
}: {
  tab: Tab;
  label: string;
  active: boolean;
  onPress: (tab: Tab) => void;
}) {
  const tint = active ? colors.accent : colors.faintOnDark;

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
      onPress={() => onPress(tab)}
      style={({ pressed }) => [styles.tab, pressed && styles.pressed]}>
      <Svg width={24} height={24} viewBox="0 0 24 24">
        {tab === 'workout' ? <DumbbellGlyph tint={tint} /> : <SlidersGlyph tint={tint} />}
      </Svg>
      <Text style={[styles.label, { color: tint }]}>{label}</Text>
    </Pressable>
  );
}

/** Dumbbell: two end plates and a bar. */
function DumbbellGlyph({ tint }: { tint: string }) {
  return (
    <>
      <Rect x="1.5" y="8.5" width="3.5" height="7" rx="1.4" fill={tint} />
      <Rect x="19" y="8.5" width="3.5" height="7" rx="1.4" fill={tint} />
      <Rect x="5.5" y="6.5" width="4" height="11" rx="1.6" fill={tint} />
      <Rect x="14.5" y="6.5" width="4" height="11" rx="1.6" fill={tint} />
      <Rect x="9" y="10.6" width="6" height="2.8" rx="1.4" fill={tint} />
    </>
  );
}

/** Sliders — clearer at 24px than a gear, whose teeth turn to mush. */
function SlidersGlyph({ tint }: { tint: string }) {
  return (
    <>
      <Path d="M4 7h16M4 17h16" stroke={tint} strokeWidth="2" strokeLinecap="round" />
      <Circle cx="9.5" cy="7" r="3" fill={colors.ink} stroke={tint} strokeWidth="2" />
      <Circle cx="15" cy="17" r="3" fill={colors.ink} stroke={tint} strokeWidth="2" />
    </>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    borderTopWidth: HAIRLINE,
    borderTopColor: colors.hairline,
    backgroundColor: colors.ink,
    paddingTop: spacing.sm,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: spacing.sm,
  },
  pressed: { opacity: 0.6 },
  label: { ...type.tag, fontSize: 11 },
});
