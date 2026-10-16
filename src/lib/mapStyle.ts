import { MAP_STYLE_URL } from './mapConfig';

/** Fetch the provider's map style (OpenFreeMap "positron" by default), used as published. */
export async function loadMapStyle(): Promise<any> {
	const res = await fetch(MAP_STYLE_URL);
	if (!res.ok) throw new Error(`Map style request failed: ${res.status}`);
	return res.json();
}
