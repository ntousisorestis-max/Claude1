import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, Image, StyleSheet, View } from 'react-native';
import { Bloom } from './Bloom';
import { useReduceMotion } from '../hooks/useReduceMotion';
import { radius, themed, useColors } from '../theme';

/**
 * The header's illustration: a 3D render of the hourglass, lit from within.
 *
 * ## Why this is a bitmap now, and what that cost
 *
 * It used to be hand-drawn SVG, which was the right call while it was an
 * illustration. It is now a render — real glass, real reflections, glowing sand
 * — and that is not reachable with paths and gradients at any sane line count.
 * So the object is a PNG and everything *around* it is still code.
 *
 * The PNG is generated, not raw: `scripts/feather-hourglass.mjs` takes the
 * render and dissolves its edges to nothing, because the render is a finished
 * picture on an opaque ground and would otherwise sit on the screen as a
 * rectangle. The reasoning, and the variants tried and rejected, are in there.
 *
 * The one thing lost by not having a true cutout: the render's own ring and
 * glow are baked in, so they can't be recoloured or pulsed. The ring is
 * therefore *not* drawn here — one drawn ring over one baked ring would read as
 * a mistake — and the rotation is kept to ±0.8° rather than the ±1.5° a cutout
 * would allow, because a ring you can see turning is a ring that looks wrong.
 *
 * ## The motion
 *
 * Four things, on deliberately unrelated timings so they never sync up into a
 * mechanical bob: a 4.4s float, an 11s drift of rotation, a 5.2s breath in the
 * glow behind, and particles on a 9s cycle. Every one is transform or opacity
 * only, so all of it runs on the native driver.
 *
 * Under reduce-motion the loops don't start, each value parks mid-travel, and
 * the particles are dropped entirely — five specks frozen around an illustration
 * read as dirt on the screen, not as a design.
 *
 * ## What isn't animated
 *
 * The sand. It can't be: it's painted into the image, and faking a stream in
 * code would mean hardcoding the pixel coordinates of the neck of this exact
 * render, which would silently point at the wrong place the day the art is
 * replaced. The render already has a visible stream in the neck, and a still
 * one reads as "time is passing" perfectly well.
 */

/** The asset's own proportions. */
const ASPECT = 651 / 541;
/** The bloom is drawn past the art so its falloff isn't cut off at the edge. */
const GLOW_SCALE = 1.45;

/**
 * Where the particles sit, as fractions of the box, and how far each drifts.
 *
 * Fixed rather than random: a fresh scatter on every render would reshuffle
 * whenever the header re-renders, which is the single most distracting thing a
 * background detail can do. `phase` staggers them around the shared cycle.
 */
const PARTICLES = [
  { x: 0.12, y: 0.64, r: 2, drift: 26, sway: 4, phase: 0 },
  { x: 0.87, y: 0.46, r: 1.5, drift: 22, sway: -3, phase: 0.34 },
  { x: 0.24, y: 0.3, r: 1.2, drift: 30, sway: 3, phase: 0.61 },
  { x: 0.79, y: 0.73, r: 2.4, drift: 18, sway: -5, phase: 0.17 },
  { x: 0.52, y: 0.16, r: 1.3, drift: 24, sway: 2, phase: 0.82 },
] as const;

