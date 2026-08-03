import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { usePressScale } from '../hooks/usePressScale';
import { useReduceMotion } from '../hooks/useReduceMotion';
import { colors, HAIRLINE, radius, sized, spacing, type } from '../theme';

export type Tab = 'workout' | 'insights' | 'streaks' | 'settings';

/** In bar order. One list, so a new tab can't be added to half the app. */
export const TABS: { tab: Tab; label: string }[] = [
  { tab: 'workout', label: 'Workout' },
  { tab: 'insights', label: 'Insights' },
  { tab: 'streaks', label: 'Streaks' },
  { tab: 'settings', label: 'Settings' },
];

/**
 * Four tabs, hand-rolled.
 *
 * A navigation library would mean three native dependencies and a router for
 * what is a single piece of state. The workout phase still drives which screen
 * shows inside the Workout tab — this only picks between the four tabs.
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
      {TABS.map(({ tab, label }) => (
        <TabButton
          key={tab}
          tab={tab}
          label={label}
          active={active === tab}
          onPress={onChange}
        />
      ))}
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
  const tint = active ? colors.accentText : colors.faintOnDark;
  const pressScale = usePressScale({ depth: 0.92, haptic: true });
  const reduceMotion = useReduceMotion();

  /**
   * The selected pill, grown into place rather than switched on.
   *
   * A separate view behind the glyph rather than a conditional
   * `backgroundColor`, because colour is not something the native driver can
   * animate — opacity and scale are. The rendered result is identical; only the
   * way it arrives changed.
   */
  const selected = useRef(new Animated.Value(active ? 1 : 0)).current;

  useEffect(() => {
    if (reduceMotion) {
      selected.setValue(active ? 1 : 0);
      return;
    }
    const animation = Animated.timing(selected, {
      toValue: active ? 1 : 0,
      // Short. This is a tab switch, and the screen behind it is already
      // crossfading — a pill still settling when the new screen has arrived
      // reads as lag.
      duration: 160,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [active, selected, reduceMotion]);

  return (
    <Pressable
      {...pressScale.handlers}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
      onPress={() => onPress(tab)}
      style={styles.tab}>
      <Animated.View style={[styles.tabInner, pressScale.style]}>
        {/* The glyph sits in a violet pill when selected. It's the only
            treatment here — a bar that grows an underline, a dot and a colour
            change is three ways of saying one thing. */}
        <View style={styles.glyph}>
          <Animated.View
            pointerEvents="none"
            style={[
              styles.pill,
              {
                opacity: selected,
                transform: [
                  {
                    scale: selected.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.9, 1],
                    }),
                  },
                ],
              },
            ]}
          />
          <Svg width={24} height={24} viewBox="0 0 24 24">
            <Glyph tab={tab} tint={tint} />
          </Svg>
        </View>
        <Text style={[styles.label, { color: tint }]}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
}

function Glyph({ tab, tint }: { tab: Tab; tint: string }) {
  switch (tab) {
    case 'workout':
      return <DumbbellGlyph tint={tint} />;
    case 'insights':
      return <BarsGlyph tint={tint} />;
    case 'streaks':
      return <FlameGlyph tint={tint} />;
    case 'settings':
      return <SlidersGlyph tint={tint} />;
  }
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

/**
 * Three rising bars for Insights.
 *
 * Filled, like the dumbbell's plates and unlike the sliders, because the bars
 * are thin enough at 24px that stroking them turns three shapes into six lines.
 */
function BarsGlyph({ tint }: { tint: string }) {
  return (
    <>
      <Rect x="3.5" y="13" width="4.2" height="7.5" rx="1.6" fill={tint} />
      <Rect x="9.9" y="8.5" width="4.2" height="12" rx="1.6" fill={tint} />
      <Rect x="16.3" y="3.5" width="4.2" height="17" rx="1.6" fill={tint} />
    </>
  );
}

/**
 * A flame for Streaks.
 *
 * Solid, with the inner flame knocked back out in the bar's own colour — the
 * same trick the sliders use for their knobs. A two-stroke outline flame reads
 * as a leaf at this size; mass is what makes it fire.
 */
function FlameGlyph({ tint }: { tint: string }) {
  return (
    <>
      <Path
        d="M12 1.8c-.8 2.5-2.2 4-3.5 5.6C6.8 9.3 5 12 5 15.4a7 7 0 0 0 14 0c0-3.4-1.8-6.1-3.5-8-1.3-1.6-2.7-3.1-3.5-5.6z"
        fill={tint}
      />
      <Path
        d="M12 12.4c-.45 1.1-1.1 1.8-1.75 2.6-.75.9-1.35 2-1.35 3.3a3.1 3.1 0 0 0 6.2 0c0-1.3-.6-2.4-1.35-3.3-.65-.8-1.3-1.5-1.75-2.6z"
        fill={colors.ink}
      />
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
  tab: { flex: 1, paddingVertical: spacing.sm },
  tabInner: { alignItems: 'center', justifyContent: 'center', gap: 5 },
  glyph: {
    // Narrower than it was with two tabs. At four, a quarter of a 320pt phone
    // is 80pt, and the old 22pt side padding made a 68pt pill that touched its
    // neighbours.
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  /** Sits behind the glyph and fills the padded box the glyph defines. */
  pill: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: radius.pill,
    backgroundColor: colors.accentWash,
  },
  label: { ...sized(type.tag, 11) },
});
