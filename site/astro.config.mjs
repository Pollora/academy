// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightQuiz from 'starlight-quiz';

export default defineConfig({
	site: 'https://academy.pollora.dev',
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
