'use server';

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export interface Location {
    id: string;
    name: string;
    code: string;
    type: 'state' | 'city';
    parent_id: string | null;
    is_active: boolean;
    created_at: string;
}

export type LocationInput = Omit<Location, 'id' | 'created_at'>;

export async function getLocations(type: 'state' | 'city', parentId?: string) {
    const supabase = createAdminClient();

    let query = supabase
        .from('locations')
        .select('*')
        .eq('type', type)
        .order('name');

    if (parentId) {
        query = query.eq('parent_id', parentId);
    }

    const { data, error } = await query;

    if (error) {
        console.error("Error fetching locations:", error);
        throw new Error("Failed to fetch locations");
    }

    return data as Location[];
}

export async function createLocation(data: LocationInput) {
    const supabase = createAdminClient();

    const { error } = await supabase
        .from('locations')
        .insert([data]);

    if (error) {
        console.error("Error creating location:", error);
        throw new Error("Failed to create location");
    }

    revalidatePath('/admin/locations');
    return { success: true };
}

export async function updateLocation(id: string, data: Partial<LocationInput>) {
    const supabase = createAdminClient();

    const { error } = await supabase
        .from('locations')
        .update(data)
        .eq('id', id);

    if (error) {
        console.error("Error updating location:", error);
        throw new Error("Failed to update location");
    }

    revalidatePath('/admin/locations');
    return { success: true };
}

export async function deleteLocation(id: string) {
    const supabase = createAdminClient();

    const { error } = await supabase
        .from('locations')
        .delete()
        .eq('id', id);

    if (error) {
        console.error("Error deleting location:", error);
        throw new Error("Failed to delete location");
    }

    revalidatePath('/admin/locations');
    return { success: true };
}
