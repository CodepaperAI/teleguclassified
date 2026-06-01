"use client";

import { useAppContext } from "@/context/AppContext";
import AdminSidebar from "./AdminSidebar";
import styles from "@/app/(admin)/admin.module.css";

export default function AdminLayoutClient({
    children,
    isAdmin,
    permissions
}: {
    children: React.ReactNode;
    isAdmin: boolean;
    permissions: string[];
}) {
    const { isAdminSidebarOpen, setIsAdminSidebarOpen } = useAppContext();

    return (
        <div className={styles.container}>
            <AdminSidebar isAdmin={isAdmin} permissions={permissions} isOpen={isAdminSidebarOpen} setIsOpen={setIsAdminSidebarOpen} />
            <main className={`${styles.main} ${!isAdminSidebarOpen ? styles.mainCollapsed : ''}`}>
                <div className={styles.content}>
                    {children}
                </div>
            </main>
        </div>
    );
}
