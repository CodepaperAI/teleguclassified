"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui-custom/Badge";
import { FaUser, FaEnvelope, FaPhone, FaCalendar, FaClock } from "react-icons/fa6";
import UserActions from "./UserActions";
import styles from "@/app/(admin)/admin/users/page.module.css"; // Reuse existing styles
import { getUsers, UserFilterStatus, UserFilterType } from "@/app/(admin)/admin/users/actions";

interface User {
    id: string;
    email: string;
    phone: string;
    full_name: string;
    avatar_url: string;
    is_blocked: boolean;
    is_paid: boolean;
    is_admin?: boolean;
    created_at: string;
    last_sign_in_at: string | null;
    block_features: any;
    auth_provider: string | null;
}

interface UsersTableProps {
    initialUsers: User[];
    currentFilterStatus: UserFilterStatus;
    currentFilterType: UserFilterType;
}

export default function UsersTable({ initialUsers, currentFilterStatus, currentFilterType }: UsersTableProps) {
    const [users, setUsers] = useState<User[]>(initialUsers);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(initialUsers.length === 20);
    const [isPending, startTransition] = useTransition();
    const searchParams = useSearchParams();

    // Sync users when initialUsers changes (due to URL filter/search changes)
    // This handles the "first page" reload.
    // We also need to reset page count and check hasMore.
    // Actually, useeffect is better here.
    const [prevInitialUsers, setPrevInitialUsers] = useState(initialUsers);
    if (initialUsers !== prevInitialUsers) {
        setUsers(initialUsers);
        setPrevInitialUsers(initialUsers);
        setPage(1);
        setHasMore(initialUsers.length === 20);
    }

    const loadUsers = () => {
        const newPage = page + 1;
        const currentSearch = searchParams.get('q') || "";

        startTransition(async () => {
            try {
                const { users: newUsers, hasMore: moreAvailable } = await getUsers({
                    page: newPage,
                    search: currentSearch,
                    filterStatus: currentFilterStatus,
                    filterType: currentFilterType
                });

                setUsers(prev => [...prev, ...newUsers]);
                setPage(newPage);
                setHasMore(moreAvailable);
            } catch (error) {
                console.error("Error loading users:", error);
                alert("Failed to load users");
            }
        });
    };

    return (
        <div>
            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>User</th>
                            <th>Status</th>
                            <th>Type</th>
                            <th>Contact Info</th>
                            <th>Joined</th>
                            <th>Last Active</th>
                            <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.length === 0 ? (
                            <tr>
                                <td colSpan={7} className={styles.emptyState}>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                                        <FaUser style={{ fontSize: '2rem', color: '#ddd' }} />
                                        <p>No users found matching your filters.</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            users.map((user) => (
                                <tr key={user.id}>
                                    <td>
                                        <div className={styles.userInfo}>
                                            {user.avatar_url ? (
                                                <img
                                                    src={user.avatar_url}
                                                    alt=""
                                                    className={styles.avatar}
                                                />
                                            ) : (
                                                <div className={styles.avatarPlaceholder}>
                                                    {(user.full_name?.[0] || user.email?.[0] || "?").toUpperCase()}
                                                </div>
                                            )}
                                            <div>
                                                <span className={styles.userName}>{user.full_name || "Unknown Name"}</span>
                                                <span className={styles.userId}>
                                                    Provider: {user.auth_provider ? user.auth_provider.charAt(0).toUpperCase() + user.auth_provider.slice(1) : "Unknown"}
                                                </span>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <Badge variant={user.is_blocked ? "destructive" : "active"}>
                                            {user.is_blocked ? "Blocked" : "Active"}
                                        </Badge>
                                    </td>
                                    <td>
                                        <Badge variant={user.is_paid ? "premium" : "outline"}>
                                            {user.is_paid ? "Paid" : "Free"}
                                        </Badge>
                                    </td>
                                    <td>
                                        <div className={styles.contactInfo}>
                                            <div className={styles.contactItem}>
                                                <FaEnvelope size={12} />
                                                <span>{user.email || "No email"}</span>
                                            </div>
                                            <div className={styles.contactItem}>
                                                <FaPhone size={12} />
                                                <span>{user.phone || "No phone"}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className={styles.contactItem}>
                                            <FaCalendar size={12} />
                                            <span>
                                                {user.created_at ? new Date(user.created_at).toLocaleDateString(undefined, {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric'
                                                }) : 'N/A'}
                                            </span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className={styles.contactItem}>
                                            <FaClock size={12} />
                                            <span>
                                                {user.last_sign_in_at
                                                    ? new Date(user.last_sign_in_at).toLocaleDateString(undefined, {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })
                                                    : "Never"}
                                            </span>
                                        </div>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <UserActions 
                                            userId={user.id} 
                                            isBlocked={user.is_blocked} 
                                            userName={user.full_name || "User"} 
                                            blockFeatures={user.block_features}
                                        />
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {hasMore && (
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
                    <button
                        onClick={loadUsers}
                        disabled={isPending}
                        className={styles.navBtn}
                        style={{ padding: '10px 20px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                        {isPending ? 'Loading...' : 'Load More'}
                    </button>
                </div>
            )}
        </div>
    );
}
