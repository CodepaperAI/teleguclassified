"use client";

import { useState, useTransition } from "react";
// Dialog components might need to resolve to correct paths.
// Let's assume standard Shadcn UI paths or custom ones. 
// Checking for UI components... skipping check as I see `Badge` in `ui-custom`.
// I'll implement a simple modal if Dialog is not found, or assume standard.
// Actually, I should check if Dialog exists.
// Wait, I saw `Dialog` being used in `AppContext.tsx` or similar? No, I implemented `BlockUser` modal logic manually?
// No, I'll use a standard HTML dialog or a simple overlay if no library is present.
// Let's check for existing UI components first.

// Correction: I don't see a `components/ui` folder in the file list I've seen so far.
// Let's create a custom modal for now to be safe and dependency-free.

import { FaXmark } from "react-icons/fa6";
import styles from "./PlanFormModal.module.css";
import { createPlan, updatePlan, Plan } from "@/app/(admin)/admin/plans/actions";

interface PlanFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    planToEdit?: Plan | null;
}

export default function PlanFormModal({ isOpen, onClose, planToEdit }: PlanFormModalProps) {
    const [isPending, startTransition] = useTransition();
    const [noExpiry, setNoExpiry] = useState(planToEdit?.duration_days === -1);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);

        const durationVal = noExpiry ? -1 : Number(formData.get("duration"));

        const data = {
            label: formData.get("label") as string,
            price: Number(formData.get("price")),
            duration_days: durationVal,
            description: formData.get("description") as string,
            is_recommended: formData.get("is_recommended") === "on",
        };

        startTransition(async () => {
            try {
                if (planToEdit) {
                    await updatePlan(planToEdit.id, data);
                } else {
                    await createPlan(data);
                }
                onClose();
            } catch (error) {
                console.error("Failed to save plan:", error);
                alert("Failed to save plan. Please try again.");
            }
        });
    };

    if (!isOpen) return null;

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <h2 className={styles.title}>{planToEdit ? "Edit Plan" : "Add New Plan"}</h2>
                    <button onClick={onClose} className={styles.closeBtn}>
                        <FaXmark />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.formGroup}>
                        <label htmlFor="label">Plan Name</label>
                        <input
                            id="label"
                            name="label"
                            defaultValue={planToEdit?.label}
                            required
                            placeholder="e.g. Standard, Premium"
                        />
                    </div>

                    <div className={styles.row}>
                        <div className={styles.formGroup}>
                            <label htmlFor="price">Price ($)</label>
                            <input
                                id="price"
                                name="price"
                                type="number"
                                step="0.01"
                                defaultValue={planToEdit?.price}
                                required
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <label htmlFor="duration" style={{ marginBottom: 0 }}>Duration (Days)</label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={noExpiry}
                                        onChange={(e) => setNoExpiry(e.target.checked)}
                                    />
                                    No Expiry
                                </label>
                            </div>
                            <input
                                id="duration"
                                name="duration"
                                type="number"
                                defaultValue={planToEdit?.duration_days === -1 ? "" : planToEdit?.duration_days}
                                disabled={noExpiry}
                                required={!noExpiry}
                                placeholder={noExpiry ? "Unlimited" : "30"}
                            />
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                name="is_recommended"
                                defaultChecked={planToEdit?.is_recommended}
                            />
                            Is Recommended Plan
                        </label>
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="description">Description</label>
                        <textarea
                            id="description"
                            name="description"
                            defaultValue={planToEdit?.description}
                            rows={3}
                            placeholder="Reason to buy this plan..."
                        />
                    </div>

                    <div className={styles.footer}>
                        <button type="button" onClick={onClose} className={styles.cancelBtn}>
                            Cancel
                        </button>
                        <button type="submit" disabled={isPending} className={styles.submitBtn}>
                            {isPending ? "Saving..." : (planToEdit ? "Update Plan" : "Create Plan")}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
