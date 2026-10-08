export interface Challenge {
	id: string;
	title: string;
	text: string;
}
export interface ChallengeGroup {
	number: number;
	title: string;
	columns: 2 | 3;
	items: Challenge[];
}

export const challengeGroups: ChallengeGroup[] = [
	{
		number: 1,
		title: 'Discover the causes and consequences of CIN',
		columns: 2,
		items: [
			{
				id: '1.1',
				title: 'Where does CIN come from?',
				text: 'CIN arises from defects in chromosome structure, sequence, and segregation, and from extracellular stresses such as hypoxia, inflammation, viruses, and therapies. Once triggered, it can self-propagate. Pinpointing the earliest drivers means studying pre-malignant tissue, which is hard to access.',
			},
			{
				id: '1.2',
				title: 'Why does cancer tolerate, and even benefit from, CIN?',
				text: 'CIN is poorly tolerated by normal cells yet advantageous to tumours. Resolving this paradox means untangling the effects of aneuploidy, tumour heterogeneity, and the CIN process itself, and it could expose a critical cancer vulnerability.',
			},
		],
	},
	{
		number: 2,
		title: 'Detect and measure CIN',
		columns: 2,
		items: [
			{
				id: '2.1',
				title: 'Identifying CIN events and their rates',
				text: 'Unlike tumour mutation burden, there is no standard clinical measure of CIN. Imaging, genomic, and transcriptional approaches each capture a different piece of the picture, and reconciling them is a central challenge.',
			},
			{
				id: '2.2',
				title: 'Timing CIN in tumour evolution',
				text: 'Reconstructing when CIN events happened reveals which mechanisms were active and which alterations were selected. Complex rearrangements, limited access to clinical samples, and the pressures of selection make this difficult. Single-cell and long-read technologies are opening new doors.',
			},
		],
	},
	{
		number: 3,
		title: 'Leverage CIN to improve cancer care',
		columns: 3,
		items: [
			{
				id: '3.1',
				title: 'Exploit CIN therapeutically',
				text: 'Approaches include pushing CIN beyond a tolerable threshold, targeting the dependencies cancer cells develop to survive it (such as KIF18A), and exploiting the vulnerabilities of specific aneuploidies.',
			},
			{
				id: '3.2',
				title: 'Build CIN-based diagnostics',
				text: 'CIN signatures already show promise in predicting treatment response. As whole-genome and single-cell sequencing become more routine, CIN biomarkers could be measured alongside other clinically actionable variants.',
			},
			{
				id: '3.3',
				title: 'Detect CIN early',
				text: 'Catching unstable genomes before they reach an advanced state could change outcomes. Doing so requires understanding CIN in normal and pre-malignant tissue, and knowing when and how to intervene.',
			},
		],
	},
];
