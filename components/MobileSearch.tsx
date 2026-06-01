"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { FaMagnifyingGlass, FaClock } from "react-icons/fa6";
import styles from "./MobileSearch.module.css";
import { useAppContext } from "@/context/AppContext";
import Fuse from "fuse.js";

export default function MobileSearch() {
    const { listings } = useAppContext();
    const [query, setQuery] = useState("");
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [recentSearches, setRecentSearches] = useState<string[]>([]);
    const searchRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    // Initialize Fuse
    const fuse = new Fuse(listings || [], {
        keys: ['title', 'category'],
        threshold: 0.3,
    });

    // Load recent searches
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

    // Fetch suggestions
    useEffect(() => {
        if (query.trim().length > 1) {
            const results = fuse.search(query, { limit: 5 });
            const unique = Array.from(new Set(results.map(r => r.item.title)));
            setSuggestions(unique);
        } else {
            setSuggestions([]);
        }
    }, [query, listings]);

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const addToRecent = (term: string) => {
        if (!term.trim()) return;
        const saved = localStorage.getItem('recentSearches');
        let current: string[] = saved ? JSON.parse(saved) : [];
        current = [term, ...current.filter(t => t.toLowerCase() !== term.toLowerCase())].slice(0, 5);
        localStorage.setItem('recentSearches', JSON.stringify(current));
        setRecentSearches(current);
    };

    const handleSubmit = (e?: React.FormEvent, term: string = query) => {
        if (e) e.preventDefault();
        if (term.trim()) {
            addToRecent(term);
            setShowSuggestions(false);
            router.push(`/listings?q=${encodeURIComponent(term)}`);
        }
    };

    return (
        <div className={styles.container} ref={searchRef}>
            <form onSubmit={handleSubmit} className={styles.searchWrapper}>
                <div className={styles.searchIcon}>
                    <FaMagnifyingGlass />
                </div>
                <input
                    type="text"
                    placeholder="Search listings..."
                    className={styles.input}
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                />
            </form>

            {showSuggestions && (query.length > 0 || recentSearches.length > 0) && (
                <div className={styles.suggestionsDropdown}>
                    {query.trim().length === 0 && recentSearches.length > 0 && (
                        <div className={styles.suggestionGroup}>
                            <div className={styles.suggestionHeader}>Recent Searches</div>
                            {recentSearches.map((term, index) => (
                                <div
                                    key={index}
                                    className={styles.suggestionItem}
                                    onClick={() => handleSubmit(undefined, term)}
                                >
                                    <FaClock className={styles.icon} /> {term}
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
                                    onClick={() => handleSubmit(undefined, term)}
                                >
                                    <FaMagnifyingGlass className={styles.icon} /> {term}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
