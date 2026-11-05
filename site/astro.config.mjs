// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightQuiz from 'starlight-quiz';

export default defineConfig({
	site: 'https://academy.pollora.dev',
	// Module numbers changed when the course was put in teaching order: keep the first published URLs working
	redirects: {
		'/fr/modules/03-blocks': '/fr/modules/04-blocks/',
		'/fr/modules/04-themes': '/fr/modules/05-themes/',
		'/fr/modules/05-async-schedule-modules': '/fr/modules/07-async-schedule-modules/',
		'/fr/modules/06-media-woocommerce-performance': '/fr/modules/08-media-woocommerce-performance/',
		'/fr/modules/07-nectar': '/fr/modules/09-nectar/',
		'/fr/modules/08-ai-upgrade': '/fr/modules/11-ai-upgrade/',
		'/fr/modules/09-hooks-events': '/fr/modules/03-hooks-events/',
		'/fr/modules/10-rest-ajax-auth': '/fr/modules/06-rest-ajax-auth/',
		'/fr/modules/11-abilities': '/fr/modules/10-abilities/',
		'/en/modules/03-blocks': '/en/modules/04-blocks/',
		'/en/modules/04-themes': '/en/modules/05-themes/',
		'/en/modules/05-async-schedule-modules': '/en/modules/07-async-schedule-modules/',
		'/en/modules/06-media-woocommerce-performance': '/en/modules/08-media-woocommerce-performance/',
		'/en/modules/07-nectar': '/en/modules/09-nectar/',
		'/en/modules/08-ai-upgrade': '/en/modules/11-ai-upgrade/',
		'/en/modules/09-hooks-events': '/en/modules/03-hooks-events/',
		'/en/modules/10-rest-ajax-auth': '/en/modules/06-rest-ajax-auth/',
		'/en/modules/11-abilities': '/en/modules/10-abilities/',
	},
	integrations: [
		starlight({
			title: 'Pollora Academy',
			description: 'Learn Pollora 13 and AI-assisted development with Nectar: theory, quizzes and graded exercises.',
			plugins: [starlightQuiz()],
			defaultLocale: 'fr',
			locales: {
				fr: { label: 'Français', lang: 'fr' },
				en: { label: 'English', lang: 'en' },
			},
			favicon: '/favicon.svg',
			head: [{ tag: 'link', attrs: { rel: 'icon', href: '/favicon.ico', sizes: '32x32' } }],
			social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/Pollora/academy' }],
			logo: { src: './src/pollora-logo.svg', replacesTitle: true },
			editLink: { baseUrl: 'https://github.com/Pollora/academy/edit/main/site/' },
			customCss: [
				'@fontsource-variable/geist',
				'@fontsource-variable/space-grotesk',
				'@fontsource-variable/jetbrains-mono',
				'./src/styles/pollora.css',
			],
			sidebar: [
				{
					label: 'Parcours',
					translations: { en: 'Path' },
					items: [{ autogenerate: { directory: 'modules' } }],
				},
			],
		}),
	],
});
