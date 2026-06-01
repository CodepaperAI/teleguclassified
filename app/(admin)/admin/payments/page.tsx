"use client";

import { useState } from "react";
import PaymentsTable from "@/components/admin/PaymentsTable";
import ManualPaymentModal from "@/components/admin/ManualPaymentModal";
import { MdPayments, MdAdd } from "react-icons/md";

export default function PaymentsPage() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '2rem'
            }}>
                <h1 style={{
                    fontSize: '1.875rem',
                    fontWeight: '700',
                    color: '#111827',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    margin: 0
                }}>
                    <MdPayments style={{ color: '#2563eb' }} />
                    Payments History
                </h1>

                <button 
                    onClick={() => setIsModalOpen(true)}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.625rem 1rem',
                        background: '#2563eb',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.5rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                    }}
                >
                    <MdAdd size={20} />
                    Record Manual Payment
                </button>
            </div>

            <PaymentsTable key={refreshKey} />

            <ManualPaymentModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={() => setRefreshKey(prev => prev + 1)}
            />
        </div>
    );
}
