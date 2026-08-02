import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { useReduceMotion } from '../hooks/useReduceMotion';

/**
 * A padlock whose shackle actually swings open.
 *
 * Drawn as SVG in a 24-unit box. It used to be built from two plain views, with
 * the shackle faked as a `View` with only its top borders drawn — but CSS
 * mitres border corners, so with `borderBottomWidth: 0` the side borders taper
 * to points and the "arch" renders as a wedge. Closed it just about passed;
 * open, tilted away from the body, it read as a floating loop rather than a
 * lock.
 *
 * The shackle is hinged on the base of its right leg, so opening is a real
 * rotation about a real pivot rather than a slide. React Native has no
 * transform-origin, so the pivot is the standard translate-rotate-translate
 * sandwich — which keeps the whole thing on transforms, and therefore on the
 * native driver.
 *
 * Nothing animates an SVG prop: the two SVGs are static and the RN view around
 * the shackle is what moves. That also keeps it clear of the `collapsable`
 * warning that animated SVG children produce on the web.
 */

/** The drawing grid. All geometry below is in these units. */
const BOX = 24;

/**
 * Left leg up, semicircle over, right leg down. Both ends run a little past
 * the body's top edge so they're hidden behind it when the lock is shut.
 */
const SHACKLE = 'M6 11 V7.5 A4 4 0 0 1 14 7.5 V11';

/** The body. Sits left of centre, leaving room for the shackle to swing clear. */
const BODY = { x: 2.5, y: 10.5, width: 15, height: 11, rx: 2.6 };

/**
 * Where the shackle goes when open: up and to the right, still upright.
 *
 * Every recognisable open-padlock icon — Material, Feather, SF Symbols — keeps
 * the shackle vertical and lifts it off the body. Tilting it, which is what a
 * real padlock does, reads as a question mark at 26px rather than as a lock.
 */
const OPEN_OFFSET = { x: 5.5, y: -1.5 };

export function LockGlyph({
  locked,
  color,
  size = 26,
}: {
  locked: boolean;
  color: string;
  /** Width of the whole glyph, in px. Everything scales off it. */
  size?: number;
}) {
  const reduceMotion = useReduceMotion();
  const open = useRef(new Animated.Value(locked ? 0 : 1)).current;
  /** 0 at rest, 1 at the peak of the beat that marks a change of state. */
  const beat = useRef(new Animated.Value(0)).current;
  const first = useRef(true);

  useEffect(() => {
    const target = locked ? 0 : 1;
    if (reduceMotion) {
      open.setValue(target);
      return;
    }
    const animation = Animated.spring(open, {
      toValue: target,
      speed: 13,
      bounciness: 8,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [locked, open, reduceMotion]);

  // A single beat when the state actually changes — the whole glyph swells and
  // a soft halo blooms out behind it. This fires on the two moments the app
  // exists for: the set starting, and rest running out. Not on mount, or every
  // screen that shows a lock would announce itself for no reason.
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (reduceMotion) {
      return;
    }
    beat.setValue(0);
    const animation = Animated.sequence([
      Animated.timing(beat, {
        toValue: 1,
        duration: 160,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.spring(beat, {
        toValue: 0,
        speed: 9,
        bounciness: 6,
        useNativeDriver: true,
      }),
    ]);
    animation.start();
    return () => animation.stop();
  }, [locked, beat, reduceMotion]);

  const scale = size / BOX;
  const lift = (distance: number) =>
    open.interpolate({ inputRange: [0, 1], outputRange: [0, distance * scale] });

  const swell = beat.interpolate({ inputRange: [0, 1], outputRange: [1, 1.14] });

  return (
    // Purely decorative: it carries no text, and the panel around it owns the
    // accessibility label that says the same thing in words.
    <Animated.View
      style={[
        styles.box,
        { width: size, height: size, transform: [{ scale: swell }] },
      ]}>
      {/* The halo. Sits furthest back and never takes a tap; it only ever
          exists for the ~400ms of a beat, so it costs nothing at rest. */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.halo,
          {
            borderRadius: size,
            backgroundColor: color,
            opacity: beat.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 0.28],
            }),
            transform: [
              {
                scale: beat.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.7, 1.5],
                }),
              },
            ],
          },
        ]}
      />

      {/* Behind the body, so both legs disappear into it when shut. */}
      <Animated.View
        style={[
          styles.layer,
          {
            transform: [
              { translateX: lift(OPEN_OFFSET.x) },
              { translateY: lift(OPEN_OFFSET.y) },
            ],
          },
        ]}>
        <Svg width={size} height={size} viewBox={`0 0 ${BOX} ${BOX}`}>
          <Path
            d={SHACKLE}
            stroke={color}
            strokeWidth={2.4}
            strokeLinecap="round"
            fill="none"
          />
        </Svg>
      </Animated.View>

      <View style={styles.layer} pointerEvents="none">
        <Svg width={size} height={size} viewBox={`0 0 ${BOX} ${BOX}`}>
          <Rect {...BODY} fill={color} />
        </Svg>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  box: { alignItems: 'center', justifyContent: 'center' },
  layer: { position: 'absolute', top: 0, left: 0 },
  halo: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
});
