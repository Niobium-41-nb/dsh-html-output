/**
 * Browser bundle for dsh-client-html-output.
 *
 * Emits the loader-handoff artifact the DSH web GUI serves at
 * `/plugins/<package>/client.js`: a CJS bundle whose footer registers the
 * plugin through `window.__ModuleLoader__.load({ id, factory })`. Platform
 * modules (react, cordis, the slot service, the runtime data layer) stay
 * external and are answered by the loader's injected `require`; everything
 * else is inlined.
 */

import { defineConfig } from 'tsdown'

const ID = 'dsh-client-html-output'

/** Module-table entries the loader's require can answer (platform seed + runtime exemption). */
const PLATFORM_EXTERNALS = [
  'react',
  'react/jsx-runtime',
  'react-dom',
  'react-dom/client',
  '@deepseek-ai/cordis',
  '@deepseek-ai/dsh-client-ui-slots',
  '@deepseek-ai/dsh-client-runtime/client',
]

export default defineConfig({
  name: `${ID}/client`,
  entry: { client: 'src/client/index.ts' },
  outDir: 'lib',
  format: 'cjs',
  platform: 'browser',
  dts: false,
  sourcemap: true,
  clean: false,
  deps: {
    neverBundle: PLATFORM_EXTERNALS,
    alwaysBundle: (id: string) => (PLATFORM_EXTERNALS.includes(id) ? false : true),
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV ?? 'production'),
    'import.meta.env.MODE': JSON.stringify(process.env.NODE_ENV ?? 'production'),
    'import.meta.env': JSON.stringify({ MODE: process.env.NODE_ENV ?? 'production' }),
  },
  outputOptions: {
    entryFileNames: 'client.js',
    banner: `window.__ModuleLoader__.load({ id: ${JSON.stringify(ID)}, factory: (require) => {`,
    footer: 'return module.exports; } });',
    intro: 'var module = { exports: {} }; var exports = module.exports;',
  },
})
