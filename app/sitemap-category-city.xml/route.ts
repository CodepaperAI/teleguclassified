import { NextResponse } from 'next/server';

export async function GET() {
  const baseUrl = 'https://canadateluguclassifieds.com';

  const categories = ['jobs', 'housing', 'services', 'buysell'];
  const cities = ['toronto', 'brampton', 'calgary', 'vancouver'];

  const urls: string[] = [];

  categories.forEach(cat => {
    cities.forEach(city => {
      // Friendly URL pattern if supported, or query params
      urls.push(`${baseUrl}/listings?category=${cat}&city=${city}`);
    });
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${urls
    .map(
      (url) => `
  <url>
    <loc>${url}</loc>
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
