import { NextResponse } from 'next/server';

export async function GET() {
  const baseUrl = 'https://canadateluguclassifieds.com';

  const pages = [
    { url: '/', priority: '1.0' },
    { url: '/about-us', priority: '0.7' },
    { url: '/contact-us', priority: '0.7' },
    { url: '/blog', priority: '0.8' },
    { url: '/post-ad', priority: '0.8' },
    { url: '/privacy-policy', priority: '0.6' },
    { url: '/terms', priority: '0.6' },
    { url: '/listings', priority: '0.9' },
    { url: '/jobs', priority: '0.8' },
    { url: '/services', priority: '0.8' },
    { url: '/real-estate', priority: '0.8' },
    { url: '/buy-sell', priority: '0.8' },
    { url: '/events', priority: '0.8' },
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${pages
    .map(
      (page) => `
  <url>
    <loc>${baseUrl}${page.url}</loc>
    <priority>${page.priority}</priority>
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
