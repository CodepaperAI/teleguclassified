"use client";

import { useState, useEffect } from "react";
import { FaPlus, FaTrophy, FaEdit, FaTrash } from "react-icons/fa";
import styles from "./MonetizationManager.module.css";
import { MonetizationPlan, getMonetizationPlans, deletePlan } from "@/lib/actions/admin-plans";
import { formatCurrency } from "@/lib/utils";
import MonetizationPlanModal from "./MonetizationPlanModal";

export default function MonetizationManager() {
    const [plans, setPlans] = useState<MonetizationPlan[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState<MonetizationPlan | null>(null);

    useEffect(() => {
        loadPlans();
    }, []);

    const loadPlans = async () => {
        setLoading(true);
        try {
            const plansData = await getMonetizationPlans();
            setPlans(plansData);
        } catch (error) {
            console.error("Error loading monetization data:", error);
        } finally {
            setLoading(false);
        }
    };


    const handleAdd = () => {
        setEditingPlan(null);
        setIsModalOpen(true);
    };

    const handleEdit = (plan: MonetizationPlan) => {
        setEditingPlan(plan);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete the plan "${name}"? Categories assigned to this plan will revert to free mode.`)) return;

        try {
            await deletePlan(id);
            loadPlans();
        } catch (error) {
            console.error("Error deleting plan:", error);
            alert("Failed to delete plan");
        }
    };

    if (loading) {
        return <div className={styles.loading}>Loading plans...</div>;
    }

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div>
                    <h2 className={styles.title}>Monetization Plans</h2>
                    <p className={styles.description}>Manage pricing tiers and their category coverage.</p>
                </div>
                <button className={styles.addBtn} onClick={handleAdd}>
                    <FaPlus /> Add New Plan
                </button>
            </header>


            <div className={styles.listContainer}>
                {plans.length === 0 ? (
                    <div className={styles.emptyState}>
                        <FaTrophy className={styles.emptyIcon} />
                        <p className={styles.emptyText}>No monetization plans created yet.</p>
                    </div>
                ) : (
                    <table className={styles.plansTable}>
                        <thead>
                            <tr>
                                <th>Plan Name</th>
                                <th>Listing Price</th>
                                <th>Images</th>
                                <th>Coverage</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {plans.map(plan => (
                                <tr key={plan.id}>
                                    <td className={styles.nameCell}>{plan.name}</td>
                                    <td>{formatCurrency(plan.listing_price)}</td>
                                    <td>{plan.paid_image_limit} Max</td>
                                    <td>
                                        <div className={styles.coverageCell}>
                                            {(plan.category_ids?.length || 0) > 0 && (
                                                <span className={styles.listBadge}>{plan.category_ids?.length} Cats</span>
                                            )}
                                            {(plan.sub_category_ids?.length || 0) > 0 && (
                                                <span className={styles.listBadge}>{plan.sub_category_ids?.length} Sub-cats</span>
                                            )}
                                            {(!plan.category_ids?.length && !plan.sub_category_ids?.length) && (
                                                <span className={styles.unassigned}>None</span>
                                            )}
                                        </div>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <div className={styles.listActions}>
                                            <button className={styles.listEditBtn} onClick={() => handleEdit(plan)}>
                                                <FaEdit /> Edit
                                            </button>
                                            <button className={styles.listDeleteBtn} onClick={() => handleDelete(plan.id, plan.name)}>
                                                <FaTrash />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {isModalOpen && (
                <MonetizationPlanModal
                    plan={editingPlan}
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={loadPlans}
                />
            )}
        </div>
    );
}
