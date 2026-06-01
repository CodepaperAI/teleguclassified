"use client";

import { useAppContext } from "@/context/AppContext";
import ListingCardV2 from "@/components/ListingCardV2";
import styles from "./Favorites.module.css";
import Link from "next/link";
import { useMemo } from "react";

export default function FavoritesPage() {
    const { listings, favorites } = useAppContext();

    const favoriteListings = useMemo(() => {
        return listings.filter(listing => favorites.includes(listing.id));
    }, [listings, favorites]);

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1>My Favorites</h1>
                <p>{favoriteListings.length} {favoriteListings.length === 1 ? 'item' : 'items'} saved</p>
            </div>

            {favoriteListings.length > 0 ? (
                <div className={styles.grid}>
                    {favoriteListings.map(listing => (
                        <ListingCardV2 key={listing.id} {...listing} />
                    ))}
                </div>
            ) : (
                <div className={styles.emptyState}>
                    <span className={styles.emptyIcon}>❤️</span>
                    <h2>No favorites yet</h2>
                    <p>
                        Items you favorite will appear here. Browse our listings to find something you like!
                    </p>
                    <Link href="/listings" className={styles.browseBtn}>
                        Browse Listings
                    </Link>
                </div>
            )}
        </div>
    );
}
