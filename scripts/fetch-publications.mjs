#!/usr/bin/env node
/**
 * Fetch publications from PubMed and update src/content/publications.yaml.
 *
 *   node scripts/fetch-publications.mjs
 *
 * Run on every deploy (see .github/workflows/deploy.yml). Entries whose id starts with "pmid-" are
 * generated and replaced on each run; everything else (for example the featured Perspective) is
 * hand-curated and kept as is. Bracketed placeholder rows are dropped once real results arrive.
 *
 * Environment (all optional):
 *   PUBMED_QUERY   PubMed search term (default: "chromosomal instability" OR "tumor evolution" OR
 *                  ("aneuploidy" AND "cancer"), in title/abstract)
 *   PUBS_MAX       maximum number of most-recent results to keep (default 200)
 *   PUBS_OUT       output file (default src/content/publications.yaml)
 *   NCBI_API_KEY   raises the NCBI rate limit from 3 to 10 requests/second
 *   NCBI_EMAIL     contact address NCBI asks tools to send
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { parse, stringify } from 'yaml';

const QUERY =
	process.env.PUBMED_QUERY ||
	[
		'"chromosomal instability"[Title/Abstract]',
		'"tumor evolution"[Title/Abstract]',
		'"tumour evolution"[Title/Abstract]',
		'("aneuploidy"[Title/Abstract] AND "cancer"[Title/Abstract])',
	].join(' OR ');
const MAX = parseInt(process.env.PUBS_MAX || '200', 10);
const OUT = process.env.PUBS_OUT || 'src/content/publications.yaml';
const HEADER =
	'# Entries with a pmid- id are generated on every deploy from PubMed (scripts/fetch-publications.mjs).\n' +
	'# Other entries are hand-curated and kept as is.\n' +
	'# Never add a DOI/URL that has not been verified.\n';
const BASE = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';
const API_KEY = process.env.NCBI_API_KEY;
const EMAIL = process.env.NCBI_EMAIL;
const MAX_AUTHORS = 6;

const params = (extra) => {
	const p = new URLSearchParams({
		db: 'pubmed',
		retmode: 'json',
		tool: 'icin-site-publications',
		...extra,
	});
	if (API_KEY) p.set('api_key', API_KEY);
	if (EMAIL) p.set('email', EMAIL);
	return p;
};

async function get(path, extra) {
	const res = await fetch(`${BASE}/${path}?${params(extra)}`);
	if (!res.ok) throw new Error(`${path} failed: ${res.status}`);
	return res.json();
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const isPlaceholder = (e) => typeof e.title === 'string' && e.title.startsWith('[') && !e.featured;
const isGenerated = (e) => typeof e.id === 'string' && e.id.startsWith('pmid-');
const clean = (s) =>
	s
		.replace(/<[^>]+>/g, '')
		.replace(/\s+/g, ' ')
		.trim();

const MONTHS = {
	jan: '01',
	feb: '02',
	mar: '03',
	apr: '04',
	may: '05',
	jun: '06',
	jul: '07',
	aug: '08',
	sep: '09',
	oct: '10',
	nov: '11',
	dec: '12',
};

/** "2026 Oct 15" -> "2026-10-15", "2026 Oct" -> "2026-10", "2026" or "2026 Spring" -> "2026". */
function parseDate(text) {
	const m = /^(\d{4})(?:\s+([A-Za-z]{3})[a-z]*)?(?:\s+(\d{1,2}))?/.exec(text ?? '');
	if (!m) return null;
	const month = m[2] && MONTHS[m[2].toLowerCase()];
	if (!month) return m[1];
	return m[3] ? `${m[1]}-${month}-${m[3].padStart(2, '0')}` : `${m[1]}-${month}`;
}

/** Prefer the electronic publication date (the day it appeared online); fall back to the issue date. */
function bestDate(r) {
	const online = parseDate(r.epubdate);
	const issue = parseDate(r.pubdate);
	return online && online.length === 10 ? online : (issue ?? online);
}

/** Sort key that orders partial dates sensibly ("2026" < "2026-03" < "2026-03-09"). */
const sortKey = (d = '') => `${d}${'-00-00'.slice(Math.max(0, d.length - 4))}`;

function authorList(authors = []) {
	const names = authors.filter((a) => a.authtype === 'Author' || !a.authtype).map((a) => a.name);
	if (names.length <= MAX_AUTHORS) return names.join(', ');
	return `${names.slice(0, MAX_AUTHORS).join(', ')}, et al.`;
}

async function fetchPubMed() {
	const search = await get('esearch.fcgi', { term: QUERY, retmax: String(MAX), sort: 'pub_date' });
	const ids = search.esearchresult.idlist;
	console.log(
		`PubMed matched ${search.esearchresult.count} records; keeping the ${ids.length} newest.`,
	);
	const rows = [];
	for (let i = 0; i < ids.length; i += 100) {
		const batch = ids.slice(i, i + 100);
		const sum = await get('esummary.fcgi', { id: batch.join(',') });
		for (const id of batch) {
			const r = sum.result?.[id];
			if (!r) continue;
			const date = bestDate(r);
			rows.push({
				id: `pmid-${id}`,
				...(date ? { date } : {}),
				title: clean(r.title).replace(/\.$/, ''),
				authors: authorList(r.authors),
				journal: r.source,
				url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`,
			});
		}
		await sleep(API_KEY ? 110 : 400);
	}
	return rows;
}

async function main() {
	const existing = existsSync(OUT) ? parse(readFileSync(OUT, 'utf8')) : [];
	if (!Array.isArray(existing)) throw new Error('publications.yaml is not a top-level list');

	// Keep hand-curated entries; drop placeholders and the previous generated rows.
	const curated = existing.filter((e) => !isGenerated(e) && !isPlaceholder(e));

	const generated = await fetchPubMed();
	if (generated.length === 0) throw new Error('PubMed returned no results');
	generated.sort(
		(a, b) => sortKey(b.date).localeCompare(sortKey(a.date)) || a.title.localeCompare(b.title),
	);

	const out = [...curated, ...generated];
	writeFileSync(
		OUT,
		HEADER +
			stringify(out, { defaultStringType: 'QUOTE_SINGLE', defaultKeyType: 'PLAIN', lineWidth: 0 }),
	);
	console.log(`Wrote ${generated.length} generated + ${curated.length} curated entries to ${OUT}`);
}

// On failure keep the existing file so the build still succeeds.
main().catch((err) => {
	console.error('PubMed update failed, keeping existing file:', err.message);
	if (!existsSync(OUT)) process.exit(1);
});
