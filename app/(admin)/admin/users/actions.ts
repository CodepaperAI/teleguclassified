"use server";

import { createClient } from "@/lib/supabase/server";
import { performUserCleanup } from "@/lib/supabase/user-cleanup";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkHasAdminAccess } from "@/lib/db/profile";

export async function deleteUser(userId: string) {
    return await performUserCleanup(userId);
}

export type UserFilterStatus = 'all' | 'active' | 'blocked';
export type UserFilterType = 'all' | 'paid' | 'free';

export interface GetUsersParams {
    page?: number;
    search?: string;
    filterStatus?: UserFilterStatus;
    filterType?: UserFilterType;
}

export async function getUsers({ page = 1, search = "", filterStatus = 'all', filterType = 'all' }: GetUsersParams) {
    const supabase = await createClient();
    const itemsPerPage = 20;

    const { data, error } = await supabase.rpc("search_users", {
        search_term: search,
        page_number: page,
        items_per_page: itemsPerPage,
        filter_status: filterStatus,
        filter_type: filterType
    });

    if (error) {
        console.error("Error fetching users:", error);
        throw new Error(error.message);
    }

    return {
        users: data || [],
        hasMore: (data || []).length === itemsPerPage
    };
}

export interface TeamMember {
    user_id: string;
    permissions: string[];
    created_at: string;
    full_name?: string;
    email?: string;
}

export async function getTeamMembers() {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('team_members')
        .select(`
            *,
            profile:profiles(full_name)
        `);

    if (error) {
        console.error("Error fetching team members:", error);
        throw new Error(error.message);
    }

    // Map nested profile data to flat structure
    return (data || []).map(member => ({
        ...member,
        full_name: (member as any).profile?.full_name
    })) as TeamMember[];
}

export async function addTeamMember(userId: string, permissions: string[]) {
    const supabase = await createClient();

    const { error } = await supabase
        .from('team_members')
        .upsert({
            user_id: userId,
            permissions
        });

    if (error) {
        console.error("Error adding team member:", error);
        return { success: false, error: error.message };
    }

    return { success: true };
}

export async function removeTeamMember(userId: string) {
    const supabase = await createClient();

    const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('user_id', userId);

    if (error) {
        console.error("Error removing team member:", error);
        return { success: false, error: error.message };
    }

    return { success: true };
}

export async function updateUserRestrictions(userId: string, isBlocked: boolean, features: any) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: "Not authenticated" };
    }

    const hasAccess = await checkHasAdminAccess(user.id, supabase);
    if (!hasAccess) {
        return { success: false, error: "Unauthorized" };
    }

    const adminSupabase = createAdminClient();
    const { error } = await adminSupabase
        .from('profiles')
        .update({
            is_blocked: isBlocked,
            block_features: features
        })
        .eq('id', userId);

    if (error) {
        console.error("Error updating user restrictions:", error);
        return { success: false, error: error.message };
    }

    revalidatePath("/admin/users");
    return { success: true };
}
