/**
 * Map configuration. To switch tile providers, change MAP_STYLE_URL (and set
 * PUBLIC_MAP_KEY if the provider needs a domain-restricted key; "{key}" in the
 * URL is replaced with it). The key is public by design: restrict it by domain.
 */
const key = import.meta.env.PUBLIC_MAP_KEY ?? '';

export const MAP_STYLE_URL = (
	import.meta.env.PUBLIC_MAP_STYLE_URL ?? 'https://tiles.openfreemap.org/styles/positron'
).replace('{key}', key);

/** Layers kept from the provider style (OpenMapTiles schema); everything else is dropped. */
export const KEEP_LAYERS = [
	'background',
	'water',
	'boundary_2',
	'label_city',
	'label_city_capital',
	'label_country_1',
	'label_country_2',
	'label_country_3',
];

export const MAP_COLORS = {
	ocean: '#1B1A2E',
	land: '#34335A',
	border: '#4A4975',
	label: '#B9B5CC',
	pink: '#E9A8D8',
	accent: '#8A2F73',
	light: '#FFFFFF',
};
