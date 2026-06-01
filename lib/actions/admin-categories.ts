"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

// --- Categories ---

function slugify(text: string) {
    return text.toString().toLowerCase()
        .replace(/\s+/g, '-')           // Replace spaces with -
        .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
        .replace(/\-\-+/g, '-')         // Replace multiple - with single -
        .replace(/^-+/, '')             // Trim - from start of text
        .replace(/-+$/, '');            // Trim - from end of text
}

export async function createCategory(data: { label: string; icon?: string }) {
    const supabase = createAdminClient();
    const id = slugify(data.label);

    try {
        const { error } = await supabase
            .from('categories')
            .insert([{ id, label: data.label, icon: data.icon }]);

        if (error) throw error;
        revalidatePath('/admin/categories');
        return { success: true };
    } catch (error: any) {
        console.error("Error creating category:", error);
        return { success: false, error: error.message };
    }
}

export async function updateCategory(id: string, data: { label: string; icon?: string }) {
    const supabase = createAdminClient();
    try {
        const { error } = await supabase
            .from('categories')
            .update({ label: data.label, icon: data.icon })
            .eq('id', id);

        if (error) throw error;
        revalidatePath('/admin/categories');
        return { success: true };
    } catch (error: any) {
        console.error("Error updating category:", error);
        return { success: false, error: error.message };
    }
}

export async function deleteCategory(id: string) {
    const supabase = createAdminClient();
    try {
        // Check for subcategories first? Or rely on cascade?
        // Let's rely on error if foreign key constraint fails, or user should delete subcats first.
        const { error } = await supabase
            .from('categories')
            .delete()
            .eq('id', id);

        if (error) throw error;
        revalidatePath('/admin/categories');
        return { success: true };
    } catch (error: any) {
        console.error("Error deleting category:", error);
        return { success: false, error: error.message };
    }
}

// --- Sub Categories ---

export async function createSubCategory(data: { label: string; category_id: string }) {
    const supabase = createAdminClient();
    try {
        const { error } = await supabase
            .from('sub_categories')
            .insert([{ label: data.label, category_id: data.category_id }]);

        if (error) throw error;
        revalidatePath('/admin/categories');
        return { success: true };
    } catch (error: any) {
        console.error("Error creating sub-category:", error);
        return { success: false, error: error.message };
    }
}


export async function updateSubCategory(id: number, data: { label: string; category_id: string }) {
    const supabase = createAdminClient();
    try {
        // 1. Get the old label first
        const { data: oldData, error: fetchError } = await supabase
            .from('sub_categories')
            .select('label')
            .eq('id', id)
            .single();

        if (fetchError) throw fetchError;
        const oldLabel = oldData.label;

        // 2. Update the sub-category
        const { error } = await supabase
            .from('sub_categories')
            .update({ label: data.label, category_id: data.category_id })
            .eq('id', id);

        if (error) throw error;

        // 3. Propagate change to listings (if label changed)
        if (oldLabel !== data.label) {
            await supabase
                .from('listings')
                .update({ sub_category_label: data.label })
                .eq('sub_category_label', oldLabel);
        }

        revalidatePath('/admin/categories');
        return { success: true };
    } catch (error: any) {
        console.error("Error updating sub-category:", error);
        return { success: false, error: error.message };
    }
}

export async function deleteSubCategory(id: number) {
    const supabase = createAdminClient();
    try {
        const { error } = await supabase
            .from('sub_categories')
            .delete()
            .eq('id', id);

        if (error) throw error;
        revalidatePath('/admin/categories');
        return { success: true };
    } catch (error: any) {
        console.error("Error deleting sub-category:", error);
        return { success: false, error: error.message };
    }
}

// --- Listing Types (Leaf nodes) ---

export async function createListingType(data: { label: string; sub_category_id: number }) {
    const supabase = createAdminClient();
    try {
        const { error } = await supabase
            .from('listing_types')
            .insert([{ label: data.label, sub_category_id: data.sub_category_id }]);

        if (error) throw error;
        revalidatePath('/admin/categories');
        return { success: true };
    } catch (error: any) {
        console.error("Error creating listing type:", error);
        return { success: false, error: error.message };
    }
}


export async function updateListingType(id: number, data: { label: string; sub_category_id: number }) {
    const supabase = createAdminClient();
    try {
        // 1. Get the old label
        const { data: oldData, error: fetchError } = await supabase
            .from('listing_types')
            .select('label')
            .eq('id', id)
            .single();

        if (fetchError) throw fetchError;
        const oldLabel = oldData.label;

        // 2. Update the listing type
        const { error } = await supabase
            .from('listing_types')
            .update({ label: data.label, sub_category_id: data.sub_category_id })
            .eq('id', id);

        if (error) throw error;

        // 3. Propagate change to listings (sub_item_label)
        if (oldLabel !== data.label) {
            await supabase
                .from('listings')
                .update({ sub_item_label: data.label })
                .eq('sub_item_label', oldLabel);
        }

        revalidatePath('/admin/categories');
        return { success: true };
    } catch (error: any) {
        console.error("Error updating listing type:", error);
        return { success: false, error: error.message };
    }
}

export async function deleteListingType(id: number) {
    const supabase = createAdminClient();
    try {
        const { error } = await supabase
            .from('listing_types')
            .delete()
            .eq('id', id);

        if (error) throw error;
        revalidatePath('/admin/categories');
        return { success: true };
    } catch (error: any) {
        console.error("Error deleting listing type:", error);
        return { success: false, error: error.message };
    }
}
