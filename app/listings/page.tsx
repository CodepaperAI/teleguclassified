"use client";

import React, { Suspense } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ListingSearch from "@/components/ListingSearch";
import FilterSidebar from "@/components/FilterSidebar";
import ListingCardV2 from "@/components/ListingCardV2";
import Pagination from "@/components/Pagination";
import styles from "../category.module.css";
import Link from "next/link";
import { useAppContext } from "@/context/AppContext";
import { useSearchParams, useRouter } from "next/navigation";
import { findCategoryPath } from "@/lib/db/categories";
import Fuse from "fuse.js";

function ListingsContent() {
    const { listings, categories, isLoadingCategories } = useAppContext();
    const [currentPage, setCurrentPage] = React.useState(1);
    const [sortBy, setSortBy] = React.useState('newest');
    const itemsPerPage = 12;
    const searchParams = useSearchParams();
    const query = searchParams.get("q") || "";
    const categoryParam = searchParams.get("category") || "";
    const [selectedLocation, setSelectedLocation] = React.useState(searchParams.get("location") || "");
    const [selectedProvince, setSelectedProvince] = React.useState(searchParams.get("province") || "");
    const [minPrice, setMinPrice] = React.useState("");
    const [maxPrice, setMaxPrice] = React.useState("");
    const router = useRouter();

    const path = React.useMemo(() =>
        findCategoryPath(categories, query || categoryParam),
        [categories, query, categoryParam]);

    // Initialize Fuse
    const fuse = React.useMemo(() => new Fuse(listings, {
        keys: ['title', 'description', 'category', 'location', 'sub_category_label', 'address', 'tags'],
        threshold: 0.3,
        ignoreLocation: true
    }), [listings]);

    const filteredListings = React.useMemo(() => {
        let results = listings;
        if (query && !path) {
            const fuseResults = fuse.search(query);
            results = fuseResults.map(r => r.item);
        }
        const filtered = results.filter(l => {
            const matchesCategoryPath = path ? (
                (path.category && l.category_id === path.category.id) ||
                (path.subCategory && l.category.toLowerCase() === path.subCategory.label.toLowerCase()) ||
                (path.subItem && l.category.toLowerCase() === path.subItem.toLowerCase())
            ) : false;
            const matchesCategory = matchesCategoryPath || (!categoryParam ||
                l.category_id === categoryParam ||
                l.category.toLowerCase().includes(categoryParam.toLowerCase())
            );

            const matchesProvince = !selectedProvince ||
                (l.province_code && l.province_code.toLowerCase() === selectedProvince.toLowerCase());

            const matchesCity = !selectedLocation ||
                (l.location && l.location.toLowerCase() === selectedLocation.toLowerCase());

            const price = l.price_amount || 0;
            const matchesMinPrice = !minPrice || price >= parseFloat(minPrice);
            const matchesMaxPrice = !maxPrice || price <= parseFloat(maxPrice);

            return matchesCategory && matchesProvince && matchesCity && matchesMinPrice && matchesMaxPrice;
        });

        // Sorting logic
        return [...filtered].sort((a, b) => {
            if (sortBy === 'price-asc') return a.price_amount - b.price_amount;
            if (sortBy === 'price-desc') return b.price_amount - a.price_amount;
            return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
        });
    }, [listings, query, categoryParam, selectedProvince, selectedLocation, minPrice, maxPrice, path, fuse, sortBy]);

    // Reset pagination when sort changes
    React.useEffect(() => {
        setCurrentPage(1);
    }, [sortBy, query, categoryParam, selectedProvince, selectedLocation, minPrice, maxPrice]);

    // Sync state with URL params
    React.useEffect(() => {
        const params = new URLSearchParams(searchParams.toString());

        let changed = false;

        if (selectedProvince) {
            if (params.get("province") !== selectedProvince) {
                params.set("province", selectedProvince);
                changed = true;
            }
        } else if (params.has("province")) {
            params.delete("province");
            changed = true;
        }

        if (selectedLocation) {
            if (params.get("location") !== selectedLocation) {
                params.set("location", selectedLocation);
                changed = true;
            }
        } else if (params.has("location")) {
            params.delete("location");
            changed = true;
        }

        if (changed) {
            const newUrl = `${window.location.pathname}?${params.toString()}`;
            router.push(newUrl, { scroll: false });
        }
    }, [selectedProvince, selectedLocation, searchParams, router]);

    const totalPages = Math.ceil(filteredListings.length / itemsPerPage);
    const displayListings = filteredListings.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    return (
        <main className={styles.container}>
            {isLoadingCategories && (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
                    <div className="loader">Loading...</div>
                </div>
            )}
            <nav className={styles.breadcrumbs}>
                <Link href="/">Home</Link>
                <span>/</span>
                <Link href="/">Classifieds</Link>
                {path?.category && (
                    <>
                        <span>/</span>
                        <Link href={`/listings?q=${encodeURIComponent(path.category.label)}`}>{path.category.label}</Link>
                    </>
                )}
                {path?.subCategory && (
                    <>
                        <span>/</span>
                        <Link href={`/listings?q=${encodeURIComponent(path.subCategory.label)}`}>{path.subCategory.label}</Link>
                    </>
                )}
                {path?.subItem && (
                    <>
                        <span>/</span>
                        <span className={styles.current}>{path.subItem}</span>
                    </>
                )}
                {!path?.subItem && path?.category && (
                    <>
                        <span>/</span>
                        <span className={styles.current}>{path.subCategory?.label || path.category.label}</span>
                    </>
                )}
                {query && !path && (
                    <>
                        <span>/</span>
                        <span className={styles.current}>Search: {query}</span>
                    </>
                )}
            </nav>


            <div className={styles.layout}>
                <div className={styles.infoBar}>
                    <div className={styles.resultsCount}>
                        Showing <strong>{displayListings.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : '0'}-{Math.min(currentPage * itemsPerPage, filteredListings.length)}</strong> of <strong>{filteredListings.length}</strong> results
                        {query && <span> for "{query}"</span>}
                    </div>
                    <div className={styles.controls}>
                        <FilterSidebar
                            currentQuery={query}
                            sortBy={sortBy}
                            onSortChange={setSortBy}
                            province={selectedProvince}
                            onProvinceChange={setSelectedProvince}
                            location={selectedLocation}
                            onLocationChange={setSelectedLocation}
                            minPrice={minPrice}
                            onMinPriceChange={setMinPrice}
                            maxPrice={maxPrice}
                            onMaxPriceChange={setMaxPrice}
                        />
                    </div>
                </div>

                <div className={styles.grid}>
                    {displayListings.map((item) => (
                        <ListingCardV2 key={item.id} {...item} />
                    ))}
                    {!isLoadingCategories && filteredListings.length === 0 && (
                        <div className={styles.noResults}>
                            <h3>No listings found</h3>
                            <p>Try adjusting your search or filters.</p>
                            <Link href="/" className="btn-primary" style={{ marginTop: '20px', display: 'inline-block' }}>
                                Back to Home
                            </Link>
                        </div>
                    )}
                </div>

                <Pagination
                    totalItems={filteredListings.length}
                    itemsPerPage={itemsPerPage}
                    currentPage={currentPage}
                    onPageChange={setCurrentPage}
                />
            </div>
        </main>
    );
}

export default function ListingsPage() {
    return (
        <Suspense fallback={
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
                <div className="loader">Loading results...</div>
            </div>
        }>
            <ListingsContent />
        </Suspense>
    );
}
