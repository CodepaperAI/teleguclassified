"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Listing, initialListings, ChatMessage, initialMessages, Order, initialOrders } from "@/lib/MockData";
import { createClient } from "@/lib/supabase/client";
import { getCategoriesTree, CategoryDto } from "@/lib/db/categories";
import { getActiveStates, Province, LocationDto } from "@/lib/db/locations";
import { ChatRoom, ChatMessage as DbChatMessage, sendChatMessage } from "@/lib/db/chat";
import { getFavorites, addFavorite, removeFavorite } from "@/lib/db/favorites";
import { User, Session } from "@supabase/supabase-js";
import { checkHasAdminAccess } from "@/lib/db/profile";
import { formatCurrency } from "@/lib/utils";

interface DialogState {
    isOpen: boolean;
    title: string;
    message: string;
    type: 'alert' | 'confirm';
    confirmText?: string;
    onConfirm: () => void;
    onCancel: () => void;
}

interface ToastState {
    isVisible: boolean;
    message: string;
    type: 'success' | 'error' | 'info';
}

interface PremiumPlan {
    id: string;
    label: string;
    price: number;
    duration_days: number;
    description: string | null;
    is_recommended?: boolean | null;
}

export interface MonetizationPlan {
    id: string;
    name: string;
    free_limit: number | null;
    listing_price: number | null;
    free_image_limit: number | null;
    paid_image_limit: number | null;
    created_at?: string | null;
}

export interface BlockFeatures {
    login?: boolean;
    posting?: boolean;
    chat?: boolean;
}


interface AppContextType {
    user: User | null;
    session: Session | null;
    categories: CategoryDto[];
    locations: LocationDto[];
    listings: Listing[];
    favorites: string[];
    messages: ChatMessage[];
    conversations: ChatRoom[];
    orders: Order[];
    premiumPlans: PremiumPlan[];
    monetizationPlans: MonetizationPlan[];
    siteSettings: SiteSettings | null;
    isLoadingUser: boolean;
    signOut: () => Promise<void>;
    toggleFavorite: (id: string) => void;
    addListing: (listing: Listing) => void;
    sendMessage: (roomId: string, content: string) => Promise<void>;
    refreshConversations: () => Promise<void>;
    deleteListing: (id: string) => Promise<void>;
    refreshListings: () => Promise<void>;
    isLoadingListings: boolean;
    isLoadingCategories: boolean;
    dialog: DialogState;
    toast: ToastState;
    showAlert: (title: string, message: string) => void;
    showConfirm: (title: string, message: string, onConfirm: () => void, onCancel?: () => void, confirmText?: string) => void;
    showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
    closeDialog: () => void;
    closeToast: () => void;
    toggleListingStatus: (id: string, currentStatus: string) => Promise<void>;
    trackImpression: (ids: string[]) => Promise<void>;
    trackView: (id: string) => Promise<void>;
    trackChat: (id: string) => Promise<void>;
    unreadCount: number;
    isAdmin: boolean;
    isCheckingAdmin: boolean;
    isBlocked: boolean;
    blockFeatures?: BlockFeatures;
    toggleVerification: (userId: string, currentStatus: boolean) => Promise<void>;
    updateListingStatus: (id: string, newStatus: string) => Promise<void>;
    isAdminSidebarOpen: boolean;
    setIsAdminSidebarOpen: (open: boolean) => void;
}

