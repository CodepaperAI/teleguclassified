"use server";

import { createClient } from "@/lib/supabase/server";
import { performUserCleanup } from "@/lib/supabase/user-cleanup";

export async function deleteMyAccount() {
    const supabase = await createClient();

    // 1. Verify Authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return { success: false, error: "You must be logged in to delete your account." };
    }

    // 2. Perform the same comprehensive cleanup as the admin action
    // This uses the Admin Client internally to ensure all data is removed even if RLS is tight
    const result = await performUserCleanup(user.id);

    if (result.success) {
        // Sign out the user locally (optional since account is deleted, but good practice)
        await supabase.auth.signOut();
    }

    return result;
}
