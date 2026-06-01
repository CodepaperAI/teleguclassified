"use client";

import { useState, useMemo } from "react";
import ListingsFilter from "@/components/admin/ListingsFilter";
import ToggleBlockButton from "@/components/admin/ToggleBlockButton";
import DeleteListingButton from "@/components/admin/DeleteListingButton";
import UpgradePlanModal from "@/components/admin/UpgradePlanModal";
import ListingActionDropdown from "@/components/admin/ListingActionDropdown";
import Link from "next/link";
import { FaMapMarkerAlt, FaEye } from "react-icons/fa";
import { FaRocket, FaPenToSquare } from "react-icons/fa6";
import { toggleListingBlockStatus, adminDeleteListing } from "@/lib/actions/admin-listings";
import Dialog from "@/components/Dialog";
import styles from "@/app/(admin)/admin/listings/listings.module.css"; // Reuse existing styles

interface Listing {
    id: string;
    title: string;
    city: string | null;
    price: number | null;
    status: string | null;
    created_at: string | null;
    category_id: string | null;
    sub_category_label: string | null;
    price_type: string | null;
    user_id: string | null;
    [key: string]: any;
}

interface Category {
    id: string;
    label: string;
}

interface Props {
    initialListings: Listing[];
    categories: Category[];
    premiumPlans: any[];
}

