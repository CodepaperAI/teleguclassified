"use client";

import ListingCardV2 from "./ListingCardV2";
import styles from "./FeaturedListings.module.css";
import { useAppContext } from "@/context/AppContext";

export default function FeaturedListings() {
    const { listings } = useAppContext();
    const featuredItems = listings.filter(l => l.badge === "FEATURED").slice(0, 4);

    return (
        <section className={styles.section}>
            <div className="container">
                <div className="section-title">
                    <h2>Featured Listings</h2>
                    <a href="/listings" className="view-all">View all →</a>
                </div>
                <div className={styles.grid}>
                    {featuredItems.map((item) => (
                        <ListingCardV2 key={item.id} {...item} />
                    ))}
                </div>
            </div>
        </section>
    );
}
