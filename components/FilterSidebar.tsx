"use client";

import { useState, useEffect } from "react";
import styles from "./FilterSidebar.module.css";
import { findCategoryPath } from "@/lib/db/categories";
import { useAppContext } from "@/context/AppContext";
import Link from "next/link";
import { getStates, getActiveCitiesByStateCode, LocationDto } from "@/lib/db/locations";

import { slugify } from "@/lib/utils";

interface FilterSidebarProps {
    currentQuery?: string;
    sortBy?: string;
    onSortChange?: (value: string) => void;
    location?: string;
    onLocationChange?: (value: string) => void;
    province?: string;
    onProvinceChange?: (value: string) => void;
    minPrice?: string;
    onMinPriceChange?: (value: string) => void;
    maxPrice?: string;
    onMaxPriceChange?: (value: string) => void;
}

export default function FilterSidebar({
    currentQuery = "",
    sortBy = "newest",
    onSortChange,
    location = "",
    onLocationChange,
    province = "",
    onProvinceChange,
    minPrice = "",
    onMinPriceChange,
    maxPrice = "",
    onMaxPriceChange
}: FilterSidebarProps) {
    const { categories } = useAppContext();
    const [isOpen, setIsOpen] = useState(false);
    const [expandedGroups, setExpandedGroups] = useState<string[]>(["sort", "category", "location"]);

    // Location states
    const [states, setStates] = useState<LocationDto[]>([]);
    const [cities, setCities] = useState<LocationDto[]>([]);

    useEffect(() => {
        getStates().then(setStates);
    }, []);

    useEffect(() => {
        if (province) {
            getActiveCitiesByStateCode(province).then(setCities);
        } else {
            setCities([]);
        }
    }, [province]);
    const path = findCategoryPath(categories, currentQuery);

    const toggleGroup = (group: string) => {
        setExpandedGroups(prev =>
            prev.includes(group) ? prev.filter(g => g !== group) : [...prev, group]
        );
    };

    const isExpanded = (group: string) => expandedGroups.includes(group);

    const renderCategoryTree = () => {
        if (!path?.category) {
            // Root view: Show all top-level categories
            return (
                <div className={styles.categoryNav}>
                    <Link href="/" className={`${styles.navItem} ${styles.level0} ${!currentQuery ? styles.activeLink : ""}`}>
                        All Categories
                    </Link>
                    {categories.map(cat => (
                        <Link
                            key={cat.id}
                            href={`/${slugify(cat.label)}`}
                            className={`${styles.navItem} ${styles.level1} ${currentQuery.toLowerCase() === cat.label.toLowerCase() ? styles.activeLink : ""}`}
                        >
                            {cat.label}
                        </Link>
                    ))}
                </div>
            );
        }

        // Deep view: Show hierarchy
        return (
            <div className={styles.categoryNav}>
                <Link href="/" className={`${styles.navItem} ${styles.level0}`}>
                    All Categories
                </Link>

                {/* Category Level */}
                <Link
                    href={`/${slugify(path.category.label)}`}
                    className={`${styles.navItem} ${styles.level1} ${!path.subCategory ? styles.activeLink : ""}`}
                >
                    {path.category.label}
                </Link>

                {/* SubCategory Level */}
                {path.subCategory && (
                    <Link
                        href={`/${slugify(path.category.label)}/${slugify(path.subCategory.label)}`}
                        className={`${styles.navItem} ${styles.level2} ${!path.subItem ? styles.activeLink : ""}`}
                    >
                        {path.subCategory.label}
                    </Link>
                )}

                {/* SubItems or Sibling SubItems */}
                {path.subCategory && (
                    <div className={styles.subItemsList}>
                        {path.subCategory.subItems?.map(item => (
                            <Link
                                key={item}
                                href={`/${slugify(path.category.label)}/${slugify(path.subCategory!.label)}/${slugify(item)}`}
                                className={`${styles.navItem} ${styles.level3} ${path.subItem?.toLowerCase() === item.toLowerCase() ? styles.activeLink : ""}`}
                            >
                                {item}
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className={styles.filterContainer}>
            <button
                className={`${styles.filterToggle} ${isOpen ? styles.active : ""}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="21" x2="4" y2="14"></line><line x1="4" y1="10" x2="4" y2="3"></line><line x1="12" y1="21" x2="12" y2="12"></line><line x1="12" y1="8" x2="12" y2="3"></line><line x1="20" y1="21" x2="20" y2="16"></line><line x1="20" y1="12" x2="20" y2="3"></line><line x1="1" y1="14" x2="7" y2="14"></line><line x1="9" y1="8" x2="15" y2="8"></line><line x1="17" y1="16" x2="23" y2="16"></line></svg>
                <span className={styles.toggleText}>{isOpen ? "Close Filter" : "Filter"}</span>
                <svg className={`${styles.toggleChevron} ${isOpen ? styles.rotated : ""}`} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </button>

            {isOpen && (
                <aside className={styles.dropdownContent}>
                    <div className={styles.header}>
                        <h3>Controls</h3>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <Link href="/listings" className={styles.clearAll} onClick={() => setIsOpen(false)}>Clear all</Link>
                            <button className={styles.closeBtn} onClick={() => setIsOpen(false)} aria-label="Close filters">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                        </div>
                    </div>

                    {/* Sort By Group */}
                    <div className={styles.group}>
                        <div className={styles.groupHeader} onClick={() => toggleGroup("sort")}>
                            <h4>Sort By</h4>
                            <svg className={`${styles.chevron} ${isExpanded("sort") ? styles.expanded : ""}`} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                        </div>
                        {isExpanded("sort") && (
                            <div className={styles.groupContent}>
                                <label className={styles.radioLabel}>
                                    <input
                                        type="radio"
                                        name="sort"
                                        value="newest"
                                        checked={sortBy === 'newest'}
                                        onChange={() => onSortChange?.('newest')}
                                    />
                                    <span className={styles.radioCircle}></span>
                                    Newest First
                                </label>
                                <label className={styles.radioLabel}>
                                    <input
                                        type="radio"
                                        name="sort"
                                        value="price-asc"
                                        checked={sortBy === 'price-asc'}
                                        onChange={() => onSortChange?.('price-asc')}
                                    />
                                    <span className={styles.radioCircle}></span>
                                    Price: Low to High
                                </label>
                                <label className={styles.radioLabel}>
                                    <input
                                        type="radio"
                                        name="sort"
                                        value="price-desc"
                                        checked={sortBy === 'price-desc'}
                                        onChange={() => onSortChange?.('price-desc')}
                                    />
                                    <span className={styles.radioCircle}></span>
                                    Price: High to Low
                                </label>
                            </div>
                        )}
                    </div>

                    {/* Category Group */}
                    <div className={styles.group}>
                        <div className={styles.groupHeader} onClick={() => toggleGroup("category")}>
                            <h4>Category</h4>
                            <svg className={`${styles.chevron} ${isExpanded("category") ? styles.expanded : ""}`} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                        </div>
                        {isExpanded("category") && (
                            <div className={styles.groupContent}>
                                {renderCategoryTree()}
                            </div>
                        )}
                    </div>

                    {/* Location Group */}
                    <div className={styles.group}>
                        <div className={styles.groupHeader} onClick={() => toggleGroup("location")}>
                            <h4>Location</h4>
                            <svg className={`${styles.chevron} ${isExpanded("location") ? styles.expanded : ""}`} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                        </div>
                        {isExpanded("location") && (
                            <div className={styles.groupContent}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <label style={{ fontSize: '0.8rem', color: '#64748b' }}>State/Province</label>
                                    <select
                                        className={styles.selectField}
                                        value={province}
                                        onChange={(e) => onProvinceChange?.(e.target.value)}
                                    >
                                        <option value="">All Regions</option>
                                        {states.map(s => (
                                            <option key={s.id} value={s.code}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <label style={{ fontSize: '0.8rem', color: '#64748b' }}>City</label>
                                    <select
                                        className={styles.selectField}
                                        value={location}
                                        onChange={(e) => onLocationChange?.(e.target.value)}
                                        disabled={!province}
                                    >
                                        <option value="">All Cities</option>
                                        {cities.map(c => (
                                            <option key={c.id} value={c.name}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Price Range Group */}
                    <div className={styles.group}>
                        <div className={styles.groupHeader} onClick={() => toggleGroup("price")}>
                            <h4>Price Range</h4>
                            <svg className={`${styles.chevron} ${isExpanded("price") ? styles.expanded : ""}`} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                        </div>
                        {isExpanded("price") && (
                            <div className={styles.groupContent}>
                                <div className={styles.priceInputs}>
                                    <div className={styles.priceField}>
                                        <span>$</span>
                                        <input
                                            type="number"
                                            placeholder="Min"
                                            value={minPrice}
                                            onChange={(e) => onMinPriceChange?.(e.target.value)}
                                        />
                                    </div>
                                    <span className={styles.dash}>-</span>
                                    <div className={styles.priceField}>
                                        <span>$</span>
                                        <input
                                            type="number"
                                            placeholder="Max"
                                            value={maxPrice}
                                            onChange={(e) => onMaxPriceChange?.(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Condition Group */}
                    <div className={styles.group}>
                        <div className={styles.groupHeader} onClick={() => toggleGroup("condition")}>
                            <h4>Condition</h4>
                            <svg className={`${styles.chevron} ${isExpanded("condition") ? styles.expanded : ""}`} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                        </div>
                        {isExpanded("condition") && (
                            <div className={styles.groupContent}>
                                {["New", "Used - Like New", "Used - Good", "Used - Fair"].map((condition, idx) => (
                                    <label key={idx} className={styles.checkboxLabel}>
                                        <input type="checkbox" />
                                        <span className={styles.checkmark}></span>
                                        {condition}
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>
                </aside>
            )}
        </div>
    );
}
