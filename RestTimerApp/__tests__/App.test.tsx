/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';
// The do-nothing cloud, passed explicitly. Before Firebase was configured this
// was what `<App />` picked by itself; now that a project exists, the default is
// the real SDK — which these tests have no business starting, and which Jest
// can't even parse (it ships as ESM, and node_modules isn't transformed).
// Naming it here keeps this suite about the app and off the network.
import { localOnlyBackend } from '../src/cloud/backend';

test('renders correctly', async () => {
  let tree!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(() => {
    tree = ReactTestRenderer.create(<App backend={localOnlyBackend} />);
  });

  // The splash runs a timed animation on mount. Without unmounting, it
  // completes after Jest has torn the environment down and crashes the run.
  await ReactTestRenderer.act(() => {
    tree.unmount();
  });
});
