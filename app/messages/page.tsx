"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useAppContext } from "@/context/AppContext";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import styles from "./Messages.module.css";
import ChatRoom from "@/components/ChatRoom";

function MessagesContent() {
    const { conversations, user, refreshConversations } = useAppContext();
    const [loading, setLoading] = useState(true);
    const [activeSubTab, setActiveSubTab] = useState<"all" | "inbound" | "outbound">("all");
    const searchParams = useSearchParams();
    const router = useRouter();
    
    const activeRoomId = searchParams.get("room");
    const activeListingId = searchParams.get("id");
    const initialMessage = searchParams.get("initialMessage");

    useEffect(() => {
        if (user) {
            refreshConversations().finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, [user]);

    if (!user) {
        return (
            <div className={styles.page}>
                <div className={styles.container} style={{ height: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ textAlign: 'center' }}>
                        <h2>Please login to see your messages</h2>
                        <Link href="/login" className="btn-primary" style={{ marginTop: '20px', display: 'inline-block' }}>Login</Link>
                    </div>
                </div>
            </div>
        );
    }

    const filteredConversations = conversations.filter(room => {
        if (activeSubTab === "all") return true;
        const isOwner = room.seller_id === user.id;
        return activeSubTab === "inbound" ? isOwner : !isOwner;
    });

    const handleSelectRoom = (room: any) => {
        router.push(`/messages?id=${room.listing_id}&room=${room.id}`);
    };

    return (
        <div className={styles.page}>
            <div className={styles.container}>
                {/* Sidebar */}
                <aside className={`${styles.sidebar} ${activeRoomId ? styles.hidden : ""}`}>
                    <div className={styles.sidebarHeader}>
                        <h1>Messages</h1>
                        <div className={styles.subTabs}>
                            <button
                                className={activeSubTab === "all" ? styles.activeSubTab : styles.subTab}
                                onClick={() => setActiveSubTab("all")}
                            >
                                All
                            </button>
                            <button
                                className={activeSubTab === "inbound" ? styles.activeSubTab : styles.subTab}
                                onClick={() => setActiveSubTab("inbound")}
                            >
                                Listings
                            </button>
                            <button
                                className={activeSubTab === "outbound" ? styles.activeSubTab : styles.subTab}
                                onClick={() => setActiveSubTab("outbound")}
                            >
                                Enquiries
                            </button>
                        </div>
                    </div>

                    <div className={styles.conversationList}>
                        {loading ? (
                            <div style={{ padding: '24px', textAlign: 'center' }}>Loading...</div>
                        ) : filteredConversations.length === 0 ? (
                            <div className={styles.emptyState}>
                                <div className={styles.emptyIcon}>💬</div>
                                <p>No messages here yet.</p>
                            </div>
                        ) : (
                            filteredConversations.map((room) => (
                                <div
                                    key={room.id}
                                    className={`${styles.conversationItem} ${activeRoomId === room.id ? styles.active : ""} ${room.has_unread && activeRoomId !== room.id ? styles.unread : ""}`}
                                    onClick={() => handleSelectRoom(room)}
                                >
                                    {room.has_unread && activeRoomId !== room.id && <div className={styles.unreadIndicator} />}
                                    <div className={styles.avatar}>
                                        {room.other_party?.avatar_url ? (
                                            <img src={room.other_party.avatar_url} alt="" />
                                        ) : (
                                            <span>{room.other_party?.full_name?.[0]?.toUpperCase() || "U"}</span>
                                        )}
                                    </div>
                                    <div className={styles.content}>
                                        <div className={styles.topRow}>
                                            <span className={styles.userName}>{room.other_party?.full_name || "User"}</span>
                                            <span className={styles.time}>
                                                {room.last_message_at ? new Date(room.last_message_at).toLocaleDateString() : ""}
                                            </span>
                                        </div>
                                        <div className={styles.listingTitle}>{room.listing?.title || "Unknown Listing"}</div>
                                        <div className={styles.lastMessage}>{room.last_message || "No messages yet"}</div>
                                    </div>
                                    {room.listing?.images?.[0] && (
                                        <img src={room.listing.images[0]} alt="" className={styles.listingThumbnail} />
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </aside>

                {/* Chat Area */}
                <main className={styles.chatArea}>
                    <ChatRoom 
                        roomId={activeRoomId} 
                        listingId={activeListingId} 
                        initialMessage={initialMessage}
                    />
                </main>
            </div>
        </div>
    );
}

export default function MessagesPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <MessagesContent />
        </Suspense>
    );
}
