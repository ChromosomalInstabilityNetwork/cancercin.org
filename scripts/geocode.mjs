#!/usr/bin/env node
/**
 * Fill in missing lat/lng for entries in src/content/people.yaml.
 *
 *   GEOCODE_CONTACT=you@example.org node scripts/geocode.mjs [--dry-run] [--file path.yaml]
 *
 * - Only entries with no lat/lng are geocoded; existing coordinates (including
 *   manual overrides) are never overwritten.
 * - Results are cached in .geocode-cache.json (committed) so reruns never re-query.
 * - Run locally, never in CI or in visitors' browsers. Use institutional
 *   addresses, not home addresses.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { parseDocument } from 'yaml';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const fileArg = args.indexOf('--file');
const FILE = fileArg >= 0 ? args[fileArg + 1] : 'src/content/people.yaml';
const CACHE_FILE = '.geocode-cache.json';

/** A provider is { name, geocode(query) -> { lat, lng, display } | null, delayMs }. */
const nominatim = {
	name: 'nominatim',
	delayMs: 1100, // usage policy: max 1 request/second
	async geocode(query) {
		const contact = process.env.GEOCODE_CONTACT;
		if (!contact) throw new Error('Set GEOCODE_CONTACT to a contact email for the User-Agent.');
		const u = new URL('https://nominatim.openstreetmap.org/search');
		u.search = new URLSearchParams({ q: query, format: 'jsonv2', limit: '1' });
		const res = await fetch(u, {
			headers: { 'User-Agent': `cancercin.org-geocoder/1.0 (${contact})` },
		});
		if (!res.ok) throw new Error(`Nominatim HTTP ${res.status}`);
		const [hit] = await res.json();
		return hit
			? { lat: +(+hit.lat).toFixed(5), lng: +(+hit.lon).toFixed(5), display: hit.display_name }
			: null;
	},
};
const provider = nominatim; // swap here for MapTiler/Geoapify/Mapbox (read keys from env only)

const cache = existsSync(CACHE_FILE) ? JSON.parse(readFileSync(CACHE_FILE, 'utf8')) : {};
const doc = parseDocument(readFileSync(FILE, 'utf8'));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const rows = [];
let queried = false;

for (const item of doc.contents.items) {
	const get = (k) => item.get(k);
	if (get('lat') !== undefined && get('lng') !== undefined) continue;

	const address = get('address');
	if (!address && !get('institution')) continue; // nothing to look up
	const parts = String(address ?? '')
		.split(',')
		.map((p) => p.trim())
		.filter(Boolean);
	// Most specific first; street/suite details often fail, so fall back to a coarser place.
	const queries = [
		address,
		[get('institution')?.split(';')[0], get('city'), get('country')].filter(Boolean).join(', '),
		parts.slice(-3).join(', '),
		parts.slice(-2).join(', '),
	].filter((q, i, a) => q && a.indexOf(q) === i);
	let result = null;
	let usedQuery = '';
	for (const q of queries.filter(Boolean)) {
		const key = `${provider.name}:${q}`;
		if (!(key in cache)) {
			if (queried) await sleep(provider.delayMs);
			queried = true;
			cache[key] = await provider.geocode(q);
			writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2) + '\n');
		}
		if (cache[key]) {
			result = cache[key];
			usedQuery = q;
			break;
		}
	}

	rows.push({
		id: get('id') ?? get('name'),
		query: usedQuery || queries[0],
		lat: result?.lat ?? '—',
		lng: result?.lng ?? '—',
		matched: result?.display ?? 'NO MATCH',
	});
	if (result && !dryRun) {
		item.set('lat', result.lat);
		item.set('lng', result.lng);
	}
}

if (!rows.length) {
	console.log('Nothing to geocode: every entry already has lat/lng.');
} else {
	console.table(rows);
	console.log(
		'Review the "matched" column for bad matches. Fix by setting lat/lng by hand in the data file.',
	);
	if (dryRun) console.log('Dry run: no files written.');
	else writeFileSync(FILE, String(doc));
}
