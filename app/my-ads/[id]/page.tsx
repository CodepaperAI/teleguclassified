"use client";

import { useAppContext } from "@/context/AppContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import styles from "../MyAds.module.css";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { FaArrowTrendUp, FaEye, FaBullhorn, FaMessage, FaArrowLeft, FaEyeSlash, FaTrash } from "react-icons/fa6";

export default function SellerAdDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { user, listings, trackView, premiumPlans, refreshListings, toggleListingStatus, deleteListing, showConfirm, showAlert } = useAppContext();
    const [selectedPlan, setSelectedPlan] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [isBoostModalOpen, setIsBoostModalOpen] = useState(false);

    // Find product from global state
    const product = listings.find(l => l.id === params.id);

    useEffect(() => {
        if (premiumPlans.length > 0 && !selectedPlan) {
            setSelectedPlan(premiumPlans[0].id);
        }
    }, [premiumPlans, selectedPlan]);

    if (!product) return <div className={styles.container}>Loading ad details...</div>;

    // Verify ownership (security check)
    const isOwner = user?.id === product.user_id || product.seller?.id === user?.id;
    if (user && !isOwner) {
        return (
            <div className={styles.container}>
                <div className={styles.empty}>
                    <h2>Access Denied</h2>
                    <p>You do not have permission to view analytics for this ad.</p>
                    <Link href="/my-ads" className={styles.emptyBtn}>Back to My Ads</Link>
                </div>
            </div>
        );
    }

    const handleBoost = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/stripe/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    listingId: product.id,
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
            setLoading(false);
        }
    };

    const handleDeleteListing = async () => {
        showConfirm(
            "Delete Listing",
            "Are you sure you want to delete this listing? This action cannot be undone.",
            async () => {
                try {
                    await deleteListing(product.id);
                    router.push("/my-ads");
                } catch (err) {
                    showAlert("Error", "Failed to delete listing. Please try again.");
                }
            }
        );
    };

    const isBoosted = product.boost_expires_at && new Date(product.boost_expires_at) > new Date();

    return (
        <main className={styles.container}>
            <div className={styles.breadcrumbNav}>
                <Link href="/my-ads" className={styles.backLink}>
                    <FaArrowLeft /> Back to My Ads
                </Link>
            </div>

            <div className={styles.sellerAdDetailHeader}>
                <div className={styles.adHeaderMain}>
                    <img src={product.image} alt={product.title} className={styles.adThumbnail} />
                    <div>
                        <h1>{product.title}</h1>
                        <p className={styles.adMeta}>
                            ID: {product.id} • Posted on {product.time} • {product.category}
                        </p>
                        <div className={styles.adStatusBadge}>
                            Status: <span className={product.status === 'active' ? styles.statusActive : styles.statusInactive}>
                                {product.status === 'active' ? 'Live' : 'Hidden'}
                            </span>
                        </div>
                    </div>
                </div>
                <div className={styles.adHeaderActions}>
                    <Link href={`/product/${product.id}`} className={styles.viewPublicBtn} target="_blank">View Public Page</Link>
                    <Link href={`/post-ad?id=${product.id}`} className={styles.editBtnLarge}>✏️ Edit Ad</Link>
                </div>
            </div>

            <div className={styles.statsGridLarge}>
                <div className={styles.largeStatCard}>
                    <div className={styles.statIconWrapper} style={{ background: '#eff6ff', color: '#3b82f6' }}>
                        <FaEye />
                    </div>
                    <div className={styles.statInfo}>
                        <span className={styles.largeStatValue}>{product.views_count || 0}</span>
                        <span className={styles.largeStatLabel}>Total Views</span>
                    </div>
                </div>
                <div className={styles.largeStatCard}>
                    <div className={styles.statIconWrapper} style={{ background: '#fef2f2', color: '#ef4444' }}>
                        <FaBullhorn />
                    </div>
                    <div className={styles.statInfo}>
                        <span className={styles.largeStatValue}>{product.impressions_count || 0}</span>
                        <span className={styles.largeStatLabel}>Impressions</span>
                    </div>
                </div>
                <div className={styles.largeStatCard}>
                    <div className={styles.statIconWrapper} style={{ background: '#ecfdf5', color: '#10b981' }}>
                        <FaMessage />
                    </div>
                    <div className={styles.statInfo}>
                        <span className={styles.largeStatValue}>{product.chats_count || 0}</span>
                        <span className={styles.largeStatLabel}>Leads / Messages</span>
                    </div>
                </div>
            </div>

            <div className={styles.managementSection}>
                <div className={styles.manageCard}>
                    <h2>Ad Promotion</h2>
                    <p>Reach up to 10x more buyers by boosting your ad to the top of search results.</p>

                    {isBoosted && product.boost_plan ? (
                        <div className={styles.boostActiveBox}>
                            <div className={styles.boostBadgeActive}>
                                <FaArrowTrendUp /> Boost Active
                            </div>
                            <p>Your ad is currently being promoted until <strong>{new Date(product.boost_expires_at!).toLocaleDateString()}</strong></p>
                        </div>
                    ) : (
                        <button className={styles.boostPageBtn} onClick={() => setIsBoostModalOpen(true)}>
                            <FaArrowTrendUp /> Boost This Ad Now
                        </button>
                    )}
                </div>

                <div className={styles.manageCard}>
                    <h2>Ad Control</h2>
                    <p>Temporarily hide your ad if you're Busy or delete it if the item is sold.</p>

                    <div className={styles.controlButtons}>
                        <button
                            className={styles.toggleStatusBtn}
                            onClick={() => toggleListingStatus(product.id, product.status || 'active')}
                        >
                            {product.status === 'active' ? <><FaEyeSlash /> Deactivate Ad</> : <><FaEye /> Reactivate Ad</>}
                        </button>
                        <button className={styles.deleteAdBtn} onClick={handleDeleteListing}>
                            <FaTrash /> Delete Permanently
                        </button>
                    </div>
                </div>
            </div>

            {/* Boost Modal (reused) */}
            {isBoostModalOpen && (
                <div className={styles.modalOverlay} onClick={() => setIsBoostModalOpen(false)}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        <h2>Boost Your Ad</h2>
                        <p>Select a plan to increase your visibility in Canada.</p>

                        <div className={styles.planList}>
                            {premiumPlans.map((plan) => (
                                <div
                                    key={plan.id}
                                    className={`${styles.planCard} ${selectedPlan === plan.id ? styles.selected : ''}`}
                                    onClick={() => setSelectedPlan(plan.id)}
                                >
                                    <div className={styles.planInfo}>
                                        <h3>{plan.label}</h3>
                                        <p>{plan.description || `Active for ${plan.duration_days} days`}</p>
                                    </div>
                                    <div className={styles.planPrice}>${plan.price?.toLocaleString()}</div>
                                </div>
                            ))}
                        </div>

                        <div className={styles.modalActions}>
                            <button className={styles.cancelBtn} onClick={() => setIsBoostModalOpen(false)}>Cancel</button>
                            <button
                                className={styles.checkoutBtn}
                                onClick={handleBoost}
                                disabled={loading}
                            >
                                {loading ? 'Redirecting...' : 'Confirm & Boost'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
