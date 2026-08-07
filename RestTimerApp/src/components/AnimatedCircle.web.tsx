import React from 'react';
import { Animated } from 'react-native';
import { Circle, type CircleProps } from 'react-native-svg';

/**
 * The web twin of AnimatedCircle, which drops `collapsable` on the way through.
 *
 * React Native's animated layer sets `collapsable: false` on whatever it wraps,
 * to stop the native view being flattened away mid-animation. On web there is
 * no view flattening and no such attribute — react-native-svg renders a real
 * DOM `<circle>`, the unknown prop reaches it, and React logs:
 *
 *     Received `false` for a non-boolean attribute `collapsable`.
 *
 * once per mount of the rest screen. Harmless, but it's console noise in the
 * one place a real error would matter, so it goes.
 *
 * Stripped here rather than in the shared file because on native the prop is
 * doing its job, and quietly removing it there would be a rendering change
 * dressed up as a lint fix.
 */
const WebCircle = React.forwardRef<
  Circle,
  CircleProps & { collapsable?: boolean }
>(function CircleWithoutCollapsable(
  { collapsable: _collapsable, ...rest },
  ref,
) {
  return <Circle ref={ref} {...rest} />;
});

export const AnimatedCircle = Animated.createAnimatedComponent(WebCircle);
