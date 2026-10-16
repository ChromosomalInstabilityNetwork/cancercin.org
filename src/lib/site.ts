export const SITE_NAME = 'International CIN Network';
export const SITE_SHORT = 'iCIN';
export const SITE_DOMAIN = 'CancerCIN.org';
export const CONTACT_EMAIL = 'contact@cancercin.org';
export const SITE_DESCRIPTION =
	'The International CIN Network (iCIN): a community of cancer-research laboratories studying chromosomal instability (CIN).';

export interface NavLink {
	label: string;
	href: string;
}
export interface NavGroup {
	label: string;
	/** Dropdown pages; the first is the group's landing page. */
	children: NavLink[];
}
export type NavItem = NavLink | NavGroup;

export const isGroup = (item: NavItem): item is NavGroup => 'children' in item;

export const NAV: NavItem[] = [
	{
		label: 'About iCIN',
		children: [
			{ label: 'About the Network', href: 'about/' },
			{ label: 'Challenges & Roadmap', href: 'about/challenges-and-roadmap/' },
			{ label: 'Working Groups', href: 'about/working-groups/' },
		],
	},
	{ label: 'People', href: 'people/' },
	{
		label: 'News & Events',
		children: [
			{ label: 'News', href: 'news/' },
			{ label: 'Events Calendar', href: 'events/' },
		],
	},
	{ label: 'Publications', href: 'publications/' },
	{ label: 'Resources', href: 'resources/' },
];

export const mailto = (subject: string, body?: string) =>
	`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}` +
	(body ? `&body=${encodeURIComponent(body)}` : '');
