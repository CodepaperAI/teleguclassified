import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function backfillManualPayments() {
    console.log("Starting manual payment backfill...");

    // 1. Get plans
    const { data: plans } = await supabase.from('premium_plans').select('id, price, label');
    const planMap = Object.fromEntries(plans?.map(p => [p.id, p]) || []);

    // 2. Get all boosted listings
    const { data: boostedListings, error: listingsError } = await supabase
        .from('listings')
        .select('id, user_id, boost_plan, title, created_at')
        .not('boost_plan', 'is', 'null');

    if (listingsError) {
        console.error("Error fetching listings:", listingsError);
        return;
    }

    // 3. Get all existing payments to avoid duplicates
    const { data: existingPayments } = await supabase
        .from('payments')
        .select('listing_id')
        .eq('status', 'completed');
    
    const paymentListingIds = new Set(existingPayments?.map(p => p.listing_id) || []);

    let count = 0;
    let totalCents = 0;

    for (const listing of boostedListings) {
        if (paymentListingIds.has(listing.id)) continue;

        const plan = planMap[listing.boost_plan];
        if (!plan) {
            console.warn(`Plan ${listing.boost_plan} not found for listing ${listing.id}`);
            continue;
        }

        const amountInCents = Math.round(plan.price * 100);

        const { error: insertError } = await supabase.from('payments').insert({
            user_id: listing.user_id,
            listing_id: listing.id,
            amount: amountInCents,
            status: 'completed',
            payment_method: 'manual',
            plan_type: plan.label,
            currency: 'CAD',
            created_at: listing.created_at, // Match listing creation time
            metadata: {
                notes: "Backfilled manual payment for legacy boosted listing"
            }
        });

        if (insertError) {
            console.error(`Failed to insert payment for listing ${listing.id}:`, insertError);
        } else {
            console.log(`Successfully backfilled payment for: ${listing.title} ($${plan.price})`);
            count++;
            totalCents += amountInCents;
            
            // Also ensure profile is_paid is true
            await supabase.from('profiles').update({ is_paid: true }).eq('id', listing.user_id);
        }
    }

    console.log(`Backfill complete! Created ${count} payment records.`);
    console.log(`Total revenue added: $${(totalCents / 100).toFixed(2)}`);
}

backfillManualPayments();