export function HeroHourglass({ size = 150 }: { size?: number }) {
  const styles = useStyles();
  const colors = useColors();
  const reduceMotion = useReduceMotion();

  const float = useRef(new Animated.Value(0)).current;
  const spin = useRef(new Animated.Value(0)).current;
  const breath = useRef(new Animated.Value(0)).current;
  const drift = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduceMotion) {
      // Mid-travel, not at either end: a still frame should look like the
      // animation's average rather than like it stopped on a peak.
      float.setValue(0.5);
      spin.setValue(0.5);
      breath.setValue(0.5);
      return;
    }

    /** There and back, easing at both ends — the shape of a breath. */
    const swing = (value: Animated.Value, duration: number) =>
      Animated.loop(
        Animated.sequence(
          [1, 0].map(toValue =>
            Animated.timing(value, {
              toValue,
              duration,
              easing: Easing.inOut(Easing.quad),
              useNativeDriver: true,
            }),
          ),
        ),
      );

    const loops = [
      swing(float, 2200),
      swing(spin, 5500),
      swing(breath, 2600),
      // The particles run one way and restart, so this one is a plain ramp.
      Animated.loop(
        Animated.timing(drift, {
          toValue: 1,
          duration: 9000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ),
    ];
    loops.forEach(loop => loop.start());
    return () => loops.forEach(loop => loop.stop());
  }, [float, spin, breath, drift, reduceMotion]);

  const width = size;
  const height = Math.round(size * ASPECT);
  const glow = Math.round(width * GLOW_SCALE);

  const art = {
    transform: [
      {
        translateY: float.interpolate({
          inputRange: [0, 1],
          outputRange: [-3, 3],
        }),
      },
      {
        rotate: spin.interpolate({
          inputRange: [0, 1],
          outputRange: ['-0.8deg', '0.8deg'],
        }),
      },
    ],
  };

  const bloom = {
    opacity: breath.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }),
    transform: [
      {
        scale: breath.interpolate({
          inputRange: [0, 1],
          outputRange: [0.94, 1.05],
        }),
      },
    ],
  };

  return (
    // The stage is the whole light-mode answer. The art is a render of a dark
    // scene, so on a near-white page it can only ever be a smudge — feathering
    // decides where a picture stops, not that it is dark. So in light mode it
    // gets a tile of night to stand on, and the feathered edges land on that
    // instead of on the page. In dark mode `stage` is transparent and the tile
    // isn't there at all.
    <View style={[styles.box, { width, height }]}>
      <View style={[styles.stage, { borderRadius: radius.lg }]} />
      <Animated.View
        style={[styles.centre, { width: glow, height: glow }, bloom]}
        pointerEvents="none"
      >
        <Bloom size={glow} color={colors.accent} peak={0.22} mid={0.1} />
      </Animated.View>

      <Animated.View style={art}>
        {/* Decorative. The headline beside it is what says what the app does,
            and "hourglass illustration" read out after it adds nothing. */}
        <Image
          accessible={false}
          source={require('../../assets/hourglass.png')}
          style={{ width, height }}
          resizeMode="contain"
        />
      </Animated.View>

      {reduceMotion
        ? null
        : PARTICLES.map(particle => (
            <Particle
              key={`${particle.x}-${particle.y}`}
              particle={particle}
              drift={drift}
              width={width}
              height={height}
            />
          ))}
    </View>
  );
}

/**
 * One speck of light, phase-shifted off the shared cycle.
 *
 * All five read the same `drift` value rather than owning a loop each, so they
 * cannot slide out of phase with one another over a long session — the same
 * reason the splash screen's dots share one value. The shift is done by
 * *sampling*: the motion is evaluated at a dozen points around the cycle,
 * offset by this particle's phase, and handed to `interpolate` as a lookup
 * table.
 *
 * The wrap is the catch. At the moment the cycle restarts, a phase-shifted
 * particle jumps from wherever it was back to the start, and `interpolate`
 * ramps smoothly across that jump — which would be a visible slide. It isn't,
 * because the fade is built to reach zero at both ends of the cycle, so every
 * particle is invisible at exactly the moment it teleports.
 */
function Particle({
  particle,
  drift,
  width,
  height,
}: {
  particle: (typeof PARTICLES)[number];
  drift: Animated.Value;
  width: number;
  height: number;
}) {
  const styles = useStyles();
  const style = useMemo(() => {
    const at = (fn: (t: number) => number) => {
      const inputRange: number[] = [];
      const outputRange: number[] = [];
      for (let i = 0; i <= 12; i++) {
        const t = i / 12;
        inputRange.push(t);
        outputRange.push(fn((t + particle.phase) % 1));
      }
      return drift.interpolate({ inputRange, outputRange });
    };

    return {
      // Zero at t=0 and t=1, so the wrap happens while it can't be seen.
      opacity: at(t => Math.sin(Math.PI * t) ** 1.6 * 0.55),
      transform: [
        { translateY: at(t => -particle.drift * t) },
        { translateX: at(t => particle.sway * Math.sin(Math.PI * 2 * t)) },
      ],
    };
  }, [drift, particle]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.particle,
        {
          left: width * particle.x,
          top: height * particle.y,
          width: particle.r * 2,
          height: particle.r * 2,
          borderRadius: particle.r,
        },
        style,
      ]}
    />
  );
}

const useStyles = themed(colors =>
  StyleSheet.create({
    box: { alignItems: 'center', justifyContent: 'center' },
    stage: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: colors.stage,
    },
    centre: {
      position: 'absolute',
      alignItems: 'center',
      justifyContent: 'center',
    },
    particle: { position: 'absolute', backgroundColor: colors.accent },
  }),
);
