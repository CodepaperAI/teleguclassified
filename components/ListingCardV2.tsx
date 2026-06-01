"use client";

import Link from "next/link";
import styles from "./ListingCardV2.module.css";
import { useAppContext } from "@/context/AppContext";
import VerificationBadge from "@/components/VerificationBadge";
import { generateProductUrl } from "@/lib/utils";

interface ListingV2Props {
    id: string;
    image: string;
    price: string;
    title: string;
    description?: string | null;
    location: string;
    time: string;
    badge?: "BOOSTED" | "FEATURED" | "URGENT";
    actionType?: "Contact Seller" | "Apply Now" | "View Details";
    // Allow additional fields from Listing objects
    [key: string]: any;
}

export default function ListingCardV2(props: ListingV2Props) {
    const {
        id, image, price, title, description, location, time, badge, actionType = "Contact Seller", seller, category_id
    } = props;
    const { favorites, toggleFavorite } = useAppContext();
    const isFavorited = favorites.includes(id);

    const shouldHidePrice = category_id === 'services' && (
        !price || 
        price === '$0' || 
        price === '$0.00' || 
        price === '$null' || 
        price === '$undefined' || 
        price === '$'
    );

    return (
        <Link href={generateProductUrl({ id, title, category_id, sub_category_label: props.sub_category_label, sub_item_label: props.sub_item_label, city: props.city, slug: props.slug })} className={styles.card}>
            <div className={styles.imageWrapper}>
                <img src={image || undefined} alt={title} className={styles.image} />
                {badge && (
                    <span className={`${styles.badge} ${styles[badge.toLowerCase()]}`}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                        {badge}
                    </span>
                )}
                <button
                    className={`${styles.favoriteBtn} ${isFavorited ? styles.favorited : ""}`}
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleFavorite(id);
                    }}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill={isFavorited ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                </button>
            </div>
            <div className={styles.content}>
                <div className={styles.topRow}>
                    {!shouldHidePrice && <span className={styles.price}>{price}</span>}
                    <span className={styles.time}>{time}</span>
                </div>
                <h3 className={styles.title}>{title}</h3>
                <p className={styles.description}>{description}</p>
                <div className={styles.footer}>
                    <div className={styles.location}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                        <span>{location}</span>
                    </div>
                    <div className={styles.actionBtn}>
                        {seller?.name || actionType}
                        {seller?.isVerified && <VerificationBadge size={16} />}
                    </div>
                </div>
            </div>
        </Link>
    );
}
