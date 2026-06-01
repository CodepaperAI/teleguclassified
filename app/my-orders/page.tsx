"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAppContext } from "@/context/AppContext";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import styles from "./MyOrders.module.css";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";

interface Order {
    id: string;
    amount: number;
    currency: string | null;
    status: string | null;
    plan_type: string | null;
    created_at: string | null;
    listing_id: string | null;
    listings: {
        title: string;
    } | null;
}

export default function MyOrdersPage() {
    const { user } = useAppContext();
    const router = useRouter();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            router.push("/login");
            return;
        }

        async function fetchOrders() {
            try {
                const supabase = createClient();
                const { data, error } = await supabase
                    .from('payments')
                    .select('*, listings(title)')
                    .eq('user_id', user!.id)
                    .order('created_at', { ascending: false });

                if (error) throw error;
                setOrders(data || []);
            } catch (err) {
                console.error("Error fetching orders:", err);
            } finally {
                setLoading(false);
            }
        }

        fetchOrders();
    }, [user, router]);

    if (!user) return null;

    return (
        <main className={styles.container}>
            <div className={styles.header}>
                <h1>My Orders</h1>
                <p>View your purchase history and featured listing promotions.</p>
            </div>

            {loading ? (
                <div className={styles.empty}>
                    <p>Loading your orders...</p>
                </div>
            ) : orders.length > 0 ? (
                <div className={styles.ordersTableWrapper}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Ad / Plan</th>
                                <th>Status</th>
                                <th>Amount</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map((order) => (
                                <tr key={order.id}>
                                    <td>
                                        <div className={styles.listingInfo}>
                                            <h4>{order.listings?.title || 'Unknown Listing'}</h4>
                                            <p>{
                                                order.plan_type === 'basic' ? 'Basic Promotion (7 Days)' :
                                                order.plan_type === 'standard' ? 'Standard Promotion (20 Days)' :
                                                order.plan_type === 'premium' ? 'Premium Promotion (30 Days)' :
                                                order.plan_type === 'featured' ? 'Featured Listing (7 Days)' :
                                                order.plan_type === 'bundle' ? 'Promotion Bundle' :
                                                order.plan_type === 'listing_fee' ? 'Standard Listing Fee' :
                                                order.plan_type === 'website_fee' ? 'Website Development Fee' :
                                                order.plan_type === 'basic_listing' ? 'Standard Listing Fee' :
                                                'Order / Promotion'
                                            }</p>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`${styles.status} ${order.status === 'completed' ? styles.statusCompleted :
                                            order.status === 'pending' ? styles.statusPending :
                                                styles.statusFailed
                                            }`}>
                                            {order.status}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={styles.amount}>
                                            {formatCurrency(Number(order.amount))} {(order.currency || 'CAD').toUpperCase()}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={styles.date}>
                                            {order.created_at ? new Date(order.created_at).toLocaleDateString() : 'N/A'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className={styles.empty}>
                    <div className={styles.emptyIcon}>🛍️</div>
                    <h2>No orders found</h2>
                    <p>You haven't promoted any ads yet. Boost your listing to reach more people!</p>
                    <Link href="/my-ads" className={styles.shopBtn}>Promote an Ad</Link>
                </div>
            )}
        </main>
    );
}
