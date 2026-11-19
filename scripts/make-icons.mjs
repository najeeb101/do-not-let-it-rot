// Renders design/assets/app-icon.svg to the PWA PNG icons with Chromium (Playwright).
// Run: node scripts/make-icons.mjs
import { chromium } from '@playwright/test';
import { mkdir, readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const svg = await readFile(resolve(root, 'design/assets/app-icon.svg'), 'utf8');
const out = resolve(root, 'public/icons');
await mkdir(out, { recursive: true });

const targets = [
  ['icon-192.png', 192],
  ['icon-512.png', 512],
  ['icon-maskable-512.png', 512],
];

const browser = await chromium.launch();
for (const [name, size] of targets) {
  const page = await browser.newPage({ viewport: { width: size, height: size } });
  await page.setContent(
    `<html><body style="margin:0">${svg.replace(/<\?xml[^>]*\?>/, '').replace(/width="512" height="512"/, `width="${size}" height="${size}"`)}</body></html>`,
  );
  await page.screenshot({ path: resolve(out, name), clip: { x: 0, y: 0, width: size, height: size } });
  await page.close();
}
await browser.close();
