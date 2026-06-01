import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMissingPayments() {
    console.log("Checking for boosted listings missing payment records...");

    // 1. Get all boosted listings
    const { data: boostedListings, error: listingsError } = await supabase
        .from('listings')
        .select('id, user_id, boost_plan, title, created_at')
        .not('boost_plan', 'is', 'null');

    if (listingsError) {
        console.error("Error fetching listings:", listingsError);
        return;
    }

    console.log(`Found ${boostedListings.length} total boosted listings.`);

    // 2. Get all payments
    const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('listing_id')
        .eq('status', 'completed');

    if (paymentsError) {
        console.error("Error fetching payments:", paymentsError);
        return;
    }

    const paymentListingIds = new Set(payments.map(p => p.listing_id));

    // 3. Find listings without payments
    const missing = boostedListings.filter(l => !paymentListingIds.has(l.id));

    console.log(`Found ${missing.length} boosted listings missing payment records:`);
    missing.forEach(l => {
        console.log(`- [${l.id}] ${l.title} (User: ${l.user_id}, Plan: ${l.boost_plan})`);
    });

    // 4. Get plan prices to see what revenue should be
    const { data: plans } = await supabase.from('premium_plans').select('id, price, label');
    const planMap = Object.fromEntries(plans?.map(p => [p.id, p]) || []);

    let totalEstimatedRevenue = 0;
    missing.forEach(l => {
        const plan = planMap[l.boost_plan];
        if (plan) {
            totalEstimatedRevenue += plan.price;
        }
    });

    console.log(`Total missing revenue: $${totalEstimatedRevenue}`);
}

checkMissingPayments();
