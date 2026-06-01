'use client';

import { useEffect, useState } from 'react';
import { getSiteStats, SiteStats } from '@/app/(admin)/admin/stats/actions';
import styles from './StatsCards.module.css';
import { FaUsers, FaListAlt, FaExchangeAlt, FaDollarSign, FaCheckCircle, FaTimesCircle, FaClock, FaUserPlus, FaShoppingCart } from 'react-icons/fa';

export default function StatsCards() {
    const [stats, setStats] = useState<SiteStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchStats() {
            try {
                const data = await getSiteStats();
                setStats(data);
            } catch (error) {
                console.error("Failed to fetch stats", error);
            } finally {
                setLoading(false);
            }
        }
        fetchStats();
    }, []);

    if (loading) {
        return <div className={styles.grid}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => (
                <div key={i} className={styles.card} style={{ height: '120px', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite', backgroundColor: '#f3f4f6' }}></div>
            ))}
        </div>;
    }

    if (!stats) return null;

    const cards = [
        // 1. REVENUE
        {
            title: "Total Revenue",
            value: `$ ${stats.total_revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            icon: FaDollarSign,
            iconClass: styles.revenueIcon,
            description: "Total money received through Stripe online payments only."
        },
        {
            title: "Manual Revenue",
            value: `$ ${stats.total_manual_revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            icon: FaDollarSign,
            iconClass: styles.revenueIcon,
            description: "Total money received from manual payments recorded by administrators."
        },

        // 2. TRANSACTIONS
        {
            title: "Total Transactions",
            value: stats.total_transactions.toLocaleString(),
            icon: FaExchangeAlt,
            iconClass: styles.transactionsIcon,
            description: "Total count of all Stripe payment attempts (excluding manual entries)."
        },
        {
            title: "Success Transactions",
            value: stats.total_success_transactions.toLocaleString(),
            icon: FaExchangeAlt,
            iconClass: styles.activeAdsIcon,
            description: "Number of Stripe payments that have been successfully completed."
        },
        {
            title: "Pending Transactions",
            value: stats.total_pending_transactions.toLocaleString(),
            icon: FaClock,
            iconClass: styles.pendingAdsIcon,
            description: "Stripe payments that are currently in progress or waiting for confirmation."
        },

        // 3. USERS
        {
            title: "Total Users",
            value: stats.total_users.toLocaleString(),
            icon: FaUsers,
            iconClass: styles.usersIcon,
            description: "Total number of registered user accounts on the platform."
        },
        {
            title: "Total Paid Users",
            value: stats.total_paid_users.toLocaleString(),
            icon: FaUserPlus,
            iconClass: styles.paidUsersIcon,
            description: "Number of unique users who have made at least one successful payment."
        },

        // 4. ADS / LISTINGS
        {
            title: "Total Listings",
            value: stats.total_listings.toLocaleString(),
            icon: FaListAlt,
            iconClass: styles.listingsIcon,
            description: "Total number of all listings ever created (excluding deleted ones)."
        },
        {
            title: "Total Paid Listings",
            value: stats.total_paid_listings.toLocaleString(),
            icon: FaShoppingCart,
            iconClass: styles.soldAdsIcon,
            description: "Total number of listings that have been upgraded to a paid boost plan."
        },
        {
            title: "Total Sold Listings",
            value: stats.total_sold_ads.toLocaleString(),
            icon: FaCheckCircle,
            iconClass: styles.activeAdsIcon,
            description: "Number of listings that have been marked as 'Sold' by the owners."
        },
        {
            title: "Active Ads",
            value: stats.total_active_ads.toLocaleString(),
            icon: FaCheckCircle,
            iconClass: styles.activeAdsIcon,
            description: "Number of listings currently live and visible on the site."
        },
        {
            title: "Inactive Ads",
            value: stats.total_inactive_ads.toLocaleString(),
            icon: FaTimesCircle,
            iconClass: styles.inactiveAdsIcon,
            description: "Listings that are expired, hidden, or in other non-active states."
        },
        {
            title: "Pending Payment Ads",
            value: stats.total_pending_ads.toLocaleString(),
            icon: FaClock,
            iconClass: styles.pendingAdsIcon,
            description: "Listings that are waiting for payment to be completed to go live."
        }
    ];

    return (
        <div className={styles.grid}>
            {cards.map((card, index) => (
                <div key={index} className={styles.card}>
                    <div className={styles.header}>
                        <div className={styles.titleContainer}>
                            <div className={styles.title}>{card.title}</div>
                            <div className={styles.infoIcon}>
                                ?
                                <span className={styles.tooltip}>{card.description}</span>
                            </div>
                        </div>
                        <div className={`${styles.iconWrapper} ${card.iconClass}`}>
                            <card.icon size={20} />
                        </div>
                    </div>
                    <div className={styles.value}>{card.value}</div>
                </div>
            ))}
        </div>
    );

}
