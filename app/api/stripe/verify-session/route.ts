import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-01-27.acacia' as any,
});

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
    try {
        const { sessionId } = await req.json();

        if (!sessionId) {
            return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });
        }

        console.log('--- Session Verification ---');
        console.log('Stripe Key Used:', process.env.STRIPE_SECRET_KEY?.substring(0, 7) + '...');
        console.log(`Verifying Stripe Session: ${sessionId}`);

        // 1. Retrieve the session from Stripe
        const session = await stripe.checkout.sessions.retrieve(sessionId);

        if (!session) {
            return NextResponse.json({ error: 'Session not found' }, { status: 404 });
        }

        if (session.payment_status !== 'paid') {
            return NextResponse.json({ 
                status: session.payment_status, 
                message: 'Payment not completed yet' 
            });
        }

        // 2. Process Activation (Same logic as webhook)
        const metadata = session.metadata;
        if (!metadata) {
            return NextResponse.json({ error: 'No metadata found in session' }, { status: 400 });
        }

        const listingId = metadata.listingId !== 'none' ? metadata.listingId : null;
        const userId = metadata.userId;
        const purchaseType = metadata.purchaseType;

        // Check if already completed to avoid redundant work
        const { data: existingPayment } = await supabase
            .from('payments')
            .select('status')
            .eq('stripe_session_id', sessionId)
            .single();

        if (existingPayment?.status === 'completed') {
            return NextResponse.json({ 
                success: true, 
                message: 'Payment already processed' 
            });
        }

        // --- Activation Logic (Mirroring Webhook) ---

        // 1. Handle Bundle Purchase (Credits)
        if (purchaseType === 'bundle' && metadata.monetizationPlanId) {
            const planId = metadata.monetizationPlanId;
            const packageSize = parseInt(metadata.packageSize || '0');

            const { data: mPlan } = await supabase
                .from('monetization_plans')
                .select('category_id, sub_category_id')
                .eq('id', planId)
                .single();

            await supabase
                .from('user_credits')
                .insert({
                    user_id: userId,
                    category_id: mPlan?.category_id,
                    sub_category_id: mPlan?.sub_category_id,
                    remaining_credits: packageSize,
                    total_purchased: packageSize,
                    expires_at: null
                });
        }

        // 2. Handle Listing Activation
        if (listingId && listingId !== 'none' && (metadata.listingFee || purchaseType === 'bundle' || metadata.planType)) {
            const planType = metadata.planType;
            const durationDays = metadata.durationDays ? parseInt(metadata.durationDays) : 0;

            const updateData: any = { status: 'active' };
            
            if (planType && planType !== 'none' && planType !== 'basic_listing') {
                const expiresAt = new Date();
                if (durationDays === -1) {
                    expiresAt.setFullYear(9999, 11, 31);
                } else {
                    expiresAt.setDate(expiresAt.getDate() + (durationDays || 7));
                }
                updateData.boost_plan = planType;
                updateData.boost_expires_at = expiresAt.toISOString();
            }

            await supabase
                .from('listings')
                .update(updateData)
                .eq('id', listingId);

            // Record in ledger
            if (purchaseType === 'bundle' || metadata.listingFee) {
                await supabase.from('listing_ledger').insert({
                    user_id: userId,
                    listing_id: listingId,
                    consumption_type: metadata.listingFee ? 'paid' : 'credit',
                    amount_deducted: metadata.listingFee ? parseFloat(metadata.listingFee) : 1
                });
            }
        }

        // 3. Update payment record
        await supabase
            .from('payments')
            .update({ 
                status: 'completed',
                updated_at: new Date().toISOString()
            })
            .eq('stripe_session_id', sessionId);

        return NextResponse.json({ 
            success: true, 
            message: 'Payment verified and listing activated' 
        });

    } catch (err: any) {
        console.error('Session Verification Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
