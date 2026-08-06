const { getDefaultConfig } = require('expo/metro-config');
const { resolve } = require('@expo/metro/metro-resolver');
const fs = require('fs');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(projectRoot);

config.watchFolders = [monorepoRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];
config.resolver.disableHierarchicalLookup = true;

config.serializer.getModulesRunBeforeMainModule = () => [
  require.resolve('./shared-array-buffer-polyfill.js'),
  require.resolve('./string-polyfills.js'),
  require.resolve('./polyfills.js'),
];

const tentapRoot = path.dirname(
  require.resolve('@10play/tentap-editor/package.json'),
);

config.resolver.resolveRequest = (context, moduleName, platform) => {
  // package.json "exports" points at lib/module (compiled JS). TenTapViewNativeComponent.js
  // loses codegen NativeProps, so babel-plugin-codegen fails. Use "react-native" entry (src/).
  if (moduleName === '@10play/tentap-editor') {
    return {
      type: 'sourceFile',
      filePath: path.join(tentapRoot, 'src/index.tsx'),
    };
  }

  // Workspace packages use TypeScript ESM `.js` import specifiers (e.g. `./foo.js` → `foo.ts`).
  if (
    moduleName.startsWith('.') &&
    moduleName.endsWith('.js') &&
    context.originModulePath.includes(`${path.sep}packages${path.sep}`)
  ) {
    const dir = path.dirname(context.originModulePath);
    const base = moduleName.slice(0, -'.js'.length);
    for (const ext of ['.ts', '.tsx']) {
      const candidate = path.join(dir, base + ext);
      if (fs.existsSync(candidate)) {
        return { type: 'sourceFile', filePath: candidate };
      }
    }
  }

  return resolve(context, moduleName, platform);
};

module.exports = config;
