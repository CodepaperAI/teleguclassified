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
        const body = await req.json();
        const { listingId, planType, listingFee, purchaseType, monetizationPlanId, includeWebsite, websiteFee, professionalJobFee } = body;

        console.log('--- Checkout API Request ---');
        console.log('Stripe Key Used:', process.env.STRIPE_SECRET_KEY?.substring(0, 7) + '...');
        console.log('Listing ID:', listingId);
        console.log('Purchase Type:', purchaseType);
        console.log('Include Website:', includeWebsite, 'Fee:', websiteFee);
        console.log('Professional Job Fee:', professionalJobFee);
        console.log('Listing Fee:', listingFee);
        console.log('Plan Type:', planType);
        console.log('----------------------------');

        // Check global monetization flag
        const { data: siteSettings } = await supabase.from('site_settings').select('is_pricing_enabled, is_hst_enabled').single();
        if (siteSettings && siteSettings.is_pricing_enabled === false) {
            return NextResponse.json({ error: 'Global monetization is currently disabled. All listings are free.' }, { status: 400 });
        }

        const isHstEnabled = siteSettings?.is_hst_enabled || false;

        if (!listingId && purchaseType !== 'bundle') {
            return NextResponse.json({ error: 'Missing listingId' }, { status: 400 });
        }

        let listing = null;
        if (listingId) {
            // Get listing details to ensure it exists and get title
            const { data, error: listingError } = await supabase
                .from('listings')
                .select('title, user_id, listing_fee')
                .eq('id', listingId)
                .single();

            if (listingError || !data) {
                console.error(`Checkout Error: Listing ${listingId} not found. Error:`, listingError);
                return NextResponse.json({
                    error: 'Listing not found',
                    details: listingError?.message,
                    receivedId: listingId
                }, { status: 404 });
            }
            listing = data;
        }

        const lineItems = [];
        let totalAmount = 0;
        let planDetails = null;
        let metadata: any = {
            listingId: listingId || 'none',
            userId: listing?.user_id || '', // We might need to get userId from session if listingId is missing
            purchaseType: purchaseType || 'listing_and_boost'
        };

        // 1. Handle Bundle Purchase
        if (purchaseType === 'bundle' && monetizationPlanId) {
            const { data: mPlan, error: mPlanError } = await supabase
                .from('monetization_plans')
                .select('*')
                .eq('id', monetizationPlanId)
                .single();

            if (mPlanError || !mPlan) {
                return NextResponse.json({ error: 'Invalid monetization plan' }, { status: 400 });
            }

            lineItems.push({
                price_data: {
                    currency: 'cad',
                    product_data: {
                        name: `Listing Bundle: ${mPlan.name}`,
                        description: `Bundle of ${mPlan.package_size} listings for ${mPlan.name}`,
                    },
                    unit_amount: Math.round(mPlan.package_price * 100),
                },
                quantity: 1,
            });
            totalAmount += mPlan.package_price;
            metadata.monetizationPlanId = monetizationPlanId;
            metadata.packageSize = mPlan.package_size.toString();
            // If listingId is provided, we can auto-use one credit after purchase
            metadata.listingId = listingId || 'none';
        }

        // 2. Handle Listing Fee if present (and NOT buying a bundle)
        const effectiveListingFee = listingFee || listing?.listing_fee || 0;
        if (purchaseType !== 'bundle' && effectiveListingFee > 0 && listing) {
            lineItems.push({
                price_data: {
                    currency: 'cad',
                    product_data: {
                        name: `Listing Fee: ${listing.title}`,
                        description: `Fee for Posting in Category/Subcategory (Limit Exceeded)`,
                    },
                    unit_amount: Math.round(effectiveListingFee * 100),
                },
                quantity: 1,
            });
            totalAmount += effectiveListingFee;
            metadata.listingFee = effectiveListingFee.toString();
        }

        // 3. Handle Boost Plan if present and not 'basic_listing'
        if (planType && planType !== 'basic_listing' && listing) {
            const { data: plan, error: planError } = await supabase
                .from('premium_plans')
                .select('*')
                .eq('id', planType)
                .single();

            if (planError || !plan) {
                return NextResponse.json({ error: 'Invalid or missing premium plan' }, { status: 400 });
            }

            planDetails = plan;
            lineItems.push({
                price_data: {
                    currency: 'cad',
                    product_data: {
                        name: `${plan.label}: ${listing.title}`,
                        description: `Increase visibility for your ad: ${listing.title}`,
                    },
                    unit_amount: Math.round(plan.price * 100),
                },
                quantity: 1,
            });
            totalAmount += plan.price;
            metadata.planType = planType;
            metadata.durationDays = planDetails?.duration_days?.toString() || '0';
        }
        
        // 4. Handle Website Fee if present
        if (includeWebsite && websiteFee > 0 && listing) {
            lineItems.push({
                price_data: {
                    currency: 'cad',
                    product_data: {
                        name: `Website Link: ${listing.title}`,
                        description: `Show your website link on your ad listing`,
                    },
                    unit_amount: Math.round(websiteFee * 100),
                },
                quantity: 1,
            });
            totalAmount += Number(websiteFee);
            metadata.includeWebsite = 'true';
            metadata.websiteFee = websiteFee.toString();
        }


        // 6. Handle Professional Job Fee
        if (professionalJobFee > 0 && listing) {
            lineItems.push({
                price_data: {
                    currency: 'cad',
                    product_data: {
                        name: `Professional Job Listing: ${listing.title}`,
                        description: `Fee for professional recruiters/companies`,
                    },
                    unit_amount: Math.round(professionalJobFee * 100),
                },
                quantity: 1,
            });
            totalAmount += Number(professionalJobFee);
            metadata.professionalJobFee = professionalJobFee.toString();
        }

        if (lineItems.length === 0) {
            return NextResponse.json({ error: 'No items to purchase' }, { status: 400 });
        }

        // 7. Apply 13% HST if enabled
        if (isHstEnabled && totalAmount > 0) {
            const hstAmount = totalAmount * 0.13;
            lineItems.push({
                price_data: {
                    currency: 'cad',
                    product_data: {
                        name: 'HST (13%)',
                        description: 'Harmonized Sales Tax',
                    },
                    unit_amount: Math.round(hstAmount * 100),
                },
                quantity: 1,
            });
            metadata.hstAmount = hstAmount.toFixed(2);
            totalAmount += hstAmount;
        }

        // Ensure we have a userId
        if (!metadata.userId) {
            // If not from listing, try to get from user session (we should pass it or get it)
            // For now, let's assume it's passed if listingId is missing
            const { userId } = await (req.clone()).json();
            metadata.userId = userId;
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: lineItems,
            mode: 'payment',
            success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/my-ads?payment=success&type=${purchaseType}&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/my-ads?payment=cancelled&type=${purchaseType}&id=${listingId || 'none'}`,
            metadata: metadata,
        });

        // Create a pending payment record
        const { error: paymentError } = await supabase.from('payments').insert({
            listing_id: listingId || null,
            user_id: metadata.userId,
            stripe_session_id: session.id,
            amount: totalAmount,
            plan_type: purchaseType === 'bundle' ? 'bundle' : (planType === 'basic_listing' ? null : planType),
            status: 'pending',
            metadata: metadata
        });

        if (paymentError) {
            console.error('Database Error (Inserting Payment):', paymentError);
            // We don't necessarily want to block the user if they've already started checkout,
            // but for reliability we should at least log it.
            // If the insert fails, the webhook might have trouble, but it can still work 
            // from the Stripe metadata alone.
        }

        return NextResponse.json({ url: session.url });
    } catch (err: any) {
        console.error('Stripe Checkout Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
