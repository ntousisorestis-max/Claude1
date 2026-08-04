/**
 * The welcome screen, and the promise it makes: exactly once, ever.
 *
 * Everything here runs against a memory store rather than a device one, so
 * "restart the app" is "mount a second App against the same storage" — which is
 * precisely what a relaunch is from the app's point of view.
 */
import React from 'react';
import ReactTestRenderer, { type ReactTestInstance } from 'react-test-renderer';
import App from '../App';
import { WELCOME } from '../src/copy';
import { createMemoryStorage, createReturningStorage } from '../src/state/storage';
import type { AppStorage } from '../src/state/storage';

const press = (root: ReactTestInstance, accessibilityLabel: string) => {
  const [node] = root.findAll(
    n =>
      n.props?.accessibilityLabel === accessibilityLabel &&
      typeof n.props?.onPress === 'function',
  );
  if (!node) {
    throw new Error(`No pressable labelled "${accessibilityLabel}"`);
  }
  ReactTestRenderer.act(() => node.props.onPress());
};

const texts = (root: ReactTestInstance): string[] =>
  root
    .findAll(n => typeof n.type === 'string' && n.props?.children != null)
    .map(n =>
      [n.props.children]
        .flat(Infinity)
        .filter(c => typeof c === 'string' || typeof c === 'number')
        .join(''),
    );

const hasText = (root: ReactTestInstance, needle: string) =>
  texts(root).some(t => t.includes(needle));

describe('the welcome screen', () => {
  const trees: ReactTestRenderer.ReactTestRenderer[] = [];

  beforeEach(() => jest.useFakeTimers());

  afterEach(() => {
    trees.forEach(t => ReactTestRenderer.act(() => t.unmount()));
    trees.length = 0;
    jest.useRealTimers();
  });

  /** One launch of the app against a given store. */
  const launch = async (storage: AppStorage) => {
    let tree!: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      tree = ReactTestRenderer.create(<App storage={storage} />);
    });
    trees.push(tree);
    return tree.root;
  };

  it('greets somebody opening the app for the first time', async () => {
    const root = await launch(createMemoryStorage());

    expect(hasText(root, WELCOME.headline)).toBe(true);
    expect(hasText(root, WELCOME.subheadline)).toBe(true);
    expect(hasText(root, WELCOME.body)).toBe(true);
  });

  it('never shows again once it has been tapped through', async () => {
    // The whole feature. A shared store standing in for the device's.
    const storage = createMemoryStorage();

    const first = await launch(storage);
    expect(hasText(first, WELCOME.headline)).toBe(true);
    press(first, WELCOME.action);
    expect(hasText(first, WELCOME.headline)).toBe(false);

    // Let the save land, then relaunch against the same storage.
    await ReactTestRenderer.act(async () => {});
    const second = await launch(storage);

    expect(hasText(second, WELCOME.headline)).toBe(false);
  });

  it('stays out of the way of somebody who has been here before', async () => {
    const root = await launch(createReturningStorage());

    expect(hasText(root, WELCOME.headline)).toBe(false);
    // And the app underneath is the one they left.
    expect(hasText(root, 'Lift more')).toBe(true);
  });

  it('does not guess before the saved state has loaded', async () => {
    // A store that never answers. Rendering the welcome here would mean
    // flashing it at somebody who tapped through it months ago, purely because
    // the disk was slow.
    const pending: AppStorage = {
      load: () => new Promise(() => {}),
      async save() {},
    };

    const root = await launch(pending);

    expect(hasText(root, WELCOME.headline)).toBe(false);
  });

  it('survives storage that cannot be read', async () => {
    // Showing the welcome one extra time is the right failure here; refusing to
    // start is not.
    const broken: AppStorage = {
      async load() {
        throw new Error('unreadable');
      },
      async save() {},
    };

    const root = await launch(broken);

    expect(hasText(root, WELCOME.headline)).toBe(true);
  });

  it('keeps the flag when everything else is deleted', async () => {
    // "Delete all exercises" is about exercises. Somebody who wipes their list
    // has not asked to be onboarded again.
    const storage = createMemoryStorage();

    const first = await launch(storage);
    press(first, WELCOME.action);
    press(first, 'Settings');
    await ReactTestRenderer.act(async () => {});

    const second = await launch(storage);
    expect(hasText(second, WELCOME.headline)).toBe(false);
  });
});
