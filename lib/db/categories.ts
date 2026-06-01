
import { supabase } from '@/lib/supabase';
import { Database } from '@/lib/database.types';

type CategoryRow = Database['public']['Tables']['categories']['Row'];
type SubCategoryRow = Database['public']['Tables']['sub_categories']['Row'];
type ListingTypeRow = Database['public']['Tables']['listing_types']['Row'];

export interface ListingTypeDto {
    id: number;
    label: string;
}

export interface SubCategoryDto {
    id: number;
    label: string;
    subItems?: string[];
    listingTypes?: ListingTypeDto[];
    free_limit?: number;
    listing_price?: number;
    package_size?: number;
    package_price?: number;
    monetization_plan_id?: string | null;
}

export interface CategoryDto {
    id: string;
    label: string;
    icon: string | null;
    subCategories?: SubCategoryDto[];
    free_limit?: number;
    listing_price?: number;
    package_size?: number;
    package_price?: number;
    monetization_plan_id?: string | null;
}

/**
 * Fetches the full category tree.
 * Note: For large datasets, fetch lazily. For this size, fetching all is fine for SSG/ISR.
 */
export async function getCategoriesTree(): Promise<CategoryDto[]> {
    const { data: categories, error: catError } = await supabase
        .from('categories')
        .select('*, free_limit, listing_price, package_size, package_price, monetization_plan_id')
        .order('label');

    if (catError) throw catError;

    // We use listing_types(*) to fetch children in one go
    const { data: subCategories, error: subError } = await supabase
        .from('sub_categories')
        .select('*, listing_types(*), free_limit, listing_price, package_size, package_price, monetization_plan_id')
        .order('label');

    if (subError) throw subError;

    const tree: CategoryDto[] = (categories || []).map((cat: any) => ({
        id: cat.id,
        label: cat.label,
        icon: cat.icon,
        subCategories: (subCategories || [])
            ?.filter((sub: any) => sub.category_id === cat.id)
            .map((sub: any) => ({
                id: sub.id,
                label: sub.label,
                subItems: sub.listing_types
                    ? (sub.listing_types as ListingTypeRow[]).map(t => t.label).sort()
                    : [],
                listingTypes: sub.listing_types
                    ? (sub.listing_types as ListingTypeRow[]).sort((a, b) => {
                        if (a.label === 'Others') return 1;
                        if (b.label === 'Others') return -1;
                        return a.label.localeCompare(b.label);
                    })
                    : [],
                free_limit: sub.free_limit,
                listing_price: sub.listing_price,
                package_size: sub.package_size,
                package_price: sub.package_price,
                monetization_plan_id: sub.monetization_plan_id
            }))
            .sort((a, b) => a.label.localeCompare(b.label)),
        free_limit: cat.free_limit,
        listing_price: cat.listing_price,
        package_size: cat.package_size,
        package_price: cat.package_price,
        monetization_plan_id: cat.monetization_plan_id
    })).sort((a, b) => {
        const order = ['buysell', 'housing', 'services', 'jobs', 'events'];
        const indexA = order.indexOf(a.id);
        const indexB = order.indexOf(b.id);

        if (indexA !== -1 && indexB !== -1) return indexA - indexB;
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;

        return a.label.localeCompare(b.label);
    });

    return tree;
}

export function findCategoryPath(categories: CategoryDto[], query: string) {
    if (!query) return null;
    const q = query.toLowerCase();

    for (const cat of categories) {
        // Match main category
        if (cat.label.toLowerCase() === q || cat.id === q) {
            return { category: cat };
        }

        if (cat.subCategories) {
            for (const sub of cat.subCategories) {
                // Match subcategory
                if (sub.label.toLowerCase() === q) {
                    return { category: cat, subCategory: sub };
                }

                // Match sub-item
                if (sub.subItems?.some(item => item.toLowerCase() === q)) {
                    return { category: cat, subCategory: sub, subItem: q };
                }
            }
        }
    }
    return null;
}

export function findCategoryBySlugs(categories: CategoryDto[], slugs: string[]) {
    if (!slugs || slugs.length === 0) return null;
    
    const catSlug = slugs[0]?.toLowerCase();
    const subCatSlug = slugs[1]?.toLowerCase();
    const itemSlug = slugs[2]?.toLowerCase();

    const category = categories.find(c => {
        const id = c.id.toLowerCase();
        const label = c.label.toLowerCase();
        const labelSlug = slugify(c.label).toLowerCase();
        
        // Normalize everything for comparison (remove dashes, remove 'and', remove spaces)
        const normalize = (s: string) => s.replace(/-/g, '').replace(/and/g, '').replace(/\s/g, '').replace(/&/g, '').toLowerCase();
        
        return id === catSlug || 
               labelSlug === catSlug || 
               normalize(id) === normalize(catSlug) ||
               normalize(label) === normalize(catSlug) ||
               normalize(labelSlug) === normalize(catSlug);
    });
    if (!category) return null;

    if (!subCatSlug) return { category };

    const normalize = (s: string) => s.replace(/-/g, '').replace(/and/g, '').replace(/\s/g, '').replace(/&/g, '').toLowerCase();

    const subCategory = category.subCategories?.find(s => {
        const labelSlug = slugify(s.label).toLowerCase();
        return labelSlug === subCatSlug || 
               normalize(labelSlug) === normalize(subCatSlug) ||
               normalize(s.label) === normalize(subCatSlug);
    });
    if (!subCategory) return { category }; 

    if (!itemSlug) return { category, subCategory };

    const subItem = subCategory.subItems?.find(i => {
        const itemSlugified = slugify(i).toLowerCase();
        return itemSlugified === itemSlug || 
               normalize(itemSlugified) === normalize(itemSlug) ||
               normalize(i) === normalize(itemSlug);
    });
    if (!subItem) return { category, subCategory }; 

    return { category, subCategory, subItem };
}

function slugify(text: string | null | undefined): string {
    if (!text) return "";
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')           
        .replace(/[^\w\-]+/g, '')       
        .replace(/\-\-+/g, '-')         
        .replace(/^-+/, '')             
        .replace(/-+$/, '');            
}

export function generateCategoryUrl(category: string, subCategory?: string, subItem?: string) {
    let url = `/${slugify(category)}`;
    if (subCategory) url += `/${slugify(subCategory)}`;
    if (subItem) url += `/${slugify(subItem)}`;
    return url;
}
