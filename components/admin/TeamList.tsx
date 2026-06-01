"use client";

import { useState } from "react";
import { TeamMember, removeTeamMember } from "@/app/(admin)/admin/users/actions";
import { Badge } from "@/components/ui-custom/Badge";
import { FaTrash, FaPen, FaPlus, FaMagnifyingGlass } from "react-icons/fa6";
import styles from "./TeamList.module.css";
import TeamMemberModal from "./TeamMemberModal";
import UserSearchModal from "./UserSearchModal";
import { useRouter } from "next/navigation";

interface TeamListProps {
    initialMembers: TeamMember[];
}

export default function TeamList({ initialMembers }: TeamListProps) {
    const [members, setMembers] = useState(initialMembers);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
    const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleRemove = async (userId: string) => {
        if (!confirm("Are you sure you want to remove this team member?")) return;

        setIsLoading(true);
        try {
            const result = await removeTeamMember(userId);
            if (result.success) {
                setMembers(prev => prev.filter(m => m.user_id !== userId));
                router.refresh();
            } else {
                alert("Error: " + result.error);
            }
        } catch (error) {
            console.error(error);
            alert("An error occurred.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleEdit = (member: TeamMember) => {
        setSelectedMember(member);
        setIsEditModalOpen(true);
    };

    const handleAddClick = () => {
        setIsSearchModalOpen(true);
    };

    return (
        <div className={styles.container}>
            <div className={styles.actionBar}>
                <button className={styles.addBtn} onClick={handleAddClick}>
                    <FaPlus /> Add Team Member
                </button>
            </div>

            <table className={styles.table}>
                <thead>
                    <tr>
                        <th>Member</th>
                        <th>Permissions</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {members.length === 0 ? (
                        <tr>
                            <td colSpan={3} className={styles.emptyState}>No team members found.</td>
                        </tr>
                    ) : (
                        members.map(member => (
                            <tr key={member.user_id}>
                                <td>
                                    <div className={styles.memberName}>{member.full_name || "Unknown"}</div>
                                    <div className={styles.memberEmail}>{member.user_id.slice(0, 8)}...</div>
                                </td>
                                <td>
                                    <div className={styles.permissionGroups}>
                                        {Object.entries(
                                            member.permissions.reduce((acc, p) => {
                                                const [module, action] = p.split(':');
                                                if (!acc[module]) acc[module] = [];
                                                acc[module].push(action);
                                                return acc;
                                            }, {} as Record<string, string[]>)
                                        ).map(([module, actions]) => (
                                            <div key={module} className={styles.permGroup}>
                                                <span className={styles.moduleName}>{module}:</span>
                                                {actions.map(a => (
                                                    <Badge key={a} variant="outline" className={styles.actionBadge}>
                                                        {a.charAt(0).toUpperCase() + a.slice(1)}
                                                    </Badge>
                                                ))}
                                            </div>
                                        ))}
                                        {member.permissions.length === 0 && <span className={styles.noPerms}>No access</span>}
                                    </div>
                                </td>
                                <td style={{ textAlign: 'right' }}>
                                    <div className={styles.actions}>
                                        <button className={styles.iconBtn} onClick={() => handleEdit(member)} title="Edit Permissions">
                                            <FaPen />
                                        </button>
                                        <button className={`${styles.iconBtn} ${styles.danger}`} onClick={() => handleRemove(member.user_id)} title="Remove">
                                            <FaTrash />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>

            {isEditModalOpen && selectedMember && (
                <TeamMemberModal
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    member={selectedMember}
                    onSuccess={() => router.refresh()}
                />
            )}

            {isSearchModalOpen && (
                <UserSearchModal
                    isOpen={isSearchModalOpen}
                    onClose={() => setIsSearchModalOpen(false)}
                    onSuccess={() => router.refresh()}
                />
            )}
        </div>
    );
}
