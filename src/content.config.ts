import { defineCollection } from 'astro:content';
import { glob, file } from 'astro/loaders';
import { z } from 'astro/zod';

// Placeholder entries leave dates/links unset; real entries should fill them in.
const people = defineCollection({
	loader: file('src/content/people.built.yaml'),
	schema: z.object({
		publish: z.boolean().default(true), // false hides the entry from the site
		name: z.string(),
		institution: z.string().optional(),
		city: z.string().optional(),
		state: z.string().optional(), // state or province, where it applies
		country: z.string().optional(),
		lat: z.number().min(-90).max(90).optional(),
		lng: z.number().min(-180).max(180).optional(),
		photo: z.string().optional(), // filename in src/img/people, e.g. jane-doe.png
		// Optional links, shown as icons under the person (full URLs).
		website: z.url().optional(),
		x: z.url().optional(),
		linkedin: z.url().optional(),
		bluesky: z.url().optional(),
		show_on_map: z.boolean().default(true),
	}),
});

const events = defineCollection({
	loader: glob({ pattern: '**/*.md', base: 'src/content/events' }),
	schema: z.object({
		publish: z.boolean().default(true), // false hides the entry from the site
		title: z.string(),
		start: z.coerce.date().optional(), // unset = date to be announced (shown as upcoming)
		end: z.coerce.date().optional(),
		location: z.string(),
		type: z.enum(['lecture', 'session', 'workshop']),
		link: z.url().optional(),
		image: z.string().optional(), // path under public/, e.g. images/news/launch.jpg
		image_alt: z.string().default(''), // leave empty if purely decorative
	}),
});

const news = defineCollection({
	loader: glob({ pattern: '**/*.md', base: 'src/content/news' }),
	schema: z.object({
		publish: z.boolean().default(true), // false hides the entry from the site
		title: z.string(),
		date: z.coerce.date().optional(),
		summary: z.string(),
		link: z.url().optional(),
		image: z.string().optional(), // path under public/, e.g. images/news/launch.jpg
		image_alt: z.string().default(''), // leave empty if purely decorative
	}),
});

const publications = defineCollection({
	loader: file('src/content/publications.yaml'),
	schema: z.object({
		publish: z.boolean().default(true), // false hides the entry from the site
		title: z.string(),
		authors: z.string(),
		journal: z.string(),
		// Publication date: YYYY-MM-DD, or YYYY-MM / YYYY when PubMed only has part of it.
		date: z
			.string()
			.regex(/^\d{4}(-\d{2}(-\d{2})?)?$/)
			.optional(),
		year: z.number().int().optional(), // legacy: use date
		keywords: z.array(z.string()).default([]), // search keywords this publication matched
		url: z.url().optional(),
		topic: z.enum(['causes', 'detection', 'clinical']).optional(), // not shown for now
		featured: z.boolean().default(false),
		summary: z.string().optional(),
	}),
});

// Methods and datasets, listed as tables on the Resources page. Datasets also get their own page.
const resources = defineCollection({
	loader: file('src/content/resources.yaml'),
	schema: z.object({
		publish: z.boolean().default(true), // false hides the entry from the site
		kind: z.enum(['method', 'data']),
		title: z.string(), // method name, or data project name
		category: z.string(), // shown in the Type column
		description: z.string().optional(), // data project description
		// Methods: link to the code repository and/or the publication.
		repo: z.url().optional(),
		publication: z.url().optional(),
		// Data: accession (optionally linked), who provided it, and links to the individual data objects.
		accession: z.string().optional(),
		accession_url: z.url().optional(),
		submitter: z.string().optional(),
		objects: z
			.array(
				z.object({ name: z.string(), url: z.url().optional(), description: z.string().optional() }),
			)
			.default([]),
	}),
});

// A team collaborating on one problem or challenge. The Markdown body is the description.
const workingGroups = defineCollection({
	loader: glob({ pattern: '**/*.md', base: 'src/content/working-groups' }),
	schema: z.object({
		publish: z.boolean().default(true), // false hides the entry from the site
		title: z.string(),
		order: z.number().default(0),
		members: z.array(z.string()), // ids from people.yaml, in display order
	}),
});

export const collections = {
	workingGroups,
	people,
	events,
	news,
	publications,
	resources,
};
