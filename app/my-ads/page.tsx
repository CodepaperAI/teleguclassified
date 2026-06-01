"use client";

import { useAppContext } from "@/context/AppContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ListingCard from "@/components/ListingCard";
import styles from "./MyAds.module.css";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";

import { useState } from "react";
import { FaArrowTrendUp, FaTrashCan, FaPause, FaCheck, FaPen, FaClock } from "react-icons/fa6";
import { IoClose } from "react-icons/io5";
import { HiDotsVertical } from "react-icons/hi";

export default function MyAdsPage() {
    return (
        <Suspense fallback={<div>Loading dashboard...</div>}>
            <MyAdsContent />
        </Suspense>
    );
}

function MyAdsContent() {
    const { user, isLoadingUser, showAlert, showConfirm, toggleListingStatus, deleteListing, updateListingStatus, showToast, premiumPlans, siteSettings } = useAppContext();
    const router = useRouter();
    const searchParams = useSearchParams();
    const paymentStatus = searchParams.get("payment");
    const [selectedListing, setSelectedListing] = useState<any>(null);
    const [loadingId, setLoadingId] = useState<string | null>(null);
    const [selectedPlan, setSelectedPlan] = useState<string>('');
    const [listingToAction, setListingToAction] = useState<any>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [myListings, setMyListings] = useState<any[]>([]);
    const [isLoadingListings, setIsLoadingListings] = useState(true);

    const fetchMyListings = async () => {
        if (!user) return;
        setIsLoadingListings(true);
        try {
            const { createClient } = await import("@/lib/supabase/client");
            const supabase = createClient();
            const { data, error } = await supabase
                .from('listings')
                .select('*, seller:profiles!user_id(full_name, is_verified, created_at)')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Transform data to match UI needs
            // We need to fetch premium plans separately or assume standard fields
            const transformed = data.map(item => ({
                ...item,
                price: item.price_type === 'amount' ? `$${(item.price || 0).toLocaleString()}` :
                    item.price_type === 'free' ? 'Free' :
                        item.price_type === 'contact' ? 'Contact' : 'Swap/Trade',
                image: item.images?.[0] || "",
                time: item.created_at ? new Date(item.created_at).toLocaleDateString() : 'N/A',
                location: `${item.city || ""}, ${item.province_code || ""}`,
                chats_count: item.chats_count || 0,
                views_count: item.views_count || 0,
                impressions_count: item.impressions_count || 0
            }));
            setMyListings(transformed);
        } catch (err) {
            console.error("Error fetching my listings:", err);
        } finally {
            setIsLoadingListings(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchMyListings();
        }
    }, [user]);

    useEffect(() => {
        if (premiumPlans.length > 0 && !selectedPlan) {
            setSelectedPlan(premiumPlans[0].id);
        }
    }, [premiumPlans, selectedPlan]);

    useEffect(() => {
        // If we're returning from a payment (success or cancel), we don't want to redirect 
        // to login immediately, even if the user state hasn't quite loaded yet. 
        // Stripe redirects should always be to an authenticated session.
        if (!isLoadingUser && !user && !paymentStatus) {
            router.push("/login");
        }
    }, [user, isLoadingUser, router, paymentStatus]);

    // Handle payment return
    useEffect(() => {
        if (paymentStatus === "success") {
            const type = searchParams.get("type");
            const sessionId = searchParams.get("session_id");

            if (type === 'listing_fee') {
                showAlert("Payment Successful!", "Your listing fee has been paid and your ad is now active.");
            } else if (type === 'bundle') {
                showAlert("Payment Successful!", "Your listing bundle has been purchased successfully.");
            } else if (type === 'listing_and_boost') {
                showAlert("Payment Successful!", "Your listing fee has been paid and your ad boost has been activated.");
            } else {
                showAlert("Payment Successful!", "Your ad boost has been activated. It may take a few moments to appear in search results.");
            }

            // PROACTIVE Fallback: If webhook is slow or failing, verify manually
            if (sessionId) {
                fetch('/api/stripe/verify-session', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ sessionId })
                })
                .then(res => res.json())
                .then(data => {
                    console.log("Session verification result:", data);
                    fetchMyListings(); // Refresh immediately after verification
                })
                .catch(err => console.error("Verification error:", err));
            }

            fetchMyListings();
            // Re-fetch after a short delay to ensure webhook has processed (as absolute fallback)
            setTimeout(() => fetchMyListings(), 2000);
            setTimeout(() => fetchMyListings(), 5000);
            // Clear the param
            router.replace("/my-ads");
        } else if (paymentStatus === "cancelled") {
            const type = searchParams.get("type");
            if (type === 'listing_fee' || type === 'listing_and_boost') {
                showAlert("Notice", "Payment was cancelled. Your ad has been saved as a draft (Pending Payment) and is not yet public.");
            } else {
                showAlert("Notice", "Payment was cancelled. Your ad is still active but was not boosted.");
            }
            router.replace("/my-ads");
        }
    }, [paymentStatus, searchParams, showAlert, router]);

    const refreshListings = fetchMyListings; // Override context refresh logic locally

    const handleBoost = async () => {
        if (!selectedListing) return;
        setLoadingId(selectedListing.id);
        try {
            const res = await fetch('/api/stripe/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    listingId: selectedListing.id,
                    planType: selectedPlan
                })
            });
            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                alert('Error creating checkout session: ' + data.error);
            }
        } catch (err) {
            console.error(err);
            alert('Failed to initiate payment');
        } finally {
            setLoadingId(null);
        }
    };



    if (!user) return null;

    // Filter listings belonging to the current user - ALREADY FILTERED IN FETCH
    // const myListings = listings.filter(l => l.seller?.id === user.id || l.user_id === user.id);

    return (
        <main className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1>My Ads</h1>
                    <p>Manage and track your active listings</p>
                </div>
                <Link href="/post-ad" className={styles.postBtn}>+ Post New Ad</Link>
            </div>

            {isLoadingListings ? (
                <div className="flex justify-center p-12">Loading ads...</div>
            ) : myListings.length > 0 ? (
                <div className={styles.grid}>
                    {myListings.map(listing => (
                        <div key={listing.id} className={styles.cardWrapper}>
                            <div className={styles.imageContainer}>
                                <ListingCard {...listing} href={`/my-ads/${listing.id}`} />
                                {listing.status === 'payment_pending' ? (
                                    <div className={styles.pendingBadge}>
                                        <FaClock className="text-sm" /> Pending Payment
                                    </div>
                                ) : (listing.boost_expires_at && new Date(listing.boost_expires_at) > new Date() && listing.boost_plan && (
                                    <div className={styles.boostBadge}>
                                        <FaArrowTrendUp /> Boost Active
                                    </div>
                                ))}
                            </div>
                            <div className={styles.statsRow}>
                                <div className={styles.statItem}>
                                    <span className={styles.statLabel}>Views</span>
                                    <span className={styles.statValue}>{listing.views_count || 0}</span>
                                </div>
                                <div className={styles.statItem}>
                                    <span className={styles.statLabel}>Impr.</span>
                                    <span className={styles.statValue}>{listing.impressions_count || 0}</span>
                                </div>
                                <div className={styles.statItem}>
                                    <span className={styles.statLabel}>Messages</span>
                                    <span className={styles.statValue}>{listing.chats_count || 0}</span>
                                </div>
                            </div>
                            <div className={styles.actions}>
                                <div className={styles.statusToggle}>
                                    {listing.status !== 'payment_pending' && (
                                        <span className={styles.toggleLabel}>
                                            {listing.status === 'blocked' ? 'Blocked by Admin' :
                                                listing.status === 'active' ? 'Active' : 
                                                listing.status === 'sold' ? 'Sold' : 'Inactive'}
                                        </span>
                                    )}
                                    
                                    {listing.status === 'blocked' ? (
                                        <div className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full font-medium">
                                            Contact Support
                                        </div>
                                    ) : listing.status === 'payment_pending' ? (
                                        <button 
                                            className={styles.premiumPayBtn}
                                            onClick={async () => {
                                                setLoadingId(listing.id);
                                                try {
                                                    const hasWebsite = !!listing.website_url;
                                                    const wFee = siteSettings?.website_fee || 4.95;
                                                    const isProfessionalJob = listing.category_id === 'jobs' && listing.attributes?.job_offered_by === 'professional';
                                                    const pJobFee = 25.00;
                                                    const lFee = listing.listing_fee || 0;
                                                    const bPlan = listing.boost_plan;
                                                    const isBoost = bPlan && bPlan !== 'free' && bPlan !== 'basic_listing';
                                                    const bPrice = isBoost ? (premiumPlans.find(p => p.id === bPlan)?.price || 0) : 0;

                                                    // Calculate purchase type
                                                    let purchaseType = 'listing_fee';
                                                    if (lFee > 0 && bPrice > 0 && hasWebsite) purchaseType = 'listing_boost_website';
                                                    else if (lFee > 0 && bPrice > 0) purchaseType = 'listing_and_boost';
                                                    else if (lFee > 0 && hasWebsite) purchaseType = 'listing_and_website';
                                                    else if (bPrice > 0 && hasWebsite) purchaseType = 'boost_and_website';
                                                    else if (lFee > 0) purchaseType = 'listing_fee';
                                                    else if (bPrice > 0) purchaseType = 'boost';
                                                    else if (hasWebsite) purchaseType = 'website_fee';

                                                    const res = await fetch('/api/stripe/checkout', {
                                                        method: 'POST',
                                                        headers: { 'Content-Type': 'application/json' },
                                                        body: JSON.stringify({
                                                            listingId: listing.id,
                                                            planType: bPlan || 'basic_listing',
                                                            listingFee: lFee > 0 ? lFee : undefined,
                                                            includeWebsite: hasWebsite,
                                                            websiteFee: hasWebsite ? wFee : undefined,
                                                            professionalJobFee: isProfessionalJob ? pJobFee : undefined,
                                                            purchaseType: purchaseType
                                                        })
                                                    });
                                                    const data = await res.json();
                                                    if (data.url) {
                                                        window.location.href = data.url;
                                                    } else {
                                                        showAlert('Error', data.error || 'Failed to create checkout session');
                                                    }
                                                } catch (err) {
                                                    console.error(err);
                                                    showAlert('Error', 'Failed to initiate payment');
                                                } finally {
                                                    setLoadingId(null);
                                                }
                                            }}
                                            disabled={loadingId === listing.id}
                                        >
                                            {loadingId === listing.id ? (
                                                <div className={styles.loader} />
                                            ) : (
                                                <>
                                                    <FaClock className="text-xl" />
                                                    COMPLETE PAYMENT
                                                </>
                                            )}
                                        </button>
                                    ) : (
                                        <button
                                            className={listing.status === 'active' ? styles.toggleOn : styles.toggleOff}
                                            onClick={async () => {
                                                await toggleListingStatus(listing.id, listing.status || 'active');
                                                fetchMyListings();
                                            }}
                                            style={{
                                                width: '40px',
                                                height: '20px',
                                                borderRadius: '10px',
                                                background: listing.status === 'active' ? '#10b981' : '#cbd5e1',
                                                border: 'none',
                                                cursor: 'pointer',
                                                position: 'relative',
                                                padding: '2px',
                                                display: 'flex',
                                                alignItems: 'center'
                                            }}
                                        >
                                            <div style={{
                                                width: '16px',
                                                height: '16px',
                                                borderRadius: '50%',
                                                background: 'white',
                                                marginLeft: listing.status === 'active' ? '20px' : '0',
                                                transition: 'margin 0.2s'
                                            }} />
                                        </button>
                                    )}
                                </div>
                                <button className={styles.moreBtn} onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setListingToAction(listing);
                                    setShowDeleteModal(true);
                                }}>
                                    <HiDotsVertical />
                                </button>
                                {(!(listing.boost_expires_at && new Date(listing.boost_expires_at) > new Date()) || !listing.boost_plan) && listing.status !== 'blocked' && listing.status !== 'payment_pending' && siteSettings?.is_pricing_enabled !== false && (
                                    <button
                                        className={styles.boostBtn}
                                        onClick={() => setSelectedListing(listing)}
                                    >
                                        <FaArrowTrendUp /> Boost
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className={styles.empty}>
                    <div className={styles.emptyIcon}>📦</div>
                    <h2>No active ads yet</h2>
                    <p>You haven't posted any listings yet. Click the button below to get started.</p>
                    <Link href="/post-ad" className={styles.emptyBtn}>Post Your First Ad</Link>
                </div>
            )}

            {selectedListing && (
                <div className={styles.modalOverlay} onClick={() => setSelectedListing(null)}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        <h2>Boost Your Ad</h2>
                        <p>Boost your visibility and reach more people in Canada.</p>

                        <div className={styles.planList}>
                            {premiumPlans.length > 0 ? (
                                premiumPlans.map((plan) => (
                                    <div
                                        key={plan.id}
                                        className={`${styles.planCard} ${selectedPlan === plan.id ? styles.selected : ''}`}
                                        onClick={() => setSelectedPlan(plan.id)}
                                    >
                                        <div className={styles.planInfo}>
                                            <h3 className={styles.planName}>{plan.label}</h3>
                                            <p className={styles.planDesc}>{plan.description || "Boost your ad visibility"}</p>
                                            <span className={styles.planDuration}>{plan.duration_days === -1 ? "Keywords: Unlimited, No Expiry" : `${plan.duration_days} Days Active`}</span>
                                        </div>
                                        <div className={styles.planPriceWrapper}>
                                            <div className={styles.planPrice}>
                                                <span className={styles.planCurrency}>$</span>
                                                {plan.price?.toLocaleString()}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p>Loading premium plans...</p>
                            )}
                        </div>

                        <div className={styles.modalActions}>
                            <button className={styles.cancelBtn} onClick={() => setSelectedListing(null)}>Cancel</button>
                            <button
                                className={styles.checkoutBtn}
                                onClick={handleBoost}
                                disabled={!!loadingId}
                            >
                                {loadingId ? 'Redirecting...' : 'Continue to Payment'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showDeleteModal && listingToAction && (
                <div className={styles.modalOverlay} onClick={() => setShowDeleteModal(false)}>
                    <div className={`${styles.modal} ${styles.deleteModal}`} onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h2 className="mb-1 text-2xl font-bold">Manage Listing</h2>
                                <p className="text-gray-500 text-sm">What would you like to do with "{listingToAction.title}"?</p>
                            </div>
                            <button onClick={() => setShowDeleteModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <IoClose size={24} />
                            </button>
                        </div>

                        <div className={styles.optionList}>
                            <button className={styles.optionBtn} onClick={() => {
                                router.push(`/post-ad?edit=${listingToAction.id}`);
                            }}>
                                <div className={`${styles.optionIcon} ${styles.editIcon}`}>
                                    <FaPen />
                                </div>
                                <div className={styles.optionText}>
                                    <h4>Edit Listing</h4>
                                    <p>Update photos, price, or description of your ad.</p>
                                </div>
                            </button>

                            <button 
                                className={styles.optionBtn} 
                                disabled={listingToAction?.status === 'payment_pending'}
                                style={listingToAction?.status === 'payment_pending' ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                                onClick={async () => {
                                if (listingToAction?.status === 'payment_pending') return;
                                try {
                                    await updateListingStatus(listingToAction.id, 'sold');
                                    fetchMyListings();
                                    setShowDeleteModal(false);
                                    showToast("Listing marked as sold!", "success");
                                } catch (err) {
                                    showAlert("Error", "Failed to update listing status.");
                                }
                            }}>
                                <div className={`${styles.optionIcon} ${styles.soldIcon}`}>
                                    <FaCheck />
                                </div>
                                <div className={styles.optionText}>
                                    <h4>Mark as Sold</h4>
                                    <p>Safe to keep your performance data while hiding it from buyers.</p>
                                    {listingToAction?.status === 'payment_pending' && <p className="text-red-500 text-xs mt-1">Payment pending. Cannot mark as sold.</p>}
                                </div>
                            </button>

                            <button 
                                className={styles.optionBtn} 
                                disabled={listingToAction?.status === 'payment_pending'}
                                style={listingToAction?.status === 'payment_pending' ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                                onClick={async () => {
                                if (listingToAction?.status === 'payment_pending') return;
                                try {
                                    await updateListingStatus(listingToAction.id, 'inactive');
                                    fetchMyListings();
                                    setShowDeleteModal(false);
                                    showToast("Listing paused successfully", "success");
                                } catch (err) {
                                    showAlert("Error", "Failed to pause listing.");
                                }
                            }}>
                                <div className={`${styles.optionIcon} ${styles.pauseIcon}`}>
                                    <FaPause />
                                </div>
                                <div className={styles.optionText}>
                                    <h4>Pause Listing</h4>
                                    <p>Temporarily hide your ad if the item is not currently available.</p>
                                    {listingToAction?.status === 'payment_pending' && <p className="text-red-500 text-xs mt-1">Payment pending. Cannot pause listing.</p>}
                                </div>
                            </button>

                            <button className={styles.optionBtn} onClick={() => {
                                setShowDeleteModal(false);
                                showConfirm(
                                    "Delete Permanently",
                                    "Are you sure? This will permanently delete the ad and all its performance stats. This cannot be undone.",
                                    async () => {
                                        try {
                                            await deleteListing(listingToAction.id);
                                            fetchMyListings();
                                            showToast("Listing deleted permanently", "info");
                                        } catch (err) {
                                            showAlert("Error", "Failed to delete listing.");
                                        }
                                    }
                                );
                            }}>
                                <div className={`${styles.optionIcon} ${styles.deleteIcon}`}>
                                    <FaTrashCan />
                                </div>
                                <div className={styles.optionText}>
                                    <h4 className="text-red-600">Delete Permanently</h4>
                                    <p>Completely remove the ad and all its data from the system.</p>
                                </div>
                            </button>
                        </div>

                        <button className={styles.closeModalBtn} onClick={() => setShowDeleteModal(false)}>
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </main>
    );
}
