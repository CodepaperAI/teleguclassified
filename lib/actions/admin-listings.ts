"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function toggleListingBlockStatus(listingId: string, currentStatus: string) {
    const supabase = createAdminClient();
    const newStatus = currentStatus === "blocked" ? "active" : "blocked";

    try {
        const { error } = await supabase
            .from("listings")
            .update({ status: newStatus })
            .eq("id", listingId);

        if (error) {
            console.error("Error updating listing status:", error);
            return { success: false, error: error.message };
        }

        revalidatePath("/admin/users/[id]/listings");
        revalidatePath("/admin/listings");
        return { success: true, newStatus };
    } catch (err) {
        console.error("Unexpected error:", err);
        return { success: false, error: "An unexpected error occurred." };
    }
}

// Helper to record manual payment for admin actions
async function recordManualPaymentInternal(supabase: any, userId: string, amount: number, planType: string, listingId: string, recordedBy: string) {
    if (amount <= 0) return;

    try {
        const amountInCents = Math.round(amount * 100);
        
        // 1. Insert payment record
        await supabase.from('payments').insert({
            user_id: userId,
            listing_id: listingId,
            amount: amountInCents,
            status: 'completed',
            payment_method: 'manual',
            plan_type: planType,
            currency: 'CAD',
            metadata: {
                notes: `Automatically recorded from Admin action: ${planType}`,
                recorded_by: recordedBy
            }
        });

        // 2. Ensure profile is_paid is true
        await supabase.from('profiles').update({ is_paid: true }).eq('id', userId);
        
    } catch (err) {
        console.error("Error recording automated manual payment:", err);
    }
}

export async function adminCreateListing(userId: string, listingData: any) {
    const supabase = createAdminClient();

    try {
        const { data: { user: adminUser } } = await supabase.auth.getUser();

        // 1. Determine if boost plan is being applied and calculate expiration
        let boostExpiresAt = null;
        if (listingData.boost_plan) {
            const { data: plan } = await supabase
                .from("premium_plans")
                .select("price, label, duration_days")
                .eq("id", listingData.boost_plan)
                .single();
            
            if (plan) {
                // Calculate expiration
                const expiresAt = new Date();
                if (plan.duration_days === -1) {
                    expiresAt.setFullYear(9999, 11, 31);
                } else {
                    expiresAt.setDate(expiresAt.getDate() + (plan.duration_days || 7));
                }
                boostExpiresAt = expiresAt.toISOString();

                // 2. Insert the listing with boost info
                const { data, error } = await supabase
                    .from("listings")
                    .insert({
                        ...listingData,
                        user_id: userId,
                        status: listingData.status || "active",
                        boost_plan: listingData.boost_plan,
                        boost_expires_at: boostExpiresAt,
                        created_at: new Date().toISOString(),
                    })
                    .select()
                    .single();

                if (error) {
                    console.error("Error creating listing by admin:", error);
                    return { success: false, error: error.message };
                }

                // 3. Record manual payment if plan has cost
                if (plan.price > 0) {
                    await recordManualPaymentInternal(
                        supabase, 
                        userId, 
                        plan.price, 
                        plan.label, 
                        data.id, 
                        adminUser?.id || 'admin'
                    );
                }

                revalidatePath("/admin/users/[id]/listings");
                revalidatePath("/admin/listings");
                revalidatePath("/admin"); // Revalidate dashboard stats
                return { success: true, data };
            }
        }

        // Default: No boost plan or plan not found (fallback to standard insert)
        const { data, error } = await supabase
            .from("listings")
            .insert({
                ...listingData,
                user_id: userId,
                status: listingData.status || "active",
                boost_plan: null,
                created_at: new Date().toISOString(),
            })
            .select()
            .single();

        if (error) {
            console.error("Error creating listing by admin (no boost):", error);
            return { success: false, error: error.message };
        }

        revalidatePath("/admin/users/[id]/listings");
        revalidatePath("/admin/listings");
        revalidatePath("/admin"); // Revalidate dashboard stats
        return { success: true, data };
    } catch (err) {
        console.error("Unexpected error in adminCreateListing:", err);
        return { success: false, error: "An unexpected error occurred." };
    }
}

