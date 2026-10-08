import { getCollection, type CollectionEntry } from 'astro:content';

type EventEntry = CollectionEntry<'events'>;

/** Split events into upcoming/past at build time. Undated events count as upcoming. */
export async function getEvents(): Promise<{ upcoming: EventEntry[]; past: EventEntry[] }> {
	const all = await getCollection('events');
	const now = new Date();
	const startOfToday = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
	const endOf = (e: EventEntry) => (e.data.end ?? e.data.start)?.getTime();

	const upcoming = all
		.filter((e) => {
			const end = endOf(e);
			return end === undefined || end >= startOfToday;
		})
		.sort((a, b) => (a.data.start?.getTime() ?? Infinity) - (b.data.start?.getTime() ?? Infinity));
	const past = all
		.filter((e) => !upcoming.includes(e))
		.sort((a, b) => b.data.start!.getTime() - a.data.start!.getTime());
	return { upcoming, past };
}

export async function getNews() {
	const all = await getCollection('news');
	return all.sort((a, b) => (b.data.date?.getTime() ?? Infinity) - (a.data.date?.getTime() ?? Infinity));
}
