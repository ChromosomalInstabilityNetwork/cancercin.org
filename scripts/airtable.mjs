/**
 * Fetch approved members from the Airtable "Members" table, normalized to the shape of a person in
 * the `people` collection (see src/content.config.ts). Build-time only: the token never reaches
 * the site.
 *
 * Environment (all required):
 *   AIRTABLE_TOKEN     personal access token with data.records:read on the base
 *   AIRTABLE_BASE_ID   base id (app…)
 *   AIRTABLE_TABLE     table name or id
 */

// Only these fields are requested, so Email and Mailing List never leave Airtable.
const FIELDS = [
	'Name',
	'Affiliation',
	'Role',
	'Location',
	'Bluesky',
	'Twitter',
	'LinkedIn',
	'Group Website',
	'Headshot',
	'List In Directory',
	'Approved',
	'Mapped',
];
const IMAGE_EXT = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' };

const text = (v) => (typeof v === 'string' ? v.trim() : '');

/** A full URL, adding https:// when the scheme was left off; undefined if it still is not one. */
function webUrl(value, who, field) {
	const v = text(value);
	if (!v) return undefined;
	const candidate = /^https?:\/\//i.test(v) ? v : `https://${v}`;
	if (URL.canParse(candidate) && new URL(candidate).hostname.includes('.')) return candidate;
	console.warn(`Airtable: ignoring ${field} of ${who}: "${v}" is not a URL.`);
}

/** Profile URL from a handle ("@jane", "jane") or from a profile link pasted in its place. */
function profileUrl(value, base, who, field) {
	const v = text(value);
	if (/^https?:\/\//i.test(v)) return webUrl(v, who, field);
	const handle = v.replace(/^@/, '');
	if (!handle) return undefined;
	if (/^[\w.-]+$/.test(handle)) return base + handle;
	console.warn(`Airtable: ignoring ${field} of ${who}: "${v}" is not a handle.`);
}

function normalize(fields) {
	const name = text(fields.Name);
	const person = { name };
	const role = text(fields.Role);
	if (role && role !== 'Other') person.role = role; // "Other" says nothing, so it is not shown
	const institution = text(fields.Affiliation);
	if (institution) person.institution = institution;
	const location = text(fields.Location);
	if (location) person.location = location;
	const website = webUrl(fields['Group Website'], name, 'Group Website');
	if (website) person.website = website;
	const bluesky = text(fields['Bluesky']).replace(/^@/, '');
	const blueskyUrl = profileUrl(
		bluesky && !bluesky.includes('.') ? `${bluesky}.bsky.social` : bluesky,
		'https://bsky.app/profile/',
		name,
		'Bluesky',
	);
	if (blueskyUrl) person.bluesky = blueskyUrl;
	const x = profileUrl(fields['Twitter'], 'https://x.com/', name, 'Twitter');
	if (x) person.x = x;
	const linkedin = profileUrl(fields.LinkedIn, 'https://www.linkedin.com/in/', name, 'LinkedIn');
	if (linkedin) person.linkedin = linkedin;
	person.show_on_map = fields.Mapped === true;
	// Attachment URLs expire after a few hours: download them, never publish them.
	const headshot = (Array.isArray(fields.Headshot) ? fields.Headshot : []).find(
		(a) => a?.url && IMAGE_EXT[a.type],
	);
	if (headshot) person.headshot = { url: headshot.url, ext: IMAGE_EXT[headshot.type] };
	else if (fields.Headshot?.length) {
		console.warn(`Airtable: ignoring Headshot of ${name}: not a PNG, JPEG or WebP image.`);
	}
	return person;
}

/** Members with Approved and List In Directory checked. `headshot` ({ url, ext }) is set when the record has an image attached. */
export async function fetchMembers() {
	const env = ['AIRTABLE_TOKEN', 'AIRTABLE_BASE_ID', 'AIRTABLE_TABLE'];
	const unset = env.filter((k) => !process.env[k]);
	if (unset.length) {
		throw new Error(
			`Missing ${unset.join(', ')}: the People directory is built from Airtable (see README).`,
		);
	}
	const [token, base, table] = env.map((k) => process.env[k]);
	const url = new URL(`https://api.airtable.com/v0/${base}/${encodeURIComponent(table)}`);
	url.searchParams.set('filterByFormula', 'AND({Approved}, {List In Directory})');
	for (const f of FIELDS) url.searchParams.append('fields[]', f);

	const members = [];
	let offset;
	do {
		if (offset) url.searchParams.set('offset', offset);
		let res;
		try {
			res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
		} catch (err) {
			throw new Error(`Airtable request failed: ${err.cause?.message ?? err.message}`, {
				cause: err,
			});
		}
		if (!res.ok) {
			const body = await res.json().catch(() => ({}));
			const detail = body.error?.message ?? body.error?.type ?? body.error ?? res.statusText;
			throw new Error(`Airtable request failed: HTTP ${res.status} ${detail}`);
		}
		const page = await res.json();
		if (!Array.isArray(page.records)) throw new Error('Airtable response has no records.');
		for (const { id, fields } of page.records) {
			if (fields.Approved !== true || fields['List In Directory'] !== true) continue;
			if (!text(fields.Name)) {
				console.warn(`Airtable: skipping approved record ${id}: it has no Name.`);
				continue;
			}
			members.push(normalize(fields));
		}
		offset = page.offset;
	} while (offset);

	if (!members.length) {
		throw new Error('Airtable returned no members with Approved and List In Directory checked.');
	}
	return members;
}
