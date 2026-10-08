import { url } from './url';
import { NAV, isGroup, type NavGroup } from './site';

const trim = (p: string) => p.replace(/\/+$/, '') || '/';

/** True if `path` is the page at `href` (site-relative) or sits beneath it. */
export function isCurrent(path: string, href: string, exact = false): boolean {
	const a = trim(path);
	const b = trim(url(href));
	return exact ? a === b : a === b || a.startsWith(b + '/');
}

/** The nav group whose pages include `path`, if any. */
export function groupFor(path: string): NavGroup | undefined {
	return NAV.filter(isGroup).find((g) => g.children.some((c) => isCurrent(path, c.href)));
}
