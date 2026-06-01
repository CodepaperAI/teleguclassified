"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";
import styles from "./ListingsFilter.module.css";
import { ChangeEvent, useState } from "react";
import { FaSearch, FaFilter } from "react-icons/fa";

interface Category {
    id: string;
    label: string;
}

interface Props {
    categories: Category[];
    onFilterChange?: (key: string, value: string) => void;
}

export default function ListingsFilter({ categories, onFilterChange }: Props) {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const router = useRouter();
    const [showFilters, setShowFilters] = useState(
        searchParams.has("category") || searchParams.has("status") || searchParams.has("price_type")
    );

    // Default to 'this_month' if not present
    const currentDateFilter = searchParams.get("date_filter") || "this_month";

    const handleSearch = useDebouncedCallback((term: string) => {
        if (onFilterChange) {
            onFilterChange("q", term);
        } else {
            const params = new URLSearchParams(searchParams);
            if (term) {
                params.set("q", term);
            } else {
                params.delete("q");
            }
            params.delete("page");
            router.replace(`${pathname}?${params.toString()}`);
        }
    }, 300);

    const handleFilterChange = (key: string, value: string) => {
        // Date filters always use URL params
        if (['date_filter', 'start_date', 'end_date'].includes(key)) {
            const params = new URLSearchParams(searchParams);
            if (value) {
                params.set(key, value);
            } else {
                params.delete(key);
            }

            // Handle custom date range cleanup
            if (key === 'date_filter' && value !== 'custom') {
                params.delete('start_date');
                params.delete('end_date');
            }

            params.delete("page");
            router.replace(`${pathname}?${params.toString()}`);
            return;
        }

        // Other filters use client state if available
        if (onFilterChange) {
            onFilterChange(key, value);
        } else {
            const params = new URLSearchParams(searchParams);
            if (value) {
                params.set(key, value);
            } else {
                params.delete(key);
            }
            params.delete("page");
            router.replace(`${pathname}?${params.toString()}`);
        }
    };

    const clearFilters = () => {
        if (onFilterChange) {
            onFilterChange("q", "");
            onFilterChange("category", "");
            onFilterChange("status", "");
            onFilterChange("price_type", "");
            // Note: We don't clear date filters here as they are server-side
        } else {
            router.replace(pathname);
        }
        setShowFilters(false);
    };

    return (
        <div className={styles.container}>
            <div className={styles.topRow}>
                <div className={styles.searchGroup}>
                    <FaSearch className={styles.searchIcon} />
                    <input
                        type="text"
                        placeholder="Search listings..."
                        className={styles.input}
                        defaultValue={searchParams.get("q")?.toString()}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => handleSearch(e.target.value)}
                    />
                </div>

                <select
                    className={styles.select}
                    value={currentDateFilter}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) => handleFilterChange("date_filter", e.target.value)}
                >
                    <option value="this_month">This Month</option>
                    <option value="last_month">Last Month</option>
                    <option value="this_year">This Year</option>
                    <option value="all_time">All Time</option>
                    <option value="custom">Custom Range</option>
                </select>

                {currentDateFilter === 'custom' && (
                    <div className={styles.dateGroup}>
                        <input
                            type="date"
                            className={styles.dateInput}
                            defaultValue={searchParams.get("start_date")?.toString()}
                            onChange={(e) => handleFilterChange("start_date", e.target.value)}
                        />
                        <input
                            type="date"
                            className={styles.dateInput}
                            defaultValue={searchParams.get("end_date")?.toString()}
                            onChange={(e) => handleFilterChange("end_date", e.target.value)}
                        />
                    </div>
                )}

                <button
                    className={`${styles.filterToggleBtn} ${showFilters ? styles.active : ''}`}
                    onClick={() => setShowFilters(!showFilters)}
                >
                    <FaFilter /> Filters
                </button>
            </div>

            {showFilters && (
                <div className={styles.collapsibleFilters}>
                    <select
                        className={styles.select}
                        defaultValue={searchParams.get("category")?.toString() || ""}
                        onChange={(e: ChangeEvent<HTMLSelectElement>) => handleFilterChange("category", e.target.value)}
                    >
                        <option value="">All Categories</option>
                        {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                                {cat.label}
                            </option>
                        ))}
                    </select>

                    <select
                        className={styles.select}
                        defaultValue={searchParams.get("status")?.toString() || ""}
                        onChange={(e: ChangeEvent<HTMLSelectElement>) => handleFilterChange("status", e.target.value)}
                    >
                        <option value="">All Statuses</option>
                        <option value="active">Active</option>
                        <option value="blocked">Blocked</option>
                        <option value="sold">Sold</option>
                        <option value="expired">Expired</option>
                        <option value="pending">Pending</option>
                    </select>

                    <select
                        className={styles.select}
                        defaultValue={searchParams.get("price_type")?.toString() || ""}
                        onChange={(e: ChangeEvent<HTMLSelectElement>) => handleFilterChange("price_type", e.target.value)}
                    >
                        <option value="">All Types</option>
                        <option value="amount">Paid</option>
                        <option value="free">Free</option>
                        <option value="contact">Contact</option>
                    </select>

                    {(searchParams.toString().length > 0) && (
                        <button
                            className={styles.clearButton}
                            onClick={clearFilters}
                        >
                            Clear Filters
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
