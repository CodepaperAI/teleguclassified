"use client";

import { useState, useRef, useEffect } from "react";
import NextLink from "next/link";
import { useRouter, usePathname } from "next/navigation";
import styles from "./Navbar.module.css";
import { FaBars, FaXmark, FaMagnifyingGlass, FaPlus, FaCircleUser, FaList, FaHeart, FaMessage, FaBoxOpen, FaRightFromBracket } from "react-icons/fa6";
import { MdMenu } from "react-icons/md";
import { useAppContext } from "@/context/AppContext";
import { getUnreadMessageCount } from "@/lib/db/chat";
import { getLocations, Province } from "@/lib/db/locations";
import Fuse from "fuse.js";

export default function Navbar() {
    const { user, signOut, listings, showConfirm, unreadCount, isAdminSidebarOpen, setIsAdminSidebarOpen } = useAppContext();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState("All Cities");
    const [locations, setLocations] = useState<Province[]>([]);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const searchRef = useRef<HTMLFormElement>(null);
    const router = useRouter();
    const pathname = usePathname() || "";
    const isAdmin = pathname.startsWith("/admin");

    // Get display name and initial safely
    const displayName = user?.user_metadata?.full_name || user?.email || user?.phone || "User";
    const initial = displayName[0]?.toUpperCase() || "U";

    // Search State
    const [searchQuery, setSearchQuery] = useState("");
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [recentSearches, setRecentSearches] = useState<string[]>([]);

    // Initialize Fuse for suggestions
    const fuse = new Fuse(listings || [], {
        keys: ['title', 'category'],
        threshold: 0.3,
    });

    // Close suggestions/dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Fetch suggestions
    useEffect(() => {
        if (searchQuery.trim().length > 1) {
            const results = fuse.search(searchQuery, { limit: 5 });
            const unique = Array.from(new Set(results.map(r => r.item.title)));
            setSuggestions(unique);
        } else {
            setSuggestions([]);
        }
    }, [searchQuery, listings]);

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

    const addToRecent = (term: string) => {
        if (!term.trim()) return;
        const saved = localStorage.getItem('recentSearches');
        let current: string[] = saved ? JSON.parse(saved) : [];
        current = [term, ...current.filter(t => t.toLowerCase() !== term.toLowerCase())].slice(0, 5);
        localStorage.setItem('recentSearches', JSON.stringify(current));
        setRecentSearches(current);
    };

    const handleSearchSubmit = (e?: React.FormEvent, term: string = searchQuery) => {
        if (e) e.preventDefault();
        if (term.trim()) {
            addToRecent(term);
            setShowSuggestions(false);
            router.push(`/listings?q=${encodeURIComponent(term)}`);
        }
    };

    // Fetch locations from database
    useEffect(() => {
        async function fetchLocations() {
            const data = await getLocations();
            setLocations(data);
        }
        fetchLocations();
    }, []);

    // Load selected location from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('selectedLocation');
        if (saved) setSelectedLocation(saved);
    }, []);

    return (
        <nav className={`${styles.navbar} ${isAdmin ? (isAdminSidebarOpen ? styles.adminNavbar : styles.adminNavbarCollapsed) : ''}`}>
            <div className={`${styles.container} ${isAdmin ? styles.adminContainer : ''}`}>
                <div className={styles.left}>
                    {isAdmin && (
                        <button 
                            className={styles.adminToggle}
                            onClick={() => setIsAdminSidebarOpen(!isAdminSidebarOpen)}
                            aria-label="Toggle Sidebar"
                        >
                            <MdMenu size={24} />
                        </button>
                    )}
                    <NextLink href="/" className={styles.logo}>
                        <img src="/logo.png" alt="Canada Telugu Classifieds Logo" className={styles.logoImg} />
                        <span className={styles.appName}>Canada Telugu Classifieds</span>
                    </NextLink>
                </div>

                <div className={`${styles.center} ${isMobileSearchOpen ? styles.showMobileSearch : ""}`}>
                    {!isAdmin && (
                        <form
                            ref={searchRef}
                            className={styles.navSearch}
                            onSubmit={handleSearchSubmit}
                        >
                            {isMobileSearchOpen && (
                                <button
                                    type="button"
                                    className={styles.closeSearchBtn}
                                    onClick={() => setIsMobileSearchOpen(false)}
                                >
                                    <FaXmark />
                                </button>
                            )}
                            <div className={styles.searchInputWrapper}>
                                <input
                                    type="text"
                                    placeholder="Search listings..."
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        setShowSuggestions(true);
                                    }}
                                    onFocus={() => setShowSuggestions(true)}
                                    className={styles.navSearchInput}
                                />
                                <button type="submit" className={styles.navSearchBtn}>
                                    <FaMagnifyingGlass />
                                </button>
                            </div>

                            {showSuggestions && (searchQuery.length > 0 || recentSearches.length > 0) && (
                                <div className={styles.suggestionsDropdown}>
                                    {searchQuery.trim().length === 0 && recentSearches.length > 0 && (
                                        <div className={styles.suggestionGroup}>
                                            <div className={styles.suggestionHeader}>Recent Searches</div>
                                            {recentSearches.map((term, index) => (
                                                <div
                                                    key={index}
                                                    className={styles.suggestionItem}
                                                    onClick={() => handleSearchSubmit(undefined, term)}
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
                                                    onClick={() => handleSearchSubmit(undefined, term)}
                                                >
                                                    🔍 {term}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </form>
                    )}
                </div>

                <div className={styles.right}>
                    {/* Desktop & Mobile: Post Ad Button */}
                    {!isAdmin && (
                        <NextLink href="/post-ad" className={`${styles.postButton} ${styles.mobilePostButton}`}>
                            <FaPlus className={styles.plus} />
                            <span className={styles.postText}>Post Free Ad</span>
                        </NextLink>
                    )}

                    {/* Desktop & Mobile: Messages */}
                    {!isAdmin && (
                        <div
                            className={styles.notification}
                            onClick={() => router.push('/messages')}
                        >
                            <span className={styles.notifIcon}>💬</span>
                            {unreadCount > 0 && (
                                <span className={styles.badge}>{unreadCount}</span>
                            )}
                        </div>
                    )}

                    {/* Desktop & Mobile: User Avatar / Login */}
                    {user ? (
                        <div className={styles.userSection} ref={dropdownRef}>
                            <div
                                className={styles.profileTrigger}
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            >
                                {user.user_metadata?.avatar_url ? (
                                    <img
                                        src={user.user_metadata.avatar_url}
                                        alt="Profile"
                                        className={styles.avatarImage}
                                    />
                                ) : (
                                    <div className={styles.avatarMini}>{initial}</div>
                                )}
                            </div>

                            {isDropdownOpen && (
                                <div className={styles.profileDropdown}>
                                    <div className={styles.dropdownHeader}>
                                        {user.user_metadata?.avatar_url ? (
                                            <img
                                                src={user.user_metadata.avatar_url}
                                                alt="Profile"
                                                className={styles.headerAvatar}
                                            />
                                        ) : (
                                            <div className={styles.headerAvatarPlaceholder}>{initial}</div>
                                        )}
                                        <div className={styles.headerInfo}>
                                            <strong>{displayName}</strong>
                                            <span>{user.email}</span>
                                        </div>
                                    </div>

                                    <div className={styles.dropdownContent}>
                                        <NextLink href="/profile" className={styles.dropdownItem} onClick={() => setIsDropdownOpen(false)}>
                                            <span className={styles.itemIcon}><FaCircleUser /></span>
                                            Profile
                                        </NextLink>
                                        <NextLink href="/my-ads" className={styles.dropdownItem} onClick={() => setIsDropdownOpen(false)}>
                                            <span className={styles.itemIcon}><FaList /></span>
                                            My Ads
                                        </NextLink>
                                        <NextLink href="/favorites" className={styles.dropdownItem} onClick={() => setIsDropdownOpen(false)}>
                                            <span className={styles.itemIcon}><FaHeart /></span>
                                            Favorites
                                        </NextLink>
                                        <NextLink href="/messages" className={styles.dropdownItem} onClick={() => setIsDropdownOpen(false)}>
                                            <span className={styles.itemIcon}><FaMessage /></span>
                                            Messages
                                        </NextLink>
                                        <NextLink href="/my-orders" className={styles.dropdownItem} onClick={() => setIsDropdownOpen(false)}>
                                            <span className={styles.itemIcon}><FaBoxOpen /></span>
                                            My Orders
                                        </NextLink>

                                        <div className={styles.divider}></div>

                                        <button
                                            onClick={() => {
                                                setIsDropdownOpen(false);
                                                showConfirm(
                                                    "Log Out",
                                                    "Are you sure you want to log out?",
                                                    async () => {
                                                        await signOut();
                                                        router.push('/');
                                                    }
                                                );
                                            }}
                                            className={`${styles.dropdownItem} ${styles.logoutBtn}`}
                                        >
                                            <span className={styles.itemIcon}><FaRightFromBracket /></span>
                                            Log Out
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <NextLink href="/login" className={styles.loginButton}>
                            Login
                        </NextLink>
                    )}
                </div>

                {/* Mobile Menu Overlay Removed */}
            </div>
        </nav >
    );
}
