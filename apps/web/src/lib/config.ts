declare const __INTRA_ENV__: Record<string, string> | undefined;

function getEnv(key: string, fallback = ''): string {
  // 1. Check define from vite.config.ts (__INTRA_ENV__)
  if (typeof __INTRA_ENV__ !== 'undefined' && __INTRA_ENV__[key]) {
    return __INTRA_ENV__[key];
  }
  // 2. Check import.meta.env
  const metaEnv = (import.meta as any)?.env;
  if (metaEnv) {
    const val = metaEnv[`VITE_${key}`] || metaEnv[key];
    if (val) return val;
  }
  return fallback;
}

export const ENV = {
  FIREBASE_API_KEY: getEnv('FIREBASE_API_KEY', 'AIzaSyC0voqfO5QnjEHI7zudgvZZUzE8r9ZAdkQ'),
  FIREBASE_AUTH_DOMAIN: getEnv('FIREBASE_AUTH_DOMAIN', 'horizon-1ba53.firebaseapp.com'),
  FIREBASE_PROJECT_ID: getEnv('FIREBASE_PROJECT_ID', 'horizon-1ba53'),
  FIREBASE_STORAGE_BUCKET: getEnv('FIREBASE_STORAGE_BUCKET', 'horizon-1ba53.firebasestorage.app'),
  FIREBASE_MESSAGING_SENDER_ID: getEnv('FIREBASE_MESSAGING_SENDER_ID', '185255650241'),
  FIREBASE_APP_ID: getEnv('FIREBASE_APP_ID', '1:185255650241:web:857b50184cf24b6a324540'),
  FIREBASE_MEASUREMENT_ID: getEnv('FIREBASE_MEASUREMENT_ID', 'G-X5QYSVRQEQ'),
  FIREBASE_DATABASE_URL: getEnv('FIREBASE_DATABASE_URL', 'https://horizon-1ba53-default-rtdb.asia-southeast1.firebasedatabase.app'),

  SARVAM_API_KEY: getEnv('SARVAM_API_KEY', 'sk_mhp6zj2k_CZWnzOpKIR4wrCdCDUwa6hJY'),
  SARVAM_BASE_URL: getEnv('SARVAM_BASE_URL', 'https://api.sarvam.ai'),
  SARVAM_MODEL: getEnv('SARVAM_MODEL', 'sarvam-105b'),

  MST_TESTNET_RPC: getEnv('MST_TESTNET_RPC', 'https://testnetrpc.mstblockchain.com'),
  CHAIN_ID: getEnv('CHAIN_ID', '91562037'),
  OPERATOR_PRIVATE_KEY: getEnv('OPERATOR_PRIVATE_KEY', '0xc9b810a17bc68a8745424ee4cd0cad5dfccb843159280c971d1fe12dca9554e8'),
  MIN_BALANCE: getEnv('MIN_BALANCE', '0.1'),
};
