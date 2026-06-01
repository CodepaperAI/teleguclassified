"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition } from "react";
import styles from "./UserSearch.module.css"; // Reuse search styles for consistency? Or page styles?
// Using page styles is cleaner for the toolbar layout but UserSearch.module.css is specific.
// Let's use inline styles or reuse className from page if passed?
// Better: styles specific to this component but matching the theme.

import { UserFilterStatus, UserFilterType } from "@/app/(admin)/admin/users/actions";

export default function UserFilters() {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const { replace } = useRouter();
    const [isPending, startTransition] = useTransition();

    const selectedStatus = searchParams.get('status') as UserFilterStatus || 'all';
    const selectedType = searchParams.get('type') as UserFilterType || 'all';

    const handleFilterChange = (key: 'status' | 'type', value: string) => {
        const params = new URLSearchParams(searchParams);
        params.set("page", "1"); // Reset to page 1 on filter change
        if (value === 'all') {
            params.delete(key);
        } else {
            params.set(key, value);
        }

        startTransition(() => {
            replace(`${pathname}?${params.toString()}`);
        });
    };

    return (
        <div style={{ display: 'flex', gap: '10px' }}>
            <select
                value={selectedStatus}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                style={{
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    backgroundColor: 'white',
                    fontSize: '0.875rem',
                    color: '#64748b',
                    outline: 'none',
                    height: '40px'
                }}
            >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="blocked">Blocked</option>
            </select>

            <select
                value={selectedType}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                style={{
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    backgroundColor: 'white',
                    fontSize: '0.875rem',
                    color: '#64748b',
                    outline: 'none',
                    height: '40px'
                }}
            >
                <option value="all">All Types</option>
                <option value="paid">Paid Users</option>
                <option value="free">Free Users</option>
            </select>
        </div>
    );
}
