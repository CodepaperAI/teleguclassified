import { createClient } from "@/lib/supabase/client";

/**
 * Gets the number of active, inactive, or closed listings for a user in a specific category or subcategory
 */
export async function getUserListingCount(userId: string, options: { categoryId?: string, subCategoryId?: number }) {
    const supabase = createClient();
    let query = supabase
        .from('listings')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .in('status', ['active', 'inactive', 'closed']);

    if (options.categoryId) {
        query = query.eq('category_id', options.categoryId);
    }
    if (options.subCategoryId) {
        query = query.eq('sub_category_id', options.subCategoryId);
    }

    const { count, error } = await query;
    if (error) {
        console.error("Error getting user listing count:", error);
        return 0;
    }
    return count || 0;
}

/**
 * Gets the total number of listings across all categories/subcategories that share the same plan
 */
export async function getUserPlanListingCount(userId: string, planId: string) {
    const supabase = createClient();

    // 1. Get all category IDs associated with this plan
    const { data: categories } = await supabase
        .from('categories')
        .select('id')
        .eq('monetization_plan_id', planId);

    // 2. Get all subcategory IDs associated with this plan
    const { data: subCategories } = await supabase
        .from('sub_categories')
        .select('id')
        .eq('monetization_plan_id', planId);

    const catIds = categories?.map(c => c.id) || [];
    const subCatIds = subCategories?.map(s => s.id) || [];

    if (catIds.length === 0 && subCatIds.length === 0) return 0;

    let query = supabase
        .from('listings')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .in('status', ['active', 'inactive', 'closed']);

    // Construct OR filter for categories and subcategories
    const filters = [];
    if (catIds.length > 0) {
        filters.push(`category_id.in.(${catIds.map(id => `"${id}"`).join(',')})`);
    }
    if (subCatIds.length > 0) {
        filters.push(`sub_category_id.in.(${subCatIds.join(',')})`);
    }

    if (filters.length > 0) {
        query = query.or(filters.join(','));
    }

    const { count, error } = await query;
    if (error) {
        console.error("Error getting user plan listing count:", error);
        return 0;
    }
    return count || 0;
}

/**
 * Gets the total number of listings across the entire platform for a user
 */
export async function getUserTotalListingCount(userId: string) {
    const supabase = createClient();

    const { count, error } = await supabase
        .from('listings')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .in('status', ['active', 'inactive', 'closed']);

    if (error) {
        console.error("Error getting user total listing count:", error);
        return 0;
    }
    return count || 0;
}

/**
 * Generates a unique slug for a listing based on its title.
 * If the slug already exists, appends -2, -3, etc.
 */
export async function generateUniqueSlug(title: string, currentId?: string) {
    const supabase = createClient();
    const { slugify } = await import("@/lib/utils");
    
    const baseSlug = slugify(title);
    if (!baseSlug) return `listing-${Date.now()}`;

    // Check if base slug is already used
    let { data: existingListings, error } = await supabase
        .from('listings')
        .select('id, slug')
        .ilike('slug', `${baseSlug}%`);

    if (error) {
        console.error("Error checking for existing slugs:", error);
        return baseSlug;
    }

    // If no listings with this slug prefix, or only the current listing has it, use base slug
    if (!existingListings || existingListings.length === 0) {
        return baseSlug;
    }

    // If we're updating a listing and the base slug belongs to it, we can keep it
    const currentListingWithBaseSlug = existingListings.find(l => l.slug === baseSlug);
    if (currentId && currentListingWithBaseSlug && currentListingWithBaseSlug.id === currentId) {
        return baseSlug;
    }

    // Find all slugs that match the pattern baseSlug, baseSlug-2, baseSlug-3...
    const slugPattern = new RegExp(`^${baseSlug}(?:-(\\d+))?$`);
    const usedNumbers = existingListings
        .map(l => {
            const match = l.slug?.match(slugPattern);
            if (!match) return null;
            return match[1] ? parseInt(match[1], 10) : 1;
        })
        .filter((n): n is number => n !== null);

    if (usedNumbers.length === 0 || (!usedNumbers.includes(1) && (!currentId || currentListingWithBaseSlug?.id !== currentId))) {
        // This case shouldn't really happen if existingListings has items, but just in case
        return baseSlug;
    }

    // Find the next available number
    let nextNumber = 2;
    while (usedNumbers.includes(nextNumber)) {
        nextNumber++;
    }

    return `${baseSlug}-${nextNumber}`;
}

/**
 * Fetches a single listing by its unique slug.
 */
export async function getListingBySlug(slug: string) {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

    if (error) {
        console.error(`Error fetching listing by slug "${slug}":`, error);
        return null;
    }
    return data;
}
