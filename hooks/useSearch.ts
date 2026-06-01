import { useState, useEffect, useMemo, useCallback } from 'react';
import Fuse from 'fuse.js';
import { Listing } from '@/lib/MockData';

interface UseSearchProps {
    data: Listing[];
    initialQuery?: string;
    keys?: string[];
}

export function useSearch({ data, initialQuery = "", keys = ['title', 'description', 'category', 'location'] }: UseSearchProps) {
    const [query, setQuery] = useState(initialQuery);
    const [recentSearches, setRecentSearches] = useState<string[]>([]);

    // Initialize Fuse
    const fuse = useMemo(() => {
        return new Fuse(data, {
            keys,
            threshold: 0.3, // 0.0 is perfect match, 1.0 is match anything
            includeScore: true,
            ignoreLocation: true,
            minMatchCharLength: 2,
        });
    }, [data, keys]);

    // Load recent searches from localStorage
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

    const addToRecent = useCallback((term: string) => {
        if (!term.trim()) return;

        setRecentSearches(prev => {
            const newItem = term.trim();
            // Remove duplicates and keep only last 5
            const filtered = prev.filter(item => item.toLowerCase() !== newItem.toLowerCase());
            const updated = [newItem, ...filtered].slice(0, 5);
            localStorage.setItem('recentSearches', JSON.stringify(updated));
            return updated;
        });
    }, []);

    const clearRecent = useCallback(() => {
        setRecentSearches([]);
        localStorage.removeItem('recentSearches');
    }, []);

    const removeRecent = useCallback((term: string) => {
        setRecentSearches(prev => {
            const updated = prev.filter(item => item !== term);
            localStorage.setItem('recentSearches', JSON.stringify(updated));
            return updated;
        });
    }, []);


    // Get Results
    const results = useMemo(() => {
        if (!query.trim()) return data;
        return fuse.search(query).map(result => result.item);
    }, [fuse, query, data]);

    // Get Suggestions (simple prefix match on titles or categories for now, effectively same as results but limited)
    const suggestions = useMemo(() => {
        if (!query.trim()) return [];

        // We can aggregate unique categories or titles from top 5 results
        const topResults = fuse.search(query, { limit: 5 });

        const uniqueSuggestions = new Set<string>();
        topResults.forEach(res => {
            uniqueSuggestions.add(res.item.title);
            // Add category if it matches the query partially
            if (res.item.category.toLowerCase().includes(query.toLowerCase())) {
                uniqueSuggestions.add(res.item.category);
            }
        });

        return Array.from(uniqueSuggestions).slice(0, 5);
    }, [fuse, query]);

    return {
        query,
        setQuery,
        results,
        suggestions,
        recentSearches,
        addToRecent,
        clearRecent,
        removeRecent
    };
}
