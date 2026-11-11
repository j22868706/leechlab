import { getCollection } from 'astro:content';

// Keep drafts out of every public listing and generated article route.
export async function getPublishedPosts() {
  return getCollection('blog', ({ data }) => !data.draft);
}
