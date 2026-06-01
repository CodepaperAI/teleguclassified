import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

/**
 * Converts a string to a URL-friendly slug.
 */
function slugify(text: string | null | undefined): string {
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

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function backfillSlugs() {
    console.log("Starting slug backfill...");

    const { data: listings, error } = await supabase
        .from('listings')
        .select('id, title, slug')
        .is('slug', null);

    if (error) {
        console.error("Error fetching listings:", error);
        return;
    }

    console.log(`Found ${listings.length} listings without slugs.`);

    for (const listing of listings) {
        let baseSlug = slugify(listing.title);
        if (!baseSlug) baseSlug = `listing-${listing.id.substring(0, 8)}`;

        let uniqueSlug = baseSlug;
        let counter = 2;

        // Check for duplicates
        while (true) {
            const { data: existing } = await supabase
                .from('listings')
                .select('id')
                .eq('slug', uniqueSlug)
                .neq('id', listing.id)
                .single();

            if (!existing) break;
            uniqueSlug = `${baseSlug}-${counter}`;
            counter++;
        }

        console.log(`Updating listing ${listing.id}: ${listing.title} -> ${uniqueSlug}`);

        const { error: updateError } = await supabase
            .from('listings')
            .update({ slug: uniqueSlug })
            .eq('id', listing.id);

        if (updateError) {
            console.error(`Error updating listing ${listing.id}:`, updateError);
        }
    }

    console.log("Slug backfill completed.");
}

backfillSlugs();
