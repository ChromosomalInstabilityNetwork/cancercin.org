import { getCollection } from 'astro:content';
import type { APIRoute } from 'astro';
import { url } from '../lib/url';
import { locationText } from '../lib/people';

// Only people with coordinates who have not opted out of the map.
export const GET: APIRoute = async () => {
	const people = await getCollection('people');
	const features = people
		.filter((p) => p.data.show_on_map && p.data.lat !== undefined && p.data.lng !== undefined)
		.map((p) => ({
			type: 'Feature',
			geometry: { type: 'Point', coordinates: [p.data.lng, p.data.lat] },
			properties: {
				id: p.id,
				name: p.data.name,
				institution: p.data.institution ?? '',
				location: locationText(p.data),
				photo: p.data.photo ? url(p.data.photo) : '',
			},
		}));
	return new Response(JSON.stringify({ type: 'FeatureCollection', features }), {
		headers: { 'Content-Type': 'application/geo+json' },
	});
};
