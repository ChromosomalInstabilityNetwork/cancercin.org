#!/usr/bin/env node
/**
 * Generate public/og.png (1200x630) from the brand colours and fonts.
 *   CHROME_PATH=/path/to/chrome node scripts/make-og.mjs
 * Output is committed; rerun only if the branding changes.
 */
import puppeteer from 'puppeteer-core';
import { readFileSync } from 'node:fs';

const exe = process.env.CHROME_PATH;
if (!exe) throw new Error('Set CHROME_PATH to a Chrome/Chromium executable.');
const font = (pkg, file) =>
	`data:font/woff2;base64,${readFileSync(`node_modules/@fontsource/${pkg}/files/${file}`).toString('base64')}`;

const html = `<!doctype html><meta charset="utf-8"><style>
@font-face{font-family:F;font-weight:600;src:url(${font('fraunces', 'fraunces-latin-600-normal.woff2')})}
@font-face{font-family:I;font-weight:500;src:url(${font('instrument-sans', 'instrument-sans-latin-500-normal.woff2')})}
body{margin:0;width:1200px;height:630px;background:#1b1a2e;color:#fff;display:flex;flex-direction:column;justify-content:center;padding:0 96px;box-sizing:border-box;position:relative;overflow:hidden}
body::after{content:'';position:absolute;right:-140px;top:-140px;width:520px;height:520px;border-radius:50%;background:#34335a}
body::before{content:'';position:absolute;right:130px;bottom:90px;width:36px;height:36px;border-radius:50%;background:#e9a8d8;z-index:1}
h1{font:600 84px/1.05 F,serif;margin:0 0 28px;max-width:860px;position:relative;z-index:2}
p{font:500 34px/1.3 I,sans-serif;color:#d9d5e3;margin:0;max-width:800px;position:relative;z-index:2}
</style><h1>Cancer CIN Consortium</h1><p>A community of laboratories advancing chromosomal instability research from the bench to the clinic.</p>`;

const browser = await puppeteer.launch({
	executablePath: exe,
	headless: true,
	args: ['--no-sandbox'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1200, height: 630 });
await page.setContent(html);
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: 'public/og.png' });
await browser.close();
console.log('Wrote public/og.png');
