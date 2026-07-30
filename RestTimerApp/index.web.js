/**
 * Web entry point.
 *
 * Renders the same App.tsx the phones do — react-native-web maps the RN
 * primitives onto DOM nodes. See webpack.config.js for the aliasing, and
 * src/notifications.web.ts for the one module that has no web equivalent.
 *
 * @format
 */

import { createRoot } from 'react-dom/client';
import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);

const rootTag = document.getElementById('root');

// RNW's own runApplication path still uses the legacy ReactDOM.render on some
// versions; mounting through createRoot keeps us on the React 19 API.
createRoot(rootTag).render(AppRegistry.getApplication(appName).element);
