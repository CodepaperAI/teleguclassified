"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export interface CMSPage {
    id: string;
    slug: string;
    title: string;
    content: string;
    updated_at: string;
}

export async function getCMSPages() {
    const supabase = createAdminClient();
    const { data, error } = await supabase
        .from("cms_pages")
        .select("*")
        .order("title", { ascending: true });

    if (error) {
        console.error("Error fetching CMS pages:", error);
        throw new Error(error.message);
    }

    return data as CMSPage[];
}

export async function getCMSPageBySlug(slug: string) {
    const supabase = createAdminClient();
    const { data, error } = await supabase
        .from("cms_pages")
        .select("*")
        .eq("slug", slug)
        .single();

    if (error) {
        console.error(`Error fetching CMS page ${slug}:`, error);
        return null;
    }

    return data as CMSPage;
}

export async function updateCMSPage(slug: string, title: string, content: string) {
    const supabase = createAdminClient();
    const { error } = await supabase
        .from("cms_pages")
        .update({ title, content, updated_at: new Date().toISOString() })
        .eq("slug", slug);

    if (error) {
        console.error(`Error updating CMS page ${slug}:`, error);
        return { success: false, error: error.message };
    }

    revalidatePath(`/${slug}`);
    revalidatePath("/admin/pages");
    revalidatePath(`/admin/pages/${slug}`);

    return { success: true };
}
