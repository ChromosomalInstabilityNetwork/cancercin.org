import { url } from './url';
import { NAV, isGroup, type NavGroup, type NavLink } from './site';

const trim = (p: string) => p.replace(/\/+$/, '') || '/';

const allLinks: NavLink[] = NAV.flatMap((i) => (isGroup(i) ? i.children : [i]));

/** The nav link that best matches `path`: exact, else the longest parent (e.g. /news/x/ -> News). */
function activeLink(path: string): NavLink | undefined {
	const p = trim(path);
	return allLinks
		.filter((l) => {
			const h = trim(url(l.href));
			return p === h || p.startsWith(h + '/');
		})
		.sort((a, b) => b.href.length - a.href.length)[0];
}

/** True if `href` is the single active nav link for `path`. */
export function isCurrent(path: string, href: string): boolean {
	return activeLink(path)?.href === href;
}

/** The nav group containing the active link, if any. */
export function groupFor(path: string): NavGroup | undefined {
	const active = activeLink(path);
	return NAV.filter(isGroup).find((g) => g.children.some((c) => c.href === active?.href));
}
