import React from "react";
import Link from "next/link";
import { FaArrowLeft } from "react-icons/fa6";
import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import styles from "./layout.module.css";
import UserTabs from "./UserTabs"; // Client component for active tabs

export default async function UserDetailsLayout(props: {
    children: React.ReactNode;
    params: Promise<{ id: string }>;
}) {
    const params = await props.params;
    const { id } = params;
    const { children } = props;
    const supabase = createAdminClient();

    // 1. Fetch profile and auth user data in parallel
    const [profileResponse, authResponse] = await Promise.all([
        supabase.from("profiles").select("full_name, avatar_url").eq("id", id).single(),
        supabase.auth.admin.getUserById(id)
    ]);

    const profile = profileResponse.data;
    const authUser = authResponse.data?.user;

    if (!profile && !authUser) {
        console.error(`User found neither in profiles nor auth for ID ${id}`);
        notFound();
    }

    // 2. Construct a safe user object
    const user = {
        full_name: profile?.full_name || authUser?.user_metadata?.full_name || "Unknown User",
        email: authUser?.email || "No Email",
        avatar_url: profile?.avatar_url || authUser?.user_metadata?.avatar_url || null,
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <Link href="/admin/users" className={styles.backLink}>
                    <FaArrowLeft /> Back to Users
                </Link>
                <div className={styles.userHeader}>
                    <div className={styles.avatarWrapper}>
                        {user.avatar_url ? (
                            <img src={user.avatar_url} alt={user.full_name || "User"} className={styles.avatar} />
                        ) : (
                            <div className={styles.avatarPlaceholder}>
                                {(user.full_name?.[0] || user.email?.[0] || "?").toUpperCase()}
                            </div>
                        )}
                    </div>
                    <div>
                        <h1 className={styles.userName}>{user.full_name || "Unknown Name"}</h1>
                        <p className={styles.userEmail}>{user.email}</p>
                    </div>
                </div>
            </div>

            <UserTabs userId={id} />

            <div className={styles.content}>
                {children}
            </div>
        </div>
    );
}
