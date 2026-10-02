import Module from 'node:module';
import path from 'node:path';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const clientNodeModules = path.resolve(__dirname, 'node_modules');
if (!process.env.NODE_PATH) {
  process.env.NODE_PATH = clientNodeModules;
} else if (!process.env.NODE_PATH.includes(clientNodeModules)) {
  process.env.NODE_PATH = `${clientNodeModules}${path.delimiter}${process.env.NODE_PATH}`;
}
// @ts-expect-error Node internal method to reload lookup paths
if (typeof Module._initPaths === 'function') {
  // @ts-expect-error Node internal
  Module._initPaths();
}

const compat = new FlatCompat({
  baseDirectory: __dirname,
  resolvePluginsRelativeTo: __dirname,
});

const config = [
  {
    ignores: ['.next/**', 'node_modules/**', 'next-env.d.ts', 'check-console.js', '*.js'],
  },
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'react-hooks/exhaustive-deps': 'off',
    },
  },
];

export default config;
