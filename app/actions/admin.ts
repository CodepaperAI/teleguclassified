"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function toggleListingBlockStatus(listingId: string, currentStatus: string) {
    const supabase = await createClient();

    // 1. Verify Authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        return { error: "Unauthorized" };
    }

    // 2. Verify Admin Status
    const { data: adminUser, error: adminError } = await supabase
        .from('admin_users')
        .select('id')
        .eq('id', user.id)
        .single();

    if (adminError || !adminUser) {
        return { error: "Forbidden: Admin access required" };
    }

    // 3. Perform Update using Service Role (Admin Client)
    // Calculate new status based on current status
    // If currently 'blocked', revert to 'active'. Otherwise, make it 'blocked'.
    // Note: If original status was 'expired' or 'sold', unblocking might need to be smart, 
    // but for now the requirement implies a simple toggle. 
    // Let's assume 'blocked' -> 'active' and anything else -> 'blocked'.

    // However, to be safe and respect the logic in the button, we can accept the *new* status or derive it here.
    // The previous client-side logic was: `const newStatus = status === 'blocked' ? 'active' : 'blocked';`

    const newStatus = currentStatus === 'blocked' ? 'active' : 'blocked';

    const adminClient = createAdminClient();

    const { error: updateError } = await adminClient
        .from('listings')
        .update({ status: newStatus })
        .eq('id', listingId);

    if (updateError) {
        console.error("Error updating listing status:", updateError);
        return { error: "Failed to update listing status" };
    }


    // 4. Revalidate with Delay
    // Add a small delay to ensure DB propagation (eventual consistency) before re-fetching
    await new Promise(resolve => setTimeout(resolve, 1000));

    revalidatePath("/admin/listings");
    return { success: true, newStatus };
}
