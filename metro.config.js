const { getDefaultConfig } = require('expo/metro-config');

module.exports = (() => {
  const config = getDefaultConfig(__dirname, { isCSSEnabled: true });

  // expo-sqlite web worker loads a .wasm file which Metro does not resolve by
  // default. Add 'wasm' to the asset extensions so the bundle can include it.
  if (!config.resolver.assetExts.includes('wasm')) {
    config.resolver.assetExts.push('wasm');
  }

  return config;
})();
