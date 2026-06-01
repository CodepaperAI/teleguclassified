import { NextResponse } from 'next/server';

export async function GET() {
  const baseUrl = 'https://canadateluguclassifieds.com';
  const lastMod = new Date().toISOString().split('T')[0];

  const sitemaps = [
    'sitemap-pages.xml',
    'sitemap-categories.xml',
    'sitemap-cities.xml',
    'sitemap-category-city.xml',
    'sitemap-listings.xml',
    'sitemap-blog.xml',
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${sitemaps
    .map(
      (sm) => `
  <sitemap>
    <loc>${baseUrl}/${sm}</loc>
    <lastmod>${lastMod}</lastmod>
  </sitemap>`
    )
    .join('')}
</sitemapindex>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate',
    },
  });
}
