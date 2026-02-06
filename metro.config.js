const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Force Metro to use "browser" export condition so jose resolves to
// dist/browser/ instead of dist/node/esm/ (which imports node:buffer)
config.resolver.unstable_conditionNames = [
  'react-native',
  'browser',
  'require',
  'import',
];

// Ensure proper resolution order for React Native
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

// Direct alias: point jose to its browser build so node:buffer is never hit
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  jose: path.resolve(__dirname, 'node_modules/jose/dist/browser'),
  // Fallback polyfills for any remaining node: protocol imports
  'node:buffer': path.resolve(__dirname, 'node_modules/buffer'),
  'node:crypto': path.resolve(__dirname, 'node_modules/expo-crypto'),
  'node:util': path.resolve(__dirname, 'node_modules/util'),
  'node:stream': path.resolve(__dirname, 'node_modules/readable-stream'),
  'node:events': path.resolve(__dirname, 'node_modules/events'),
  'node:url': path.resolve(__dirname, 'node_modules/react-native-url-polyfill'),
};

module.exports = config;