import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, {
  Defs,
  Ellipse,
  LinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';
import { useReduceMotion } from '../hooks/useReduceMotion';
import { colors } from '../theme';

/**
 * The header's illustration: an hourglass with violet sand, lit from within.
 *
 * Drawn rather than shipped as a PNG. It has to sit on a background that is
 * itself a gradient, at whatever size the header gives it, in a palette that
 * has already changed once — all three of which a raster asset is bad at. It
 * also costs nothing to download and stays sharp on every density.
 *
 * The only motion is the falling sand, which is why the whole thing doesn't
 * read as a static sticker. It's one looping opacity fade on a native driver,
 * and it stops entirely under reduce-motion.
 */

const W = 132;
const H = 168;

export function HeroHourglass({ size = 150 }: { size?: number }) {
  const reduceMotion = useReduceMotion();
  const fall = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduceMotion) {
      fall.setValue(0.6);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(fall, {
          toValue: 1,
          duration: 1400,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(fall, {
          toValue: 0.35,
          duration: 1400,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [fall, reduceMotion]);

  const height = (size / W) * H;

  return (
    <View style={[styles.box, { width: size, height }]} pointerEvents="none">
      {/* The bloom it sits in. Separate from the glass so it can spill past the
          silhouette without being clipped by it. */}
      <Svg style={styles.layer} width={size} height={height} viewBox={`0 0 ${W} ${H}`}>
        <Defs>
          <RadialGradient id="hg-glow" cx={W / 2} cy={H * 0.56} rx={W * 0.62} ry={H * 0.5} gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor={colors.accent} stopOpacity={0.42} />
            <Stop offset="0.55" stopColor={colors.accent} stopOpacity={0.13} />
            <Stop offset="1" stopColor={colors.accent} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect x={0} y={0} width={W} height={H} fill="url(#hg-glow)" />
      </Svg>

      <Svg style={styles.layer} width={size} height={height} viewBox={`0 0 ${W} ${H}`}>
        <Defs>
          {/* The glass: barely there, brighter along the top edge. */}
          <LinearGradient id="hg-glass" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.16} />
            <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0.04} />
          </LinearGradient>
          {/* Sand, lit from the top so the two bulbs don't look flat. */}
          <LinearGradient id="hg-sand" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#C4A5FF" />
            <Stop offset="1" stopColor={colors.accent} />
          </LinearGradient>
          <LinearGradient id="hg-frame" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={colors.raised} />
            <Stop offset="1" stopColor={colors.surface} />
          </LinearGradient>
        </Defs>

        {/* --- Glass -------------------------------------------------------
            Concave sides, not straight ones. A pair of triangles meeting at a
            point is a bowtie; the waist curve is what makes it an hourglass. */}
        <Path
          d="M32 26 H100 C100 44 90 66 68 83 H64 C42 66 32 44 32 26 Z"
          fill="url(#hg-glass)"
          stroke="rgba(255,255,255,0.26)"
          strokeWidth={1.6}
          strokeLinejoin="round"
        />
        <Path
          d="M64 85 H68 C90 102 100 124 100 142 H32 C32 124 42 102 64 85 Z"
          fill="url(#hg-glass)"
          stroke="rgba(255,255,255,0.26)"
          strokeWidth={1.6}
          strokeLinejoin="round"
        />

        {/* --- Sand, still in the top bulb --------------------------------- */}
        <Path d="M43 52 H89 C86 64 79 73 68 83 H64 C53 73 46 64 43 52 Z" fill="url(#hg-sand)" />
        {/* --- Sand, piled in the bottom ----------------------------------- */}
        <Path d="M38 142 C40 122 56 110 66 110 C76 110 92 122 94 142 Z" fill="url(#hg-sand)" />
        <Ellipse cx={66} cy={138} rx={28} ry={4.5} fill="#C4A5FF" opacity={0.5} />

        {/* A single highlight down the left of the upper bulb — the cheapest
            possible cue that this is glass rather than a flat shape. */}
        <Path
          d="M40 32 C42 46 49 58 58 68"
          stroke="rgba(255,255,255,0.3)"
          strokeWidth={2.4}
          strokeLinecap="round"
          fill="none"
        />

        {/* --- Frame: caps and posts --------------------------------------- */}
        <Rect x={22} y={20} width={5} height={128} rx={2.5} fill="url(#hg-frame)" />
        <Rect x={105} y={20} width={5} height={128} rx={2.5} fill="url(#hg-frame)" />
        <Rect x={16} y={12} width={100} height={15} rx={7.5} fill="url(#hg-frame)" />
        <Rect x={16} y={141} width={100} height={15} rx={7.5} fill="url(#hg-frame)" />
        <Rect x={16} y={12} width={100} height={3.5} rx={1.75} fill={colors.accent} opacity={0.55} />
        <Rect x={16} y={152.5} width={100} height={3.5} rx={1.75} fill={colors.accent} opacity={0.3} />
      </Svg>

      {/* --- The stream, the one moving part --------------------------------- */}
      <Animated.View style={[styles.layer, { opacity: fall }]}>
        <Svg width={size} height={height} viewBox={`0 0 ${W} ${H}`}>
          <Rect x={64.2} y={84} width={3.6} height={46} rx={1.8} fill="#C4A5FF" />
        </Svg>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { alignItems: 'center', justifyContent: 'center' },
  layer: { position: 'absolute', top: 0, left: 0 },
});
