import { KEEP_LAYERS, MAP_COLORS as C, MAP_STYLE_URL } from './mapConfig';

/** Fetch the provider's style and recolour it to the light brand palette. */
export async function loadMapStyle(): Promise<any> {
	const res = await fetch(MAP_STYLE_URL);
	if (!res.ok) throw new Error(`Map style request failed: ${res.status}`);
	const style = await res.json();

	delete style.sprite; // icons are not used
	style.sources = { openmaptiles: style.sources.openmaptiles }; // drop the unused raster layer
	style.layers = style.layers
		.filter((l: any) => KEEP_LAYERS.includes(l.id))
		.map((l: any) => {
			l.paint = { ...(l.paint ?? {}) };
			l.layout = { ...(l.layout ?? {}) };
			if (l.id === 'background') l.paint['background-color'] = C.land;
			else if (l.id === 'water') l.paint['fill-color'] = C.ocean;
			else if (l.id.startsWith('boundary')) {
				l.paint['line-color'] = C.border;
			} else if (l.type === 'symbol') {
				delete l.layout['icon-image'];
				l.paint['text-color'] = C.label;
				l.paint['text-halo-color'] = C.halo;
				l.paint['text-halo-width'] = 1;
			}
			return l;
		});
	return style;
}
