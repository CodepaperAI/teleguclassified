import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  const baseUrl = 'https://canadateluguclassifieds.com';

  // Fetch active listings
  const { data: listings, error } = await supabase
    .from('listings')
    .select('id, title, category_id, sub_category_label, sub_item_label, created_at')
    .eq('status', 'active')
    .limit(1000);

  if (error || !listings) {
    console.error('Error fetching listings for sitemap:', error);
    return new NextResponse(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
</urlset>`, { 
      headers: { 'Content-Type': 'application/xml' } 
    });
  }

  const urls = listings.map(l => {
    // Generate a slug from title
    const slug = l.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    
    // URL structure: /category/subcategory/type/slug/id
    const cat = l.category_id || 'ad';
    const sub = l.sub_category_label ? encodeURIComponent(l.sub_category_label.toLowerCase().replace(/\s+/g, '-')) : 'all';
    const item = l.sub_item_label ? encodeURIComponent(l.sub_item_label.toLowerCase().replace(/\s+/g, '-')) : 'all';
    
    const url = `${baseUrl}/${cat}/${sub}/${item}/${slug}/${l.id}`;
    const lastMod = l.created_at ? new Date(l.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

    return `
  <url>
    <loc>${url}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>weekly</changefreq>
  </url>`;
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${urls.join('')}
</urlset>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate',
    },
  });
}
