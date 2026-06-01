"use client";

import React from "react";
import FilterSidebar from "@/components/FilterSidebar";
import ListingCardV2 from "@/components/ListingCardV2";
import Pagination from "@/components/Pagination";
import styles from "@/app/category.module.css";
import Link from "next/link";
import { useAppContext } from "@/context/AppContext";
import { useSearchParams, useRouter } from "next/navigation";
import { CategoryDto, SubCategoryDto } from "@/lib/db/categories";
import Fuse from "fuse.js";

interface ListingsViewProps {
    initialQuery?: string;
    categoryPath?: {
        category?: CategoryDto;
        subCategory?: SubCategoryDto;
        subItem?: string;
    };
    basePath: string;
}

export default function ListingsView({ initialQuery = "", categoryPath, basePath }: ListingsViewProps) {
    const { listings, isLoadingCategories } = useAppContext();
    const [currentPage, setCurrentPage] = React.useState(1);
    const [sortBy, setSortBy] = React.useState('newest');
    const itemsPerPage = 12;
    const searchParams = useSearchParams();
    const query = initialQuery || searchParams.get("q") || "";
    const [selectedLocation, setSelectedLocation] = React.useState(searchParams.get("location") || "");
    const [selectedProvince, setSelectedProvince] = React.useState(searchParams.get("province") || "");
    const [minPrice, setMinPrice] = React.useState("");
    const [maxPrice, setMaxPrice] = React.useState("");
    const router = useRouter();

    // Initialize Fuse for text search
    const fuse = React.useMemo(() => new Fuse(listings, {
        keys: ['title', 'description', 'category', 'location', 'sub_category_label', 'address', 'tags'],
        threshold: 0.3,
        ignoreLocation: true
    }), [listings]);

    const filteredListings = React.useMemo(() => {
        let results = listings;
        
        // Apply text search if query exists and no category path matches it precisely
        if (query && !categoryPath) {
            const fuseResults = fuse.search(query);
            results = fuseResults.map(r => r.item);
        }

        const filtered = results.filter(l => {
            // Category/Subcategory/Item matching
            let matchesCategory = true;
            if (categoryPath) {
                // 1. Match Main Category
                if (categoryPath.category && l.category_id !== categoryPath.category.id) {
                    matchesCategory = false;
                }
                
                // 2. Match Sub-Category (ID preferred, label fallback)
                if (categoryPath.subCategory) {
                    const isIdMatch = l.sub_category_id === categoryPath.subCategory.id;
                    const isLabelMatch = l.sub_category_label?.toLowerCase() === categoryPath.subCategory.label.toLowerCase();
                    if (!isIdMatch && !isLabelMatch) {
                        matchesCategory = false;
                    }
                }
                
                // 3. Match Sub-Item (label-based since it's a string array usually)
                if (categoryPath.subItem && l.sub_item_label?.toLowerCase() !== categoryPath.subItem.toLowerCase()) {
                    matchesCategory = false;
                }
            }

            const matchesProvince = !selectedProvince ||
                (l.province_code && l.province_code.toLowerCase() === selectedProvince.toLowerCase());

            const matchesCity = !selectedLocation ||
                (l.location && l.location.toLowerCase() === selectedLocation.toLowerCase());

            const price = l.price_amount || 0;
            const matchesMinPrice = !minPrice || price >= parseFloat(minPrice);
            const matchesMaxPrice = !maxPrice || price <= parseFloat(maxPrice);

            return matchesCategory && matchesProvince && matchesCity && matchesMinPrice && matchesMaxPrice;
        });

        // Sorting
        return [...filtered].sort((a, b) => {
            if (sortBy === 'price-asc') return a.price_amount - b.price_amount;
            if (sortBy === 'price-desc') return b.price_amount - a.price_amount;
            return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
        });
    }, [listings, query, selectedProvince, selectedLocation, minPrice, maxPrice, categoryPath, fuse, sortBy]);

    // Reset pagination
    React.useEffect(() => {
        setCurrentPage(1);
    }, [sortBy, query, selectedProvince, selectedLocation, minPrice, maxPrice]);

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
            router.push(`${window.location.pathname}?${params.toString()}`, { scroll: false });
        }
    }, [selectedProvince, selectedLocation, searchParams, router]);

    const displayListings = filteredListings.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    return (
        <div className={styles.layout}>
            <div className={styles.infoBar}>
                <div className={styles.resultsCount}>
                    Showing <strong>{displayListings.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : '0'}-{Math.min(currentPage * itemsPerPage, filteredListings.length)}</strong> of <strong>{filteredListings.length}</strong> results
                    {query && !categoryPath && <span> for "{query}"</span>}
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
    );
}
