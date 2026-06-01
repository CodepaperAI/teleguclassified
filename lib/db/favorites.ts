import { supabase } from "@/lib/supabase";

export async function getFavorites(userId: string): Promise<string[]> {
    const { data, error } = await supabase
        .from('favorites')
        .select('listing_id')
        .eq('user_id', userId);

    if (error) {
        console.error('Error fetching favorites:', error);
        return [];
    }

    return data.map(item => item.listing_id);
}

export async function addFavorite(userId: string, listing_id: string): Promise<void> {
    const { error } = await supabase
        .from('favorites')
        .insert({ user_id: userId, listing_id });

    if (error) {
        console.error('Error adding favorite:', error);
        throw error;
    }
}

export async function removeFavorite(userId: string, listing_id: string): Promise<void> {
    const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', userId)
        .eq('listing_id', listing_id);

    if (error) {
        console.error('Error removing favorite:', error);
        throw error;
    }
}
