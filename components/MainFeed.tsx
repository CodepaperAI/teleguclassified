"use client";

import styles from "./MainFeed.module.css";
import ListingCardV2 from "./ListingCardV2";
import FilterSidebar from "./FilterSidebar";
import { useAppContext } from "@/context/AppContext";
import { useEffect, useRef, useState, useMemo } from "react";

const ITEMS_PER_PAGE = 12;

// Skeleton card shown while listings are loading
function SkeletonCard() {
    return (
        <div className={styles.skeletonCard}>
            <div className={styles.skeletonImage} />
            <div className={styles.skeletonBody}>
                <div className={styles.skeletonLine} style={{ width: '75%' }} />
                <div className={styles.skeletonLine} style={{ width: '45%' }} />
                <div className={styles.skeletonLine} style={{ width: '55%' }} />
            </div>
        </div>
    );
}

export default function MainFeed() {
    const { listings, isLoadingListings, trackImpression } = useAppContext();
    const [sortBy, setSortBy] = useState<string>('newest');
    const [province, setProvince] = useState<string>('');
    const [location, setLocation] = useState<string>('');
    const [currentPage, setCurrentPage] = useState(1);

    const filteredListings = useMemo(() => {
        let result = [...listings];

        // Province filtering
        if (province) {
            result = result.filter(l => l.province_code === province);
        }

        // City filtering
        if (location) {
            result = result.filter(l => l.location.toLowerCase().includes(location.toLowerCase()));
        }

        // Sorting
        result.sort((a, b) => {
            if (sortBy === 'price-asc') return a.price_amount - b.price_amount;
            if (sortBy === 'price-desc') return b.price_amount - a.price_amount;
            return 0;
        });

        return result;
    }, [listings, sortBy, province, location]);

    // Reset pagination when filters or sort change
    useEffect(() => {
        setCurrentPage(1);
    }, [sortBy, province, location]);

    const totalPages = Math.ceil(filteredListings.length / ITEMS_PER_PAGE);
    const displayListings = filteredListings.slice(0, currentPage * ITEMS_PER_PAGE);
    const trackedRef = useRef<Set<string>>(new Set());

    useEffect(() => {
        if (displayListings.length > 0) {
            const newIds = displayListings
                .map(l => l.id)
                .filter(id => !trackedRef.current.has(id));

            if (newIds.length > 0) {
                trackImpression(newIds);
                newIds.forEach(id => trackedRef.current.add(id));
            }
        }
    }, [displayListings, trackImpression]);

    return (
        <section className={styles.section}>
            <div className="container">
                <div className={styles.contentHeader}>
                    <h2>Fresh Finds</h2>
                    <div className={styles.topActions}>
                        <FilterSidebar
                            currentQuery=""
                            sortBy={sortBy}
                            onSortChange={setSortBy}
                            province={province}
                            onProvinceChange={(p) => {
                                setProvince(p);
                                setLocation('');
                            }}
                            location={location}
                            onLocationChange={setLocation}
                        />
                    </div>
                </div>

                {/* Loading state — animated skeleton cards */}
                {isLoadingListings && (
                    <>
                        <div className={styles.progressBar}>
                            <div className={styles.progressBarFill} />
                        </div>
                        <div className={styles.grid}>
                            {Array.from({ length: 8 }).map((_, i) => (
                                <SkeletonCard key={i} />
                            ))}
                        </div>
                    </>
                )}

                {/* Loaded — has listings */}
                {!isLoadingListings && displayListings.length > 0 && (
                    <>
                        <div className={styles.grid}>
                            {displayListings.map((item) => (
                                <ListingCardV2 key={item.id} {...item} />
                            ))}
                        </div>

                        {currentPage < totalPages && (
                            <div className={styles.loadMoreWrapper}>
                                <button
                                    className={styles.loadMoreBtn}
                                    onClick={() => setCurrentPage(prev => prev + 1)}
                                >
                                    Load More Listings
                                </button>
                            </div>
                        )}
                    </>
                )}

                {/* Loaded — truly empty */}
                {!isLoadingListings && displayListings.length === 0 && (
                    <div className={styles.noResults}>
                        <div className={styles.noResultsIcon}>🔍</div>
                        <h3>No listings found</h3>
                    </div>
                )}
            </div>
        </section>
    );
}
