"use client";

import { useState } from "react";
import Dialog from "@/components/Dialog";
import { TeamMember, addTeamMember } from "@/app/(admin)/admin/users/actions";
import styles from "./TeamMemberModal.module.css";

interface TeamMemberModalProps {
    isOpen: boolean;
    onClose: () => void;
    member: Partial<TeamMember> & { user_id: string }; // user_id is required
    onSuccess?: () => void;
}

const MODULES = [
    { id: "listings", label: "Listings" },
    { id: "users", label: "Users" },
    { id: "plans", label: "Plans" },
    { id: "categories", label: "Categories" },
    { id: "locations", label: "Locations" },
    { id: "settings", label: "Settings" }
];

export default function TeamMemberModal({ isOpen, onClose, member, onSuccess }: TeamMemberModalProps) {
    const [selectedPerms, setSelectedPerms] = useState<string[]>(member.permissions || []);
    const [isSaving, setIsSaving] = useState(false);

    const togglePermission = (moduleId: string, type: 'read' | 'write') => {
        const perm = `${moduleId}:${type}`;
        setSelectedPerms(prev => {
            if (prev.includes(perm)) {
                // If removing read, also remove write
                if (type === 'read') {
                    return prev.filter(p => !p.startsWith(`${moduleId}:`));
                }
                return prev.filter(p => p !== perm);
            } else {
                // If adding write, also add read
                if (type === 'write') {
                    const withWrite = [...prev, perm];
                    if (!withWrite.includes(`${moduleId}:read`)) {
                        withWrite.push(`${moduleId}:read`);
                    }
                    return withWrite;
                }
                return [...prev, perm];
            }
        });
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const result = await addTeamMember(member.user_id, selectedPerms);
            if (result.success) {
                onSuccess?.();
                onClose();
            } else {
                alert("Failed: " + result.error);
            }
        } catch (error) {
            console.error(error);
            alert("An error occurred.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog
            isOpen={isOpen}
            onClose={onClose}
            title={member.full_name ? `Permissions: ${member.full_name}` : "Assign Permissions"}
        >
            <div className={styles.container}>
                <div className={styles.permHeader}>
                    <div className={styles.moduleCol}>Module</div>
                    <div className={styles.checkCol}>Read</div>
                    <div className={styles.checkCol}>Write</div>
                </div>
                <div className={styles.permGrid}>
                    {MODULES.map(module => (
                        <div key={module.id} className={styles.permRow}>
                            <div className={styles.moduleLabel}>{module.label}</div>
                            <div className={styles.checkCol}>
                                <input
                                    type="checkbox"
                                    checked={selectedPerms.includes(`${module.id}:read`)}
                                    onChange={() => togglePermission(module.id, 'read')}
                                />
                            </div>
                            <div className={styles.checkCol}>
                                <input
                                    type="checkbox"
                                    checked={selectedPerms.includes(`${module.id}:write`)}
                                    onChange={() => togglePermission(module.id, 'write')}
                                />
                            </div>
                        </div>
                    ))}
                </div>
                <div className={styles.footer}>
                    <button className={styles.cancelBtn} onClick={onClose} disabled={isSaving}>Cancel</button>
                    <button className={styles.saveBtn} onClick={handleSave} disabled={isSaving}>
                        {isSaving ? "Saving..." : "Save Permissions"}
                    </button>
                </div>
            </div>
        </Dialog>
    );
}
