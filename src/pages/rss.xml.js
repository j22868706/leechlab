import { getCollection } from 'astro:content';
import rss from '@astrojs/rss';
import { SITE_DESCRIPTION, SITE_TITLE } from '../consts';

const base = `${import.meta.env.BASE_URL.replace(/\/+$/, '')}/`;

export async function GET(context) {
	const posts = await getCollection('blog');
	return rss({
		title: SITE_TITLE,
		description: SITE_DESCRIPTION,
		site: new URL(base, context.site),
		items: posts.map((post) => ({
			...post.data,
			link: `${base}blog/${post.id}/`,
		})),
	});
}
