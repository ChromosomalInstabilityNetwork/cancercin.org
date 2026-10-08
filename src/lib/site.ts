export const SITE_NAME = 'Cancer CIN Consortium';
export const SITE_DOMAIN = 'CancerCIN.org';
export const CONTACT_EMAIL = 'contact@cancercin.org';
export const SITE_DESCRIPTION =
	'A community of cancer-research labs studying chromosomal instability (CIN).';

export const PAGE_LINKS = [
	{ href: 'people/', label: 'People' },
	{ href: 'events/', label: 'Events' },
	{ href: 'publications/', label: 'Publications' },
	{ href: 'resources/', label: 'Resources' },
] as const;

export const HOME_ANCHORS = [
	{ href: '#definition', label: 'Definition' },
	{ href: '#challenges', label: 'Challenges' },
	{ href: '#roadmap', label: 'Roadmap' },
] as const;

export const mailto = (subject: string, body?: string) =>
	`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}` +
	(body ? `&body=${encodeURIComponent(body)}` : '');
