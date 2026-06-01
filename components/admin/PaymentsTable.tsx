"use client";

import { useState, useEffect } from "react";
import { getPayments, PaymentRecord, DateFilter } from "@/app/(admin)/admin/payments/actions";
import styles from "./PaymentsTable.module.css";
import { FaSpinner, FaCalendarAlt } from "react-icons/fa";
import { formatCurrency } from "@/lib/utils";

export default function PaymentsTable() {
    const [payments, setPayments] = useState<PaymentRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<DateFilter>('this_month');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const loadPayments = async () => {
        // If custom filter is selected but dates are missing, don't fetch and clear current data
        if (filter === 'custom' && (!startDate || !endDate)) {
            setPayments([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const data = await getPayments(filter, startDate, endDate);
            setPayments(data);
        } catch (error) {
            console.error("Failed to load payments", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPayments();
    }, [filter, startDate, endDate]); // Reload when filters change

    const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setFilter(e.target.value as DateFilter);
        // Reset custom dates on switch
        if (e.target.value !== 'custom') {
            setStartDate('');
            setEndDate('');
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-CA', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const totalAmount = payments.reduce((sum, payment) => sum + payment.amount, 0);

    return (
        <div className={styles.tableContainer}>
            <div className={styles.controls}>
                <div className={styles.filters}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FaCalendarAlt color="#6b7280" />
                        <select
                            value={filter}
                            onChange={handleFilterChange}
                            className={styles.filterSelect}
                        >
                            <option value="today">Today</option>
                            <option value="yesterday">Yesterday</option>
                            <option value="this_month">This Month</option>
                            <option value="last_month">Last Month</option>
                            <option value="this_year">This Year</option>
                            <option value="custom">Custom Range</option>
                        </select>
                    </div>

                    {filter === 'custom' && (
                        <div className={styles.dateRange}>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className={styles.dateInput}
                            />
                            <span>to</span>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className={styles.dateInput}
                            />
                        </div>
                    )}
                </div>

                <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.9rem', color: '#6b7280', alignItems: 'center' }}>
                    <div>Total Transactions: <strong style={{ color: '#111827' }}>{payments.length}</strong></div>
                    <div>Total Amount: <strong style={{ color: '#059669', fontSize: '1rem' }}>{formatCurrency(totalAmount / 100)}</strong></div>
                </div>
            </div>

            {loading ? (
                <div className={styles.noData}>
                    <FaSpinner className="animate-spin" style={{ fontSize: '2rem', color: '#2563eb' }} />
                    <p style={{ marginTop: '1rem' }}>Loading payments...</p>
                </div>
            ) : payments.length === 0 ? (
                <div className={styles.noData}>
                    No payments found for the selected period.
                </div>
            ) : (
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>User</th>
                            <th>Plan</th>
                            <th>Method</th>
                            <th>Amount</th>
                            <th>Status</th>
                            <th>Reference</th>
                        </tr>
                    </thead>
                    <tbody>
                        {payments.map((payment) => (
                            <tr key={payment.id}>
                                <td>{formatDate(payment.created_at)}</td>
                                <td>
                                    <div className={styles.userCell}>
                                        {payment.user ? (
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <a
                                                    href={`/admin/users/${payment.user.id}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className={styles.userName}
                                                    style={{ textDecoration: 'none', color: '#2563eb', fontWeight: 'bold' }}
                                                    onMouseOver={(e) => e.currentTarget.style.textDecoration = 'underline'}
                                                    onMouseOut={(e) => e.currentTarget.style.textDecoration = 'none'}
                                                >
                                                    {payment.user.full_name || 'Guest'}
                                                </a>
                                                <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>{payment.user.email}</span>
                                            </div>
                                        ) : (
                                            <span className={styles.userName}>Guest</span>
                                        )}
                                    </div>
                                </td>
                                <td style={{ textTransform: 'capitalize' }}>{payment.plan_type}</td>
                                <td>
                                    <span className={`${styles.method} ${payment.payment_method === 'manual' ? styles.methodManual : styles.methodStripe}`}>
                                        {payment.payment_method === 'manual' ? 'Manual' : 'Stripe'}
                                    </span>
                                </td>
                                <td>
                                    <span className={styles.amount}>
                                        {formatCurrency(payment.amount / 100)}
                                    </span>
                                </td>
                                <td>
                                    <span className={`${styles.status} ${payment.status === 'completed' ? styles.statusCompleted :
                                        payment.status === 'pending' ? styles.statusPending : styles.statusFailed
                                        }`}>
                                        {payment.status}
                                    </span>
                                </td>
                                <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#6b7280' }}>
                                    {payment.payment_method === 'manual' ? 'MANUAL' : (payment.stripe_session_id ? `${payment.stripe_session_id.substring(0, 10)}...` : '-')}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}
