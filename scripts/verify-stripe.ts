import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('Error: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not found in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function verifyServerSide(listingId: string, planType: string) {
    console.log(`--- Starting Server-Side Verification for Listing: ${listingId} ---`);

    // 1. Simulate Webhook: Update listing boost_plan
    console.log(`Step 1: Simulating boost_plan update for ${planType}...`);
    const { data: updatedListing, error: listingError } = await supabase
        .from('listings')
        .update({ boost_plan: planType })
        .eq('id', listingId)
        .select()
        .single();

    if (listingError) {
        console.error('❌ Failed to update listing:', listingError.message);
    } else {
        console.log('✅ Listing updated successfully. Current boost_plan:', updatedListing.boost_plan);
    }

    // 2. Simulate Webhook: Create completion record in payments
    console.log('Step 2: Creating mock completed payment record...');
    const { data: paymentRecord, error: paymentError } = await supabase
        .from('payments')
        .insert({
            listing_id: listingId,
            user_id: updatedListing?.user_id || null,
            stripe_session_id: `test_session_${Date.now()}`,
            amount: planType === 'featured' ? 10 : 25,
            plan_type: planType,
            status: 'completed'
        })
        .select()
        .single();

    if (paymentError) {
        console.error('❌ Failed to create payment record:', paymentError.message);
    } else {
        console.log('✅ Payment record created successfully. ID:', paymentRecord.id);
    }

    console.log('--- Verification Complete ---');
}

// Get arguments from CLI
const listingId = process.argv[2];
const planType = process.argv[3] || 'featured';

if (!listingId) {
    console.log('Usage: npx ts-node scripts/verify-stripe.ts <listingId> [planType]');
    process.exit(1);
}

verifyServerSide(listingId, planType);
