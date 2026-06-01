"use client";

import { useState, useEffect } from "react";
import { FaXmark, FaSpinner } from "react-icons/fa6";
import { getAdminChatMessages } from "@/lib/actions/admin-chat";
import styles from "./ChatViewer.module.css";

interface ChatViewerProps {
    roomId: string;
    isOpen: boolean;
    onClose: () => void;
    otherUserName: string;
    listingTitle: string;
}

export default function ChatViewer({ roomId, isOpen, onClose, otherUserName, listingTitle }: ChatViewerProps) {
    const [messages, setMessages] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen && roomId) {
            fetchMessages();
        }
    }, [isOpen, roomId]);

    const fetchMessages = async () => {
        setIsLoading(true);
        const result = await getAdminChatMessages(roomId);
        if (result.success) {
            setMessages(result.data || []);
        } else {
            alert("Failed to load messages");
        }
        setIsLoading(false);
    };

    if (!isOpen) return null;

    return (
        <div className={styles.overlay}>
            <div className={styles.dialog}>
                <div className={styles.header}>
                    <div>
                        <h3 className={styles.title}>Chat with {otherUserName}</h3>
                        <p className={styles.subtitle}>{listingTitle}</p>
                    </div>
                    <button onClick={onClose} className={styles.closeBtn}>
                        <FaXmark />
                    </button>
                </div>

                <div className={styles.body}>
                    {isLoading ? (
                        <div className={styles.loading}>
                            <FaSpinner className={styles.spinner} />
                        </div>
                    ) : messages.length === 0 ? (
                        <div className={styles.empty}>No messages found.</div>
                    ) : (
                        <div className={styles.messageList}>
                            {messages.map((msg) => {
                                const isSystem = msg.sender_id === null; // Handle system messages if any
                                // We don't verify "isMe" easily here without current admin ID, 
                                // so we'll just show sender name for clarity.

                                return (
                                    <div key={msg.id} className={styles.messageWrapper}>
                                        <div className={styles.messageHeader}>
                                            <span className={styles.sender}>
                                                {msg.sender?.full_name || "Unknown"}
                                            </span>
                                            <span className={styles.time}>
                                                {msg.created_at ? new Date(msg.created_at).toLocaleString() : 'Unknown'}
                                            </span>
                                        </div>
                                        <div className={styles.bubble}>
                                            {msg.content}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className={styles.footer}>
                    <p className={styles.footerNote}>Read-only view. Admins cannot reply.</p>
                </div>
            </div>
        </div>
    );
}