export interface SiteSettings {
    id: number;
    social_links: any;
    contact_email: string | null;
    contact_phone: string | null;
    about_us: string | null;
    home_banner_url: string | null;
    hero_description: string | null;
    website_fee: number | null;
    is_pricing_enabled: boolean | null;
    is_hst_enabled?: boolean | null;
    global_free_limit: number | null;
    global_free_image_limit: number | null;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
    const supabase = createClient();
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [categories, setCategories] = useState<CategoryDto[]>([]);
    const [locations, setLocations] = useState<LocationDto[]>([]);
    const [listings, setListings] = useState<Listing[]>(initialListings);
    const [favorites, setFavorites] = useState<string[]>([]);
    const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
    const [conversations, setConversations] = useState<ChatRoom[]>([]);
    const [orders, setOrders] = useState<Order[]>(initialOrders);
    const [premiumPlans, setPremiumPlans] = useState<PremiumPlan[]>([]);
    const [monetizationPlans, setMonetizationPlans] = useState<MonetizationPlan[]>([]);
    const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
    const [isLoadingCategories, setIsLoadingCategories] = useState(true);
    const [isLoadingUser, setIsLoadingUser] = useState(true);
    const [isLoadingListings, setIsLoadingListings] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isCheckingAdmin, setIsCheckingAdmin] = useState(false);
    const [isBlocked, setIsBlocked] = useState(false);
    const [blockFeatures, setBlockFeatures] = useState<BlockFeatures | undefined>(undefined);
    const [isAdminSidebarOpen, setIsAdminSidebarOpen] = useState(true);

    const [dialog, setDialog] = useState<DialogState>({
        isOpen: false,
        title: '',
        message: '',
        type: 'alert',
        onConfirm: () => { },
        onCancel: () => { }
    });

    const [toast, setToast] = useState<ToastState>({
        isVisible: false,
        message: '',
        type: 'success'
    });

    const closeDialog = React.useCallback(() => setDialog(prev => ({ ...prev, isOpen: false })), []);
    const closeToast = React.useCallback(() => setToast(prev => ({ ...prev, isVisible: false })), []);

    const showToast = React.useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
        setToast({
            isVisible: true,
            message,
            type
        });
    }, []);

    const showAlert = React.useCallback((title: string, message: string) => {
        setDialog({
            isOpen: true,
            title,
            message,
            type: 'alert',
            onConfirm: closeDialog,
            onCancel: closeDialog
        });
    }, [closeDialog]);

    const showConfirm = React.useCallback((title: string, message: string, onConfirm: () => void, onCancel?: () => void, confirmText?: string) => {
        setDialog({
            isOpen: true,
            title,
            message,
            type: 'confirm',
            confirmText,
            onConfirm: () => {
                onConfirm();
                closeDialog();
            },
            onCancel: () => {
                onCancel?.();
                closeDialog();
            }
        });
    }, [closeDialog]);

    // Authenticated state & Admin check
    useEffect(() => {
        const checkAdmin = async (uid: string) => {
            setIsCheckingAdmin(true);
            const hasAccess = await checkHasAdminAccess(uid, supabase);
            
            const { data } = await supabase
                .from('profiles')
                .select('is_blocked, block_features')
                .eq('id', uid)
                .single();
            
            const blockedFeats = data?.block_features as BlockFeatures | undefined;
            if (blockedFeats?.login) {
                // If the user's login is blocked, sign them out immediately
                await supabase.auth.signOut();
                setIsAdmin(false);
                setIsBlocked(true);
                setBlockFeatures(blockedFeats);
                alert("Account Restricted: Your account has been blocked from logging in. Please contact support.");
                return;
            }

            setIsAdmin(hasAccess);
            setIsBlocked(!!data?.is_blocked);
            setBlockFeatures(blockedFeats);
            setIsCheckingAdmin(false);
        };

        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                checkAdmin(session.user.id);
            }
            setIsLoadingUser(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                checkAdmin(session.user.id);
            } else {
                setIsAdmin(false);
                setIsBlocked(false);
                setBlockFeatures(undefined);
            }
        });

        return () => subscription.unsubscribe();
    }, []);


    const toggleVerification = async (userId: string, currentStatus: boolean) => {
        if (!isAdmin) return;

        try {
            const { error } = await supabase
                .from('profiles')
                .update({ is_verified: !currentStatus })
                .eq('id', userId);

            if (error) throw error;

            showToast(`User verification ${!currentStatus ? 'enabled' : 'disabled'}`, 'success');
            // Refresh listings to update UI
            fetchListings();
        } catch (error) {
            console.error("Error toggling verification:", error);
            showToast("Failed to update verification status", "error");
        }
    };

    // Fetch real listings from Supabase
    const fetchListings = React.useCallback(async () => {
        setIsLoadingListings(true);
        try {
            const { data, error } = await supabase
                .from('listings')
                .select('*')
                .eq('status', 'active')
                // Premium ads first, then newest first
                .order('boost_plan', { ascending: false, nullsFirst: false })
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Fetch verification status for these users
            const userIds = Array.from(new Set(data.map(item => item.user_id).filter(id => id))) as string[];
            let verifiedUsers = new Set<string>();

            if (userIds.length > 0) {
                const { data: profiles } = await supabase
                    .from('profiles')
                    .select('id, is_verified')
                    .in('id', userIds);

                if (profiles) {
                    profiles.forEach(p => {
                        if (p.is_verified) verifiedUsers.add(p.id);
                    });
                }
            }

            // Transform DB data to UI Listing format
            const transformed: Listing[] = data.map((item: any) => {
                // Use the relation label if available (handles renames), otherwise fallback to stored label
                const activeSubCatLabel = item.sub_categories?.label || item.sub_category_label;
                const activeSubItemLabel = item.listing_types?.label || item.sub_item_label;

                const priceStr = item.price_type === 'amount' ? formatCurrency(item.price, false) :
                    item.price_type === 'free' ? 'Free' :
                        item.price_type === 'contact' ? 'Please Contact' : 'Swap/Trade';

                return {
                    id: item.id,
                    image: item.images?.[0] || "",
                    images: item.images || [],
                    price: priceStr,
                    price_amount: item.price || 0,
                    time: item.created_at ? new Date(item.created_at).toLocaleDateString() : 'N/A',
                    title: item.title,
                    description: item.description,
                    location: `${item.city || "Unknown"}, ${item.province_code || ""}`,
                    city: item.city || undefined,
                    province_code: item.province_code || undefined,
                    address: item.address,
                    category: activeSubCatLabel || item.category_id || "Other",
                    category_id: item.category_id || undefined,
                    tags: item.tags || [],
                    badge: item.boost_plan ? 'BOOSTED' : undefined,
                    actionType: item.category_id === 'jobs' ? 'Apply Now' : 'Contact Seller',
                    user_id: item.user_id || undefined,
                    phone: item.contact_phone || undefined,
                    status: item.status,
                    views_count: item.views_count ?? 0,
                    impressions_count: item.impressions_count ?? 0,
                    chats_count: item.chats_count ?? 0,
                    created_at: item.created_at,
                    boost_expires_at: item.boost_expires_at || null,
                    youtube_video_url: item.youtube_video_url || null,
                    attributes: item.attributes || null,
                    sub_category_id: item.sub_category_id || undefined,
                    sub_category_label: activeSubCatLabel || undefined,
                    listing_type_id: item.listing_type_id || undefined,
                    sub_item_label: activeSubItemLabel || undefined,
                    seller: {
                        id: item.user_id || undefined,
                        name: item.contact_name || 'User',
                        initials: (item.contact_name || 'U')[0].toUpperCase(),
                        memberSince: item.created_at ? new Date(item.created_at).getFullYear().toString() : '',
                        rating: '',
                        reviews: '',
                        responseTime: '',
                        isVerified: item.user_id ? verifiedUsers.has(item.user_id) : false
                    }
                };
            });

            setListings(transformed);
        } catch (err) {
            console.error("Error fetching listings:", err);
        } finally {
            setIsLoadingListings(false);
        }
    }, []);

    useEffect(() => {
        fetchListings();
    }, [user]); // Re-fetch when user logs in/out to handle RLS/session correctly

    useEffect(() => {
        setIsLoadingCategories(true);
        Promise.all([
            getCategoriesTree().then(data => setCategories(data)),
            getActiveStates().then(data => setLocations(data)),
            supabase.from('premium_plans').select('*').eq('is_active', true).order('price', { ascending: true }).then(({ data }) => {
                if (data) setPremiumPlans(data);
            }),
            supabase.from('site_settings').select('*').eq('id', 1).single().then(({ data }) => {
                if (data) setSiteSettings(data as SiteSettings);
            }),
            supabase.from('monetization_plans').select('*').order('name').then(({ data }) => {
                if (data) setMonetizationPlans(data as MonetizationPlan[]);
            })
        ])
            .catch(err => console.error("Failed to fetch initial data:", err))
            .finally(() => setIsLoadingCategories(false));
    }, []);

    // Fetch and Subscribe to Conversations
    const fetchConversations = async () => {
        if (!user) return;
        const { getChatRooms } = await import("@/lib/db/chat");
        try {
            const rooms = await getChatRooms(user.id);
            setConversations(rooms);
        } catch (err) {
            console.error("Error fetching conversations:", err);
        }
    };

    const fetchUnreadCount = async () => {
        if (!user) {
            setUnreadCount(0);
            return;
        }
        const { getUnreadMessageCount } = await import("@/lib/db/chat");
        try {
            const count = await getUnreadMessageCount(user.id);
            setUnreadCount(count);
        } catch (err) {
            console.error("Error fetching unread count:", err);
        }
    };

    useEffect(() => {
        if (user) {
            fetchConversations();
            fetchUnreadCount();

            // Subscribe to room updates
            const roomChannel = supabase
                .channel('chat_rooms_updates')
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: 'chat_rooms'
                }, () => {
                    fetchConversations();
                })
                .subscribe();

            // Subscribe to new messages for notifications
            const messageChannel = supabase
                .channel('global_messages')
                .on('postgres_changes', {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'chat_messages'
                }, async (payload: any) => {
                    // Start of handling new message
                    if (payload.new.sender_id !== user.id) {
                        // It's an incoming message
                        // Verify if it belongs to one of user's room (basic check)
                        // Ideally we check if user is participant, but for now we just refresh unread count
                        await fetchUnreadCount();
                        await fetchConversations();
                        showToast(`New message received`, 'info');

                        // Play sound if possible
                        try {
                            const audio = new Audio('/notification.mp3');
                            // Note: Audio might fail if file doesn't exist or browser policy blocks it
                            audio.play().catch(e => { });
                        } catch (e) { }
                    }
                })
                .subscribe();

            return () => {
                supabase.removeChannel(roomChannel);
                supabase.removeChannel(messageChannel);
            };
        } else {
            setUnreadCount(0);
            setFavorites([]); // Clear favorites on logout
        }
    }, [user]);

    // Fetch favorites on load/login
    useEffect(() => {
        if (user) {
            getFavorites(user.id).then(setFavorites);
        } else {
            // Optional: Keep local storage for guests if desired, but for now we'll stick to auth users
            const local = localStorage.getItem("favorites");
            if (local) setFavorites(JSON.parse(local));
        }
    }, [user]);

    const refreshConversations = async () => {
        await fetchConversations();
        await fetchUnreadCount();
    };

    const signOut = async () => {
        await supabase.auth.signOut();
        setUnreadCount(0);
    };

    const toggleFavorite = async (id: string) => {
        // Optimistic update
        const isFavorited = favorites.includes(id);
        const next = isFavorited ? favorites.filter(f => f !== id) : [...favorites, id];
        setFavorites(next);

        // Persist to local storage for guests
        if (!user) {
            localStorage.setItem("favorites", JSON.stringify(next));
            return;
        }

        // Persist to Supabase for auth users
        try {
            if (isFavorited) {
                await removeFavorite(user.id, id);
            } else {
                await addFavorite(user.id, id);
            }
        } catch (err) {
            console.error("Error toggling favorite:", err);
            // Revert on error
            setFavorites(favorites);
            showToast("Failed to update favorite", "error");
        }
    };

    // Updated addListing to trigger a re-fetch or just update local state
    const addListing = (listing: Listing) => {
        setListings(prev => [listing, ...prev]);
        // Explicitly re-fetch to ensure sync with DB if needed
        fetchListings();
    };

    // Updated sendMessage to use Supabase
    const sendMessage = async (roomId: string, content: string) => {
        if (!user) return;
        try {
            await sendChatMessage(roomId, user.id, content);
            // Optimistically update
            await fetchConversations();
        } catch (err) {
            console.error("Error sending message:", err);
        }
    };

    const deleteListing = async (id: string) => {
        try {
            // 1. Fetch the listing to get image URLs
            const { data: listing, error: fetchError } = await supabase
                .from('listings')
                .select('images')
                .eq('id', id)
                .single();

            if (fetchError) {
                console.error("Error fetching listing for deletion:", fetchError);
            }

            // 2. Delete images from storage if they exist
            if (listing?.images && Array.isArray(listing.images) && listing.images.length > 0) {
                const imagePaths = listing.images
                    .filter((url: string) => url.includes('supabase.co') && url.includes('/public/listings/'))
                    .map((url: string) => {
                        const parts = url.split('/public/listings/');
                        return parts.length > 1 ? parts[1] : null;
                    })
                    .filter((path: string | null): path is string => path !== null);

                if (imagePaths.length > 0) {
                    const { error: storageError } = await supabase.storage
                        .from('listings')
                        .remove(imagePaths);

                    if (storageError) {
                        console.error("Error deleting images from storage:", storageError);
                    }
                }
            }

            // 3. Delete the listing record
            const { error: deleteError } = await supabase
                .from('listings')
                .delete()
                .eq('id', id);

            if (deleteError) throw deleteError;
            await fetchListings();
        } catch (err) {
            console.error("Error deleting listing:", err);
            throw err;
        }
    };

    const updateListingStatus = async (id: string, newStatus: string) => {
        try {
            const { error } = await supabase
                .from('listings')
                .update({ status: newStatus })
                .eq('id', id);

            if (error) throw error;
            await fetchListings();
        } catch (err) {
            console.error("Error updating listing status:", err);
            throw err;
        }
    };

    const toggleListingStatus = async (id: string, currentStatus: string) => {
        const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
        await updateListingStatus(id, newStatus);
    };

    const trackImpression = async (ids: string[]) => {
        if (!ids.length) return;
        try {
            // Using rpc for bulk increment is better, but simple update for now
            // Supabase doesn't have a built-in bulk increment without RPC
            await supabase.rpc('increment_impressions', { listing_ids: ids });
        } catch (err) {
            console.error("Error tracking impressions:", err);
        }
    };

    const trackView = async (id: string) => {
        try {
            await supabase.rpc('increment_views', { listing_id: id });
        } catch (err) {
            console.error("Error tracking view:", err);
        }
    };

    const trackChat = async (id: string) => {
        try {
            await supabase.rpc('increment_chats', { listing_id: id });
        } catch (err) {
            console.error("Error tracking chat:", err);
        }
    };

    return (
        <AppContext.Provider value={{
            user,
            session,
            categories,
            locations,
            listings,
            favorites,
            messages,
            conversations,
            orders,
            signOut,
            toggleFavorite,
            addListing,
            sendMessage,
            refreshConversations,
            deleteListing,
            refreshListings: fetchListings,
            isLoadingListings,
            isLoadingCategories,
            isLoadingUser,
            premiumPlans,
            monetizationPlans,
            dialog,
            showAlert,
            showConfirm,
            showToast,
            closeDialog,
            closeToast,
            toast,
            toggleListingStatus,
            trackImpression,
            trackView,
            trackChat,
            unreadCount,
            isAdmin,
            isCheckingAdmin,
            isBlocked,
            blockFeatures,
            toggleVerification,
            updateListingStatus,
            siteSettings,
            isAdminSidebarOpen,
            setIsAdminSidebarOpen
        }}>
            {children}
        </AppContext.Provider>
    );
}

export function useAppContext() {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error("useAppContext must be used within an AppProvider");
    }
    return context;
}
