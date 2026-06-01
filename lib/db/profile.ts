import { supabase } from "@/lib/supabase";

export async function uploadAvatar(file: File, userId: string): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

    if (uploadError) {
        throw uploadError;
    }

    const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
    return data.publicUrl;
}

export async function updateProfile(userId: string, updates: { avatar_url?: string; full_name?: string }) {
    const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId);

    if (error) {
        throw error;
    }


    // specific to avatar, we also want to update the user metadata so it persists in the session
    if (updates.avatar_url || updates.full_name) {
        const { error: authError } = await supabase.auth.updateUser({
            data: {
                ...(updates.avatar_url && { avatar_url: updates.avatar_url }),
                ...(updates.full_name && { full_name: updates.full_name }),
            }
        });

        if (authError) {
            // Non-blocking error, but good to know
            console.error("Error updating user metadata:", authError);
        }
    }
}

export async function getProfile(userId: string, supabaseClient?: any) {
    const supabaseToUse = supabaseClient || supabase;

    const { data, error } = await supabaseToUse
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (error) {
        console.error('Error fetching profile:', error);
        return null;
    }

    return data;
}

export async function checkIsAdmin(userId: string, supabaseClient?: any): Promise<boolean> {
    const supabaseToUse = supabaseClient || supabase;

    const { data, error } = await supabaseToUse
        .from('admin_users')
        .select('id')
        .eq('id', userId)
        .single();

    if (!error && data) return true;

    // Also check profiles for is_admin flag
    const { data: profile } = await supabaseToUse
        .from('profiles')
        .select('is_admin')
        .eq('id', userId)
        .single();

    return !!profile?.is_admin;
}

export async function getTeamPermissions(userId: string, supabaseClient?: any): Promise<string[] | null> {
    const supabaseToUse = supabaseClient || supabase;

    const { data, error } = await supabaseToUse
        .from('team_members')
        .select('permissions')
        .eq('user_id', userId)
        .single();

    if (error || !data) {
        return null;
    }

    return data.permissions || [];
}

export async function checkHasAdminAccess(userId: string, supabaseClient?: any): Promise<boolean> {
    const isAdmin = await checkIsAdmin(userId, supabaseClient);
    if (isAdmin) return true;

    const permissions = await getTeamPermissions(userId, supabaseClient);
    return permissions !== null;
}
