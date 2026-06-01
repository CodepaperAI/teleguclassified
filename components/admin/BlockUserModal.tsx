"use client";

import { useState } from "react";
import styles from "./BlockUserModal.module.css";
import { useRouter } from "next/navigation";
import { useAppContext } from "@/context/AppContext";
import { updateUserRestrictions } from "@/app/(admin)/admin/users/actions";

interface BlockFeatures {
    login?: boolean;
    posting?: boolean;
    chat?: boolean;
}

interface BlockUserModalProps {
    userId: string;
    userName: string;
    initialBlocked: boolean;
    initialFeatures?: BlockFeatures;
    onClose: () => void;
}

export default function BlockUserModal({ userId, userName, initialBlocked, initialFeatures, onClose }: BlockUserModalProps) {
    const [loginBlocked, setLoginBlocked] = useState(!!initialFeatures?.login || (initialBlocked && !initialFeatures));
    const [postingBlocked, setPostingBlocked] = useState(!!initialFeatures?.posting || (initialBlocked && !initialFeatures));
    const [chatBlocked, setChatBlocked] = useState(!!initialFeatures?.chat || (initialBlocked && !initialFeatures));
    
    // Add fullBlock as an overarching state if they just want a complete block
    const [isLoading, setIsLoading] = useState(false);
    const { showConfirm, showToast } = useAppContext();
    const router = useRouter();

    const handleSave = async () => {
        const features = {
            login: loginBlocked,
            posting: postingBlocked,
            chat: chatBlocked
        };
        const isBlockedAny = loginBlocked || postingBlocked || chatBlocked;

        showConfirm(
            "Save Restrictions?",
            `Are you sure you want to update restrictions for ${userName}?`,
            async () => {
                setIsLoading(true);
                try {
                    const result = await updateUserRestrictions(userId, isBlockedAny, features);

                    if (!result.success) throw new Error(result.error);

                    showToast(`Updated restrictions for ${userName}`, "success");
                    onClose();
                } catch (error: any) {
                    console.error("Error saving block features:", error);
                    alert(error.message || "Failed to update user restrictions.");
                } finally {
                    setIsLoading(false);
                }
            }
        );
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <h3 className={styles.title}>Manage Restrictions: {userName}</h3>
                
                <div className={styles.checkboxList}>
                    <label className={styles.checkboxItem}>
                        <input 
                            type="checkbox" 
                            checked={loginBlocked} 
                            onChange={(e) => setLoginBlocked(e.target.checked)} 
                            disabled={isLoading} 
                        />
                        Block from Logging In
                    </label>
                    <label className={styles.checkboxItem}>
                        <input 
                            type="checkbox" 
                            checked={postingBlocked} 
                            onChange={(e) => setPostingBlocked(e.target.checked)} 
                            disabled={isLoading} 
                        />
                        Block from Posting New Ads
                    </label>
                    <label className={styles.checkboxItem}>
                        <input 
                            type="checkbox" 
                            checked={chatBlocked} 
                            onChange={(e) => setChatBlocked(e.target.checked)} 
                            disabled={isLoading} 
                        />
                        Block from Chatting
                    </label>
                </div>

                <div className={styles.actions}>
                    <button className={styles.cancelBtn} onClick={onClose} disabled={isLoading}>
                        Cancel
                    </button>
                    <button className={styles.saveBtn} onClick={handleSave} disabled={isLoading}>
                        {isLoading ? "Saving..." : "Save Restrictions"}
                    </button>
                </div>
            </div>
        </div>
    );
}
