"use client";

import React, { useState, useEffect, useRef } from "react";
import styles from "./ChatRoom.module.css";
import { useAppContext } from "@/context/AppContext";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import VerificationBadge from "@/components/VerificationBadge";
import { generateProductUrl } from "@/lib/utils";

interface ChatRoomProps {
    roomId: string | null;
    listingId: string | null;
    initialMessage?: string | null;
}

export default function ChatRoom({ roomId: roomIdProp, listingId: listingIdProp, initialMessage }: ChatRoomProps) {
    const supabase = createClient();
    const router = useRouter();
    const { listings, user, blockFeatures, showToast, refreshConversations } = useAppContext();

    const [room, setRoom] = useState<any>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [inputValue, setInputValue] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    const product = listings.find(l => l.id === listingIdProp);

    // Initial Load: Room and Messages
    useEffect(() => {
        if (!user || (!listingIdProp && !roomIdProp)) {
            setLoading(false);
            setRoom(null);
            setMessages([]);
            return;
        }

        const setupChat = async () => {
            setLoading(true);
            const { getOrCreateChatRoom, getChatMessages } = await import("@/lib/db/chat");
            try {
                let activeRoom = null;
                if (roomIdProp) {
                    // Fetch existing room details
                    const { data, error } = await supabase
                        .from('chat_rooms')
                        .select(`
                            *,
                            listing:listings (id, title, images, price, price_type, category_id, sub_category_label, sub_item_label),
                            buyer:profiles!chat_rooms_buyer_id_fkey (full_name, avatar_url, is_verified),
                            seller:profiles!chat_rooms_seller_id_fkey (full_name, avatar_url, is_verified)
                        `)
                        .eq('id', roomIdProp)
                        .single();

                    if (error) throw error;
                    const isBuyer = data.buyer_id === user.id;
                    activeRoom = {
                        ...data,
                        other_party: isBuyer ? data.seller : data.buyer
                    };
                } else if (listingIdProp && product?.user_id) {
                    // Create or get room based on listing
                    const result = await getOrCreateChatRoom(listingIdProp, user.id, product.user_id);
                    // For the initial load without a room ID, we ideally would update the URL 
                    // but in a component we'll just set the room and continue
                    activeRoom = {
                        ...result,
                        other_party: result.seller_id === user.id ? result.buyer : result.seller
                    };
                }

                if (activeRoom) {
                    setRoom(activeRoom);
                    const msgs = await getChatMessages(activeRoom.id, 50);
                    setMessages(msgs);
                    setHasMore(msgs.length === 50);

                    // Mark as read
                    const { markMessagesAsRead } = await import("@/lib/db/chat");
                    await markMessagesAsRead(activeRoom.id, user.id);
                    refreshConversations();

                    // Scroll to bottom
                    setTimeout(() => scrollToBottom(true), 50);
                }
            } catch (err: any) {
                console.error("Chat setup error:", err);
                showToast("Failed to load conversation", "error");
            } finally {
                setLoading(false);
            }
        };

        setupChat();
    }, [user, listingIdProp, roomIdProp, product?.user_id]);

    useEffect(() => {
        if (initialMessage) {
            setInputValue(initialMessage);
        }
    }, [initialMessage]);

    // Real-time subscription
    useEffect(() => {
        if (!room?.id) return;

        const channel = supabase
            .channel(`room:${room.id}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'chat_messages',
                filter: `room_id=eq.${room.id}`
            }, async (payload: any) => {
                setMessages(prev => {
                    if (prev.some(m => m.id === payload.new.id)) return prev;
                    setTimeout(() => scrollToBottom(), 50);
                    return [...prev, payload.new];
                });

                if (payload.new.sender_id !== user?.id) {
                    const { markMessagesAsRead } = await import("@/lib/db/chat");
                    await markMessagesAsRead(room.id, user!.id);
                    refreshConversations();
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [room?.id]);

    const scrollToBottom = (instant = false) => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTo({
                top: chatContainerRef.current.scrollHeight,
                behavior: instant ? "auto" : "smooth"
            });
        }
    };

    const loadMoreMessages = async () => {
        if (loadingMore || !hasMore || messages.length === 0) return;

        setLoadingMore(true);
        const container = chatContainerRef.current;
        const previousHeight = container?.scrollHeight || 0;
        const previousTop = container?.scrollTop || 0;

        try {
            const { getChatMessages } = await import("@/lib/db/chat");
            const oldestMsg = messages[0];
            const olderMsgs = await getChatMessages(room.id, 50, oldestMsg.created_at);

            if (olderMsgs.length < 50) {
                setHasMore(false);
            }

            setMessages(prev => [...olderMsgs, ...prev]);

            requestAnimationFrame(() => {
                if (container) {
                    const newHeight = container.scrollHeight;
                    container.scrollTop = newHeight - previousHeight + previousTop;
                }
            });

        } catch (error) {
            console.error("Failed to load more messages", error);
        } finally {
            setLoadingMore(false);
        }
    };

    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (blockFeatures?.chat) {
            showToast("Account Restricted: You are blocked from sending messages.", "error");
            return;
        }
        const file = e.target.files?.[0];
        if (!file || !room?.id || !user) return;

        e.target.value = '';

        try {
            setUploading(true);
            let fileToUpload = file;
            const isImage = file.type.startsWith('image/');

            if (isImage) {
                const imageCompression = (await import('browser-image-compression')).default;
                const options = {
                    maxSizeMB: 1,
                    maxWidthOrHeight: 1920,
                    useWebWorker: true
                };
                try {
                    fileToUpload = await imageCompression(file, options);
                } catch (error) {
                    console.error("Compression failed:", error);
                }
            } else if (file.size > 2 * 1024 * 1024) {
                showToast("File size must be less than 2MB", "error");
                setUploading(false);
                return;
            }

            const fileExt = fileToUpload.name.split('.').pop() || 'jpg';
            const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
            const filePath = `${room.id}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('chat-attachments')
                .upload(filePath, fileToUpload);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('chat-attachments')
                .getPublicUrl(filePath);

            const { sendChatMessage } = await import("@/lib/db/chat");
            await sendChatMessage(room.id, user.id, "", {
                type: isImage ? 'image' : 'file',
                url: publicUrl,
                name: file.name,
                size: fileToUpload.size
            });

            setTimeout(() => scrollToBottom(), 100);

        } catch (error) {
            console.error("Error uploading file:", error);
            showToast("Failed to upload file", "error");
        } finally {
            setUploading(false);
        }
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (blockFeatures?.chat) {
            showToast("Account Restricted", "error");
            return;
        }
        if (isSending || !inputValue.trim() || !room?.id || !user) return;

        const content = inputValue.trim();
        setIsSending(true);
        setInputValue("");
        
        try {
            const { sendChatMessage } = await import("@/lib/db/chat");
            await sendChatMessage(room.id, user.id, content);
            setTimeout(() => scrollToBottom(), 100);
        } catch (err: any) {
            console.error("Failed to send message:", err);
            setInputValue(content);
            showToast("Failed to send message", "error");
        } finally {
            setIsSending(false);
        }
    };

    if (!user) return null;

    if (!roomIdProp && !listingIdProp) {
        return (
            <div className={styles.emptyContainer}>
                <div className={styles.emptySelection}>
                    <div className={styles.emptyIcon}>💬</div>
                    <h2>Select a conversation</h2>
                    <p>Choose a chat from the sidebar to start messaging</p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className={styles.emptyContainer}>
                <div className="loader">Loading conversation...</div>
            </div>
        );
    }

    if (!room) {
        return (
            <div className={styles.emptyContainer}>
                <div className={styles.emptySelection}>
                    <h2>Conversation not found</h2>
                    <p>This chat may have been deleted or moved.</p>
                </div>
            </div>
        );
    }

    const otherPartyName = room.other_party?.full_name || "User";
    const listingInfo = room.listing || product;

    return (
        <div className={styles.chatRoomContent}>
            {/* Main Chat Header */}
            <header className={styles.chatHeader}>
                <div className={styles.headerLeft}>
                    <button 
                        className={styles.backBtn} 
                        onClick={() => {
                            router.push('/messages');
                        }}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M19 12H5M12 19l-7-7 7-7"/>
                        </svg>
                    </button>
                    <div className={styles.headerInfo}>
                        <div className={styles.chatHeaderTitle}>
                            <span className={styles.nameText}>{otherPartyName}</span>
                            {room.other_party?.is_verified && <VerificationBadge />}
                        </div>
                        {listingInfo && (
                            <div className={styles.headerSubtitle}>
                                Discussing: {listingInfo.title}
                            </div>
                        )}
                    </div>
                </div>
                
                {listingInfo && (
                     <div className={styles.headerProduct}>
                        <Link href={generateProductUrl(listingInfo)} className={styles.headerProductLink}>
                            <span>View Ad</span>
                        </Link>
                     </div>
                )}
            </header>

            {/* Product Sticky Bar for Context */}
            {listingInfo && (
                <div className={styles.productCompactBar}>
                    <img
                        src={listingInfo.images?.[0] || listingInfo.image}
                        alt=""
                        className={styles.compactThumb}
                    />
                    <div className={styles.compactInfo}>
                        <span className={styles.compactTitle}>{listingInfo.title}</span>
                        <span className={styles.compactPrice}>
                            {typeof listingInfo.price === 'number' ? `$${listingInfo.price}` : listingInfo.price}
                        </span>
                    </div>
                </div>
            )}

            <div className={styles.chatMessages} ref={chatContainerRef}>
                {hasMore && (
                    <div style={{ textAlign: 'center', padding: '10px' }}>
                        <button
                            onClick={loadMoreMessages}
                            className="btn-ghost"
                            disabled={loadingMore}
                            style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                        >
                            {loadingMore ? 'Loading...' : 'Load Previous Messages'}
                        </button>
                    </div>
                )}



                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`${styles.messageBubble} ${msg.sender_id === user?.id ? styles.messageRight : styles.messageLeft}`}
                    >
                        {msg.message_type === 'image' ? (
                            <div className={styles.messageImageWrapper}>
                                <img
                                    src={msg.file_url}
                                    alt="Attachment"
                                    className={styles.messageImage}
                                    onClick={() => window.open(msg.file_url, '_blank')}
                                />
                            </div>
                        ) : msg.message_type === 'file' ? (
                            <a href={msg.file_url} target="_blank" rel="noopener noreferrer" className={styles.messageFile}>
                                <div className={styles.fileIcon}>📄</div>
                                <div className={styles.fileInfo}>
                                    <span className={styles.fileName}>{msg.file_name}</span>
                                    <span className={styles.fileSize}>
                                        {msg.file_size ? (msg.file_size / 1024).toFixed(1) + ' KB' : ''}
                                    </span>
                                </div>
                            </a>
                        ) : (
                            <span>{msg.content}</span>
                        )}
                        <span className={styles.messageTime}>
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            <form className={styles.chatInputArea} onSubmit={handleSend}>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                    accept="image/*,.pdf,.doc,.docx,.txt"
                />
                <button
                    type="button"
                    className={styles.attachBtn}
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={styles.attachIcon}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                </button>
                <div className={styles.inputWrapper}>
                    <input
                        type="text"
                        className={styles.input}
                        placeholder={blockFeatures?.chat ? "Blocked" : "Type a message..."}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        disabled={blockFeatures?.chat}
                    />
                </div>
                <button 
                    type="submit" 
                    className={styles.sendBtn} 
                    disabled={(!inputValue.trim() && !uploading && !isSending) || blockFeatures?.chat || isSending}
                >
                    {uploading || isSending ? (
                        <div className="spinner-small"></div>
                    ) : (
                        <svg viewBox="0 0 24 24" className={styles.sendIcon} fill="currentColor">
                            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                        </svg>
                    )}
                </button>
            </form>
        </div>
    );
}
