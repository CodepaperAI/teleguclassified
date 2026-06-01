'use server';

import { createAdminClient } from "@/lib/supabase/admin";
import { unstable_noStore as noStore } from 'next/cache';

export interface SiteStats {
    total_users: number;
    total_listings: number;
    total_transactions: number;
    total_pending_transactions: number;
    total_success_transactions: number;
    total_revenue: number;
    total_manual_revenue: number;
    total_paid_listings: number;
    total_sold_ads: number;
    total_active_ads: number;
    total_inactive_ads: number;
    total_pending_ads: number;
    total_paid_users: number;
}

export async function getSiteStats(): Promise<SiteStats> {
    noStore();
    const supabase = createAdminClient();

    const [
        totalUsers,
        totalListings,
        activeAds,
        soldAds,
        pendingAds,
        inactiveAds,
        totalTransactions,
        pendingTransactions,
        successTransactions,
        revenueData,
        paidUsers,
        paidListings
    ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('listings').select('*', { count: 'exact', head: true }).neq('status', 'deleted'),
        supabase.from('listings').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('listings').select('*', { count: 'exact', head: true }).eq('status', 'sold'),
        supabase.from('listings').select('*', { count: 'exact', head: true }).eq('status', 'payment_pending'),
        supabase.from('listings').select('*', { count: 'exact', head: true }).not('status', 'in', '("active","sold","payment_pending","deleted")'),
        supabase.from('payments').select('*', { count: 'exact', head: true }).neq('payment_method', 'manual'),
        supabase.from('payments').select('*', { count: 'exact', head: true }).eq('status', 'pending').neq('payment_method', 'manual'),
        supabase.from('payments').select('*', { count: 'exact', head: true }).eq('status', 'completed').neq('payment_method', 'manual'),
        supabase.from('payments').select('amount, payment_method').eq('status', 'completed'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_paid', true),
        supabase.from('listings').select('*', { count: 'exact', head: true }).not('boost_plan', 'is', 'null').neq('status', 'deleted')
    ]);

    // Handle errors if any
    const errors = [
        totalUsers.error, totalListings.error, activeAds.error, soldAds.error,
        pendingAds.error, inactiveAds.error, totalTransactions.error, 
        pendingTransactions.error, successTransactions.error,
        revenueData.error, paidUsers.error, paidListings.error
    ].filter(Boolean);

    if (errors.length > 0) {
        console.error("Errors fetching real-time stats:", errors);
    }

    const completedPayments = revenueData.data || [];
    const totalStripeRevenue = completedPayments
        .filter(p => p.payment_method !== 'manual')
        .reduce((sum, p) => sum + (p.amount / 100), 0);
    const totalManualRevenue = completedPayments
        .filter(p => p.payment_method === 'manual')
        .reduce((sum, p) => sum + (p.amount / 100), 0);

    return {
        total_users: totalUsers.count || 0,
        total_listings: totalListings.count || 0,
        total_transactions: totalTransactions.count || 0,
        total_pending_transactions: pendingTransactions.count || 0,
        total_success_transactions: successTransactions.count || 0,
        total_revenue: totalStripeRevenue,
        total_manual_revenue: totalManualRevenue,
        total_paid_listings: paidListings.count || 0,
        total_sold_ads: soldAds.count || 0,
        total_active_ads: activeAds.count || 0,
        total_inactive_ads: inactiveAds.count || 0,
        total_pending_ads: pendingAds.count || 0,
        total_paid_users: paidUsers.count || 0,
    };
}


