import React, { useState } from 'react';
import { StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Path,
  Stop,
} from 'react-native-svg';
import { recentDays, weekdayOf } from '../cloud/days';
import { sized, spacing, themed, type, useColors } from '../theme';
import type { DayTotals } from '../cloud/types';

/**
 * Seven days of focus time, as a curve.
 *
 * ## Why the curve is drawn by hand
 *
 * A charting library for one seven-point line would be a dependency larger than
 * the rest of this screen. The maths below is a Catmull-Rom spline converted to
 * cubic beziers — about fifteen lines, and it means the glow, the fill and the
 * clamping are all things that can be tuned rather than fought.
 *
 * ## The clamp matters
 *
 * Catmull-Rom overshoots. Feed it a week that goes 0, 0, 40min, 0 and the
 * "smooth" curve dives well below zero on the way in and out, drawing negative
 * focus time. Both control points are pinned inside the plot, which costs a
 * little smoothness at sharp corners and buys a chart that never lies.
 *
 * ## The glow
 *
 * Two strokes of the same path — a wide faint one under a crisp one — rather
 * than an SVG filter. `react-native-svg` supports filters unevenly across
 * platforms, and this reads the same everywhere for a fraction of the cost.
 */

const HEIGHT = 132;
/** Room above the tallest point so the stroke and its glow aren't clipped. */
const PAD_TOP = 10;
const PAD_BOTTOM = 6;
/**
 * Room at each end for the dot on today.
 *
 * Without it the last point sits exactly on the right edge and the marker is
 * sliced in half by the SVG's own bounds — which looks like a rendering bug on
 * the one day the chart is most likely to be looked at.
 */
const PAD_X = 9;

export function FocusChart({
  today,
  days,
}: {
  today: string;
  /** Whatever days the account has. Missing days are a real zero, not a gap. */
  days: DayTotals[];
}) {
  const styles = useStyles();
  const colors = useColors();
  const [width, setWidth] = useState(0);

  const week = recentDays(today, 7);
  const byDay = new Map(days.map(day => [day.day, day.focusSeconds]));
  const values = week.map(day => byDay.get(day) ?? 0);
  const peak = Math.max(...values);
  const empty = peak <= 0;

  const onLayout = (event: LayoutChangeEvent) =>
    setWidth(Math.round(event.nativeEvent.layout.width));

  const plot = HEIGHT - PAD_TOP - PAD_BOTTOM;
  const step = width > 0 ? (width - PAD_X * 2) / (values.length - 1) : 0;

  // An empty week draws a flat line along the floor rather than nothing at all:
  // the shape of the chart is the promise of what goes in it.
  const points = values.map((value, i) => ({
    x: PAD_X + i * step,
    y: PAD_TOP + plot - (empty ? 0 : (value / peak) * plot),
  }));

  const line = width > 0 ? smoothPath(points, PAD_TOP, PAD_TOP + plot) : '';
  const under = line
    ? `${line} L ${points[6].x} ${HEIGHT} L ${points[0].x} ${HEIGHT} Z`
    : '';
  const stroke = empty ? colors.hairline : colors.accent;

  return (
    <View>
      <View style={styles.plot} onLayout={onLayout}>
        {width > 0 ? (
          <Svg width={width} height={HEIGHT}>
            <Defs>
              <LinearGradient id="focus-fill" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={colors.accent} stopOpacity={0.32} />
                <Stop offset="1" stopColor={colors.accent} stopOpacity={0} />
              </LinearGradient>
            </Defs>

            {empty ? null : <Path d={under} fill="url(#focus-fill)" />}

            {/* The glow: same path, wide and faint, underneath. */}
            {empty ? null : (
              <Path
                d={line}
                stroke={colors.accent}
                strokeWidth={10}
                strokeOpacity={0.16}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            )}

            <Path
              d={line}
              stroke={stroke}
              strokeWidth={empty ? 2 : 3}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />

            {/* Today, marked. The only dot on the chart — seven of them turns a
                line into a scatter plot and makes the shape harder to read. */}
            {empty ? null : (
              <>
                <Circle
                  cx={points[6].x}
                  cy={points[6].y}
                  r={7}
                  fill={colors.accent}
                  fillOpacity={0.24}
                />
                <Circle
                  cx={points[6].x}
                  cy={points[6].y}
                  r={3.5}
                  fill={colors.white}
                />
              </>
            )}
          </Svg>
        ) : null}
      </View>

      <View style={styles.axis}>
        {week.map(day => (
          <Text
            key={day}
            style={[styles.tick, day === today && styles.tickToday]}
          >
            {weekdayOf(day).slice(0, 1)}
          </Text>
        ))}
      </View>
    </View>
  );
}

/**
 * A Catmull-Rom spline through `points`, as an SVG cubic-bezier path.
 *
 * Control points are clamped to the plot area — see the note at the top of the
 * file. Without it a spike surrounded by zeroes draws a curve that dips under
 * the baseline, which on a chart of "time you didn't spend on your phone" would
 * be a negative amount of time.
 */
function smoothPath(
  points: { x: number; y: number }[],
  top: number,
  bottom: number,
): string {
  const clamp = (y: number) => Math.min(bottom, Math.max(top, y));
  let path = `M ${points[0].x} ${points[0].y}`;

  for (let i = 0; i < points.length - 1; i++) {
    const previous = points[i - 1] ?? points[i];
    const start = points[i];
    const end = points[i + 1];
    const next = points[i + 2] ?? points[i + 1];

    // The classic Catmull-Rom-to-bezier conversion: each control point is a
    // sixth of the way along the chord spanning its neighbours.
    const c1x = start.x + (end.x - previous.x) / 6;
    const c1y = clamp(start.y + (end.y - previous.y) / 6);
    const c2x = end.x - (next.x - start.x) / 6;
    const c2y = clamp(end.y - (next.y - start.y) / 6);

    path += ` C ${c1x} ${c1y} ${c2x} ${c2y} ${end.x} ${end.y}`;
  }
  return path;
}

const useStyles = themed(colors =>
  StyleSheet.create({
    plot: { height: HEIGHT },
    axis: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: spacing.sm,
    },
    tick: { ...sized(type.tag, 10), color: colors.faint },
    tickToday: { color: colors.accentText },
  }),
);
