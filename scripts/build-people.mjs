#!/usr/bin/env node
/**
 * Build src/content/people.built.yaml (generated, not committed) from the Airtable Members table.
 *
 *   node scripts/build-people.mjs
 *
 * scripts/airtable.mjs fetches the approved members. This script adds everything else:
 * - id: slug of the name ("Jane Q. Doe" -> jane-q-doe); working groups refer to it.
 * - photo: the Airtable headshot, downloaded to src/img/people/airtable (not committed), else the
 *   file in src/img/people named after the person.
 * - lat/lng: looked up in .geocode-cache.json by affiliation + location. Places the cache doesn't
 *   have yet are looked up with Nominatim when GEOCODE_CONTACT is set.
 */
import { readFileSync, writeFileSync, existsSync, readdirSync, rmSync, mkdirSync } from 'node:fs';
import { stringify } from 'yaml';
import { fetchMembers } from './airtable.mjs';

const OUT = 'src/content/people.built.yaml';
const PHOTOS = 'src/img/people';
const DOWNLOADS = 'airtable'; // folder in PHOTOS for headshots downloaded from Airtable
const CACHE_FILE = '.geocode-cache.json';
const CONTACT = process.env.GEOCODE_CONTACT;

const HEADER = `# GENERATED from Airtable by scripts/build-people.mjs (runs before dev/build). Do not edit.
`;

const slug = (s) =>
	s
		.normalize('NFKD')
		.replace(/[̀-ͯ]/g, '')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '');

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

/** Save a member's Airtable headshot as <id>.<ext>; returns its path within PHOTOS. */
async function downloadPhoto(id, { url, ext }) {
	const res = await fetch(url);
	if (!res.ok) throw new Error(`HTTP ${res.status}`);
	const file = `${DOWNLOADS}/${id}.${ext}`;
	writeFileSync(`${PHOTOS}/${file}`, Buffer.from(await res.arrayBuffer()));
	return file;
}

/** Queries to try, most specific first: institution + place, then just the place. */
function queriesFor(p) {
	if (!p.location) return [];
	const institution = p.institution?.split(';')[0].split(',').pop()?.trim();
	return [institution ? `${institution}, ${p.location}` : '', p.location].filter(Boolean);
}

const cache = existsSync(CACHE_FILE) ? JSON.parse(readFileSync(CACHE_FILE, 'utf8')) : {};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let queried = false;

async function nominatim(query) {
	const u = new URL('https://nominatim.openstreetmap.org/search');
	u.search = new URLSearchParams({ q: query, format: 'jsonv2', limit: '1' });
	const res = await fetch(u, {
		headers: { 'User-Agent': `cancercin.org-geocoder/1.0 (${CONTACT})` },
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
		if (!(key in cache) && CONTACT) {
			if (queried) await sleep(1100); // usage policy: max 1 request/second
			queried = true;
			try {
				cache[key] = await nominatim(q);
			} catch (err) {
				console.warn(`Could not geocode ${q}: ${err.message}`);
				continue;
			}
			writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2) + '\n');
			console.log(`geocoded ${q}: ${cache[key]?.display ?? 'NO MATCH'}`);
		}
		if (cache[key]) return cache[key];
	}
}

const members = await fetchMembers().catch((err) => {
	console.error(err.message);
	process.exit(1);
});
rmSync(`${PHOTOS}/${DOWNLOADS}`, { recursive: true, force: true });
mkdirSync(`${PHOTOS}/${DOWNLOADS}`, { recursive: true });

const people = [];
const repoPhoto = [];
const unmapped = [];
const ids = new Set();
for (const { headshot, ...member } of members) {
	const id = slug(member.name);
	if (ids.has(id)) throw new Error(`Duplicate person id "${id}" (${member.name}) in Airtable`);
	ids.add(id);
	const entry = { id, ...member };
	if (headshot) {
		try {
			entry.photo = await downloadPhoto(id, headshot);
		} catch (err) {
			console.warn(`Could not download the Airtable headshot of ${member.name}: ${err.message}`);
		}
	}
	if (!entry.photo) {
		const photo = findPhoto(member.name);
		if (photo) {
			entry.photo = photo;
			repoPhoto.push(member.name);
		}
	}
	if (member.show_on_map) {
		const hit = await locate(member);
		if (hit) {
			entry.lat = hit.lat;
			entry.lng = hit.lng;
		} else unmapped.push(member.name);
	}
	people.push(entry);
}

writeFileSync(OUT, HEADER + '\n' + stringify(people, { lineWidth: 0 }));
console.log(`Airtable: ${people.length} people`);
if (repoPhoto.length) {
	console.log(`Headshot from ${PHOTOS} (none in Airtable): ${repoPhoto.join(', ')}`);
}
if (unmapped.length) {
	console.warn(
		`No coordinates for ${unmapped.join(', ')}: they won't appear on the map.` +
			(CONTACT ? '' : ' Set GEOCODE_CONTACT to look them up.'),
	);
}
