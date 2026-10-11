import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, '../dist');
const indexHtmlPath = path.join(distDir, 'index.html');

if (!fs.existsSync(indexHtmlPath)) {
  console.warn('[copy-spa-html] dist/index.html not found, skipping route copies.');
  process.exit(0);
}

const routes = [
  'docs',
  'eval',
  'dashboard',
  'agent',
  'mcp',
  'sdk',
  'pricing',
  'home',
];

for (const route of routes) {
  const targetDir = path.join(distDir, route);
  fs.mkdirSync(targetDir, { recursive: true });
  fs.copyFileSync(indexHtmlPath, path.join(targetDir, 'index.html'));
}

// Also create 404.html fallback for any nested dynamic routes
fs.copyFileSync(indexHtmlPath, path.join(distDir, '404.html'));

console.log(`[copy-spa-html] Successfully generated static entrypoints for ${routes.length} SPA routes and 404.html fallback.`);
