#!/usr/bin/env node
/**
 * Build src/content/people.yaml (generated, not committed) from src/content/people.tsv.
 *
 *   node scripts/build-people.mjs [--geocode]
 *
 * people.tsv holds only what people provide: name, institution, city, state, country and links.
 * Everything else is derived here:
 * - id: slug of the name ("Pippa F. Cosper" -> pippa-f-cosper); working groups refer to it.
 * - photo: the file in src/img/people named after the person (jane-doe.png), if there is one.
 * - show_on_map: true.
 * - lat/lng: looked up in .geocode-cache.json by institution + place. Normal builds only read the
 *   cache; `npm run geocode` (--geocode) queries Nominatim for places the cache doesn't have yet.
 *
 * Optional extra TSV columns override the derived values: id, photo, show_on_map, lat, lng.
 */
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { stringify } from 'yaml';

const TSV = 'src/content/people.tsv';
const OUT = 'src/content/people.yaml';
const PHOTOS = 'src/img/people';
const CACHE_FILE = '.geocode-cache.json';
const geocode = process.argv.includes('--geocode');

const HEADER = `# GENERATED from people.tsv by scripts/build-people.mjs (runs before dev/build). Do not edit.
# Edit people.tsv instead; id, photo, show_on_map, lat and lng are filled in automatically.
`;

const slug = (s) =>
	s
		.normalize('NFKD')
		.replace(/[̀-ͯ]/g, '')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '');

function readTsv() {
	const [head, ...lines] = readFileSync(TSV, 'utf8')
		.replace(/^\uFEFF/, '')
		.split(/\r?\n/)
		.filter((l) => l.trim());
	const cols = head.split('\t').map((c) => c.trim());
	return lines.map((l) => {
		const cells = l.split('\t');
		return Object.fromEntries(cols.map((c, i) => [c, (cells[i] ?? '').trim()]));
	});
}

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
for (const row of readTsv()) {
	if (!row.name) continue;
	const id = row.id || slug(row.name);
	if (ids.has(id)) throw new Error(`Duplicate person id "${id}" (${row.name}) in ${TSV}`);
	ids.add(id);
	const entry = { id, name: row.name };
	for (const f of FIELDS) if (row[f]) entry[f] = row[f];
	const photo = row.photo || findPhoto(row.name);
	if (photo) entry.photo = photo;
	entry.show_on_map = row.show_on_map ? row.show_on_map.toLowerCase() !== 'false' : true;
	if (row.lat && row.lng) {
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
