import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import UserSearch from "@/components/admin/UserSearch";
import UserActions from "@/components/admin/UserActions";
import UsersTable from "@/components/admin/UsersTable";
import UserFilters from "@/components/admin/UserFilters";
import { UserFilterStatus, UserFilterType } from "./actions";
import { Badge } from "@/components/ui-custom/Badge";
import { FaUser, FaEnvelope, FaPhone, FaCalendar, FaClock } from "react-icons/fa6";
import styles from "./page.module.css";

export default async function AdminUsersPage(props: {
    searchParams: Promise<{ q?: string; page?: string; status?: string; type?: string }>;
}) {
    const searchParams = await props.searchParams;
    const query = searchParams?.q || "";
    const currentPage = Number(searchParams?.page) || 1;
    const itemsPerPage = 20;

    const statusFilter = (searchParams?.status as UserFilterStatus) || 'all';
    const typeFilter = (searchParams?.type as UserFilterType) || 'all';

    const supabase = await createClient();

    const { data: users, error } = await supabase.rpc("search_users", {
        search_term: query,
        page_number: currentPage,
        items_per_page: itemsPerPage,
        filter_status: statusFilter,
        filter_type: typeFilter
    });

    if (error) {
        console.error("Error fetching users:", error);
        return (
            <div className={styles.pageContainer}>
                <div style={{ padding: '20px', background: '#ffebee', color: '#c62828', borderRadius: '8px' }}>
                    <h3 style={{ fontWeight: 'bold' }}>Error loading users</h3>
                    <p>{error.message}</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.pageContainer}>
            <div className={styles.header}>
                <h1 className={styles.title}>User Management</h1>
                <p className={styles.subtitle}>Manage platform users, view details, and monitor activity.</p>
            </div>

            <div className={styles.card}>
                <div className={styles.toolbar} style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '300px' }}>
                        <Suspense fallback={<div>Loading search...</div>}>
                            <UserSearch />
                        </Suspense>
                    </div>
                    <Suspense fallback={<div>Loading filters...</div>}>
                        <UserFilters />
                    </Suspense>
                </div>

                <UsersTable
                    initialUsers={users || []}
                    currentFilterStatus={statusFilter}
                    currentFilterType={typeFilter}
                />
            </div>
        </div>
    );
}
