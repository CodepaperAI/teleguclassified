export interface Listing {
    id: string;
    image: string;
    images?: string[];
    price: string;
    price_amount: number;
    time: string;
    title: string;
    description?: string | null;
    location: string;
    city?: string;
    province_code?: string;
    address?: string | null;
    category: string;
    tags?: string[];
    badge?: "FEATURED" | "URGENT" | "BOOSTED";
    actionType?: "Contact Seller" | "Apply Now" | "View Details";
    user_id?: string;
    category_id?: string;
    phone?: string;
    status?: string | null;
    views_count?: number;
    impressions_count?: number;
    chats_count?: number;
    created_at?: string | null;
    boost_expires_at?: string | null;
    boost_plan?: string | null;
    youtube_video_url?: string | null;
    attributes?: any;
    sub_category_id?: number;
    sub_category_label?: string;
    listing_type_id?: number;
    sub_item_label?: string;
    slug?: string;
    seller?: {
        id?: string;
        name: string;
        initials: string;
        memberSince: string;
        rating: string;
        reviews: string;
        responseTime: string;
        isVerified?: boolean;
    };
}

export const initialListings: Listing[] = [];

export interface ChatMessage {
    id: string;
    sender: string;
    message: string;
    time: string;
    avatar?: string;
    unreadCount?: number;
}

export const initialMessages: ChatMessage[] = [];

export interface Order {
    id: string;
    item: string;
    price: string;
    date: string;
    status: "Delivered" | "Pending" | "Cancelled" | "Shipped";
    image: string;
}

export const initialOrders: Order[] = [];
