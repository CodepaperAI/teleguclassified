import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

/**
 * Performs a comprehensive cleanup of all user-related data across the platform
 * and finally deletes the user from Auth and Profiles.
 * This now delegates the heavy work to a Supabase Edge Function for reliability.
 * This must be called from a Server Context (Server Action or Route Handler).
 */
export async function performUserCleanup(userId: string) {
    const supabase = createAdminClient(); // Use service role for reliable server-to-server call

    console.log(`[Cleanup] Offloading comprehensive cleanup for user ${userId} to Edge Function via Admin Client`);

    try {
        // 1. Invoke the Supabase Edge Function
        // The invoke() method automatically includes the user's JWT from the current session
        const { data, error: invokeError } = await supabase.functions.invoke('delete-user', {
            body: { userId }
        });

        if (invokeError) {
            console.error(`[Cleanup] Edge Function invocation error for ${userId}:`, invokeError);
            return { success: false, error: invokeError.message || "Failed to trigger cleanup process" };
        }

        if (data?.error) {
            console.error(`[Cleanup] Edge Function returned an error:`, data.error);
            return { success: false, error: data.error };
        }

        console.log(`[Cleanup] Edge Function successfully completed for: ${userId}`);

        // 2. Post-cleanup revalidation
        // This keeps the Next.js cache in sync after the background deletion
        revalidatePath("/admin/users");
        revalidatePath("/");

        return { success: true };

    } catch (error: any) {
        console.error(`[Cleanup] Unexpected proxy failure for ${userId}:`, error);
        return { success: false, error: error.message || "An unexpected error occurred during user deletion" };
    }
}

