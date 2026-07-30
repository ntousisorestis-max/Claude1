/**
 * Web build for the Rest Timer app.
 *
 * This runs the real app — the same App.tsx, screens, reducer and animations
 * the phones run — with react-native-web mapping RN primitives onto the DOM.
 * It is a way to feel the UX without a Mac or an Android SDK; it can't
 * validate the things the app actually exists for (real app blocking, OS
 * notifications, haptics), because browsers can't do them.
 */
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const appDirectory = __dirname;

/**
 * React Native packages ship untranspiled (Flow types, JSX, ESM), so unlike a
 * normal web project we must run babel over these node_modules rather than
 * skipping the directory wholesale.
 */
const compileNodeModules = [
  'react-native',
  'react-native-web',
  'react-native-svg',
  'react-native-safe-area-context',
  '@react-native',
  '@notifee/react-native',
].map(mod => path.resolve(appDirectory, 'node_modules', mod));

const babelLoaderRule = {
  test: /\.[jt]sx?$/,
  include: [
    path.resolve(appDirectory, 'index.web.js'),
    path.resolve(appDirectory, 'App.tsx'),
    path.resolve(appDirectory, 'src'),
    ...compileNodeModules,
  ],
  use: {
    loader: 'babel-loader',
    options: {
      cacheDirectory: true,
      presets: [
        ['module:@react-native/babel-preset', { useTransformReactJSXExperimental: false }],
      ],
      plugins: [],
    },
  },
};

module.exports = {
  entry: path.resolve(appDirectory, 'index.web.js'),

  output: {
    path: path.resolve(appDirectory, 'dist'),
    filename: 'bundle.[contenthash].js',
    publicPath: '/',
    clean: true,
  },

  module: {
    rules: [
      babelLoaderRule,
      {
        test: /\.(gif|jpe?g|png|svg|ttf|otf|woff2?)$/,
        type: 'asset/resource',
      },
    ],
  },

  resolve: {
    // `.web.*` wins, which is how src/notifications.web.ts replaces the
    // notifee-backed module without a single import changing.
    extensions: [
      '.web.tsx',
      '.web.ts',
      '.web.jsx',
      '.web.js',
      '.tsx',
      '.ts',
      '.jsx',
      '.js',
    ],
    alias: {
      // The `$` means exact matches only, so deep imports still resolve.
      'react-native$': 'react-native-web',
    },
  },

  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(appDirectory, 'public/index.html'),
    }),
  ],

  devServer: {
    historyApiFallback: true,
    port: 3000,
    open: false,
    static: { directory: path.resolve(appDirectory, 'public') },
  },
};
