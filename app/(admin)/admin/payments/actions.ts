'use server';

import { createClient } from "@/lib/supabase/server";

import { revalidatePath } from "next/cache";

export interface PaymentRecord {
    id: string;
    amount: number;
    currency: string;
    status: string;
    created_at: string;
    plan_type: string; // e.g., 'premium', 'basic'
    stripe_session_id?: string;
    payment_method: string;
    user: {
        id: string;
        email: string;
        full_name: string;
    } | null;
}

export type DateFilter = 'today' | 'yesterday' | 'this_month' | 'last_month' | 'this_year' | 'custom';

export async function getPayments(filter: DateFilter, startDate?: string, endDate?: string): Promise<PaymentRecord[]> {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return [];
    }

    let query = supabase
        .from('payments')
        .select(`
            *,
            user:profiles(full_name, email)
        `)
        .order('created_at', { ascending: false });

    const now = new Date();
    let start: Date | null = null;
    let end: Date | null = null;

    switch (filter) {
        case 'today':
            start = new Date(now.setHours(0, 0, 0, 0));
            end = new Date(now.setHours(23, 59, 59, 999));
            break;
        case 'yesterday':
            const yesterday = new Date(now);
            yesterday.setDate(yesterday.getDate() - 1);
            start = new Date(yesterday.setHours(0, 0, 0, 0));
            end = new Date(yesterday.setHours(23, 59, 59, 999));
            break;
        case 'this_month':
            start = new Date(now.getFullYear(), now.getMonth(), 1);
            end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59); // End of month
            break;
        case 'last_month':
            start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
            break;
        case 'this_year':
            start = new Date(now.getFullYear(), 0, 1);
            end = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
            break;
        case 'custom':
            if (startDate) start = new Date(startDate);
            if (endDate) {
                end = new Date(endDate);
                end.setHours(23, 59, 59, 999); // Include the full end date
            }
            break;
    }

    if (start) {
        query = query.gte('created_at', start.toISOString());
    }
    if (end) {
        query = query.lte('created_at', end.toISOString());
    }

    const { data, error } = await query;

    if (error) {
        console.error("Error fetching payments:", error);
        return [];
    }

    // Transform data to match interface (handling joined data)
    return data.map((item: any) => ({
        id: item.id,
        amount: item.amount,
        currency: item.currency || 'CAD',
        status: item.status,
        created_at: item.created_at,
        plan_type: item.plan_type,
        stripe_session_id: item.stripe_session_id,
        payment_method: item.payment_method || 'stripe',
        user: item.user ? {
            id: item.user_id,
            email: item.user.email || 'N/A',
            full_name: item.user.full_name
        } : null
    }));
}

export async function addManualPayment(formData: {
    userId: string;
    amount: number; // in dollars
    planType: string;
    notes: string;
}) {
    const supabase = await createClient();
    
    // Verify admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");
    
    const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();
    if (!profile?.is_admin) throw new Error("Unauthorized: Admin access required");

    const amountInCents = Math.round(formData.amount * 100);

    // 1. Insert payment record
    const { error: paymentError } = await supabase.from('payments').insert({
        user_id: formData.userId,
        amount: amountInCents,
        status: 'completed',
        payment_method: 'manual',
        plan_type: formData.planType,
        currency: 'CAD',
        metadata: {
            notes: formData.notes,
            recorded_by: user.id
        }
    });

    if (paymentError) throw new Error(`Failed to record payment: ${paymentError.message}`);

    // 2. Update user profile to is_paid = true
    const { error: profileError } = await supabase
        .from('profiles')
        .update({ is_paid: true })
        .eq('id', formData.userId);

    if (profileError) console.error("Error updating user paid status:", profileError);

    revalidatePath('/admin/payments');
    revalidatePath('/admin');
    
    return { success: true };
}

