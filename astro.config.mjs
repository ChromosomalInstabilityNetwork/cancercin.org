// @ts-check
import { defineConfig } from 'astro/config';

// SITE_URL / BASE_PATH let the same code serve a project page
// (https://user.github.io/repo, BASE_PATH=/repo) or a custom domain
// (https://CancerCIN.org, no BASE_PATH).
export default defineConfig({
	site: process.env.SITE_URL || 'https://cancercin.org',
	base: process.env.BASE_PATH || '/',
	vite: {
		// Pre-bundle the lazily imported map library so dev never serves a stale dep.
		optimizeDeps: { include: ['maplibre-gl'] },
	},
});
