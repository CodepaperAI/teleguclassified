"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import styles from "./ListingSearch.module.css";
import { useAppContext } from "@/context/AppContext";
import Fuse from "fuse.js";

export default function ListingSearch() {
    const { listings } = useAppContext();
    const [query, setQuery] = useState("");
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [recentSearches, setRecentSearches] = useState<string[]>([]);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const router = useRouter();
    const searchRef = useRef<HTMLDivElement>(null);

    // Initialize Fuse
    const fuse = new Fuse(listings, {
        keys: ['title', 'category'],
        threshold: 0.3,
    });

    useEffect(() => {
        const saved = localStorage.getItem('recentSearches');
        if (saved) {
            try {
                setRecentSearches(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to parse recent searches", e);
            }
        }
    }, []);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        if (query.trim().length > 1) {
            const results = fuse.search(query, { limit: 5 });
            const unique = Array.from(new Set(results.map(r => r.item.title)));
            setSuggestions(unique);
        } else {
            setSuggestions([]);
        }
    }, [query, listings]);

    const addToRecent = (term: string) => {
        if (!term.trim()) return;
        const saved = localStorage.getItem('recentSearches');
        let current: string[] = saved ? JSON.parse(saved) : [];
        current = [term, ...current.filter(t => t.toLowerCase() !== term.toLowerCase())].slice(0, 5);
        localStorage.setItem('recentSearches', JSON.stringify(current));
        setRecentSearches(current);
    };

    const handleSearch = (searchTerm: string = query) => {
        if (!searchTerm.trim()) return;
        addToRecent(searchTerm);
        setShowSuggestions(false);
        router.push(`/listings?q=${encodeURIComponent(searchTerm)}`);
    };

    return (
        <div className={styles.searchContainer} ref={searchRef}>
            <div className={styles.searchBox}>
                <div className={styles.mainInput}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.icon}><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                    <input
                        type="text"
                        placeholder="Search for listings..."
                        className={styles.input}
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            setShowSuggestions(true);
                        }}
                        onFocus={() => setShowSuggestions(true)}
                        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    />

                    {/* Suggestions Dropdown */}
                    {showSuggestions && (
                        <div className={styles.suggestionsDropdown}>
                            {query.trim().length === 0 && recentSearches.length > 0 && (
                                <div className={styles.suggestionGroup}>
                                    <div className={styles.suggestionHeader}>Recent Searches</div>
                                    {recentSearches.map((term, index) => (
                                        <div
                                            key={index}
                                            className={styles.suggestionItem}
                                            onClick={() => {
                                                setQuery(term);
                                                handleSearch(term);
                                            }}
                                        >
                                            🕒 {term}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {suggestions.length > 0 && (
                                <div className={styles.suggestionGroup}>
                                    <div className={styles.suggestionHeader}>Suggestions</div>
                                    {suggestions.map((term, index) => (
                                        <div
                                            key={index}
                                            className={styles.suggestionItem}
                                            onClick={() => {
                                                setQuery(term);
                                                handleSearch(term);
                                            }}
                                        >
                                            🔍 {term}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
                <button className={styles.searchBtn} onClick={() => handleSearch()}>Find Results</button>
            </div>

            <div className={styles.popularTags}>
                <span className={styles.popularLabel}>Popular:</span>
                <div className={styles.tagsList}>
                    <button className={styles.tag} onClick={() => router.push("/listings?q=Apartments")}>Apartments</button>
                    <button className={styles.tag} onClick={() => router.push("/listings?q=Basement")}>Basement</button>
                    <button className={styles.tag} onClick={() => router.push("/listings?q=Condo")}>Condo</button>
                    <button className={styles.tag} onClick={() => router.push("/listings?q=Room")}>Room</button>
                </div>
            </div>
        </div>
    );
}
