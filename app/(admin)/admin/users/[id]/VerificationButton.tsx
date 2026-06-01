"use client";

import { useState } from "react";
import { FaCircleCheck, FaBan, FaSpinner } from "react-icons/fa6";
import { toggleUserVerification } from "@/lib/actions/admin-users";
import styles from "./VerificationButton.module.css";
import Dialog from "@/components/Dialog";

interface VerificationButtonProps {
    userId: string;
    isVerified: boolean;
}

export default function VerificationButton({ userId, isVerified }: VerificationButtonProps) {
    const [showDialog, setShowDialog] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleClick = () => {
        setShowDialog(true);
    };

    const handleConfirm = async () => {
        setShowDialog(false);
        setIsLoading(true);
        try {
            const result = await toggleUserVerification(userId, isVerified);
            if (!result.success) {
                alert("Failed to update status: " + result.error);
            }
        } catch (error) {
            console.error(error);
            alert("An error occurred.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <button
                className={`${styles.button} ${isVerified ? styles.revoke : styles.verify}`}
                onClick={handleClick}
                disabled={isLoading}
            >
                {isLoading ? (
                    <FaSpinner className={styles.spinner} />
                ) : isVerified ? (
                    <>
                        <FaBan /> Revoke Verification
                    </>
                ) : (
                    <>
                        <FaCircleCheck /> Verify User
                    </>
                )}
            </button>

            <Dialog
                isOpen={showDialog}
                title={isVerified ? "Revoke Verification?" : "Verify User?"}
                message={isVerified
                    ? "Are you sure you want to revoke this user's verification status? They will lose their verified badge."
                    : "Are you sure you want to verify this user? This will add a verified badge to their profile."
                }
                type="confirm"
                onConfirm={handleConfirm}
                onCancel={() => setShowDialog(false)}
            />
        </>
    );
}
