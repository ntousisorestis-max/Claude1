/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';

test('renders correctly', async () => {
  let tree!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(() => {
    tree = ReactTestRenderer.create(<App />);
  });

  // The splash runs a timed animation on mount. Without unmounting, it
  // completes after Jest has torn the environment down and crashes the run.
  await ReactTestRenderer.act(() => {
    tree.unmount();
  });
});
