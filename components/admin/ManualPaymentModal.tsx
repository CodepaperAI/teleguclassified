"use client";

import { useState } from "react";
import Dialog from "@/components/Dialog";
import { getUsers } from "@/app/(admin)/admin/users/actions";
import { addManualPayment } from "@/app/(admin)/admin/payments/actions";
import { FaMagnifyingGlass, FaSpinner, FaCircleCheck } from "react-icons/fa6";
import styles from "./UserSearchModal.module.css"; // Reuse search styles
import localStyles from "./ManualPaymentModal.module.css";

interface ManualPaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export default function ManualPaymentModal({ isOpen, onClose, onSuccess }: ManualPaymentModalProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [results, setResults] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any | null>(null);
    
    // Form fields
    const [amount, setAmount] = useState("");
    const [planType, setPlanType] = useState("manual_listing");
    const [notes, setNotes] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchTerm.trim()) return;

        setIsLoading(true);
        try {
            const { users } = await getUsers({ search: searchTerm, page: 1 });
            setResults(users);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRecordPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser || !amount) return;

        setIsSubmitting(true);
        try {
            await addManualPayment({
                userId: selectedUser.id,
                amount: parseFloat(amount),
                planType,
                notes
            });
            alert("Payment recorded successfully!");
            onSuccess?.();
            onClose();
        } catch (error: any) {
            alert(`Failed: ${error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog isOpen={isOpen} onClose={onClose} title="Record Manual Payment">
            <div className={localStyles.container}>
                {!selectedUser ? (
                    <div className={localStyles.searchSection}>
                        <label className={localStyles.label}>Find User</label>
                        <form className={styles.searchBox} onSubmit={handleSearch}>
                            <input
                                type="text"
                                placeholder="Search by name or email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                autoFocus
                            />
                            <button type="submit" disabled={isLoading}>
                                {isLoading ? <FaSpinner className={styles.spinner} /> : <FaMagnifyingGlass />}
                            </button>
                        </form>

                        <div className={styles.resultsList}>
                            {isLoading ? (
                                <div className={styles.loadingState}>Searching...</div>
                            ) : results.length === 0 && searchTerm ? (
                                <div className={styles.emptyState}>No users found.</div>
                            ) : (
                                results.map(user => (
                                    <div key={user.id} className={styles.resultItem}>
                                        <div className={styles.userInfo}>
                                            <div className={styles.userName}>{user.full_name || "Unknown Name"}</div>
                                            <div className={styles.userEmail}>{user.email}</div>
                                        </div>
                                        <button className={localStyles.selectBtn} onClick={() => setSelectedUser(user)}>
                                            Select
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                ) : (
                    <form className={localStyles.form} onSubmit={handleRecordPayment}>
                        <div className={localStyles.selectedUserCard}>
                            <div className={localStyles.userHeader}>
                                <strong>Selected User:</strong>
                                <button type="button" onClick={() => setSelectedUser(null)} className={localStyles.changeUserBtn}>Change</button>
                            </div>
                            <div>{selectedUser.full_name} ({selectedUser.email})</div>
                        </div>

                        <div className={localStyles.inputGroup}>
                            <label>Amount (CAD)</label>
                            <input 
                                type="number" 
                                step="0.01" 
                                required 
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0.00"
                            />
                        </div>

                        <div className={localStyles.inputGroup}>
                            <label>Plan Type / Reference</label>
                            <select value={planType} onChange={(e) => setPlanType(e.target.value)}>
                                <option value="manual_listing">Manual Listing Fee</option>
                                <option value="boost_plan">Boost Plan</option>
                                <option value="bundle">Listing Bundle</option>
                                <option value="other">Other</option>
                            </select>
                        </div>

                        <div className={localStyles.inputGroup}>
                            <label>Internal Notes</label>
                            <textarea 
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="e.g. Cash payment, bank transfer ref..."
                                rows={3}
                            />
                        </div>

                        <button type="submit" className={localStyles.submitBtn} disabled={isSubmitting}>
                            {isSubmitting ? <FaSpinner className={localStyles.spinner} /> : <FaCircleCheck />}
                            {isSubmitting ? " Recording..." : " Record Payment"}
                        </button>
                    </form>
                )}
            </div>
        </Dialog>
    );
}
