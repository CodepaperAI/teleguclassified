import { NextResponse } from 'next/server';
import { getBlogLastModified, getUpliftBlogs } from '@/lib/upliftai';

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET() {
  const baseUrl = 'https://canadateluguclassifieds.com';
  const result = await getUpliftBlogs({ page: 1, limit: 100, status: 'PUBLISH' });
  const blogPosts = result.data?.blogs || [];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${blogPosts
    .map(
      (post) => `
  <url>
    <loc>${escapeXml(`${baseUrl}/blog/${encodeURIComponent(post.slug)}`)}</loc>
    <lastmod>${getBlogLastModified(post)}</lastmod>
  </url>`
    )
    .join('')}
</urlset>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate',
    },
  });
}
