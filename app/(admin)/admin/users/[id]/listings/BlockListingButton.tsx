"use client";

import { useState } from "react";
import { FaBan, FaCircleCheck, FaSpinner, FaShieldHalved } from "react-icons/fa6";
import { toggleListingBlockStatus } from "@/lib/actions/admin-listings";
import Dialog from "@/components/Dialog";
import styles from "./BlockListingButton.module.css"; // We'll assume simple styles or inline

interface BlockListingButtonProps {
    listingId: string;
    currentStatus: string;
}

export default function BlockListingButton({ listingId, currentStatus }: BlockListingButtonProps) {
    const [showDialog, setShowDialog] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const isBlocked = currentStatus === "blocked";

    const handleConfirm = async () => {
        setShowDialog(false);
        setIsLoading(true);
        try {
            const result = await toggleListingBlockStatus(listingId, currentStatus);
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
                onClick={() => setShowDialog(true)}
                className={`p-2 rounded-md transition-colors ${isBlocked
                        ? "text-emerald-500 hover:bg-emerald-50 hover:text-emerald-600"
                        : "text-red-500 hover:bg-red-50 hover:text-red-600"
                    }`}
                title={isBlocked ? "Unblock Listing" : "Block Listing"}
                disabled={isLoading}
            >
                {isLoading ? (
                    <FaSpinner className="animate-spin" />
                ) : isBlocked ? (
                    <FaCircleCheck />
                ) : (
                    <FaBan />
                )}
            </button>

            <Dialog
                isOpen={showDialog}
                title={isBlocked ? "Unblock Listing?" : "Block Listing?"}
                message={isBlocked
                    ? "Are you sure you want to unblock this listing? It will become visible to buyers again."
                    : "Are you sure you want to block this listing? It will be hidden from buyers."
                }
                type="confirm"
                onConfirm={handleConfirm}
                onCancel={() => setShowDialog(false)}
            />
        </>
    );
}
