import { createClient } from "@/lib/supabase/client";

// Legacy interface, kept for backwards compatibility with AppContext
export interface Province {
    id: string;
    name: string;
    code: string;
}

// New unified interface for admin & dynamic locations
export interface LocationDto {
    id: string;
    name: string;
    code: string;
    type: 'state' | 'city';
    parent_id: string | null;
    is_active: boolean;
    created_at?: string;
}

// Legacy function, kept for backward compatibility if needed, though we can upgrade to getActiveStates
export async function getLocations(): Promise<Province[]> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('locations')
        .select('*')
        .eq('type', 'state') // assuming getLocations was returning states originally
        .eq('is_active', true)
        .order('name', { ascending: true });

    if (error) {
        console.error('Error fetching locations:', error);
        return [];
    }

    return data || [];
}

export async function getStates(customClient?: any): Promise<LocationDto[]> {
    const supabase = customClient || createClient();
    const { data, error } = await supabase
        .from('locations')
        .select('*')
        .eq('type', 'state')
        .order('name');

    if (error) {
        console.error("Error fetching states:", error);
        return [];
    }
    return data as LocationDto[];
}

export async function getCities(stateId: string, customClient?: any): Promise<LocationDto[]> {
    const supabase = customClient || createClient();
    const { data, error } = await supabase
        .from('locations')
        .select('*')
        .eq('type', 'city')
        .eq('parent_id', stateId)
        .order('name');

    if (error) {
        console.error("Error fetching cities:", error);
        return [];
    }
    return data as LocationDto[];
}

export async function getAllLocations(customClient?: any): Promise<LocationDto[]> {
    const supabase = customClient || createClient();
    const { data, error } = await supabase
        .from('locations')
        .select('*')
        .order('type', { ascending: false }) // states first
        .order('name');

    if (error) {
        console.error("Error fetching all locations:", error);
        return [];
    }
    return data as LocationDto[];
}

export async function getActiveStates(): Promise<LocationDto[]> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('locations')
        .select('*')
        .eq('type', 'state')
        .eq('is_active', true)
        .order('name');

    if (error) {
        console.error("Error fetching active states:", error);
        return [];
    }
    return data as LocationDto[];
}

export async function getActiveCitiesByStateCode(stateCode: string): Promise<LocationDto[]> {
    const supabase = createClient();
    // First get the state
    const { data: stateData, error: stateError } = await supabase
        .from('locations')
        .select('id')
        .eq('type', 'state')
        .eq('code', stateCode)
        .single();

    if (stateError || !stateData) {
        console.error("Error fetching state for cities:", stateError);
        return [];
    }

    // Then get its cities
    const { data, error } = await supabase
        .from('locations')
        .select('*')
        .eq('type', 'city')
        .eq('parent_id', stateData.id)
        .eq('is_active', true)
        .order('name');

    if (error) {
        console.error("Error fetching active cities:", error);
        return [];
    }
    return data as LocationDto[];
}

export async function getActiveCities(stateId: string): Promise<LocationDto[]> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('locations')
        .select('*')
        .eq('type', 'city')
        .eq('parent_id', stateId)
        .eq('is_active', true)
        .order('name');

    if (error) {
        console.error("Error fetching active cities:", error);
        return [];
    }
    return data as LocationDto[];
}
