// tsup config for `@gohan-ai/react-native`.
//
// Source-resolution strategy (decision documented per Phase 3 task 3):
//
// We do NOT duplicate code. The package's only "real" source file is
// `src/index.ts`, which re-exports from `../../src/...` (the standalone
// Expo app's source tree). tsup follows those imports and bundles the
// transitive closure into `dist/`. The standalone app keeps importing from
// `@/components/...` via the root tsconfig path alias — totally untouched.
//
// What we externalise (consumer must provide via peer deps OR runtime env):
//   - react, react-native, react-native-svg, react-native-safe-area-context,
//     nativewind, react-native-sse, react-native-gesture-handler,
//     react-native-reanimated, react-native-keyboard-aware-scrollview
//   - All `expo-*` and `@expo/*` packages (the host app provides them).
//   - `@react-native-async-storage/async-storage` (host has its own copy).
//   - `@supabase/supabase-js` (only pulled in by realtime path; consumer
//     installs it once at the app level — keeps bundle small and avoids
//     duplicate clients).
//   - `zustand` (state lib used by stores; let host dedupe).
//
// What we bundle: everything under `../../src/` that the public API
// transitively reaches, except the excluded files (`app/`, `(auth)`,
// `services/supabase.ts`, `StandaloneCoachProvider.tsx`).

import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  outExtension: ({ format }) => ({ js: format === 'esm' ? '.mjs' : '.cjs' }),
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  treeshake: true,
  target: 'es2020',
  platform: 'neutral',
  external: [
    'react',
    'react-native',
    'react-native-svg',
    'react-native-safe-area-context',
    'react-native-sse',
    'react-native-gesture-handler',
    'react-native-reanimated',
    'react-native-keyboard-aware-scrollview',
    'react-native-url-polyfill',
    'react-native-web',
    'react-native-worklets',
    'nativewind',
    '@supabase/supabase-js',
    'zustand',
    'zustand/middleware',
    '@react-native-async-storage/async-storage',
    /^expo(-|$)/,
    /^@expo\//,
  ],
  esbuildOptions(options) {
    options.jsx = 'automatic';
    // Resolve `@/...` path alias used throughout `../../src` to the repo
    // root's `src/` directory so deep imports keep working when bundled
    // from the package's vantage point.
    options.alias = {
      ...(options.alias ?? {}),
      '@': '../../src',
    };
  },
});
