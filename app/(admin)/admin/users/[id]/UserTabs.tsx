"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./UserTabs.module.css";

export default function UserTabs({ userId }: { userId: string }) {
    const pathname = usePathname();
    const cleanPath = pathname?.split("?")[0]; // Remove query params if any

    const tabs = [
        { name: "Profile", href: `/admin/users/${userId}`, exact: true },
        { name: "Listings", href: `/admin/users/${userId}/listings` },
        { name: "Transactions", href: `/admin/users/${userId}/transactions` },
        { name: "Favorites", href: `/admin/users/${userId}/favorites` },
        { name: "Messages", href: `/admin/users/${userId}/messages` },
    ];

    return (
        <div className={styles.tabsContainer}>
            {tabs.map((tab) => {
                const isActive = tab.exact
                    ? cleanPath === tab.href
                    : cleanPath?.startsWith(tab.href);

                return (
                    <Link
                        key={tab.name}
                        href={tab.href}
                        className={`${styles.tab} ${isActive ? styles.active : ""}`}
                    >
                        {tab.name}
                    </Link>
                );
            })}
        </div>
    );
}
