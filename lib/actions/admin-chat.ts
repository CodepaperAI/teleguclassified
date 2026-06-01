"use server";

import { createAdminClient } from "@/lib/supabase/admin";

export async function getAdminChatMessages(roomId: string) {
    const supabase = createAdminClient();

    try {
        const { data, error } = await supabase
            .from("chat_messages")
            .select(`
                *,
                sender:sender_id (
                    full_name
                )
            `)
            .eq("room_id", roomId)
            .order("created_at", { ascending: true });

        if (error) {
            console.error("Error fetching messages:", error);
            return { success: false, error: error.message };
        }

        return { success: true, data };
    } catch (err) {
        console.error("Unexpected error:", err);
        return { success: false, error: "An unexpected error occurred." };
    }
}
