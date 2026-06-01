
/**
 * Converts a string to a URL-friendly slug.
 */
export function slugify(text: string | null | undefined): string {
    if (!text) return "";
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')           // Replace spaces with -
        .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
        .replace(/\-\-+/g, '-')         // Replace multiple - with single -
        .replace(/^-+/, '')             // Trim - from start of text
        .replace(/-+$/, '');            // Trim - from end of text
}

/**
 * Maps database category IDs to URL-friendly slugs.
 */
const CATEGORY_MAP: Record<string, string> = {
    'buysell': 'buy-sell',
    'housing': 'real-estate',
    'services': 'services',
    'jobs': 'jobs',
    'events': 'events'
};

/**
 * Generates a descriptive, SEO-friendly product URL.
 * Structure: /[category]/[subcategory]/[listingtype]/[product-name]/[id]
 */
export function generateProductUrl(listing: {
    id: string;
    title: string;
    category_id?: string;
    sub_category_label?: string;
    sub_item_label?: string;
    city?: string;
    slug?: string;
}) {
    const category = (CATEGORY_MAP[listing.category_id || ''] || listing.category_id || 'other').toLowerCase();
    const subCategory = slugify(listing.sub_category_label);
    const subItem = slugify(listing.sub_item_label);
    const location = slugify(listing.city || 'canada');
    const slug = (listing.slug || slugify(listing.title)).toLowerCase();
    
    let parts = [category];
    if (subCategory) parts.push(subCategory);
    if (subItem) parts.push(subItem);
    parts.push(location);
    parts.push(slug);
    
    return '/' + parts.join('/');
}

/**
 * Formats a number with comma separators.
 */
export function formatNumber(amount: number | string | null | undefined): string {
    if (amount === null || amount === undefined) return "0";
    const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(numericAmount)) return "0";
    return numericAmount.toLocaleString('en-CA');
}

/**
 * Formats a number as currency ($) with comma separators.
 */
export function formatCurrency(amount: number | string | null | undefined, includeDecimals = true): string {
    if (amount === null || amount === undefined) return "$0.00";
    const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(numericAmount)) return "$0.00";
    
    return numericAmount.toLocaleString('en-CA', {
        style: 'currency',
        currency: 'CAD',
        minimumFractionDigits: includeDecimals ? 2 : 0,
        maximumFractionDigits: includeDecimals ? 2 : 0,
    });
}
