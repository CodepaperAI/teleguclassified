"use client";

import { useState } from "react";
import { FaTrashCan, FaSpinner } from "react-icons/fa6";
import { adminDeleteListing } from "@/lib/actions/admin-listings";
import Dialog from "@/components/Dialog";

interface DeleteListingButtonProps {
    listingId: string;
    listingTitle: string;
}

export default function DeleteListingButton({ listingId, listingTitle }: DeleteListingButtonProps) {
    const [showDialog, setShowDialog] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleConfirm = async () => {
        setShowDialog(false);
        setIsLoading(true);
        try {
            const result = await adminDeleteListing(listingId);
            if (!result.success) {
                alert("Failed to delete listing: " + result.error);
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
                className="p-2 rounded-md transition-colors text-red-500 hover:bg-red-50 hover:text-red-700"
                title="Delete Listing"
                disabled={isLoading}
            >
                {isLoading ? (
                    <FaSpinner className="animate-spin" />
                ) : (
                    <FaTrashCan />
                )}
            </button>

            <Dialog
                isOpen={showDialog}
                title="Delete Listing?"
                message={`Are you sure you want to permanently delete "${listingTitle}"? This action cannot be undone.`}
                type="confirm"
                onConfirm={handleConfirm}
                onCancel={() => setShowDialog(false)}
            />
        </>
    );
}
