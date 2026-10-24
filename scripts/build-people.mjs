#!/usr/bin/env node
/**
 * Build src/content/people.built.yaml (generated, not committed) from src/content/people.yaml.
 *
 *   node scripts/build-people.mjs [--geocode]
 *
 * people.yaml holds only what people provide: name, institution, city, state, country, links and
 * (optionally) a photo filename. The built file adds everything else:
 * - id: slug of the name ("Pippa F. Cosper" -> pippa-f-cosper); working groups refer to it.
 * - photo: the `photo` given in people.yaml, else the file in src/img/people named after the person.
 * - show_on_map: true.
 * - lat/lng: looked up in .geocode-cache.json by institution + place. Normal builds only read the
 *   cache; `npm run geocode` (--geocode) queries Nominatim for places the cache doesn't have yet.
 *
 * Optional id, show_on_map, lat and lng keys in people.yaml override the derived values.
 */
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { parse, stringify } from 'yaml';

const SRC = 'src/content/people.yaml';
const OUT = 'src/content/people.built.yaml';
const PHOTOS = 'src/img/people';
const CACHE_FILE = '.geocode-cache.json';
const geocode = process.argv.includes('--geocode');

const HEADER = `# GENERATED from people.yaml by scripts/build-people.mjs (runs before dev/build). Do not edit.
# Edit people.yaml instead; id, show_on_map, lat and lng are filled in automatically.
`;

const slug = (s) =>
	s
		.normalize('NFKD')
		.replace(/[̀-ͯ]/g, '')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '');

const readPeople = () => parse(readFileSync(SRC, 'utf8')) ?? [];

const photoFiles = new Map(
	existsSync(PHOTOS)
		? readdirSync(PHOTOS)
				.filter((f) => /\.(png|jpe?g|webp)$/i.test(f))
				.map((f) => [f.replace(/\.[^.]+$/, '').toLowerCase(), f])
		: [],
);
function findPhoto(name) {
	const w = slug(name).split('-');
	const tries = [w.join('-'), `${w[0]}-${w[w.length - 1]}`];
	for (const t of tries) if (photoFiles.has(t)) return photoFiles.get(t);
}

/** Queries to try, most specific first: institution + place, then just the place. */
function queriesFor(p) {
	const place = [p.city, p.state, p.country].filter(Boolean).join(', ');
	if (!place) return [];
	const institution = p.institution?.split(';')[0].split(',').pop()?.trim();
	return [institution ? `${institution}, ${place}` : '', place].filter(Boolean);
}

const cache = existsSync(CACHE_FILE) ? JSON.parse(readFileSync(CACHE_FILE, 'utf8')) : {};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let queried = false;

async function nominatim(query) {
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
}

async function locate(p) {
	for (const q of queriesFor(p)) {
		const key = `nominatim:${q}`;
		if (!(key in cache) && geocode) {
			if (queried) await sleep(1100); // usage policy: max 1 request/second
			queried = true;
			cache[key] = await nominatim(q);
			writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2) + '\n');
			console.log(`geocoded ${q}: ${cache[key]?.display ?? 'NO MATCH'}`);
		}
		if (cache[key]) return cache[key];
	}
}

const FIELDS = ['institution', 'city', 'state', 'country', 'website', 'x', 'linkedin', 'bluesky'];
const people = [];
const missing = [];
const ids = new Set();
for (const row of readPeople()) {
	if (!row.name) continue;
	const id = row.id || slug(row.name);
	if (ids.has(id)) throw new Error(`Duplicate person id "${id}" (${row.name}) in ${SRC}`);
	ids.add(id);
	const entry = { id, name: row.name };
	for (const f of FIELDS) if (row[f]) entry[f] = row[f];
	const photo = row.photo || findPhoto(row.name);
	if (photo) entry.photo = photo;
	entry.show_on_map = row.show_on_map ?? true;
	if (row.lat !== undefined && row.lng !== undefined) {
		entry.lat = +row.lat;
		entry.lng = +row.lng;
	} else {
		const hit = await locate(row);
		if (hit) {
			entry.lat = hit.lat;
			entry.lng = hit.lng;
		} else if (queriesFor(row).length) missing.push(row.name);
	}
	people.push(entry);
}

writeFileSync(OUT, HEADER + '\n' + stringify(people, { lineWidth: 0 }));
console.log(`people.yaml: ${people.length} people`);
if (missing.length) {
	console.warn(
		`No coordinates yet for ${missing.join(', ')}: they won't appear on the map. Run \`GEOCODE_CONTACT=you@example.org npm run geocode\`.`,
	);
}
