import { getPublished } from '../lib/content';
import type { APIRoute } from 'astro';
import { getImage } from 'astro:assets';
import { locationText } from '../lib/people';

// Only people with coordinates who have not opted out of the map.
const photos = import.meta.glob<{ default: ImageMetadata }>('../img/people/*.{png,jpg,jpeg,webp}', {
	eager: true,
});

async function photoUrl(photo?: string): Promise<string> {
	const src = photo ? photos[`../img/people/${photo}`]?.default : undefined;
	return src ? (await getImage({ src, width: 192, height: 192 })).src : '';
}

export const GET: APIRoute = async () => {
	const people = await getPublished('people');
	const mapped = people.filter(
		(p) => p.data.show_on_map && p.data.lat !== undefined && p.data.lng !== undefined,
	);
	const features = await Promise.all(
		mapped.map(async (p) => ({
			type: 'Feature',
			geometry: { type: 'Point', coordinates: [p.data.lng, p.data.lat] },
			properties: {
				id: p.id,
				name: p.data.name,
				institution: p.data.institution ?? '',
				location: locationText(p.data),
				photo: await photoUrl(p.data.photo),
			},
		})),
	);
	return new Response(JSON.stringify({ type: 'FeatureCollection', features }), {
		headers: { 'Content-Type': 'application/geo+json' },
	});
};
