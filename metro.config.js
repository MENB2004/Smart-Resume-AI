const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Disable package exports to fix Node.js module resolution issues (e.g. stream in ws/supabase)
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
