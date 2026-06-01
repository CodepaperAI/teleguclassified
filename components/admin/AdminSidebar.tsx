"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    MdDashboard,
    MdList,
    MdPeople,
    MdMap,
    MdLogout,
    MdCategory,
    MdLocalOffer,
    MdSettings,
    MdPayments,
    MdGroup,
    MdDescription,
} from "react-icons/md";
import styles from "./AdminSidebar.module.css";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function AdminSidebar({
    isAdmin,
    permissions,
    isOpen = true,
    setIsOpen
}: {
    isAdmin: boolean;
    permissions: string[];
    isOpen?: boolean;
    setIsOpen?: (isOpen: boolean) => void;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const supabase = createClient();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/login");
    };

    const navItems = [
        { label: "Dashboard", href: "/admin", icon: MdDashboard, permission: '*' },
        { label: "Listings", href: "/admin/listings", icon: MdList, permission: 'listings' },
        { label: "Categories", href: "/admin/categories", icon: MdCategory, permission: 'categories' },
        { label: "Users", href: "/admin/users", icon: MdPeople, permission: 'users' },
        { label: "Pages", href: "/admin/pages", icon: MdDescription, permission: 'settings' },
        { label: "Plans", href: "/admin/plans", icon: MdLocalOffer, permission: 'plans' },
        { label: "Locations", href: "/admin/locations", icon: MdMap, permission: 'locations' },
        { label: "Monetization", href: "/admin/monetization", icon: MdPayments, permission: 'plans' },
        { label: "Team", href: "/admin/team", icon: MdGroup, permission: 'users' },
        { label: "Settings", href: "/admin/settings", icon: MdSettings, permission: 'settings' },
    ].filter(item => {
        if (item.label === "Team") return isAdmin;
        return (
            permissions.includes('*') ||
            permissions.includes(`${item.permission}:read`) ||
            permissions.includes(`${item.permission}:write`)
        );
    });

    return (
        <aside className={`${styles.sidebar} ${!isOpen ? styles.sidebarHidden : ''}`}>
            <div className={styles.header}>
                <div className={styles.logo}>Admin Panel</div>
            </div>

            <nav className={styles.nav}>
                {navItems.map((item) => {
                    const isActive = item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href);
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`${styles.link} ${isActive ? styles.linkActive : ""}`}
                        >
                            <item.icon className={styles.icon} />
                            <span>{item.label}</span>
                        </Link>
                    );
                })}

                <button onClick={handleLogout} className={styles.link} style={{ marginTop: 'auto' }}>
                    <MdLogout className={styles.icon} />
                    <span>Logout</span>
                </button>
            </nav>

            <div className={styles.footer}>
                &copy; {new Date().getFullYear()} Canada Telugu Classifieds
            </div>
        </aside>
    );
}
