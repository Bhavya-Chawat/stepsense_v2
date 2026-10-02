const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Watch packages/ folder
config.watchFolders = [
  path.resolve(workspaceRoot, 'packages'),
];

// Explicitly map @stepsense/* workspace packages directly to index.ts files
config.resolver.extraNodeModules = {
  '@stepsense/core': path.resolve(workspaceRoot, 'packages/core/index.ts'),
  '@stepsense/types': path.resolve(workspaceRoot, 'packages/types/index.ts'),
  '@stepsense/supabase-client': path.resolve(workspaceRoot, 'packages/supabase-client/index.ts'),
  '@stepsense/design-tokens': path.resolve(workspaceRoot, 'packages/design-tokens/index.ts'),
};

module.exports = config;
