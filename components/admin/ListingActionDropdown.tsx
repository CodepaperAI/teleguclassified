"use client";

import { useState, useRef, useEffect } from "react";
import { HiDotsVertical } from "react-icons/hi";
import { FaBan, FaCircleCheck, FaTrashCan, FaRocket, FaPenToSquare } from "react-icons/fa6";
import styles from "./ListingActionDropdown.module.css";

interface ListingActionDropdownProps {
    listing: {
        id: string;
        title: string;
        status: string;
    };
    onBlock: () => void;
    onEdit: () => void;
    onDelete: () => void;
    onUpgrade: () => void;
}

export default function ListingActionDropdown({ listing, onBlock, onEdit, onDelete, onUpgrade }: ListingActionDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const isBlocked = listing.status === "blocked";

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className={styles.container} ref={dropdownRef}>
            <button 
                className={styles.trigger}
                onClick={() => setIsOpen(!isOpen)}
                title="Listing Actions"
            >
                <HiDotsVertical />
            </button>

            {isOpen && (
                <div className={styles.menu}>
                    <button 
                        className={styles.menuItem}
                        onClick={() => {
                            onEdit();
                            setIsOpen(false);
                        }}
                    >
                        <FaPenToSquare className={styles.editIcon} />
                        Edit
                    </button>

                    <button 
                        className={styles.menuItem}
                        onClick={() => {
                            onBlock();
                            setIsOpen(false);
                        }}
                    >
                        {isBlocked ? <FaCircleCheck className={styles.unblockIcon} /> : <FaBan className={styles.blockIcon} />}
                        {isBlocked ? "Unblock" : "Block"}
                    </button>

                    <button 
                        className={styles.menuItem}
                        onClick={() => {
                            onUpgrade();
                            setIsOpen(false);
                        }}
                    >
                        <FaRocket className={styles.upgradeIcon} />
                        Upgrade
                    </button>

                    <div className={styles.divider} />

                    <button 
                        className={`${styles.menuItem} ${styles.deleteItem}`}
                        onClick={() => {
                            onDelete();
                            setIsOpen(false);
                        }}
                    >
                        <FaTrashCan className={styles.deleteIcon} />
                        Delete
                    </button>
                </div>
            )}
        </div>
    );
}
