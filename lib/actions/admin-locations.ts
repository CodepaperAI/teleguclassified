"use server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const slugify = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

export async function createLocation(data: { name: string; code?: string; type: 'state' | 'city'; parent_id?: string }) {
    try {
        const supabase = await createClient();

        // 1. Check for duplication (Case-insensitive)
        const { data: existing } = await supabase
            .from('locations')
            .select('id')
            .ilike('name', data.name)
            .eq('type', data.type)
            .maybeSingle();

        if (existing) {
            return { success: false, error: `${data.type === 'state' ? 'State' : 'City'} with this name already exists.` };
        }

        // 2. Auto-generate code if not provided
        let locationCode = data.code;
        if (!locationCode) {
            if (data.type === 'city' && data.parent_id) {
                // Fetch parent state code
                const { data: parent } = await supabase
                    .from('locations')
                    .select('code')
                    .eq('id', data.parent_id)
                    .single();

                if (parent) {
                    locationCode = `${parent.code.toLowerCase()}-${slugify(data.name)}`;
                } else {
                    locationCode = slugify(data.name);
                }
            } else {
                locationCode = data.name.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 3);
            }
        }

        const insertData: any = {
            name: data.name,
            code: locationCode,
            type: data.type,
            is_active: true
        };

        if (data.parent_id) {
            insertData.parent_id = data.parent_id;
        }

        const { data: newLocation, error } = await supabase
            .from('locations')
            .insert(insertData)
            .select()
            .single();

        if (error) {
            console.error("Supabase insert error:", error);
            throw error;
        }

        revalidatePath('/admin/locations');
        return { success: true, count: 1 };
    } catch (error: any) {
        console.error("Error creating location (caught):", error);
        return { success: false, error: error.message };
    }
}

export async function updateLocation(id: string, data: { name: string; code?: string; is_active?: boolean }) {
    try {
        const supabase = await createClient();

        // 1. Check for duplication (excluding current ID)
        const { data: existing } = await supabase
            .from('locations')
            .select('id, type')
            .ilike('name', data.name)
            .neq('id', id)
            .maybeSingle();

        if (existing) {
            return { success: false, error: `${existing.type === 'state' ? 'State' : 'City'} with this name already exists.` };
        }

        const updateData: any = {
            name: data.name
        };

        // If code is not provided but name changed, we might want to update the code too
        if (data.code) {
            updateData.code = data.code;
        } else if (!data.code) {
            const { data: current } = await supabase.from('locations').select('name, type, parent_id').eq('id', id).single();
            if (current && current.name !== data.name) {
                if (current.type === 'city' && current.parent_id) {
                    const { data: parent } = await supabase
                        .from('locations')
                        .select('code')
                        .eq('id', current.parent_id)
                        .single();

                    if (parent) {
                        updateData.code = `${parent.code.toLowerCase()}-${slugify(data.name)}`;
                    } else {
                        updateData.code = slugify(data.name);
                    }
                } else {
                    updateData.code = data.name.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 3);
                }
            }
        }

        if (data.is_active !== undefined) {
            updateData.is_active = data.is_active;
        }

        const { error } = await supabase
            .from('locations')
            .update(updateData)
            .eq('id', id);

        if (error) throw error;

        revalidatePath('/admin/locations');
        return { success: true };
    } catch (error: any) {
        console.error("Error updating location:", error);
        return { success: false, error: error.message };
    }
}

export async function deleteLocation(id: string) {
    try {
        const supabase = await createClient();

        // Let cascade handle children (cities) or display an error if constrained
        const { error } = await supabase
            .from('locations')
            .delete()
            .eq('id', id);

        if (error) throw error;

        revalidatePath('/admin/locations');
        return { success: true };
    } catch (error: any) {
        console.error("Error deleting location:", error);
        return { success: false, error: error.message };
    }
}

export async function toggleLocationStatus(id: string, currentStatus: boolean) {
    try {
        const supabase = await createClient();
        const newStatus = !currentStatus;

        // Update the location itself
        const { data: updatedLocation, error } = await supabase
            .from('locations')
            .update({ is_active: newStatus })
            .eq('id', id)
            .select('type')
            .single();

        if (error) throw error;

        // If it's a state and being disabled, also disable all its cities
        // If it's a state and being enabled, we enable all its cities for consistency
        if (updatedLocation.type === 'state') {
            const { error: cascadeError } = await supabase
                .from('locations')
                .update({ is_active: newStatus })
                .eq('parent_id', id)
                .eq('type', 'city');

            if (cascadeError) throw cascadeError;
        }

        revalidatePath('/admin/locations');
        return { success: true };
    } catch (error: any) {
        console.error("Error toggling location status:", error);
        return { success: false, error: error.message };
    }
}
