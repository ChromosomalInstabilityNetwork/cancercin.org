#!/usr/bin/env node
/**
 * Fail on broken internal links, assets and #fragments in the built site (dist/).
 * Honours BASE_PATH, so run it against a build made with the same value.
 */
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { DIST, BASE, htmlFiles, pagePath } from './lib.mjs';

const files = htmlFiles();
const ids = new Map(); // page path -> Set of ids
const html = new Map();
for (const f of files) {
	const src = readFileSync(join(DIST, f), 'utf8');
	html.set(f, src);
	ids.set(pagePath(f), new Set([...src.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])));
}

const resolve = (urlPath) => {
	const rel = decodeURIComponent(urlPath.slice(BASE.length));
	for (const c of [rel, join(rel, 'index.html'), rel + '.html']) {
		const p = join(DIST, c);
		if (existsSync(p) && statSync(p).isFile()) return p;
	}
	return null;
};

const problems = [];
let checked = 0;
for (const [file, src] of html) {
	const from = pagePath(file);
	for (const m of src.matchAll(/\s(?:href|src)="([^"]*)"/g)) {
		const raw = m[1].replace(/&amp;/g, '&');
		if (!raw || /^(https?:|mailto:|tel:|data:|javascript:|\/\/)/.test(raw)) continue;
		checked++;
		const [pathPart, hash] = raw.split('#');
		const target = pathPart ? new URL(pathPart, `http://x${from}`).pathname : from;
		if (!target.startsWith(BASE)) {
			problems.push(`${file}: "${raw}" is outside the base path ${BASE}`);
			continue;
		}
		const found = resolve(target);
		if (!found) {
			problems.push(`${file}: broken link "${raw}"`);
			continue;
		}
		if (hash) {
			const tp = target.endsWith('/') || !found.endsWith('.html') ? target : target;
			const set = ids.get(tp) ?? ids.get(tp + '/');
			if (!set?.has(hash)) problems.push(`${file}: missing fragment "#${hash}" in ${target}`);
		}
	}
}

if (problems.length) {
	console.error(`${problems.length} link problem(s):\n` + [...new Set(problems)].join('\n'));
	process.exit(1);
}
console.log(`Link check passed: ${checked} internal references across ${files.length} pages.`);
