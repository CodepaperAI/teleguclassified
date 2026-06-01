"use client";

import { Listing } from "@/lib/MockData";
import ListingCardV2 from "@/components/ListingCardV2";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import styles from "./ProductDetail.module.css";
import Link from "next/link";
import { useAppContext } from "@/context/AppContext";
import { useParams, useRouter } from "next/navigation";
import ListingsView from "@/components/ListingsView";
import { findCategoryBySlugs } from "@/lib/db/categories";
import { generateProductUrl, slugify } from "@/lib/utils";
import { getListingBySlug } from "@/lib/db/listings";
import { useState, useEffect, useRef } from "react";
import Dialog from "@/components/Dialog";
import VerificationBadge from "@/components/VerificationBadge";
import PhotoLightbox from "@/components/PhotoLightbox";

export default function ProductDetail() {
    const params = useParams();
    const router = useRouter();
    const { listings, categories, isLoadingListings, isLoadingCategories, user, blockFeatures, trackView, refreshListings, favorites, toggleFavorite, isAdmin } = useAppContext();
    const [showPhone, setShowPhone] = useState(false);
    const viewTrackedRef = useRef(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);

    // Dialog State
    const [dialogState, setDialogState] = useState({
        isOpen: false,
        title: "",
        message: "",
        type: 'alert' as 'alert' | 'confirm',
        onConfirm: () => { },
    });

    // Extract Slug from catch-all params
    // productPath should be [category, location, slug]
    const pathSegments = params.productPath as string[];
    const slug = pathSegments ? pathSegments[pathSegments.length - 1] : null;

    const [product, setProduct] = useState<Listing | null>(null);
    const [isFetchingBySlug, setIsFetchingBySlug] = useState(false);
    const [isCategoryPage, setIsCategoryPage] = useState(false);
    const [categoryPath, setCategoryPath] = useState<any>(null);

    // Find product or category from slugs
    useEffect(() => {
        if (!slug || isLoadingListings || isLoadingCategories) return;

        // 1. Try to find if it's a listing (by unique slug)
        const foundListing = listings.find(l => l.slug === slug || l.id === slug);
        if (foundListing) {
            setProduct(foundListing);
            setIsCategoryPage(false);
            return;
        }

        // 2. If 3, 4 or 5 segments and not found in local, try DB for listing
        if (pathSegments.length >= 3 && pathSegments.length <= 5) {
            const fetchBySlug = async () => {
                setIsFetchingBySlug(true);
                try {
                    const data = await getListingBySlug(slug);
                    if (data) {
                        const priceStr = data.price_type === 'amount' ? `$${(data.price || 0).toLocaleString()}` :
                            data.price_type === 'free' ? 'Free' :
                                data.price_type === 'contact' ? 'Please Contact' : 'Swap/Trade';

                        setProduct({
                            ...data,
                            id: data.id,
                            image: data.images?.[0] || "",
                            price: priceStr,
                            price_amount: data.price || 0,
                            category: data.sub_category_label || data.category_id || "Other",
                            time: data.created_at ? new Date(data.created_at).toLocaleDateString() : 'N/A',
                            location: `${data.city || "Unknown"}, ${data.province_code || ""}`,
                            city: data.city || undefined,
                            sub_category_id: data.sub_category_id || undefined,
                            listing_type_id: data.listing_type_id || undefined,
                            seller: {
                                id: data.user_id || undefined,
                                name: data.contact_name || 'User',
                                initials: (data.contact_name || 'U')[0].toUpperCase(),
                                memberSince: data.created_at ? new Date(data.created_at).getFullYear().toString() : '',
                                rating: '',
                                reviews: '',
                                responseTime: '',
                            }
                        } as unknown as Listing);
                        setIsCategoryPage(false);
                        return;
                    }
                } catch (err) {
                    console.error("Error fetching product by slug:", err);
                } finally {
                    setIsFetchingBySlug(false);
                }
            };
            fetchBySlug();
        }

        // 3. Check if it matches a category path
        const catPath = findCategoryBySlugs(categories, pathSegments);
        if (catPath) {
            setCategoryPath(catPath);
            setIsCategoryPage(true);
        }
    }, [slug, listings, categories, isLoadingListings, isLoadingCategories]);

    useEffect(() => {
        if (product && product.id && !viewTrackedRef.current) {
            trackView(product.id);
            viewTrackedRef.current = true;
            if (product.images?.[0]) setSelectedImage(product.images[0]);
            else if (product.image) setSelectedImage(product.image);
        }
    }, [product?.id, trackView]);

    const handleShowPhone = () => {
        if (!product) return;
        if (!user) {
            setDialogState({
                isOpen: true,
                title: "Sign In Required",
                message: "Please sign in to view the seller's phone number.",
                type: 'confirm',
                onConfirm: () => {
                    setDialogState(prev => ({ ...prev, isOpen: false }));
                    router.push(`/login?returnTo=/listings`);
                }
            });
            return;
        }
        setShowPhone(true);
    };

    const handleSendMessage = async (e: React.MouseEvent) => {
        e.preventDefault();
        if (!product) return;

        if (blockFeatures?.chat) {
            setDialogState({
                isOpen: true,
                title: "Account Restricted",
                message: "You are blocked from sending messages.",
                type: 'alert',
                onConfirm: () => setDialogState(prev => ({ ...prev, isOpen: false }))
            });
            return;
        }

        if (!user) {
            setDialogState({
                isOpen: true,
                title: "Sign In Required",
                message: "Please sign in to message the seller.",
                type: 'confirm',
                onConfirm: () => {
                    setDialogState(prev => ({ ...prev, isOpen: false }));
                    router.push(`/login?returnTo=/listings`);
                }
            });
            return;
        }

        try {
            const { getOrCreateChatRoom } = await import("@/lib/db/chat");
            const room = await getOrCreateChatRoom(product.id, user.id, product.user_id!);
            router.push(`/chat?id=${product.id}&room=${room.id}&initialMessage=Hi, is this still available?`);
        } catch (error) {
            console.error("Error starting chat:", error);
        }
    };

    if (isLoadingListings || isLoadingCategories || isFetchingBySlug) {
        return <div className="container" style={{ padding: '50px', textAlign: 'center' }}>Loading...</div>;
    }

    if (isCategoryPage && categoryPath) {
        const title = categoryPath.subItem || categoryPath.subCategory?.label || categoryPath.category?.label;
        const parentTitle = categoryPath.subItem ? categoryPath.subCategory?.label : (categoryPath.subCategory ? categoryPath.category?.label : null);
        
        return (
            <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
                <Navbar />
                
                <div className="container" style={{ flex: 1, paddingTop: '20px' }}>
                    <nav className={styles.breadcrumbs} style={{ marginBottom: '20px' }}>
                        <Link href="/">Home</Link>
                        <span>/</span>
                        <Link href="/">Classifieds</Link>
                        {categoryPath.category && (
                            <>
                                <span>/</span>
                                <Link href={`/${slugify(categoryPath.category.label)}`}>{categoryPath.category.label}</Link>
                            </>
                        )}
                        {categoryPath.subCategory && (
                            <>
                                <span>/</span>
                                <Link href={`/${slugify(categoryPath.category.label)}/${slugify(categoryPath.subCategory.label)}`}>{categoryPath.subCategory.label}</Link>
                            </>
                        )}
                        {categoryPath.subItem && (
                            <>
                                <span>/</span>
                                <span className={styles.current}>{categoryPath.subItem}</span>
                            </>
                        )}
                    </nav>

                    <ListingsView 
                        categoryPath={categoryPath} 
                        basePath={`/${pathSegments.join('/')}`}
                    />
                </div>
                <Footer />
            </main>
        );
    }

    if (!product) {
        // Double check loading states
        if (isLoadingListings || isLoadingCategories || isFetchingBySlug) {
            return <div className="container" style={{ padding: '50px', textAlign: 'center' }}>Loading...</div>;
        }

        // If this isn't a product path (e.g. a random 1-segment URL that doesn't exist), 
        // we might want to return null and let Next.js handle it, but for a catch-all
        // we should show a 404 or redirect.
        return (
            <div className="container" style={{ padding: '100px 20px', textAlign: 'center' }}>
                <h1 style={{ fontSize: '3rem', marginBottom: '20px' }}>404</h1>
                <h2>Page Not Found</h2>
                <p style={{ color: '#666', margin: '20px 0' }}>The page you are looking for doesn't exist or has been moved.</p>
                <Link href="/" className="btn-primary" style={{ padding: '12px 24px', borderRadius: '8px', background: 'var(--primary)', color: 'white', textDecoration: 'none', display: 'inline-block' }}>
                    Back to Home
                </Link>
            </div>
        );
    }

    return (
        <div className={styles.page}>
            <div className="container">
                {/* Breadcrumbs */}
                <div className={styles.breadcrumbs}>
                    <Link href="/">Home</Link>
                    <span>›</span>
                    <Link href="/listings">Classifieds</Link>
                    {product.category && (
                        <>
                            <span>›</span>
                            <Link href={`/listings?category=${product.category_id}`}>{product.category}</Link>
                        </>
                    )}
                    {product.sub_category_label && (
                        <>
                            <span>›</span>
                            <Link href={`/listings?q=${encodeURIComponent(product.sub_category_label)}`}>{product.sub_category_label}</Link>
                        </>
                    )}
                    {product.sub_item_label && (
                        <>
                            <span>›</span>
                            <Link href={`/listings?q=${encodeURIComponent(product.sub_item_label)}`}>{product.sub_item_label}</Link>
                        </>
                    )}
                </div>

                <div className={styles.layout}>
                    <div className={styles.mainContent}>
                        <div className={styles.gallery}>
                            <div className={styles.mainImageContainer} onClick={() => setIsLightboxOpen(true)}>
                                 <img 
                                    src={selectedImage || product.image} 
                                    alt={product.title} 
                                    className={styles.mainImage} 
                                />
                            </div>
                            {product.images && product.images.length > 1 && (
                                <div className={styles.thumbnails}>
                                    {product.images.map((img, i) => (
                                        <img 
                                           key={i} 
                                           src={img} 
                                           alt="" 
                                           className={`${styles.thumbnail} ${selectedImage === img ? styles.activeThumb : ""}`} 
                                           onClick={() => setSelectedImage(img)}
                                       />
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className={styles.detailsCard}>
                            <h1 className={styles.title}>{product.title}</h1>
                            <div className={styles.price}>{product.price}</div>
                            <div className={styles.meta}>
                                <span>📍 {product.location}</span>
                                <span>📅 {product.time}</span>
                                <span>👁️ {product.views_count} views</span>
                            </div>
                            <div className={styles.description}>
                                <h3>Description</h3>
                                <div style={{ whiteSpace: 'pre-wrap' }}>{product.description}</div>
                            </div>
                        </div>
                    </div>

                    <div className={styles.sidebar}>
                        <div className={styles.card}>
                            <h3>Seller Information</h3>
                            <div className={styles.sellerInfo}>
                                <div className={styles.avatar}>
                                    {product.seller?.initials}
                                    {product.seller?.isVerified && (
                                        <div className={styles.badgeWrapper}>
                                            <VerificationBadge size={16} />
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <div className={styles.sellerName}>{product.seller?.name}</div>
                                    <div className={styles.memberSince}>Member since {product.seller?.memberSince}</div>
                                </div>
                            </div>
                            <button className={styles.btnPrimary} onClick={handleSendMessage}>Message Seller</button>
                            <button className={styles.btnSecondary} onClick={handleShowPhone}>
                                {showPhone ? product.phone : "Show Phone Number"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {isLightboxOpen && (
                <PhotoLightbox 
                    images={product.images || [product.image]} 
                    initialIndex={(product.images || [product.image]).indexOf(selectedImage || product.image)} 
                    isOpen={isLightboxOpen}
                    onClose={() => setIsLightboxOpen(false)} 
                />
            )}

            <Dialog 
                isOpen={dialogState.isOpen}
                title={dialogState.title}
                message={dialogState.message}
                type={dialogState.type}
                onConfirm={dialogState.onConfirm}
                onClose={() => setDialogState(prev => ({ ...prev, isOpen: false }))}
            />
        </div>
    );
}
