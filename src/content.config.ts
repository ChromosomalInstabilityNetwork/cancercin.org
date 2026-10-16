import { defineCollection } from 'astro:content';
import { glob, file } from 'astro/loaders';
import { z } from 'astro/zod';

// Placeholder entries leave dates/links unset; real entries should fill them in.
const people = defineCollection({
	loader: file('src/content/people.yaml'),
	schema: z.object({
		name: z.string(),
		institution: z.string().optional(),
		address: z.string().optional(),
		city: z.string().optional(),
		country: z.string().optional(),
		lat: z.number().min(-90).max(90).optional(),
		lng: z.number().min(-180).max(180).optional(),
		photo: z.string().optional(), // path under public/, e.g. people/jane-doe.jpg
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
		title: z.string(),
		authors: z.string(),
		journal: z.string(),
		// Publication date: YYYY-MM-DD, or YYYY-MM / YYYY when PubMed only has part of it.
		date: z
			.string()
			.regex(/^\d{4}(-\d{2}(-\d{2})?)?$/)
			.optional(),
		year: z.number().int().optional(), // legacy: use date
		url: z.url().optional(),
		topic: z.enum(['causes', 'detection', 'clinical']).optional(), // not shown for now
		featured: z.boolean().default(false),
		summary: z.string().optional(),
	}),
});

const resources = defineCollection({
	loader: file('src/content/resources.yaml'),
	schema: z.object({
		kind: z.enum(['method', 'data']),
		title: z.string(),
		category: z.string(),
		description: z.string(),
		url: z.url().optional(),
		host: z.enum(['github', 'website', 'repository']),
		label: z.string().optional(), // text shown on the link button
	}),
});

export const collections = { people, events, news, publications, resources };
