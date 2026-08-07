import React, { useId } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { themed, useColors } from '../theme';

/**
 * The depth under everything: two soft violet blooms on the screen background.
 *
 * Deliberately asymmetric. One large bloom sits high and left — roughly behind
 * where every screen puts its headline — and a second, smaller and fainter one
 * sits low and right. A single centred glow reads as a spotlight pointed at the
 * middle of the screen; two offset ones of different sizes read as light in a
 * room.
 *
 * It is drawn at the root, once, rather than per screen: same position on every
 * screen is what makes it feel like one surface the app sits on instead of a
 * decoration each screen happens to have.
 *
 * **Nothing here may cost legibility.** The peaks below are picked so the
 * lightest point of the background stays dark enough for `faintOnDark` — the
 * dimmest colour in the palette — to clear WCAG AA at the sizes it's used.
 */

/**
 * The bloom over the violet flood.
 *
 * Fixed rather than per-palette, because the flood is fixed: it is the same
 * violet in light and dark, so what lifts it is the same too.
 */
const ON_ACCENT = { peak: 0.06, second: 0.03 } as const;

/**
 * Falloff. A straight line from peak to zero has a visible edge partway out;
 * these intermediate stops give it a long, soft tail instead.
 */
const FALLOFF = [
  { offset: '0', scale: 1 },
  { offset: '0.4', scale: 0.52 },
  { offset: '0.7', scale: 0.18 },
  { offset: '1', scale: 0 },
] as const;

export function GlowBackground({
  /** Which ground it's sitting on. Violet on the dark one, light on the violet one. */
  tone = 'onInk',
}: {
  tone?: 'onInk' | 'onAccent';
}) {
  const styles = useStyles();
  const colors = useColors();
  const { width, height } = useWindowDimensions();

  // SVG gradient ids live in one global namespace on the web, so two glows on
  // screen at once would silently share whichever was defined first.
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const mainId = `glow-main-${uid}`;
  const secondId = `glow-second-${uid}`;

  // Over the app's own ground the bloom is the palette's; over the flood it is
  // white, and the flood doesn't change between themes.
  //
  // Light's peak is less than half of dark's, and that is the whole difference
  // between a glow and a stain. A violet bloom at dark's strength over
  // near-white tints the entire page violet — at which point the page is
  // competing with the one thing violet is supposed to mean.
  const onInk = tone === 'onInk';
  const color = onInk ? colors.glow : colors.white;
  const peak = onInk ? colors.glowPeak : ON_ACCENT.peak;
  const secondPeak = onInk ? colors.glowSecondPeak : ON_ACCENT.second;

  // Big enough that the bloom's outer edge always falls outside the screen.
  // Sized off the full diagonal rather than the width: at anything smaller the
  // gradient reaches zero inside the frame and you can see the circle it came
  // from, which is exactly the "spotlight" look this is meant to avoid.
  const mainRadius = Math.hypot(width, height) * 0.95;
  const secondRadius = mainRadius * 0.55;

  const stops = (id: string, top: number) =>
    FALLOFF.map(({ offset, scale }) => (
      <Stop
        key={`${id}-${offset}`}
        offset={offset}
        stopColor={color}
        stopOpacity={top * scale}
      />
    ));

  return (
    <View style={styles.fill} pointerEvents="none">
      <Svg width={width} height={height}>
        <Defs>
          {/* High and left, behind the headline on every screen. */}
          <RadialGradient
            id={mainId}
            cx={width * 0.22}
            cy={height * 0.14}
            rx={mainRadius}
            ry={mainRadius}
            gradientUnits="userSpaceOnUse"
          >
            {stops(mainId, peak)}
          </RadialGradient>

          {/* Low and right, to stop the whole thing leaning one way. */}
          <RadialGradient
            id={secondId}
            cx={width * 0.92}
            cy={height * 0.82}
            rx={secondRadius}
            ry={secondRadius}
            gradientUnits="userSpaceOnUse"
          >
            {stops(secondId, secondPeak)}
          </RadialGradient>
        </Defs>

        <Rect
          x={0}
          y={0}
          width={width}
          height={height}
          fill={`url(#${mainId})`}
        />
        <Rect
          x={0}
          y={0}
          width={width}
          height={height}
          fill={`url(#${secondId})`}
        />
      </Svg>
    </View>
  );
}

const useStyles = themed(() =>
  StyleSheet.create({
    fill: {
      // RN 0.86's types don't expose absoluteFillObject; spell it out.
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
  }),
);
