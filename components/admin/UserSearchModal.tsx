"use client";

import { useState } from "react";
import Dialog from "@/components/Dialog";
import { getUsers } from "@/app/(admin)/admin/users/actions";
import { FaMagnifyingGlass, FaPlus, FaSpinner } from "react-icons/fa6";
import styles from "./UserSearchModal.module.css";
import TeamMemberModal from "./TeamMemberModal";

interface UserSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export default function UserSearchModal({ isOpen, onClose, onSuccess }: UserSearchModalProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [results, setResults] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any | null>(null);
    const [isPermsModalOpen, setIsPermsModalOpen] = useState(false);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchTerm.trim()) return;

        setIsLoading(true);
        try {
            const { users } = await getUsers({ search: searchTerm, page: 1 });
            setResults(users);
        } catch (error) {
            console.error(error);
            alert("Search failed.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectUser = (user: any) => {
        setSelectedUser(user);
        setIsPermsModalOpen(true);
    };

    return (
        <>
            <Dialog isOpen={isOpen} onClose={onClose} title="Add Team Member">
                <div className={styles.container}>
                    <form className={styles.searchBox} onSubmit={handleSearch}>
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            autoFocus
                        />
                        <button type="submit" disabled={isLoading}>
                            {isLoading ? <FaSpinner className={styles.spinner} /> : <FaMagnifyingGlass />}
                        </button>
                    </form>

                    <div className={styles.resultsList}>
                        {isLoading ? (
                            <div className={styles.loadingState}>Searching...</div>
                        ) : results.length === 0 && searchTerm ? (
                            <div className={styles.emptyState}>No users found.</div>
                        ) : (
                            results.map(user => (
                                <div key={user.id} className={styles.resultItem}>
                                    <div className={styles.userInfo}>
                                        <div className={styles.userName}>{user.full_name || "Unknown Name"}</div>
                                        <div className={styles.userEmail}>{user.email}</div>
                                    </div>
                                    <button className={styles.selectBtn} onClick={() => handleSelectUser(user)}>
                                        <FaPlus /> Add
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </Dialog>

            {isPermsModalOpen && selectedUser && (
                <TeamMemberModal
                    isOpen={isPermsModalOpen}
                    onClose={() => {
                        setIsPermsModalOpen(false);
                        onClose(); // Close search modal too
                    }}
                    member={{
                        user_id: selectedUser.id,
                        full_name: selectedUser.full_name,
                        permissions: []
                    }}
                    onSuccess={onSuccess}
                />
            )}
        </>
    );
}
