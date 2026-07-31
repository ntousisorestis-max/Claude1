import { Animated } from 'react-native';
import { Circle } from 'react-native-svg';

/**
 * An SVG circle whose props can be driven by `Animated`.
 *
 * Native needs nothing special. The web build has a twin — `AnimatedCircle.web.tsx`,
 * picked up by webpack's platform resolution — which exists to strip one prop
 * React DOM complains about. See that file for the detail.
 */
export const AnimatedCircle = Animated.createAnimatedComponent(Circle);
