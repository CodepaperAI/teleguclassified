"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function toggleUserVerification(userId: string, currentStatus: boolean) {
    const supabase = createAdminClient();
    const newStatus = !currentStatus;

    try {
        const { error } = await supabase
            .from("profiles")
            .update({ is_verified: newStatus })
            .eq("id", userId);

        if (error) {
            console.error("Error updating verification status:", error);
            return { success: false, error: error.message };
        }

        revalidatePath(`/admin/users/${userId}`);
        return { success: true, newStatus };
    } catch (err) {
        console.error("Unexpected error:", err);
        return { success: false, error: "An unexpected error occurred." };
    }
}
