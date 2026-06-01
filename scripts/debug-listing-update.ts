
import dotenv from 'dotenv';
import path from 'path';

// Calculate the path to .env.local relative to where the script is run
// Assuming script is run from project root (where .env.local usually is)
const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/client';

async function testUpdate() {
    const adminClient = createAdminClient();

    // 1. Get a listing
    const { data: listings } = await adminClient.from('listings').select('id, status').limit(1);
    if (!listings || listings.length === 0) {
        console.log('No listings found');
        return;
    }

    const listing = listings[0];
    console.log(`Current status for ${listing.id}: ${listing.status}`);

    // 2. Toggle status
    const newStatus = listing.status === 'blocked' ? 'active' : 'blocked';
    console.log(`Attempting to update to: ${newStatus}`);

    const { error } = await adminClient
        .from('listings')
        .update({ status: newStatus })
        .eq('id', listing.id);

    if (error) {
        console.error('Update failed:', error);
    } else {
        console.log('Update successful (according to client)');
    }

    // 3. Verify persistence immediately
    const { data: verification } = await adminClient.from('listings').select('status').eq('id', listing.id).single();
    console.log(`Immediate verification status: ${verification?.status}`);

    if (verification?.status !== newStatus) {
        console.error('CRITICAL: Update did not persist!');
    } else {
        console.log('Persistence verified.');
    }

    // 4. Revert
    console.log('Reverting...');
    await adminClient.from('listings').update({ status: listing.status }).eq('id', listing.id);
}

testUpdate();
