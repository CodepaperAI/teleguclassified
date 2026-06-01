import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { CATEGORIES } from '@/lib/categoriesData';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // 0. Prune ghost categories (those that exist in DB but not in CATEGORIES config)
        const configCategoryIds = CATEGORIES.map(c => c.id);
        const { error: pruneError } = await supabase
            .from('categories')
            .delete()
            .not('id', 'in', `(${configCategoryIds.join(',')})`);

        if (pruneError) {
            console.warn("Ghost category pruning failed (likely due to active listings):", pruneError.message);
            // We don't throw here to allow the rest of the migration to proceed, 
            // but we might want to handle this better in a production environment.
        }

        // 1. Insert Categories
        for (const cat of CATEGORIES) {
            const { error: catError } = await supabase
                .from('categories')
                .upsert({ id: cat.id, label: cat.label, icon: cat.icon }, { onConflict: 'id' });

            if (catError) throw new Error(`Cat Error ${cat.id}: ${catError.message}`);

            if (cat.subCategories) {
                for (const sub of cat.subCategories) {
                    // 2. Insert SubCategories
                    // We assume "label" + "category_id" is unique enough for upsert/lookup, 
                    // or we just insert. Since this is a one-time script, verify first.

                    // For simplicity in this script, we select first to see if exists, else insert.
                    let subId;

                    const { data: existingSub } = await supabase
                        .from('sub_categories')
                        .select('id')
                        .eq('category_id', cat.id)
                        .eq('label', sub.label)
                        .single();

                    if (existingSub) {
                        subId = existingSub.id;
                    } else {
                        const { data: newSub, error: subError } = await supabase
                            .from('sub_categories')
                            .insert({ category_id: cat.id, label: sub.label })
                            .select()
                            .single();

                        if (subError) throw new Error(`Sub Error ${sub.label}: ${subError.message}`);
                        subId = newSub.id;
                    }

                    // 3. Insert Listing Types (subItems)
                    if (sub.subItems && sub.subItems.length > 0) {
                        // Get existing types for this subCategory to avoid duplicates
                        const { data: existingTypes } = await supabase
                            .from('listing_types')
                            .select('label')
                            .eq('sub_category_id', subId);

                        const existingLabels = new Set(existingTypes?.map(t => t.label) || []);
                        const newItems = sub.subItems.filter(item => !existingLabels.has(item));

                        if (newItems.length > 0) {
                            const typesPayload = newItems.map(item => ({
                                sub_category_id: subId,
                                label: item
                            }));

                            const { error: typeError } = await supabase
                                .from('listing_types')
                                .insert(typesPayload);

                            if (typeError) throw new Error(`Type Error for ${sub.label}: ${typeError.message}`);
                        }
                    }
                }
            }
        }

        // 4. Seed DEMO Listings
        const demoListings = [
            {
                title: 'Spacious Downtown Condo',
                description: 'Beautiful 2 bedroom condo with city view.',
                price: 750000,
                category_id: 'housing',
                currency: 'CAD',
                attributes: { bedrooms: 2, bathrooms: 2, sqft: 900 }
            },
            {
                title: 'Software Developer @ TechCorp',
                description: 'React/Next.js developer needed.',
                price: 0,
                category_id: 'jobs',
                attributes: { type: 'Full-time', remote: true }
            }
        ];

        try {
            await supabase.from('listings').insert(demoListings);
        } catch (demoErr) {
            console.warn("Demo listings failed (likely due to FKs), but categories migrated:", demoErr);
        }

        // 5. Attempt to trigger PostgREST reload (may require higher permissions)
        try {
            await (supabase as any).rpc('reload_schema');
        } catch (e) {
            // Silently fail as this is a 'nice to have' and often restricted
            console.log("Remote schema reload RPC not found or restricted. Manual refresh required.");
        }

        return NextResponse.json({
            success: true,
            message: 'Relational migration completed!',
            instructions: 'IMPORTANT: If you still see "column not found" errors, please go to Supabase Settings > API and click "Reload PostgREST" or wait 5 minutes.'
        });
    } catch (err: any) {
        console.error(err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
