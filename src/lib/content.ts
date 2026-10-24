import { getCollection, type CollectionKey } from 'astro:content';

/** Entries of a collection whose `publish` field is not false. */
export async function getPublished<C extends CollectionKey>(name: C) {
	return getCollection(name, (e) => e.data.publish !== false);
}
