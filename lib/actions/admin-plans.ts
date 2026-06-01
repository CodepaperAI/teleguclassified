'use server';

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface MonetizationPlan {
    id: string;
    name: string;
    free_limit: number;
    listing_price: number;
    free_image_limit: number;
    paid_image_limit: number;
    created_at?: string;
    category_ids?: string[];
    sub_category_ids?: number[];
}

export async function getMonetizationPlans() {
    const supabase = await createClient();

    const { data: plans, error: plansError } = await supabase
        .from('monetization_plans')
        .select('*')
        .order('created_at', { ascending: false });

    if (plansError) throw plansError;

    // Fetch mappings
    const { data: categories } = await supabase
        .from('categories')
        .select('id, realization_plan_id:monetization_plan_id');

    const { data: subCategories } = await supabase
        .from('sub_categories')
        .select('id, realization_plan_id:monetization_plan_id');

    return plans.map(plan => ({
        ...plan,
        category_ids: categories?.filter(c => (c as any).realization_plan_id === plan.id).map(c => c.id) || [],
        sub_category_ids: subCategories?.filter(s => (s as any).realization_plan_id === plan.id).map(s => s.id) || []
    }));
}

export async function createOrUpdatePlan(plan: Partial<MonetizationPlan>, categoryIds: string[], subCategoryIds: number[]) {
    const supabase = await createClient();

    let planId = plan.id;

    if (planId) {
        const { error } = await supabase
            .from('monetization_plans')
            .update({
                name: plan.name,
                free_limit: plan.free_limit,
                listing_price: plan.listing_price,
                free_image_limit: plan.free_image_limit,
                paid_image_limit: plan.paid_image_limit
            })
            .eq('id', planId);
        if (error) throw error;
    } else {
        const { data, error } = await supabase
            .from('monetization_plans')
            .insert({
                name: plan.name,
                free_limit: plan.free_limit,
                listing_price: plan.listing_price,
                free_image_limit: plan.free_image_limit,
                paid_image_limit: plan.paid_image_limit
            })
            .select()
            .single();
        if (error) throw error;
        planId = data.id;
    }

    // Update category mappings
    // 1. Clear old mappings for this plan
    await supabase.from('categories').update({ monetization_plan_id: null }).eq('monetization_plan_id', planId);
    await supabase.from('sub_categories').update({ monetization_plan_id: null }).eq('monetization_plan_id', planId);

    // 2. Set new mappings
    if (categoryIds.length > 0) {
        await supabase.from('categories').update({ monetization_plan_id: planId }).in('id', categoryIds);
    }
    if (subCategoryIds.length > 0) {
        await supabase.from('sub_categories').update({ monetization_plan_id: planId }).in('id', subCategoryIds);
    }

    revalidatePath('/admin/monetization');
    return planId;
}

export async function deletePlan(planId: string) {
    const supabase = await createClient();

    // Mapping handles ON DELETE SET NULL
    const { error } = await supabase.from('monetization_plans').delete().eq('id', planId);
    if (error) throw error;

    revalidatePath('/admin/monetization');
}
