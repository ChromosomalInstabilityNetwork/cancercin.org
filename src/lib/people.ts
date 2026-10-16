/** "City, State, Country" from whichever parts a person has (no street addresses are stored). */
export function locationText(p: { city?: string; state?: string; country?: string }): string {
	return [p.city, p.state, p.country].filter(Boolean).join(', ');
}
