"use client";

import { useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";
import styles from "./UserSearch.module.css";
import { FaMagnifyingGlass } from "react-icons/fa6";

export default function UserSearch() {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const { replace } = useRouter();
    const [isPending, startTransition] = useTransition();

    const handleSearch = useDebouncedCallback((term: string) => {
        const params = new URLSearchParams(searchParams);
        params.set("page", "1");
        if (term) {
            params.set("q", term);
        } else {
            params.delete("q");
        }
        startTransition(() => {
            replace(`${pathname}?${params.toString()}`);
        });
    }, 300);

    return (
        <div className={styles.searchContainer}>
            <label htmlFor="search" className="sr-only">
                Search
            </label>
            <FaMagnifyingGlass className={styles.searchIcon} />
            <input
                id="search"
                className={styles.searchInput}
                placeholder="Search by name, email, or phone..."
                onChange={(e) => handleSearch(e.target.value)}
                defaultValue={searchParams.get("q")?.toString()}
            />
        </div>
    );
}
