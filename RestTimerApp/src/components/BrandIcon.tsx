import React from 'react';
import Svg, { Circle, Ellipse, Path, Rect } from 'react-native-svg';
import { colors } from '../theme';

/**
 * Simplified brand marks for the apps you can block.
 *
 * Hand-drawn approximations, not official assets — they're here to make a row
 * of app names scannable at a glance, which coloured dots never managed. Each
 * is a single 24x24 glyph so they sit on one optical baseline despite the real
 * logos having wildly different proportions.
 *
 * `hole` is the colour punched through a filled shape (YouTube's play
 * triangle, Reddit's eyes) — it has to match whatever sits behind the icon.
 */
export type BrandId = 'tiktok' | 'instagram' | 'youtube' | 'x' | 'reddit';

type Props = {
  id: BrandId;
  color: string;
  size?: number;
  hole?: string;
};

export function BrandIcon({ id, color, size = 20, hole = colors.surface }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {glyph(id, color, hole)}
    </Svg>
  );
}

function glyph(id: BrandId, c: string, hole: string) {
  switch (id) {
    case 'youtube':
      return (
        <>
          <Path
            d="M23 12s0-3.6-.46-5.32a2.77 2.77 0 0 0-1.95-1.96C18.87 4.25 12 4.25 12 4.25s-6.87 0-8.59.47a2.77 2.77 0 0 0-1.95 1.96C1 8.4 1 12 1 12s0 3.6.46 5.32a2.77 2.77 0 0 0 1.95 1.96c1.72.47 8.59.47 8.59.47s6.87 0 8.59-.47a2.77 2.77 0 0 0 1.95-1.96C23 15.6 23 12 23 12Z"
            fill={c}
          />
          <Path d="M9.9 15.4V8.6l5.9 3.4-5.9 3.4Z" fill={hole} />
        </>
      );

    case 'instagram':
      return (
        <>
          <Rect
            x="2.6"
            y="2.6"
            width="18.8"
            height="18.8"
            rx="5.6"
            stroke={c}
            strokeWidth="2"
            fill="none"
          />
          <Circle cx="12" cy="12" r="4.4" stroke={c} strokeWidth="2" fill="none" />
          <Circle cx="17.4" cy="6.6" r="1.4" fill={c} />
        </>
      );

    case 'x':
      return (
        <Path
          d="M18.24 2.25h3.31l-7.23 8.26 8.5 11.24h-6.65l-5.21-6.82-5.96 6.82H1.68l7.73-8.84L1.25 2.25h6.82l4.71 6.23 5.46-6.23Zm-1.16 17.52h1.83L7.01 4.13H5.04l12.04 15.64Z"
          fill={c}
        />
      );

    case 'tiktok':
      // The note: a stem, its rounded foot, and the flag folding off the top.
      return (
        <Path
          d="M16.9 2h-3.2v13.55a2.62 2.62 0 1 1-2.2-2.58v-3.2a5.78 5.78 0 1 0 5.4 5.77V9.1a7.02 7.02 0 0 0 4.05 1.3V7.2A3.85 3.85 0 0 1 16.9 3.4V2Z"
          fill={c}
        />
      );

    case 'reddit':
      return (
        <>
          <Path
            d="M12.4 5.6 13.5 2.4"
            stroke={c}
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <Circle cx="14.1" cy="2.5" r="1.7" fill={c} />
          <Ellipse cx="12" cy="14" rx="9" ry="7" fill={c} />
          <Circle cx="8.7" cy="13.1" r="1.4" fill={hole} />
          <Circle cx="15.3" cy="13.1" r="1.4" fill={hole} />
          <Path
            d="M9 17c1.8 1.2 4.2 1.2 6 0"
            stroke={hole}
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
          />
        </>
      );
  }
}
