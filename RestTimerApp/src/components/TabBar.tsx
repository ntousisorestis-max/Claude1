import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { usePressScale } from '../hooks/usePressScale';
import { useReduceMotion } from '../hooks/useReduceMotion';
import {
  HAIRLINE,
  radius,
  sized,
  spacing,
  themed,
  type,
  useColors,
} from '../theme';

export type Tab = 'workout' | 'insights' | 'streaks' | 'settings';

/** In bar order. One list, so a new tab can't be added to half the app. */
export const TABS: { tab: Tab; label: string }[] = [
  { tab: 'workout', label: 'Workout' },
  { tab: 'insights', label: 'Insights' },
  { tab: 'streaks', label: 'Streaks' },
  { tab: 'settings', label: 'Settings' },
];

/** How tall the pill itself is. */
const PILL_HEIGHT = 64;
/** How far it sits in from the sides, and up from the bottom. */
const SIDE_INSET = 20;
const BOTTOM_GAP = 12;
/**
 * Air between the pill and the last thing a screen scrolls past it.
 *
 * 28 rather than a token, because the tightest case decided it: a Workout tab
 * with one exercise ends on "+ Add exercise", and at 20 that button stopped
 * close enough to the pill to read as crowding it rather than clearing it.
 */
const BREATHING = 28;

/**
 * What every scrolling screen must put at the bottom of its content.
 *
 * The pill floats over the content rather than sitting under it, so nothing
 * reserves this space automatically — each screen has to. Exported from here,
 * beside the numbers it is derived from, because the alternative is four copies
 * of a magic number that quietly stop matching the pill the first time its
 * height changes.
 *
 * Getting it wrong is not subtle in the worst case: on a Workout tab with no
 * exercises there is only ~36pt of scroll available, and the last thing on it
 * is the button that saves your first exercise.
 */
export const TAB_BAR_CLEARANCE = BOTTOM_GAP + PILL_HEIGHT + BREATHING;

/**
 * Four tabs, hand-rolled, in a pill that floats above the content.
 *
 * A navigation library would mean three native dependencies and a router for
 * what is a single piece of state. The workout phase still drives which screen
 * shows inside the Workout tab — this only picks between the four tabs.
 *
 * ## Why it floats
 *
 * A full-width bar welded to the bottom edge, painted the page's own colour
 * with a hairline across the top, is the default every framework hands you.
 * Lifting it off the edge and letting content scroll underneath is most of the
 * difference between "an app" and "a nice app", and it costs one absolutely
 * positioned view.
 *
 * The dock spanning the full width is `box-none` so taps either side of the
 * pill fall through to whatever is behind them — without that it would swallow
 * presses on the bottom corners of every screen.
 */
export function TabBar({
  active,
  onChange,
}: {
  active: Tab;
  onChange: (tab: Tab) => void;
}) {
  const styles = useStyles();
  // The home indicator. The pill sits above it rather than under it, and the
  // content inside the safe area is measured from the same line, so the two
  // agree about where the bottom of the screen is.
  const insets = useSafeAreaInsets();

  return (
    <View
      pointerEvents="box-none"
      style={[styles.dock, { paddingBottom: insets.bottom + BOTTOM_GAP }]}
    >
      <View style={styles.pillBar}>
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
  const styles = useStyles();
  const colors = useColors();
  const tint = active ? colors.accentText : colors.faint;
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
      style={styles.tab}
    >
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
            <Glyph tab={tab} tint={tint} hole={colors.surface} />
          </Svg>
        </View>
        <Text style={[styles.label, { color: tint }]}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
}

/**
 * `hole` is the colour showing through a knocked-out shape.
 *
 * It used to be the page colour, which was the same thing as the bar's colour
 * back when the bar was painted in it. The pill is its own surface now, so a
 * hole punched in the page colour would read as a dark blob inside the flame
 * and inside both slider knobs. Passed down for the same reason `BrandIcon`
 * takes one.
 */
function Glyph({ tab, tint, hole }: { tab: Tab; tint: string; hole: string }) {
  switch (tab) {
    case 'workout':
      return <DumbbellGlyph tint={tint} />;
    case 'insights':
      return <BarsGlyph tint={tint} />;
    case 'streaks':
      return <FlameGlyph tint={tint} hole={hole} />;
    case 'settings':
      return <SlidersGlyph tint={tint} hole={hole} />;
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
function FlameGlyph({ tint, hole }: { tint: string; hole: string }) {
  return (
    <>
      <Path
        d="M12 1.8c-.8 2.5-2.2 4-3.5 5.6C6.8 9.3 5 12 5 15.4a7 7 0 0 0 14 0c0-3.4-1.8-6.1-3.5-8-1.3-1.6-2.7-3.1-3.5-5.6z"
        fill={tint}
      />
      <Path
        d="M12 12.4c-.45 1.1-1.1 1.8-1.75 2.6-.75.9-1.35 2-1.35 3.3a3.1 3.1 0 0 0 6.2 0c0-1.3-.6-2.4-1.35-3.3-.65-.8-1.3-1.5-1.75-2.6z"
        fill={hole}
      />
    </>
  );
}

/** Sliders — clearer at 24px than a gear, whose teeth turn to mush. */
function SlidersGlyph({ tint, hole }: { tint: string; hole: string }) {
  return (
    <>
      <Path
        d="M4 7h16M4 17h16"
        stroke={tint}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <Circle cx="9.5" cy="7" r="3" fill={hole} stroke={tint} strokeWidth="2" />
      <Circle cx="15" cy="17" r="3" fill={hole} stroke={tint} strokeWidth="2" />
    </>
  );
}

const useStyles = themed(colors =>
  StyleSheet.create({
    /**
     * Spans the width so the pill can centre itself, but paints nothing and
     * catches nothing — see `pointerEvents` on the view itself.
     */
    dock: {
      position: 'absolute',
      left: SIDE_INSET,
      right: SIDE_INSET,
      bottom: 0,
    },
    pillBar: {
      flexDirection: 'row',
      alignItems: 'center',
      height: PILL_HEIGHT,
      borderRadius: radius.pill,
      backgroundColor: colors.surface,
      borderWidth: HAIRLINE,
      borderColor: colors.hairline,
      // A real shadow rather than the violet `shadow` token, which is a glow —
      // a nav bar that appears to be radiating is not the effect.
      shadowColor: colors.dropShadow,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.3,
      shadowRadius: 16,
      elevation: 8,
    },
    tab: { flex: 1, paddingVertical: spacing.xs },
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
  }),
);
