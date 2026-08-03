/**
 * The one part of the motion work that can regress silently.
 *
 * Timings and easing are taste and can only be judged by watching them. What
 * *can* be tested — and what actually hurts someone if it breaks — is the
 * bargain `Collapsible` makes: it keeps its children mounted so their height
 * can be animated, which means it has to take responsibility for making them
 * genuinely inert when shut. Squashed-to-nothing content that is still tappable
 * and still read aloud is worse than no animation at all.
 */
import React from 'react';
import ReactTestRenderer, { type ReactTestInstance } from 'react-test-renderer';
import { Pressable, Text } from 'react-native';
import { Collapsible } from '../src/components/Collapsible';
import { Pop } from '../src/components/Pop';

const render = (element: React.ReactElement) => {
  let tree!: ReactTestRenderer.ReactTestRenderer;
  ReactTestRenderer.act(() => {
    tree = ReactTestRenderer.create(element);
  });
  return tree;
};

/** The Collapsible's own animated wrapper — the one carrying the contract. */
const shell = (root: ReactTestInstance) =>
  root.findAll(n => n.props?.accessibilityElementsHidden !== undefined)[0];

const body = (
  <Pressable accessibilityLabel="Increase sets" onPress={() => {}}>
    <Text>Controls</Text>
  </Pressable>
);

describe('Collapsible', () => {
  it('keeps its children mounted so there is something to measure', () => {
    // The whole reason this component exists. `open ? children : null` cannot
    // animate — nothing to grow from, nothing left to shrink.
    const tree = render(<Collapsible open={false}>{body}</Collapsible>);

    // Non-empty rather than exactly one: a Pressable renders as several host
    // nodes that all carry the label down.
    expect(
      tree.root.findAll(n => n.props?.accessibilityLabel === 'Increase sets')
        .length,
    ).toBeGreaterThan(0);
  });

  it('hides shut content from screen readers and from thumbs', () => {
    const tree = render(<Collapsible open={false}>{body}</Collapsible>);
    const wrapper = shell(tree.root);

    expect(wrapper.props.accessibilityElementsHidden).toBe(true);
    expect(wrapper.props.importantForAccessibility).toBe('no-hide-descendants');
    // The web one. react-native-web implements neither of the two above, so
    // without this the browser build leaves collapsed controls readable.
    expect(wrapper.props['aria-hidden']).toBe(true);
    // Not just invisible: a zero-height box still catches taps along its edge.
    expect(wrapper.props.pointerEvents).toBe('none');
  });

  it('hands the content back when it opens', () => {
    const tree = render(<Collapsible open>{body}</Collapsible>);
    const wrapper = shell(tree.root);

    expect(wrapper.props.accessibilityElementsHidden).toBe(false);
    expect(wrapper.props.importantForAccessibility).toBe('auto');
    expect(wrapper.props['aria-hidden']).toBe(false);
    expect(wrapper.props.pointerEvents).toBe('auto');
  });

  it('flips the contract when it is toggled, not only on first render', () => {
    const tree = render(<Collapsible open={false}>{body}</Collapsible>);
    expect(shell(tree.root).props.accessibilityElementsHidden).toBe(true);

    ReactTestRenderer.act(() => {
      tree.update(<Collapsible open>{body}</Collapsible>);
    });
    expect(shell(tree.root).props.accessibilityElementsHidden).toBe(false);

    ReactTestRenderer.act(() => {
      tree.update(<Collapsible open={false}>{body}</Collapsible>);
    });
    expect(shell(tree.root).props.accessibilityElementsHidden).toBe(true);
  });
});

describe('Pop', () => {
  it('renders its children untouched', () => {
    // It wraps content in an Animated.View, so the thing worth checking is that
    // nothing gets lost on the way through.
    const tree = render(
      <Pop value={1}>
        <Text>14 minutes</Text>
      </Pop>,
    );

    expect(
      tree.root.findAll(
        n => typeof n.type === 'string' && n.props?.children === '14 minutes',
      ),
    ).toHaveLength(1);
  });

  it('survives its value changing repeatedly', () => {
    // The count-up on the complete screen drives one of these through fifteen
    // values in a second; a pop that stacked animations would stutter.
    const tree = render(
      <Pop value={0}>
        <Text>x</Text>
      </Pop>,
    );

    expect(() => {
      for (let next = 1; next <= 15; next++) {
        ReactTestRenderer.act(() => {
          tree.update(
            <Pop value={next}>
              <Text>x</Text>
            </Pop>,
          );
        });
      }
    }).not.toThrow();
  });
});
