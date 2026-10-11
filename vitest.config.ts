import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    globals: true,
    alias: {
      '@intra/shared': path.resolve(__dirname, './packages/shared/src/index.ts'),
      '@intra/observer': path.resolve(__dirname, './packages/observer/src/index.ts'),
      '@intra/model': path.resolve(__dirname, './packages/model/src/index.ts'),
      '@intra/differ': path.resolve(__dirname, './packages/differ/src/index.ts'),
      '@intra/impact': path.resolve(__dirname, './packages/impact/src/index.ts'),
      '@intra/adapter': path.resolve(__dirname, './packages/adapter/src/index.ts'),
      '@intra/validator': path.resolve(__dirname, './packages/validator/src/index.ts'),
      '@intra/sim-services': path.resolve(__dirname, './packages/sim-services/src/index.ts'),
      '@intra/sdk': path.resolve(__dirname, './packages/sdk/src/index.ts'),
      '@intra/engine': path.resolve(__dirname, './apps/engine/src/index.ts'),
      '@intra/demo-app': path.resolve(__dirname, './apps/demo-app/src/index.ts'),
      '@intra/mcpserver': path.resolve(__dirname, './mcpserver/src/index.ts'),
    },
  },
});