export async function adminUpgradeListingPlan(listingId: string, planId: string) {
    const supabase = createAdminClient();

    try {
        const { data: { user: adminUser } } = await supabase.auth.getUser();

        // 1. Fetch plan details
        const { data: plan, error: planError } = await supabase
            .from("premium_plans")
            .select("*")
            .eq("id", planId)
            .single();

        if (planError || !plan) {
            console.error("Error fetching plan details:", planError);
            return { success: false, error: "Plan not found." };
        }

        // 2. Calculate expiration
        const expiresAt = new Date();
        if (plan.duration_days === -1) {
            expiresAt.setFullYear(9999, 11, 31);
        } else {
            expiresAt.setDate(expiresAt.getDate() + (plan.duration_days || 7));
        }

        // 3. Update listing
        const { data: updatedListing, error: updateError } = await supabase
            .from("listings")
            .update({
                boost_plan: planId,
                boost_expires_at: expiresAt.toISOString(),
            })
            .eq("id", listingId)
            .select("*, profiles(email, full_name)")
            .single();

        if (updateError) {
            console.error("Error upgrading listing plan:", updateError);
            return { success: false, error: updateError.message };
        }

        // 4. Record manual payment if plan has cost
        if (plan.price > 0 && updatedListing.user_id) {
            await recordManualPaymentInternal(
                supabase, 
                updatedListing.user_id, 
                plan.price, 
                plan.label, 
                listingId, 
                adminUser?.id || 'admin'
            );
        }

        // 5. Send Email Notification
        const profile = (updatedListing as any).profiles;
        if (profile?.email) {
            try {
                // Determine base URL for email function call
                const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
                if (baseUrl) {
                    await supabase.functions.invoke('send-email', {
                        body: {
                            event: 'listing_boosted',
                            payload: {
                                to: profile.email,
                                title: updatedListing.title,
                                plan_label: plan.label,
                                id: updatedListing.id
                            }
                        }
                    });
                }
            } catch (emailErr) {
                console.error("Error triggering boost email:", emailErr);
                // Don't fail the whole action if email fails
            }
        }

        revalidatePath("/admin/users/[id]/listings");
        revalidatePath("/admin/listings");
        revalidatePath("/admin"); // Revalidate dashboard stats
        return { success: true };
    } catch (err) {
        console.error("Unexpected error:", err);
        return { success: false, error: "An unexpected error occurred." };
    }
}

export async function adminUpdateListing(listingId: string, listingData: any) {
    const supabase = createAdminClient();

    try {
        const { data: { user: adminUser } } = await supabase.auth.getUser();

        // 1. Fetch current listing to check for plan changes
        const { data: currentListing, error: fetchError } = await supabase
            .from("listings")
            .select("boost_plan, user_id")
            .eq("id", listingId)
            .single();

        if (fetchError || !currentListing) {
            console.error("Error fetching current listing:", fetchError);
            return { success: false, error: "Listing not found." };
        }

        // 2. Handle Plan Change / Upgrade
        const newPlanId = listingData.boost_plan;
        const oldPlanId = currentListing.boost_plan;
        let boostExpiresAt = listingData.boost_expires_at;

        if (newPlanId && newPlanId !== oldPlanId) {
            // New plan selected or changed
            const { data: plan } = await supabase
                .from("premium_plans")
                .select("price, label, duration_days")
                .eq("id", newPlanId)
                .single();

            if (plan) {
                // Calculate new expiration
                const expiresAt = new Date();
                if (plan.duration_days === -1) {
                    expiresAt.setFullYear(9999, 11, 31);
                } else {
                    expiresAt.setDate(expiresAt.getDate() + (plan.duration_days || 7));
                }
                boostExpiresAt = expiresAt.toISOString();

                // Record manual payment if new plan is paid
                if (plan.price > 0 && currentListing.user_id) {
                    await recordManualPaymentInternal(
                        supabase, 
                        currentListing.user_id, 
                        plan.price, 
                        plan.label, 
                        listingId, 
                        adminUser?.id || 'admin'
                    );
                }
            }
        } else if (!newPlanId) {
            // Plan removed
            boostExpiresAt = null;
        }

        // 3. Update the listing
        const { error: updateError } = await supabase
            .from("listings")
            .update({
                ...listingData,
                boost_expires_at: boostExpiresAt,
                updated_at: new Date().toISOString()
            })
            .eq("id", listingId);

        if (updateError) {
            console.error("Error updating listing by admin:", updateError);
            return { success: false, error: updateError.message };
        }

        revalidatePath("/admin/users/[id]/listings");
        revalidatePath("/admin/listings");
        revalidatePath("/admin/listings/" + listingId);
        revalidatePath("/admin");
        return { success: true };
    } catch (err) {
        console.error("Unexpected error in adminUpdateListing:", err);
        return { success: false, error: "An unexpected error occurred." };
    }
}


export async function adminDeleteListing(listingId: string) {
    const supabase = createAdminClient();

    try {
        const { error } = await supabase
            .from("listings")
            .delete()
            .eq("id", listingId);

        if (error) {
            console.error("Error deleting listing by admin:", error);
            return { success: false, error: error.message };
        }

        revalidatePath("/admin/users/[id]/listings");
        return { success: true };
    } catch (err) {
        console.error("Unexpected error:", err);
        return { success: false, error: "An unexpected error occurred." };
    }
}
