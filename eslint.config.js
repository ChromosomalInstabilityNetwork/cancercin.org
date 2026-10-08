import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import astro from 'eslint-plugin-astro';
import globals from 'globals';

export default [
	{ ignores: ['dist/', '.astro/', 'node_modules/', 'public/'] },
	js.configs.recommended,
	...tseslint.configs.recommended,
	...astro.configs.recommended,
	{
		languageOptions: { globals: { ...globals.browser, ...globals.node } },
		rules: {
			// Map/style code deals with untyped third-party JSON.
			'@typescript-eslint/no-explicit-any': 'off',
		},
	},
];
