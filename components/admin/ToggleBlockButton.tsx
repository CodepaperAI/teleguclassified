"use client";

import { useState } from "react";
import { toggleListingBlockStatus } from "@/app/actions/admin";
import styles from "./ToggleBlockButton.module.css";
import { useAppContext } from "@/context/AppContext";

interface Props {
    listingId: string;
    initialStatus: string;
}

export default function ToggleBlockButton({ listingId, initialStatus }: Props) {
    const [status, setStatus] = useState(initialStatus);
    const [loading, setLoading] = useState(false);
    const { showConfirm } = useAppContext();
    const isBlocked = status === 'blocked';

    const toggleBlock = async () => {
        const action = isBlocked ? 'unblock' : 'block';
        
        showConfirm(
            `${action.charAt(0).toUpperCase() + action.slice(1)} Listing?`,
            `Are you sure you want to ${action} this listing? The user will be notified of this change.`,
            async () => {
                setLoading(true);
                try {
                    const result = await toggleListingBlockStatus(listingId, status);

                    if (result.error) {
                        console.error(result.error);
                        alert(result.error);
                        return;
                    }

                    if (result.success && result.newStatus) {
                        setStatus(result.newStatus);
                    }
                } catch (error) {
                    console.error("Error updating status:", error);
                    alert("Failed to update status");
                } finally {
                    setLoading(false);
                }
            }
        );
    };

    return (
        <button
            onClick={toggleBlock}
            disabled={loading}
            className={`${styles.btn} ${isBlocked ? styles.unblock : styles.block}`}
        >
            {loading ? '...' : (isBlocked ? 'Unblock' : 'Block')}
        </button>
    );
}
