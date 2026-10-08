#!/usr/bin/env node
/**
 * Run axe-core (WCAG 2.x A/AA) against every built page. Serves dist/ itself,
 * honouring BASE_PATH. Needs a Chrome/Chromium: set CHROME_PATH.
 */
import http from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import puppeteer from 'puppeteer-core';
import { DIST, BASE, htmlFiles, pagePath } from './lib.mjs';

const exe = process.env.CHROME_PATH;
if (!exe) throw new Error('Set CHROME_PATH to a Chrome/Chromium executable.');

const types = {
	'.html': 'text/html; charset=utf-8',
	'.css': 'text/css',
	'.js': 'text/javascript',
	'.mjs': 'text/javascript',
	'.json': 'application/json',
	'.geojson': 'application/geo+json',
	'.svg': 'image/svg+xml',
	'.png': 'image/png',
	'.woff2': 'font/woff2',
	'.woff': 'font/woff',
	'.xml': 'application/xml',
	'.txt': 'text/plain',
};
const server = http.createServer((req, res) => {
	const path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
	if (!path.startsWith(BASE)) return res.writeHead(404).end();
	const rel = path.slice(BASE.length);
	const file = [rel, join(rel, 'index.html'), `${rel}.html`]
		.map((c) => join(DIST, c))
		.find((p) => existsSync(p) && statSync(p).isFile());
	if (!file) return res.writeHead(404).end('not found');
	res.writeHead(200, { 'Content-Type': types[extname(file)] ?? 'application/octet-stream' });
	res.end(readFileSync(file));
});
await new Promise((r) => server.listen(0, r));
const origin = `http://localhost:${server.address().port}`;

const axeSource = readFileSync('node_modules/axe-core/axe.min.js', 'utf8');
const browser = await puppeteer.launch({
	executablePath: exe,
	headless: true,
	args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});

let failures = 0;
const pages = htmlFiles();
for (const f of pages) {
	const page = await browser.newPage();
	await page.setViewport({ width: 1280, height: 800 });
	await page.goto(origin + pagePath(f), { waitUntil: 'load' });
	await new Promise((r) => setTimeout(r, f.startsWith('people') ? 4000 : 300));
	await page.evaluate(axeSource);
	const { violations } = await page.evaluate(() =>
		// eslint-disable-next-line no-undef
		axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'] }),
	);
	if (violations.length) {
		failures += violations.length;
		console.error(`\n${pagePath(f)}`);
		for (const v of violations) {
			console.error(`  [${v.impact}] ${v.id}: ${v.help}`);
			for (const n of v.nodes.slice(0, 3)) console.error(`      ${n.target.join(' ')}`);
		}
	} else console.log(`ok  ${pagePath(f)}`);
	await page.close();
}
await browser.close();
server.close();
if (failures) {
	console.error(`\n${failures} accessibility violation(s).`);
	process.exit(1);
}
console.log('\nAccessibility check passed.');
