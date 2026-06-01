"use client";

import { useState, useTransition, useEffect } from "react";
import { FaXmark, FaRocket } from "react-icons/fa6";
import styles from "./AdminModals.module.css";
import { adminUpgradeListingPlan } from "@/lib/actions/admin-listings";

interface UpgradePlanModalProps {
    isOpen: boolean;
    onClose: () => void;
    listingId: string;
    listingTitle: string;
    currentPlanId?: string;
    plans: any[];
}

export default function UpgradePlanModal({ isOpen, onClose, listingId, listingTitle, currentPlanId, plans }: UpgradePlanModalProps) {
    const [isPending, startTransition] = useTransition();
    const [selectedPlanId, setSelectedPlanId] = useState("");

    // Update selected plan when modal opens or listing changes
    useEffect(() => {
        if (isOpen) {
            setSelectedPlanId(currentPlanId || "");
        }
    }, [isOpen, currentPlanId]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!selectedPlanId) return;

        startTransition(async () => {
            const result = await adminUpgradeListingPlan(listingId, selectedPlanId);
            if (result.success) {
                onClose();
            } else {
                alert("Failed to upgrade plan: " + result.error);
            }
        });
    };

    if (!isOpen) return null;

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <h2 className={styles.title}>Upgrade Plan (Boost Ad)</h2>
                    <button onClick={onClose} className={styles.closeBtn}>
                        <FaXmark />
                    </button>
                </div>

                <div className={styles.info}>
                    Boosting: <strong>{listingTitle}</strong>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.formGroup}>
                        <label htmlFor="plan">Select Boost Plan</label>
                        <select 
                            id="plan" 
                            required 
                            value={selectedPlanId} 
                            onChange={(e) => setSelectedPlanId(e.target.value)}
                        >
                            <option value="">Select Plan</option>
                            {plans.map(plan => (
                                <option key={plan.id} value={plan.id}>
                                    {plan.label} - ${plan.price === 0 ? "Free" : plan.price} ({plan.duration_days === -1 ? "No Expiry" : `${plan.duration_days} Days`}) {plan.id === currentPlanId ? "(Current)" : ""}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.formNote}>
                        <FaRocket /> This will instantly boost the listing and send a notification email to the user.
                    </div>

                    <div className={styles.footer}>
                        <button type="button" onClick={onClose} className={styles.cancelBtn}>
                            Cancel
                        </button>
                        <button type="submit" disabled={isPending || !selectedPlanId} className={styles.submitBtn}>
                            {isPending ? "Upgrading..." : "Confirm Upgrade"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
