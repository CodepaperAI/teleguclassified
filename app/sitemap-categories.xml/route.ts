import { NextResponse } from 'next/server';
import { CATEGORIES } from '@/lib/categoriesData';

export async function GET() {
  const baseUrl = 'https://canadateluguclassifieds.com';

  const urls: string[] = [];

  CATEGORIES.forEach(cat => {
    urls.push(`${baseUrl}/listings?category=${cat.id}`);
    
    if (cat.subCategories) {
      cat.subCategories.forEach(sub => {
        urls.push(`${baseUrl}/listings?q=${encodeURIComponent(sub.label)}`);
        
        if (sub.subItems) {
          sub.subItems.forEach(item => {
            urls.push(`${baseUrl}/listings?q=${encodeURIComponent(item)}`);
          });
        }
      });
    }
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
