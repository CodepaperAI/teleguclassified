"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface PlanData {
    label: string;
    price: number;
    duration_days: number;
    description?: string;
    is_active?: boolean;
    is_recommended?: boolean;
}

export type Plan = PlanData & { id: string; created_at: string };

export async function getPlans() {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("premium_plans")
        .select("*")
        .order("price", { ascending: true }); // Order by price for now

    if (error) {
        console.error("Error fetching plans:", error);
        throw new Error("Failed to fetch plans");
    }

    return data as Plan[];
}

export async function createPlan(data: PlanData) {
    const supabase = await createClient();

    const { error } = await supabase
        .from("premium_plans")
        .insert([{
            ...data,
            id: crypto.randomUUID()
        }]);

    if (error) {
        console.error("Error creating plan:", error);
        throw new Error("Failed to create plan");
    }

    revalidatePath("/admin/plans");
}

export async function updatePlan(id: string, data: Partial<PlanData>) {
    const supabase = await createClient();

    const { error } = await supabase
        .from("premium_plans")
        .update(data)
        .eq("id", id);

    if (error) {
        console.error("Error updating plan:", error);
        throw new Error("Failed to update plan");
    }

    revalidatePath("/admin/plans");
}

export async function togglePlanStatus(id: string, currentStatus: boolean) {
    const supabase = await createClient();

    const { error } = await supabase
        .from("premium_plans")
        .update({ is_active: !currentStatus })
        .eq("id", id);

    if (error) {
        console.error("Error toggling plan status:", error);
        throw new Error("Failed to toggle plan status");
    }

    revalidatePath("/admin/plans");
}
