import { NextResponse } from 'next/server';

export async function GET() {
  const baseUrl = 'https://canadateluguclassifieds.com';

  const cities = [
    'toronto',
    'brampton',
    'mississauga',
    'calgary',
    'vancouver',
    'montreal',
    'ottawa',
    'edmonton',
    'winnipeg',
    'hamilton',
    'kitchener',
    'london',
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${cities
    .map(
      (city) => `
  <url>
    <loc>${baseUrl}/listings?city=${city}</loc>
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
