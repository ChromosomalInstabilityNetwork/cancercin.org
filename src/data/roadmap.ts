export interface RoadmapItem {
	title: string;
	text: string;
	/** Optional call-to-action link shown on the card (href is relative to the site root). */
	action?: { label: string; href: string };
}

export const roadmap: RoadmapItem[] = [
	{
		title: 'Collaborate to catalyze discovery',
		text: 'Team science across basic researchers, clinicians, industry, funders, and patient advocates, backed by open data sharing.',
	},
	{
		title: 'Expand clinical tissue sampling',
		text: 'Systematic sampling of normal, pre-malignant, metastatic, and post-mortem tissue, with genomic sampling built into clinical trials.',
	},
	{
		title: 'Develop new models and technologies',
		text: 'Models that include the tumour microenvironment and immune system, tunable systems with graded CIN, and higher-resolution tools, including spatial multiomics.',
	},
	{
		title: 'Improve and harmonize CIN measurements',
		text: 'Shared standards, methods, and automated quantification that account for fitness effects, so studies can be compared directly.',
		action: {
			label: 'Go to CIN Measurement Working Group',
			href: 'about/working-groups/#cin-measurement',
		},
	},
	{
		title: 'Develop next-generation CIN biomarkers',
		text: 'Genome-wide biomarkers measured on continuous scales, tracked over time and space, and grounded in clear mechanistic understanding.',
	},
];
