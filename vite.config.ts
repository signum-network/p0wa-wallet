import { sveltekit } from '@sveltejs/kit/vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';
import type { UserConfig } from 'vite';

const config: UserConfig = {
	plugins: [sveltekit(), SvelteKitPWA()],
	test: {
		globals: true,
		// environment:"jsdom",
		include: ['src/**/*.{test,spec}.{js,ts}']
	}
};

export default config;
