# LeechLab

Personal site and learning notes, built with Astro and deployed to GitHub Pages at https://leechih.us.

## Development

Use Node.js 24 (see `.nvmrc`), then install dependencies with `npm ci`.

- `npm run dev -- --background`: start the development server in the background.
- `npm run astro -- dev status`: check server status.
- `npm run astro -- dev logs`: view server logs.
- `npm run astro -- dev stop`: stop the server.
- `npm run check`: run Astro and TypeScript diagnostics.
- `npm run build`: run diagnostics and build the site into `dist/`.
- `npm run preview`: preview the production build locally.

## Writing articles

Add Markdown or MDX files under `src/content/blog/`. For example:

```yaml
---
title: 'My learning notes'
description: 'What I learned today.'
pubDate: '2026-11-11'
heroImage: '../../assets/blog-LeetCode.png'
tags: ['leetcode', 'python']
draft: false
---
```

`heroImage`, `tags`, `draft`, and `updatedDate` are optional. Tags use letters a–z, numbers, and hyphens; they are trimmed, lowercased, and deduplicated automatically. Browse tags at `/blog/tags/`.

Set `draft: true` to exclude an article from the homepage, Blog, tags, RSS, sitemap, and generated article routes. Omit the flag or set it to `false` to publish.

The filename determines the article URL. When renaming a published article, add a redirect in `astro.config.mjs` to preserve shared links. On GitHub Pages, redirects are generated as HTML pages using meta refresh.

## Deployment

Pushes to `main` trigger `.github/workflows/deploy.yml`. The production build includes type checks before GitHub Pages deployment.
