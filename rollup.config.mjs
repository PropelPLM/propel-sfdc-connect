import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import babel from '@rollup/plugin-babel';
import { readFileSync } from 'fs';

// Read package.json
const pkg = JSON.parse(readFileSync('./package.json'));

// Get all dependencies as externals
const externals = [
  ...Object.keys(pkg.dependencies || {}),
  ...Object.keys(pkg.peerDependencies || {}),
  // Node.js built-in modules
  'fs', 'path', 'events', 'child_process', 'util', 'https'
];

export default [
  {
    input: 'index.js',
    output: [
      {
        file: 'dist/index.js',
        format: 'cjs',
        sourcemap: true
      },
      {
        file: 'dist/index.esm.js',
        format: 'es',
        sourcemap: true
      }
    ],
    plugins: [
      resolve({
        preferBuiltins: true
      }),
      commonjs(),
      babel({
        babelHelpers: 'bundled',
        exclude: 'node_modules/**'
      })
    ],
    external: externals
  },
  {
    input: 'test/sfdx-lib.js',
    output: [
      {
        file: 'dist/sfdx-lib.js',
        format: 'es',
        sourcemap: true
      },
      {
        file: 'dist/sfdx-lib.cjs',
        format: 'cjs',
        sourcemap: true
      }
    ],
    plugins: [
      resolve({
        preferBuiltins: true
      }),
      commonjs(),
      babel({
        babelHelpers: 'bundled',
        exclude: 'node_modules/**'
      })
    ],
    external: externals
  }
];