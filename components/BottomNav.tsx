"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FaHouse, FaHeart, FaPlus, FaMessage, FaUser, FaList, FaRightFromBracket, FaCircleUser, FaBoxOpen } from "react-icons/fa6";
import styles from "./BottomNav.module.css";
import { useAppContext } from "@/context/AppContext";
import { getUnreadMessageCount } from "@/lib/db/chat";
import { useState, useEffect } from "react";

export default function BottomNav() {
    const pathname = usePathname();
    const router = useRouter();
    const { user, signOut, showConfirm } = useAppContext();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    const isActive = (path: string) => pathname === path;

    // Reset menu when path changes
    useEffect(() => {
        setIsMenuOpen(false);
    }, [pathname]);

    // Fetch unread messages
    useEffect(() => {
        if (!user) {
            setUnreadCount(0);
            return;
        }

        const fetchUnread = async () => {
            const count = await getUnreadMessageCount(user.id);
            setUnreadCount(count);
        };

        fetchUnread();

        // Poll every 30 seconds
        const interval = setInterval(fetchUnread, 30000);
        return () => clearInterval(interval);
    }, [user]);

    const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || "User";
    const initial = displayName[0]?.toUpperCase() || "U";
    const avatarUrl = user?.user_metadata?.avatar_url;

    const handleLogout = () => {
        setIsMenuOpen(false);
        showConfirm("Log Out", "Are you sure you want to log out?", async () => {
            await signOut();
            router.push('/');
        });
    };

    return (
        <>
            {isMenuOpen && (
                <div className={styles.menuOverlay} onClick={() => setIsMenuOpen(false)}>
                    <div className={styles.profileMenu} onClick={e => e.stopPropagation()}>
                        {user ? (
                            <>
                                <div className={styles.menuHeader}>
                                    {avatarUrl ? (
                                        <img src={avatarUrl} alt={displayName} className={styles.menuAvatar} />
                                    ) : (
                                        <div className={styles.menuAvatarPlaceholder}>{initial}</div>
                                    )}
                                    <div className={styles.userInfo}>
                                        <h3>{displayName}</h3>
                                        <p>{user.email}</p>
                                    </div>
                                </div>
                                <div className={styles.menuLinks}>
                                    <Link href="/profile" className={styles.menuItem}>
                                        <span className={styles.menuIcon}><FaCircleUser /></span>
                                        Profile
                                    </Link>
                                    <Link href="/my-ads" className={styles.menuItem}>
                                        <span className={styles.menuIcon}><FaList /></span>
                                        My Ads
                                    </Link>
                                    <Link href="/favorites" className={styles.menuItem}>
                                        <span className={styles.menuIcon}><FaHeart /></span>
                                        Favorites
                                    </Link>
                                    <Link href="/messages" className={styles.menuItem}>
                                        <span className={styles.menuIcon}><FaMessage /></span>
                                        Messages
                                    </Link>
                                    <Link href="/my-orders" className={styles.menuItem}>
                                        <span className={styles.menuIcon}><FaBoxOpen /></span>
                                        My Orders
                                    </Link>
                                    <button className={`${styles.menuItem} ${styles.logoutBtn}`} onClick={handleLogout}>
                                        <span className={styles.menuIcon}><FaRightFromBracket /></span>
                                        Log Out
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className={styles.loginPrompt}>
                                <h3>Welcome!</h3>
                                <p>Log in to manage your ads and messages.</p>
                                <Link href="/login" className={styles.loginBtn}>Log In</Link>
                                <Link href="/signup" className={styles.signupBtn}>Sign Up</Link>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <nav className={styles.bottomNav}>
                <div className={styles.container}>
                    <Link href="/" className={`${styles.navItem} ${!isMenuOpen && isActive('/') ? styles.active : ''}`} onClick={() => setIsMenuOpen(false)}>
                        <FaHouse className={styles.icon} />
                        <span className={styles.label}>Home</span>
                    </Link>

                    <Link href="/favorites" className={`${styles.navItem} ${!isMenuOpen && isActive('/favorites') ? styles.active : ''}`} onClick={() => setIsMenuOpen(false)}>
                        <FaHeart className={styles.icon} />
                        <span className={styles.label}>Favorites</span>
                    </Link>

                    <div className={styles.fabContainer}>
                        <Link href="/post-ad" className={styles.fab} onClick={() => setIsMenuOpen(false)}>
                            <FaPlus />
                        </Link>
                    </div>

                    <Link href="/messages" className={`${styles.navItem} ${!isMenuOpen && isActive('/messages') ? styles.active : ''}`} onClick={() => setIsMenuOpen(false)}>
                        <div style={{ position: 'relative' }}>
                            <FaMessage className={styles.icon} />
                            {unreadCount > 0 && (
                                <span className={styles.navBadge}>{unreadCount > 9 ? '9+' : unreadCount}</span>
                            )}
                        </div>
                        <span className={styles.label}>Messages</span>
                    </Link>

                    <button
                        className={`${styles.navItem} ${isActive('/profile') || isMenuOpen ? styles.active : ''}`}
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                        <FaUser className={styles.icon} />
                        <span className={styles.label}>Account</span>
                    </button>
                </div>
            </nav>
        </>
    );
}
