import { createAdminClient } from "@/lib/supabase/admin";
import { Card, CardContent } from "@/components/ui-custom/Card";
import { Badge } from "@/components/ui-custom/Badge";
import Link from "next/link";
import { FaMapMarkerAlt, FaCalendar, FaTag, FaUser, FaPhone, FaEnvelope } from "react-icons/fa";
import ToggleBlockButton from "@/components/admin/ToggleBlockButton";
import styles from "./page.module.css";

export default async function AdminListingDetailPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const { id } = params;
    const supabase = createAdminClient();

    // 1. Fetch listing data
    const { data: listing, error: listingError } = await supabase
        .from("listings")
        .select("*")
        .eq("id", id)
        .single();

    if (listingError || !listing) {
        return (
            <div className="p-8 text-center text-gray-500">
                <h2 className="text-xl font-bold mb-2">Listing Not Found</h2>
                <p>The listing with ID {id} could not be found.</p>
                {listingError && <p className="text-red-500 mt-2">Error: {listingError.message}</p>}
                <Link href="/admin/listings" className="text-blue-600 hover:underline mt-4 inline-block">
                    Back to Listings
                </Link>
            </div>
        );
    }

    // 2. Fetch seller profile separately
    let seller = null;
    if (listing.user_id) {
        const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, phone, is_verified")
            .eq("id", listing.user_id)
            .single();
        seller = profile;
    }

    const isBlocked = listing.status === 'blocked';
    const isSold = listing.status === 'sold';
    const isActive = listing.status === 'active';

    return (
        <div className={styles.container}>
            {/* Header Section */}
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <div className={styles.breadcrumbs}>
                        <Link href="/admin/listings" className={styles.breadcrumbLink}>
                            Listings
                        </Link>
                        <span>/</span>
                        <span style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {listing.title}
                        </span>
                    </div>
                    <div className={styles.titleRow}>
                        <h1 className={styles.title}>{listing.title}</h1>
                        <Badge
                            className=""
                            variant={isActive ? 'active' : isBlocked ? 'destructive' : isSold ? 'secondary' : 'default'}
                        >
                            {(listing.status || 'unknown').toUpperCase()}
                        </Badge>
                    </div>
                    <div className={styles.metaRow}>
                        <span className={styles.metaItem}>
                            <FaMapMarkerAlt color="#3b82f6" />
                            {listing.city || "Unknown City"}, {listing.province_code}
                        </span>
                        <span className={styles.metaItem}>
                            <FaCalendar color="#a855f7" />
                            Posted {listing.created_at ? new Date(listing.created_at).toLocaleDateString() : 'Unknown Date'}
                        </span>
                        <span className={styles.metaItem}>
                            <FaTag color="#f97316" />
                            {listing.category_id}
                        </span>
                    </div>
                </div>

                <div className={styles.headerActions}>
                    <Link
                        href={`/product/${listing.id}`}
                        target="_blank"
                        className={styles.viewPublicBtn}
                    >
                        <span>View Public Page</span>
                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                        </svg>
                    </Link>
                    <ToggleBlockButton listingId={listing.id} initialStatus={listing.status || 'active'} />
                </div>
            </div>

            <div className={styles.grid}>
                {/* Main Content Column */}
                <div className={styles.mainContent}>
                    {/* Gallery */}
                    <Card className={styles.cardNoBorder}>
                        <CardContent className="p-0">
                            {listing.images && listing.images.length > 0 ? (
                                <div className={styles.gallery}>
                                    <div className={styles.mainImageWrapper}>
                                        <img
                                            src={listing.images[0]}
                                            alt={listing.title}
                                            className={styles.mainImage}
                                        />
                                    </div>
                                    {listing.images.length > 1 && (
                                        <div className={styles.thumbnails}>
                                            {listing.images.slice(1, 5).map((img: string, idx: number) => (
                                                <div key={idx} className={styles.thumbnail}>
                                                    <img
                                                        src={img}
                                                        alt={`${listing.title} ${idx + 2}`}
                                                        className={styles.thumbnailImg}
                                                    />
                                                </div>
                                            ))}
                                            {listing.images.length > 5 && (
                                                <div className={`${styles.thumbnail} ${styles.moreImages}`}>
                                                    +{listing.images.length - 5}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className={styles.noImages}>
                                    <FaTag size={32} style={{ opacity: 0.2 }} />
                                    <span>No Images</span>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Description */}
                    <div>
                        <h3 className={styles.sectionTitle}>Description</h3>
                        <Card>
                            <CardContent className="p-6">
                                <div className={styles.description}>
                                    {listing.description || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>No description provided by the seller.</span>}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Listing Attributes/Details */}
                    <div>
                        <h3 className={styles.sectionTitle}>Details</h3>
                        <div className={styles.attributesGrid}>
                            <div className={styles.attributeCard}>
                                <span className={styles.attributeLabel}>Price Type</span>
                                <div className={styles.attributeValue} style={{ textTransform: 'capitalize' }}>{listing.price_type}</div>
                            </div>
                            <div className={styles.attributeCard}>
                                <span className={styles.attributeLabel}>Sub-Category</span>
                                <div className={styles.attributeValue}>{listing.sub_category_label || "-"}</div>
                            </div>
                            <div className={styles.attributeCard}>
                                <span className={styles.attributeLabel}>Boost Plan</span>
                                <div className={styles.attributeValue} style={{ display: 'flex', alignItems: 'center', gap: '8px', textTransform: 'capitalize' }}>
                                    {listing.boost_plan || "Free"}
                                    {listing.boost_plan && (
                                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#a855f7' }}></span>
                                    )}
                                </div>
                            </div>
                            <div className={styles.attributeCard}>
                                <span className={styles.attributeLabel}>Reference ID</span>
                                <div className={styles.attributeValue} style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>{listing.id.split('-')[0]}...</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar Column */}
                <div className={styles.sidebar}>
                    {/* Price Card */}
                    <Card style={{ borderLeft: '4px solid #10b981' }}>
                        <CardContent className={styles.sidebarCardContent}>
                            <p className={styles.priceLabel}>Asking Price</p>
                            <div className={styles.priceValue}>
                                {listing.price_type === 'amount' ? `$${listing.price?.toLocaleString()}` :
                                    listing.price_type === 'free' ? 'Free' :
                                        listing.price_type === 'contact' ? 'Contact' : 'Trade'}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Admin Actions Card */}
                    <Card>
                        <CardContent className={styles.sidebarCardContent}>
                            <div className={styles.actionHeader}>
                                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path>
                                </svg>
                                Admin Actions
                            </div>
                            <div className={styles.actionContent}>
                                <div className={styles.visibilityCard}>
                                    <div className={styles.statusRow}>
                                        <span className={styles.statusLabel}>Visibility</span>
                                        <span className={`${styles.statusBadge} ${isActive ? styles.statusActive : styles.statusBlocked}`}>
                                            {isActive ? 'Public' : 'Hidden'}
                                        </span>
                                    </div>
                                    <p className={styles.statusHelp}>
                                        {isActive ? 'This listing is visible to all users.' : 'This listing is blocked and only visible to admins.'}
                                    </p>
                                </div>
                                {/* Future: Add 'Delete' or 'Edit' buttons here */}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Seller Card */}
                    <Card className={styles.cardNoPadding}>
                        <div className={styles.sellerHeader}>
                            <h3 className={styles.sellerTitle}>Seller Information</h3>
                            {seller?.is_verified && (
                                <span className={styles.verifiedBadge}>
                                    <svg width="12" height="12" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                                    Verified
                                </span>
                            )}
                        </div>
                        <div className={styles.sellerBody}>
                            <div className={styles.sellerProfile}>
                                <div className={styles.sellerAvatar}>
                                    {(seller?.full_name?.[0] || 'U').toUpperCase()}
                                </div>
                                <div>
                                    <div className={styles.sellerName}>{seller?.full_name || "Unknown User"}</div>
                                    <div className={styles.sellerSubtitle}>
                                        <FaUser size={12} />
                                        ID: {listing.user_id?.substring(0, 6)}...
                                    </div>
                                </div>
                            </div>
                            <div className={styles.contactList}>
                                {listing.contact_email && (
                                    <div className={styles.contactItem} style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                        <div className={styles.contactIcon}>
                                            <FaEnvelope size={14} />
                                        </div>
                                        <span>{listing.contact_email}</span>
                                    </div>
                                )}
                                {seller?.phone && (
                                    <div className={styles.contactItem}>
                                        <div className={styles.contactIcon}>
                                            <FaPhone size={14} />
                                        </div>
                                        <span>{seller.phone}</span>
                                    </div>
                                )}
                            </div>
                            <Link
                                href={`/admin/users/${listing.user_id}`}
                                className={styles.viewProfileBtn}
                            >
                                View Full Profile
                            </Link>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}

