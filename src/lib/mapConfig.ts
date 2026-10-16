/**
 * Map configuration. To switch tile providers, change MAP_STYLE_URL (and set
 * PUBLIC_MAP_KEY if the provider needs a domain-restricted key; "{key}" in the
 * URL is replaced with it). The key is public by design: restrict it by domain.
 */
const key = import.meta.env.PUBLIC_MAP_KEY ?? '';

export const MAP_STYLE_URL = (
	import.meta.env.PUBLIC_MAP_STYLE_URL ?? 'https://tiles.openfreemap.org/styles/positron'
).replace('{key}', key);
