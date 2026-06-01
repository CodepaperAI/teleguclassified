"use client";

import { useState } from "react";
import { FaPlus, FaRocket, FaEye, FaLayerGroup, FaBan, FaCircleCheck, FaTrashCan, FaPenToSquare } from "react-icons/fa6";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui-custom/Table";
import { Badge } from "@/components/ui-custom/Badge";
import Link from "next/link";
import UpgradePlanModal from "@/components/admin/UpgradePlanModal";
import ListingActionDropdown from "@/components/admin/ListingActionDropdown";
import { toggleListingBlockStatus, adminDeleteListing } from "@/lib/actions/admin-listings";
import Dialog from "@/components/Dialog";
import styles from "./page.module.css";

interface AdminListingsClientProps {
    listings: any[];
    userId: string;
    categories: any[];
    premiumPlans: any[];
}

export default function AdminListingsClient({ listings, userId, categories, premiumPlans }: AdminListingsClientProps) {
    const [actionState, setActionState] = useState<{
        type: 'none' | 'delete' | 'upgrade' | 'block';
        listing: any | null;
        isLoading: boolean;
    }>({ type: 'none', listing: null, isLoading: false });

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
        <>
            <div className={styles.headerActions}>
                <Link 
                    href={`/admin/listings/edit?userId=${userId}`}
                    className={styles.addBtn}
                >
                    <FaPlus /> Add New Listing
                </Link>
            </div>

            {listings.length === 0 ? (
                <div style={{ padding: '80px 24px', textAlign: 'center', color: '#666' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '16px', opacity: 0.3 }}>
                        <FaLayerGroup style={{ margin: '0 auto' }} />
                    </div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111', marginBottom: '8px' }}>No listings found</h3>
                    <p style={{ marginBottom: '24px' }}>This user hasn't posted any listings yet.</p>
                    <Link 
                        href={`/admin/listings/edit?userId=${userId}`}
                        style={{ 
                            padding: '10px 20px', 
                            background: '#000', 
                            color: '#fff', 
                            border: 'none', 
                            borderRadius: '6px', 
                            fontWeight: '500', 
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            textDecoration: 'none'
                        }}
                    >
                        <FaPlus /> Create First Listing
                    </Link>
                </div>
            ) : (
                <>
                    <div className={`${styles.desktopOnly} pb-48 min-h-[500px]`} style={{ overflow: 'visible' }}>
                        <Table containerClassName="min-h-[500px]" style={{ overflow: 'visible' }}>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Listing</TableHead>
                                    <TableHead>Price</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Created</TableHead>
                                    <TableHead className="text-center">View</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {listings.map((listing) => {
                                    const statusVariant =
                                        listing.status === 'active' ? 'active' :
                                            listing.status === 'sold' ? 'secondary' :
                                                listing.status === 'blocked' ? 'destructive' :
                                                    'pending';

                                    return (
                                        <TableRow key={listing.id}>
                                            <TableCell>
                                                <div className={styles.listingCell}>
                                                    <div className={styles.thumbnailWrapper}>
                                                        {listing.images && listing.images[0] ? (
                                                            <img src={listing.images[0]} alt="" className={styles.thumbnail} />
                                                        ) : (
                                                            <div className={styles.noThumbnail}>N/A</div>
                                                        )}
                                                    </div>
                                                    <div className={styles.listingInfo}>
                                                        <div className={styles.listingTitle} title={listing.title}>
                                                            {listing.title}
                                                            {listing.boost_plan && (
                                                                <span className={styles.boostBadge} title={`Boosted: ${listing.boost_plan}`}>
                                                                    <FaRocket />
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className={styles.listingId}>ID: {listing.id.slice(0, 8)}</div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className={styles.price}>
                                                    {listing.price_type === 'contact' ? 'Contact' :
                                                        listing.price_type === 'free' ? 'Free' :
                                                            listing.price ? `$${listing.price.toLocaleString()}` : "N/A"}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={statusVariant}>{listing.status}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                <span className={styles.category}>
                                                    {listing.sub_category_label || listing.category_id || "Uncategorized"}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <span className={styles.date}>
                                                    {listing.created_at ? new Date(listing.created_at).toLocaleDateString() : 'Unknown'}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Link href={`/admin/listings/${listing.id}`} target="_blank" className={styles.actionBtn} style={{ display: 'inline-flex' }}>
                                                    <FaEye />
                                                </Link>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className={styles.rowActions} style={{ justifyContent: 'flex-end' }}>
                                                    <ListingActionDropdown 
                                                        listing={{
                                                            id: listing.id,
                                                            title: listing.title,
                                                            status: listing.status || 'active'
                                                        }}
                                                        onBlock={() => setActionState({ type: 'block', listing, isLoading: false })}
                                                        onEdit={() => window.open(`/admin/listings/edit?id=${listing.id}&userId=${userId}`, '_blank')}
                                                        onDelete={() => setActionState({ type: 'delete', listing, isLoading: false })}
                                                        onUpgrade={() => setActionState({ type: 'upgrade', listing, isLoading: false })}
                                                    />
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Mobile Cards (Simplified for space) */}
                    <div className={styles.mobileOnly}>
                        <div className={styles.mobileCardList}>
                            {listings.map((listing) => (
                                <div key={listing.id} className={styles.mobileCard}>
                                    <div className={styles.mobileHeader}>
                                        <h4 className={styles.mobileTitle}>{listing.title}</h4>
                                        <Badge variant={listing.status === 'active' ? 'active' : 'secondary'}>
                                            {listing.status}
                                        </Badge>
                                    </div>
                                    <div className={styles.mobileActions}>
                                        <ListingActionDropdown 
                                            listing={{
                                                id: listing.id,
                                                title: listing.title,
                                                status: listing.status || 'active'
                                            }}
                                            onBlock={() => setActionState({ type: 'block', listing, isLoading: false })}
                                            onEdit={() => window.open(`/admin/listings/edit?id=${listing.id}&userId=${userId}`, '_blank')}
                                            onDelete={() => setActionState({ type: 'delete', listing, isLoading: false })}
                                            onUpgrade={() => setActionState({ type: 'upgrade', listing, isLoading: false })}
                                        />
                                        <Link href={`/admin/listings/${listing.id}`} className={styles.mobileActionLink}>
                                            View
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}


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
        </>
    );
}
