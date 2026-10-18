// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// SITE_URL / BASE_PATH let the same code serve a project page
// (https://user.github.io/repo, BASE_PATH=/repo) or a custom domain
// (https://CancerCIN.org, no BASE_PATH).
export default defineConfig({
	site: process.env.SITE_URL || 'https://cancercin.org',
	base: process.env.BASE_PATH || '/',
	integrations: [sitemap()],
	vite: {
		build: {
			// Without this the CSS minifier rewrites `(max-width: 900px)` as `(width <= 900px)`, which
			// older phones (Safari before 16.4, Chrome before 104) ignore, so the narrow layout never applied.
			cssTarget: ['chrome80', 'safari13', 'firefox78'],
		},
		// maplibre-gl resolves its web worker relative to its own files, which breaks
		// when Vite pre-bundles it in dev.
		optimizeDeps: { exclude: ['maplibre-gl'] },
	},
});