export default function AdminListingsClient({ initialListings, categories, premiumPlans }: Props) {
    const [filter, setFilter] = useState({
        q: "",
        category: "",
        status: "",
        price_type: ""
    });

    const [actionState, setActionState] = useState<{
        type: 'none' | 'delete' | 'upgrade' | 'block';
        listing: Listing | null;
        isLoading: boolean;
    }>({ type: 'none', listing: null, isLoading: false });

    const filteredListings = useMemo(() => {
        return initialListings.filter(listing => {
            // Search Filter
            if (filter.q) {
                const term = filter.q.toLowerCase();
                const titleMatch = listing.title.toLowerCase().includes(term);
                // Can extend to search other fields if needed
                if (!titleMatch) return false;
            }

            // Category Filter
            if (filter.category && listing.category_id !== filter.category) {
                return false;
            }

            // Status Filter
            if (filter.status && listing.status !== filter.status) {
                return false;
            }

            // Price Type Filter
            if (filter.price_type) {
                if (filter.price_type === 'free') {
                    if (listing.price_type !== 'free' && listing.price !== 0) return false;
                } else if (listing.price_type !== filter.price_type) {
                    return false;
                }
            }

            return true;
        });
    }, [initialListings, filter]);

    const handleClientFilterChange = (key: string, value: string) => {
        setFilter(prev => ({ ...prev, [key]: value }));
    };

    const handleBlock = async () => {
        if (!actionState.listing) return;
        const listing = actionState.listing;
        setActionState(prev => ({ ...prev, isLoading: true, type: 'none' }));
        try {
            const result = await toggleListingBlockStatus(listing.id, listing.status || 'active');
            if (!result.success) alert("Error: " + result.error);
        } catch (err) {
            console.error(err);
        } finally {
            setActionState(prev => ({ ...prev, isLoading: false, listing: null }));
        }
    };

    const handleDelete = async () => {
        if (!actionState.listing) return;
        const listing = actionState.listing;
        setActionState(prev => ({ ...prev, isLoading: true, type: 'none' }));
        try {
            const result = await adminDeleteListing(listing.id);
            if (!result.success) alert("Error: " + result.error);
        } catch (err) {
            console.error(err);
        } finally {
            setActionState(prev => ({ ...prev, isLoading: false, listing: null }));
        }
    };

    return (
        <div>
            <div className={styles.header}>
                <h1 className={styles.title}>Listings Management</h1>
                <div className="text-sm text-gray-500">
                    Showing {filteredListings.length} of {initialListings.length} loaded listings
                </div>
            </div>

            <ListingsFilter
                categories={categories}
                onFilterChange={handleClientFilterChange}
            />

            <div className={`${styles.tableContainer} pb-48 min-h-[500px]`} style={{ overflow: 'visible' }}>
                <table className={styles.table}>
                    <thead>
                        <tr className={styles.tr}>
                            <th className={styles.th}>Title</th>
                            <th className={styles.th}>Category</th>
                            <th className={styles.th}>Price</th>
                            <th className={styles.th}>Status</th>
                            <th className={styles.th}>Date</th>
                            <th className={styles.th}>Status Control</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredListings.map((listing) => (
                            <tr key={listing.id} className={styles.tr}>
                                <td className={styles.td}>
                                    <div className={`${styles.listingTitle} font-medium mb-2 flex items-center gap-4`}>
                                        <span className="truncate">{listing.title}</span>
                                        {listing.boost_plan && (
                                            <span 
                                                className="text-[#3b82f6] bg-blue-50 p-1 rounded-full text-[11px] ml-1" 
                                                title={`Boosted: ${listing.boost_plan}`}
                                                style={{ color: '#3b82f6' }}
                                            >
                                                <FaRocket />
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-xs text-gray-400 flex items-center gap-1">
                                        {listing.city && <FaMapMarkerAlt className="w-3 h-3" />} {listing.city}
                                    </div>
                                </td>
                                <td className={styles.td}>{listing.sub_category_label || listing.category_id}</td>
                                <td className={styles.td}>${listing.price}</td>
                                <td className={styles.td}>
                                    <span
                                        className={`${styles.badge} ${listing.status === "active"
                                            ? styles.badgeActive
                                            : listing.status === "blocked"
                                                ? styles.badgeBlocked
                                                : listing.status === "sold"
                                                    ? styles.badgeSold
                                                    : styles.badgeExpired
                                            }`}
                                    >
                                        {listing.status}
                                    </span>
                                </td>
                                <td className={styles.td}>
                                    {listing.created_at ? new Date(listing.created_at).toLocaleDateString() : 'Unknown'}
                                </td>
                                <td className={styles.td}>
                                    <div className={styles.actions}>
                                        <Link
                                            href={`/admin/listings/${listing.id}`}
                                            className="text-gray-500 hover:text-blue-600 transition-colors p-2"
                                            title="View Details"
                                        >
                                            <FaEye />
                                        </Link>
                                        <ListingActionDropdown 
                                            listing={{
                                                id: listing.id,
                                                title: listing.title,
                                                status: listing.status || 'active'
                                            }}
                                            onBlock={() => setActionState({ type: 'block', listing, isLoading: false })}
                                            onEdit={() => window.open(`/admin/listings/edit?id=${listing.id}&userId=${listing.user_id}`, '_blank')}
                                            onDelete={() => setActionState({ type: 'delete', listing, isLoading: false })}
                                            onUpgrade={() => setActionState({ type: 'upgrade', listing, isLoading: false })}
                                        />
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filteredListings.length === 0 && (
                            <tr>
                                <td colSpan={6} className="text-center p-4 text-gray-500">
                                    No listings match your filters.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <UpgradePlanModal 
                isOpen={actionState.type === 'upgrade'}
                onClose={() => setActionState({ type: 'none', listing: null, isLoading: false })}
                listingId={actionState.listing?.id || ""}
                listingTitle={actionState.listing?.title || ""}
                currentPlanId={actionState.listing?.boost_plan}
                plans={premiumPlans}
            />

            <Dialog 
                isOpen={actionState.type === 'block'}
                title={actionState.listing?.status === 'blocked' ? "Unblock Listing?" : "Block Listing?"}
                message={actionState.listing?.status === 'blocked' 
                    ? "Are you sure you want to unblock this listing?" 
                    : "Are you sure you want to block this listing? It will be hidden from the public."}
                type="confirm"
                onConfirm={handleBlock}
                onCancel={() => setActionState({ type: 'none', listing: null, isLoading: false })}
            />

            <Dialog 
                isOpen={actionState.type === 'delete'}
                title="Delete Listing Permanently?"
                message={`Are you sure you want to delete "${actionState.listing?.title}"? This action cannot be undone.`}
                type="confirm"
                onConfirm={handleDelete}
                onCancel={() => setActionState({ type: 'none', listing: null, isLoading: false })}
            />
        </div>
    );
}
