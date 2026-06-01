'use server';

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface SiteSettings {
    id: number;
    social_links: {
        facebook?: string;
        twitter?: string;
        instagram?: string;
        youtube?: string;
        linkedin?: string;
    };
    contact_email: string;
    contact_phone: string;
    about_us: string;
    hero_description: string;
    home_banner_url: string;
    website_fee: number;
    is_pricing_enabled: boolean;
    is_hst_enabled?: boolean;
    global_free_limit: number;
    global_free_image_limit: number;
}

export async function getSettings(): Promise<SiteSettings | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .eq('id', 1)
        .single();

    if (error) {
        console.error("Error fetching settings:", error);
        return null;
    }
    return data;
}

export async function updateSettings(data: Partial<SiteSettings>) {
    const supabaseAdmin = createAdminClient();

    // Ensure we are updating ID 1, use upsert in case row doesn't exist yet
    const { error } = await supabaseAdmin
        .from('site_settings')
        .upsert({ id: 1, ...data, updated_at: new Date().toISOString() });

    if (error) {
        console.error("Error updating settings:", error);
        throw new Error("Failed to update settings");
    }

    revalidatePath("/", "layout"); // Revalidate everything as settings are global
}
