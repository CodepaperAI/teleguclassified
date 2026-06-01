"use client";

import { useState, useTransition } from "react";
import { Plan, togglePlanStatus } from "@/app/(admin)/admin/plans/actions";
import { Badge } from "@/components/ui-custom/Badge";
import styles from "./PlansTable.module.css";
import { FaPen, FaBan, FaCheck, FaTrash } from "react-icons/fa6";
import PlanFormModal from "./PlanFormModal";

interface PlansTableProps {
    initialPlans: Plan[];
}

export default function PlansTable({ initialPlans }: PlansTableProps) {
    const [plans, setPlans] = useState<Plan[]>(initialPlans);
    const [isPending, startTransition] = useTransition();
    const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleToggleStatus = (id: string, currentStatus: boolean, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm(`Are you sure you want to ${currentStatus ? 'deactivate' : 'activate'} this plan?`)) return;

        startTransition(async () => {
            try {
                await togglePlanStatus(id, currentStatus);
                // Optimistic update
                setPlans(prev => prev.map(p =>
                    p.id === id ? { ...p, is_active: !currentStatus } : p
                ));
            } catch (error) {
                console.error("Error toggling status:", error);
                alert("Failed to update status");
            }
        });
    };

    const handleEdit = (plan: Plan) => {
        setEditingPlan(plan);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingPlan(null);
        // Refresh page or re-fetch plans? 
        // For simplicity, we can let the server action revalidatePath handle it, 
        // but since we are preserving state here, we might need to sync.
        // Actually, revalidatePath will refresh the server component, but this client component 
        // might not update unless the parent re-renders/passes new props.
        // Let's assume the page will refresh.
        window.location.reload();
    };

    return (
        <div className={styles.container}>
            <button
                className={styles.addBtn}
                onClick={() => { setEditingPlan(null); setIsModalOpen(true); }}
            >
                + Add Plan
            </button>

            <div className={styles.tableReflow}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Label</th>
                            <th>Price</th>
                            <th>Duration (Days)</th>
                            <th>Status</th>
                            <th>Description</th>
                            <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {plans.map((plan) => (
                            <tr key={plan.id}>
                                <td style={{ fontWeight: 600 }}>{plan.label}</td>
                                <td>${plan.price}</td>
                                <td>{plan.duration_days === -1 ? <span className={styles.unlimited}>Unlimited</span> : `${plan.duration_days} days`}</td>
                                <td>
                                    <Badge variant={plan.is_active ? "active" : "inactive"}>
                                        {plan.is_active ? "Active" : "Inactive"}
                                    </Badge>
                                </td>
                                <td className={styles.description}>{plan.description || "-"}</td>
                                <td style={{ textAlign: 'right' }}>
                                    <div className={styles.actions}>
                                        <button
                                            onClick={() => handleEdit(plan)}
                                            className={`${styles.actionBtn} ${styles.edit}`}
                                            title="Edit"
                                        >
                                            <FaPen />
                                        </button>
                                        <button
                                            onClick={(e) => handleToggleStatus(plan.id, !!plan.is_active, e)}
                                            className={`${styles.actionBtn} ${plan.is_active ? styles.block : styles.activate}`}
                                            title={plan.is_active ? "Deactivate" : "Activate"}
                                        >
                                            {plan.is_active ? <FaBan /> : <FaCheck />}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {plans.length === 0 && (
                            <tr>
                                <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                                    No plans found. Create one to get started.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <PlanFormModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                planToEdit={editingPlan}
            />
        </div>
    );
}
