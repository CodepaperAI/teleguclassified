import { createClient } from "@/lib/supabase/client";
import { Database } from "@/lib/database.types";

export type ChatRoom = Database['public']['Tables']['chat_rooms']['Row'] & {
    listing?: {
        id: string;
        title: string;
        images: string[] | null;
        price: number | null;
        price_type: string | null;
        category_id: string | null;
        sub_category_label: string | null;
        sub_item_label: string | null;
    } | null;
    other_party?: {
        full_name: string | null;
        avatar_url: string | null;
    } | null;
    has_unread?: boolean;
};

export type ChatMessage = Database['public']['Tables']['chat_messages']['Row'] & {
    message_type: 'text' | 'image' | 'file';
    file_url?: string | null;
    file_name?: string | null;
    file_size?: number | null;
};

export async function getOrCreateChatRoom(listingId: string, buyerId: string, sellerId: string) {
    if (buyerId === sellerId) {
        throw new Error("You cannot chat with yourself");
    }
    const supabase = createClient();
    console.log("getOrCreateChatRoom", { listingId, buyerId, sellerId });

    // Try to find existing room
    const { data: existing, error: findError } = await supabase
        .from('chat_rooms')
        .select(`
            *,
            listing:listings (id, title, images, price, price_type, category_id, sub_category_label, sub_item_label),
            buyer:profiles!chat_rooms_buyer_id_fkey (full_name, avatar_url, is_verified),
            seller:profiles!chat_rooms_seller_id_fkey (full_name, avatar_url, is_verified)
        `)
        .eq('listing_id', listingId)
        .eq('buyer_id', buyerId)
        .eq('seller_id', sellerId)
        .maybeSingle();

    if (existing) return existing;

    // Create new room
    const { data: created, error: createError } = await supabase
        .from('chat_rooms')
        .insert({
            listing_id: listingId,
            buyer_id: buyerId,
            seller_id: sellerId
        })
        .select(`
            *,
            listing:listings (title, images, price, price_type),
            buyer:profiles!chat_rooms_buyer_id_fkey (full_name, avatar_url, is_verified),
            seller:profiles!chat_rooms_seller_id_fkey (full_name, avatar_url, is_verified)
        `)
        .single();

    if (createError) {
        console.error("Error creating chat room:", createError);
        throw createError;
    }
    return created;
}

export async function getChatRooms(userId: string): Promise<ChatRoom[]> {
    const supabase = createClient();
    // Fetch rooms first
    const { data: rooms, error: roomsError } = await supabase
        .from('chat_rooms')
        .select('*')
        .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
        .order('last_message_at', { ascending: false });

    if (roomsError) throw roomsError;
    if (!rooms || rooms.length === 0) return [];

    // Get unique listing IDs and profile IDs
    const listingIds = Array.from(new Set(rooms.map(r => r.listing_id).filter(id => !!id))) as string[];
    const profileIds = Array.from(new Set([
        ...rooms.map(r => r.buyer_id),
        ...rooms.map(r => r.seller_id)
    ]));

    // Fetch listings
    const { data: listings } = await supabase
        .from('listings')
        .select('id, title, images, price, price_type, category_id, sub_category_label, sub_item_label')
        .in('id', listingIds);

    // Fetch profiles
    const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', profileIds);

    // Fetch unread status for these rooms
    const { data: unreadMessages } = await supabase
        .from('chat_messages')
        .select('room_id')
        .in('room_id', rooms.map(r => r.id))
        .neq('sender_id', userId)
        .or('is_read.is.null,is_read.eq.false');
    
    const unreadRoomIds = new Set(unreadMessages?.map(m => m.room_id) || []);

    // Merge data
    return rooms.map(room => {
        const listing = listings?.find(l => l.id === room.listing_id);
        const buyer = profiles?.find(p => p.id === room.buyer_id);
        const seller = profiles?.find(p => p.id === room.seller_id);

        const isBuyer = room.buyer_id === userId;

        return {
            ...room,
            has_unread: unreadRoomIds.has(room.id),
            listing: listing ? {
                id: listing.id,
                title: listing.title,
                images: listing.images,
                price: listing.price,
                price_type: listing.price_type,
                category_id: listing.category_id,
                sub_category_label: listing.sub_category_label,
                sub_item_label: listing.sub_item_label
            } : null,
            buyer: buyer ? {
                full_name: buyer.full_name,
                avatar_url: buyer.avatar_url
            } : null,
            seller: seller ? {
                full_name: seller.full_name,
                avatar_url: seller.avatar_url
            } : null,
            other_party: isBuyer ? (seller ? {
                full_name: seller.full_name,
                avatar_url: seller.avatar_url
            } : null) : (buyer ? {
                full_name: buyer.full_name,
                avatar_url: buyer.avatar_url
            } : null)
        };
    });
}

export async function getChatMessages(roomId: string, limit = 50, before?: string): Promise<ChatMessage[]> {
    const supabase = createClient();
    let query = supabase
        .from('chat_messages')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (before) {
        query = query.lt('created_at', before);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Reverse to return in chronological order (oldest to newest)
    return data ? data.reverse() as ChatMessage[] : [];
}

export async function sendChatMessage(
    roomId: string,
    senderId: string,
    content: string,
    attachment?: {
        type: 'image' | 'file',
        url: string,
        name: string,
        size: number
    }
) {
    const supabase = createClient();
    // Insert message
    const { data: message, error: messageError } = await supabase
        .from('chat_messages')
        .insert({
            room_id: roomId,
            sender_id: senderId,
            content: content,
            message_type: attachment?.type || 'text',
            file_url: attachment?.url,
            file_name: attachment?.name,
            file_size: attachment?.size
        })
        .select('*')
        .single();

    if (messageError) throw messageError;

    // Update room's last message
    const lastMsgContent = attachment ? (attachment.type === 'image' ? '📷 Image' : '📎 File') : content;

    await supabase
        .from('chat_rooms')
        .update({
            last_message: lastMsgContent,
            last_message_at: new Date().toISOString()
        })
        .eq('id', roomId);

    return message;
}


export async function getUnreadMessageCount(userId: string): Promise<number> {
    const supabase = createClient();
    // Get all chat rooms where the user is a participant
    const { data: rooms, error: roomsError } = await supabase
        .from('chat_rooms')
        .select('id')
        .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`);

    if (roomsError || !rooms || rooms.length === 0) return 0;

    const roomIds = rooms.map(r => r.id);

    // Count unread messages (messages not sent by the user in any of their rooms)
    const { count, error: countError } = await supabase
        .from('chat_messages')
        .select('*', { count: 'exact', head: true })
        .in('room_id', roomIds)
        .neq('sender_id', userId)
        .or('is_read.is.null,is_read.eq.false');

    if (countError) {
        console.error('Error fetching unread count:', countError);
        return 0;
    }

    return count || 0;
}

export async function markMessagesAsRead(roomId: string, userId: string): Promise<void> {
    const supabase = createClient();
    
    // Mark all messages in this room as read, IF they were not sent by the current user
    const { error } = await supabase
        .from('chat_messages')
        .update({ is_read: true })
        .eq('room_id', roomId)
        .neq('sender_id', userId)
        .or('is_read.is.null,is_read.eq.false');

    if (error) {
        console.error('Error marking messages as read:', error);
        throw error;
    }
}
