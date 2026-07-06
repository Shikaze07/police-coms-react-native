const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Enable package exports resolution (essential for modern Firebase SDK modules)
config.resolver.unstable_enablePackageExports = false;

// Enable .mjs resolution for Firebase SDK 9/10 packages
config.resolver.sourceExts.push('mjs');

module.exports = config;
