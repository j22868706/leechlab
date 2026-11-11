 // @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig, fontProviders } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  // Production custom domain
  site: 'https://leechih.us',

  // Serve the custom domain from its root
  base: '/',

  redirects: {
    '/blog/first-post': '/blog/leetcode_learning_notes_two_sum_contains_duplicate_and_valid_anagram/',
  },

  integrations: [mdx(), sitemap({ filter: (page) => !new URL(page).pathname.replace(/\/$/, '').endsWith('/blog/first-post') })],

  fonts: [
    {
      provider: fontProviders.local(),
      name: 'Atkinson',
      cssVariable: '--font-atkinson',
      fallbacks: ['sans-serif'],
      options: {
        variants: [
          {
            src: ['./src/assets/fonts/atkinson-regular.woff'],
            weight: 400,
            style: 'normal',
            display: 'swap',
          },
          {
            src: ['./src/assets/fonts/atkinson-bold.woff'],
            weight: 700,
            style: 'normal',
            display: 'swap',
          },
        ],
      },
    },
  ],
});

