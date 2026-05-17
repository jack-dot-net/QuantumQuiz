// scripts/build.mjs — transpiles + minifies + obfuscates the client bundle.
//
// The client uses global window.* patterns (no ES module imports), so we
// concatenate the source files in load order, transform JSX via esbuild,
// then minify + obfuscate the result. Output: public/build/app.bundle.js
//
// Run with: npm run build

import { transform } from 'esbuild';
import JavaScriptObfuscator from 'javascript-obfuscator';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SRC = join(ROOT, 'client-src');
const OUT = join(ROOT, 'public', 'build');

// Load order (matches the previous individual <script> tags in index.html).
// anti-devtools must run first so its handlers attach before any UI exists.
const SOURCES = [
  'anti-devtools.js',
  'client-state.js',
  'shared.jsx',
  'host.jsx',
  'player.jsx',
  'app.jsx',
];

async function main() {
  const t0 = Date.now();

  // 1. Transpile each file
  const transpiled = [];
  for (const file of SOURCES) {
    const code = await readFile(join(SRC, file), 'utf8');
    const isJsx = file.endsWith('.jsx');
    const out = await transform(code, {
      loader: isJsx ? 'jsx' : 'js',
      target: 'es2020',
      jsxFactory: 'React.createElement',
      jsxFragment: 'React.Fragment',
    });
    transpiled.push(`/* ${file} */\n${out.code}`);
  }

  // 2. Concatenate inside an IIFE so internal symbols don't leak globally.
  //    Code that needs to be global already uses `window.X = ...` explicitly.
  const concatenated = `(function(){"use strict";\n${transpiled.join('\n\n')}\n})();`;

  // 3. Minify with esbuild
  const minified = await transform(concatenated, {
    minify: true,
    target: 'es2020',
    legalComments: 'none',
  });

  // 4. Obfuscate
  //    - renameGlobals: false  → must keep React, ReactDOM, io, QRCode, window.QQ*
  //    - transformObjectKeys: false → we access .actions, .useStore, etc.
  //    - debugProtection: false → we're not blocking DevTools, just hiding source
  const obfuscated = JavaScriptObfuscator.obfuscate(minified.code, {
    compact: true,
    controlFlowFlattening: true,
    controlFlowFlatteningThreshold: 0.6,
    deadCodeInjection: true,
    deadCodeInjectionThreshold: 0.3,
    debugProtection: false,
    disableConsoleOutput: false,
    identifierNamesGenerator: 'hexadecimal',
    log: false,
    numbersToExpressions: true,
    renameGlobals: false,
    selfDefending: true,
    simplify: true,
    splitStrings: true,
    splitStringsChunkLength: 8,
    stringArray: true,
    stringArrayEncoding: ['base64'],
    stringArrayThreshold: 0.75,
    transformObjectKeys: false,
    unicodeEscapeSequence: false,
    reservedNames: ['^React$', '^ReactDOM$', '^io$', '^QRCode$', '^QQ$'],
  }).getObfuscatedCode();

  await mkdir(OUT, { recursive: true });
  await writeFile(join(OUT, 'app.bundle.js'), obfuscated, 'utf8');

  const kb = (obfuscated.length / 1024).toFixed(1);
  const ms = Date.now() - t0;
  console.log(`✓ built public/build/app.bundle.js — ${kb} KB in ${ms}ms`);
}

main().catch((e) => {
  console.error('build failed:', e);
  process.exit(1);
});
