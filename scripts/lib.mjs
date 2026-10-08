import { readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

export const DIST = 'dist';
export const BASE = (process.env.BASE_PATH || '/').replace(/\/?$/, '/');

/** All built .html files, as paths relative to dist. */
export function htmlFiles(dir = DIST) {
	const out = [];
	for (const name of readdirSync(dir)) {
		const p = join(dir, name);
		if (statSync(p).isDirectory()) out.push(...htmlFiles(p));
		else if (name.endsWith('.html')) out.push(relative(DIST, p));
	}
	return out;
}

/** Public URL path for a built html file (e.g. about/index.html -> BASE + about/). */
export function pagePath(file) {
	return BASE + file.replace(/index\.html$/, '').replace(/\.html$/, '');
}
