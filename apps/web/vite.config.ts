import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  const rootDir = path.resolve(__dirname, '../../');
  const env = loadEnv(mode, rootDir, '');

  return {
    plugins: [react()],
    envDir: rootDir,
    define: {
      '__INTRA_ENV__': JSON.stringify({
        FIREBASE_API_KEY: env.FIREBASE_API_KEY || '',
        FIREBASE_AUTH_DOMAIN: env.FIREBASE_AUTH_DOMAIN || '',
        FIREBASE_PROJECT_ID: env.FIREBASE_PROJECT_ID || '',
        FIREBASE_STORAGE_BUCKET: env.FIREBASE_STORAGE_BUCKET || '',
        FIREBASE_MESSAGING_SENDER_ID: env.FIREBASE_MESSAGING_SENDER_ID || '',
        FIREBASE_APP_ID: env.FIREBASE_APP_ID || '',
        FIREBASE_MEASUREMENT_ID: env.FIREBASE_MEASUREMENT_ID || '',
        FIREBASE_DATABASE_URL: env.FIREBASE_DATABASE_URL || 'https://horizon-1ba53-default-rtdb.asia-southeast1.firebasedatabase.app',
        SARVAM_API_KEY: env.SARVAM_API_KEY || '',
        SARVAM_BASE_URL: env.SARVAM_BASE_URL || 'https://api.sarvam.ai',
        SARVAM_MODEL: env.SARVAM_MODEL || 'sarvam-105b',
        MST_TESTNET_RPC: env.MST_TESTNET_RPC || 'https://testnetrpc.mstblockchain.com',
        CHAIN_ID: env.CHAIN_ID || '91562037',
        OPERATOR_PRIVATE_KEY: env.OPERATOR_PRIVATE_KEY || '',
        MIN_BALANCE: env.MIN_BALANCE || '0.1',
      }),
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      proxy: {
        '/api/engine': {
          target: 'http://localhost:3001',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/engine/, ''),
        },
        '/api/mcp': {
          target: 'http://localhost:3002',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/mcp/, ''),
        },
        '/api/sim': {
          target: 'http://localhost:4000',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/sim/, ''),
        },
      },
    },
    resolve: {
      alias: {
        '@intra/sdk': path.resolve(__dirname, '../../packages/sdk/src/index.ts'),
        '@intra/shared': path.resolve(__dirname, '../../packages/shared/src/index.ts'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules/ethers')) return 'vendor-ethers';
            if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) return 'vendor-react';
            if (id.includes('node_modules/lucide-react')) return 'vendor-icons';
            if (id.includes('containers/HomeContainer')) return 'container-home';
            if (id.includes('containers/ProductsContainer')) return 'container-products';
            if (id.includes('containers/DocsContainer')) return 'container-docs';
            if (id.includes('containers/PricingContainer')) return 'container-pricing';
            if (id.includes('containers/DashboardContainer')) return 'container-dashboard';
            if (id.includes('containers/LabContainer')) return 'container-lab';
          },
        },
      },
    },
  };
});
