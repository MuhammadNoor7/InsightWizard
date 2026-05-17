const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Disable package exports to bypass the lucide-react-native resolution bug
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
