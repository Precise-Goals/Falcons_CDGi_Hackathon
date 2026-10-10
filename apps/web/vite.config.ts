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
    },
  };
});
