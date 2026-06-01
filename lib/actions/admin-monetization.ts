'use server';

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface CategoryMonetization {
    id: string;
    label: string;
    free_limit: number;
    listing_price: number;
    package_size: number;
    package_price: number;
    type: 'category' | 'subcategory';
    parent_id?: string;
}

export async function getMonetizationSettings() {
    const supabase = await createClient();

    const { data: categories, error: catError } = await supabase
        .from('categories')
        .select('id, label, free_limit, listing_price, package_size, package_price')
        .order('label');

    if (catError) throw catError;

    const { data: subCategories, error: subError } = await supabase
        .from('sub_categories')
        .select('id, label, category_id, free_limit, listing_price, package_size, package_price')
        .order('label');

    if (subError) throw subError;

    const combined: CategoryMonetization[] = [
        ...categories.map(c => ({ ...c, type: 'category' as const })),
        ...subCategories.map(s => ({
            ...s,
            type: 'subcategory' as const,
            parent_id: s.category_id
        }))
    ];

    return combined;
}

export async function updateMonetization(
    id: string | number,
    type: 'category' | 'subcategory',
    data: Partial<CategoryMonetization>
) {
    const supabase = await createClient();
    const table = type === 'category' ? 'categories' : 'sub_categories';

    const { error } = await supabase
        .from(table)
        .update({
            free_limit: data.free_limit,
            listing_price: data.listing_price,
            package_size: data.package_size,
            package_price: data.package_price
        })
        .eq('id', id);

    if (error) {
        console.error(`Error updating ${type} monetization:`, error);
        throw new Error(`Failed to update ${type} monetization`);
    }

    revalidatePath('/admin/monetization');
}
