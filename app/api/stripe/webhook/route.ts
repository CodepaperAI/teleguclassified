import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { headers } from 'next/headers';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-01-27.acacia' as any,
});

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
    console.log('--- Stripe Webhook Received ---');
    console.log('Stripe Key Used:', process.env.STRIPE_SECRET_KEY?.substring(0, 7) + '...');
    console.log('Webhook Secret Used:', process.env.STRIPE_WEBHOOK_SECRET?.substring(0, 9) + '...');
    const body = await req.arrayBuffer();
    const buffer = Buffer.from(body);
    const signature = (await headers()).get('stripe-signature') as string;

    if (!signature) {
        console.error('Webhook Error: No stripe-signature header');
        return NextResponse.json({ error: 'No stripe-signature header' }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(
            buffer,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!
        );
        console.log(`Webhook Event Verified: ${event.type}`);
    } catch (err: any) {
        console.error(`Webhook Signature Verification Failed: ${err.message}`);
        return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }

    // Handle the event
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;
        const metadata = session.metadata;

        console.log('Metadata:', JSON.stringify(metadata, null, 2));

        if (metadata) {
            const listingId = metadata.listingId !== 'none' ? metadata.listingId : null;
            const userId = metadata.userId;
            const purchaseType = metadata.purchaseType;

            // 1. Handle Bundle Purchase (Credits)
            if (purchaseType === 'bundle' && metadata.monetizationPlanId) {
                const planId = metadata.monetizationPlanId;
                const packageSize = parseInt(metadata.packageSize || '0');

                console.log(`Processing Bundle: User=${userId}, Plan=${planId}, Size=${packageSize}`);

                // Fetch current category/subcategory from planar metadata if stored, 
                // but usually bundles are for specific categories.
                // We need to know which category this credit is for.
                const { data: mPlan } = await supabase
                    .from('monetization_plans')
                    .select('category_id, sub_category_id')
                    .eq('id', planId)
                    .single();

                // UPSERT into user_credits
                const { error: creditError } = await supabase
                    .from('user_credits')
                    .insert({
                        user_id: userId,
                        category_id: mPlan?.category_id,
                        sub_category_id: mPlan?.sub_category_id,
                        remaining_credits: packageSize,
                        total_purchased: packageSize,
                        expires_at: null // For now, bundles don't expire unless specified
                    });

                if (creditError) {
                    console.error('Database Error (Inserting Credits):', creditError);
                }
            }

            // 2. Handle Listing Activation (if fee paid or bundle auto-used)
            if (listingId && listingId !== 'none' && (metadata.listingFee || purchaseType === 'bundle' || metadata.planType)) {
                const planType = metadata.planType;
                const durationDays = metadata.durationDays ? parseInt(metadata.durationDays) : 0;

                console.log(`Processing Activation: Listing=${listingId}, Plan=${planType}, FeePaid=${!!metadata.listingFee}`);

                const updateData: any = { status: 'active' };
                
                // If there's a boost plan, set the expiry
                if (planType && planType !== 'none' && planType !== 'basic_listing') {
                    const expiresAt = new Date();
                    if (durationDays === -1) {
                        expiresAt.setFullYear(9999, 11, 31);
                    } else {
                        expiresAt.setDate(expiresAt.getDate() + (durationDays || 7));
                    }
                    updateData.boost_plan = planType;
                    updateData.boost_expires_at = expiresAt.toISOString();
                    console.log(`Boosting Listing: ${listingId} until ${updateData.boost_expires_at}`);
                }

                const { error: listingError } = await supabase
                    .from('listings')
                    .update(updateData)
                    .eq('id', listingId);

                if (listingError) {
                    console.error('Database Error (Updating Listing):', listingError);
                } else {
                    console.log(`Listing ${listingId} successfully activated.`);
                }

                // Record in ledger for audit
                if (purchaseType === 'bundle' || metadata.listingFee) {
                    const { error: ledgerError } = await supabase.from('listing_ledger').insert({
                        user_id: userId,
                        listing_id: listingId,
                        consumption_type: metadata.listingFee ? 'paid' : 'credit',
                        amount_deducted: metadata.listingFee ? parseFloat(metadata.listingFee) : 1
                    });
                    if (ledgerError) console.error('Ledger Error:', ledgerError);
                }
            }

            // 3. Update payment record
            const { error: paymentError } = await supabase
                .from('payments')
                .update({ 
                    status: 'completed',
                    updated_at: new Date().toISOString()
                })
                .eq('stripe_session_id', session.id);

            if (paymentError) {
                console.error('Database Error (Updating Payment):', paymentError);
            } else {
                console.log(`Payment record for session ${session.id} marked as completed.`);
                
                // --- ADDED: Send Payment Confirmation Email ---
                try {
                    const customerEmail = session.customer_details?.email || session.metadata?.user_email;
                    if (customerEmail) {
                        await supabase.functions.invoke('send-email', {
                            body: {
                                event: 'payment_confirmation',
                                payload: {
                                    to: customerEmail,
                                    order_id: session.id,
                                    amount: ((session.amount_total || 0) / 100).toFixed(2),
                                    plan: metadata.planType || metadata.purchaseType || 'Ad Service'
                                }
                            }
                        });
                        console.log(`Payment confirmation email sent to ${customerEmail}`);
                    }
                } catch (emailErr) {
                    console.error('Error sending payment confirmation email:', emailErr);
                }
                // ----------------------------------------------
            }
        } else {
            console.warn('Webhook warning: Missing metadata');
        }
    } else if (event.type === 'checkout.session.expired') {
        const session = event.data.object as Stripe.Checkout.Session;
        await supabase
            .from('payments')
            .update({ 
                status: 'failed',
                updated_at: new Date().toISOString()
            })
            .eq('stripe_session_id', session.id);
        console.log(`Payment session expired: ${session.id}`);
    }

    return NextResponse.json({ received: true });
}
