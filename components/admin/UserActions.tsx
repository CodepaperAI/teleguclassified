"use client";

import { useState, useRef, useEffect } from "react";
import { FaEllipsisVertical, FaUser, FaLayerGroup, FaMoneyBillTransfer, FaHeart, FaMessage, FaBan, FaCheck, FaTrash } from "react-icons/fa6";
import styles from "./UserActions.module.css";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useAppContext } from "@/context/AppContext";
import { deleteUser } from "@/app/(admin)/admin/users/actions";
import BlockUserModal from "./BlockUserModal";

export default function UserActions({ userId, isBlocked, userName, blockFeatures }: { userId: string, isBlocked: boolean, userName: string, blockFeatures?: any }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const supabase = createClient();
    const router = useRouter();
    const { showConfirm, showToast } = useAppContext();

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleOpenBlockModal = () => {
        setIsOpen(false);
        setIsBlockModalOpen(true);
    };

    const handleDeleteUser = () => {
        setIsOpen(false);
        showConfirm(
            "Delete User Permanently?",
            `Are you sure you want to delete ${userName}? This action CANNOT be undone. All listings, messages, and associated data for this user will be permanently removed from the platform.`,
            async () => {
                setIsLoading(true);
                try {
                    const result = await deleteUser(userId);
                    if (result.success) {
                        showToast("User deleted successfully", "success");
                        router.refresh();
                    } else {
                        alert(result.error || "Failed to delete user");
                    }
                } catch (error) {
                    console.error("Error in handleDeleteUser:", error);
                    alert("A server error occurred during deletion");
                } finally {
                    setIsLoading(false);
                }
            }
        );
    };

    return (
        <div className={styles.container} ref={dropdownRef}>
            <button
                className={`${styles.triggerBtn} ${isOpen ? styles.active : ''}`}
                onClick={() => setIsOpen(!isOpen)}
                aria-label="User actions"
                disabled={isLoading}
            >
                <FaEllipsisVertical />
            </button>

            {isOpen && (
                <div className={styles.dropdown}>
                    <Link href={`/admin/users/${userId}`} className={styles.item} onClick={() => setIsOpen(false)}>
                        <FaUser className={styles.icon} />
                        Profile
                    </Link>
                    <Link href={`/admin/users/${userId}/listings`} className={styles.item} onClick={() => setIsOpen(false)}>
                        <FaLayerGroup className={styles.icon} />
                        Listings
                    </Link>
                    <Link href={`/admin/users/${userId}/transactions`} className={styles.item} onClick={() => setIsOpen(false)}>
                        <FaMoneyBillTransfer className={styles.icon} />
                        Transactions
                    </Link>
                    <Link href={`/admin/users/${userId}/favorites`} className={styles.item} onClick={() => setIsOpen(false)}>
                        <FaHeart className={styles.icon} />
                        Favorites
                    </Link>
                    <Link href={`/admin/users/${userId}/messages`} className={styles.item} onClick={() => setIsOpen(false)}>
                        <FaMessage className={styles.icon} />
                        Messages
                    </Link>
                    <div className={styles.separator} />
                    <button
                        className={`${styles.item} ${isBlocked ? styles.success : styles.danger}`}
                        onClick={handleOpenBlockModal}
                        disabled={isLoading}
                    >
                        {isBlocked ? (
                            <>
                                <FaCheck className={styles.icon} />
                                Manage Restrictions
                            </>
                        ) : (
                            <>
                                <FaBan className={styles.icon} />
                                Manage Restrictions
                            </>
                        )}
                    </button>
                    <button
                        className={`${styles.item} ${styles.danger}`}
                        onClick={handleDeleteUser}
                        disabled={isLoading}
                    >
                        <FaTrash className={styles.icon} />
                        Delete User
                    </button>
                </div>
            )}

            {isBlockModalOpen && (
                <BlockUserModal 
                    userId={userId}
                    userName={userName}
                    initialBlocked={isBlocked}
                    initialFeatures={blockFeatures}
                    onClose={() => setIsBlockModalOpen(false)}
                />
            )}
        </div>
    );
}
