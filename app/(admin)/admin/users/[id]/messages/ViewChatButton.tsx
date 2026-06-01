"use client";

import { useState } from "react";
import { FaEye } from "react-icons/fa6";
import ChatViewer from "./ChatViewer";

interface ViewChatButtonProps {
    roomId: string;
    otherUserName: string;
    listingTitle: string;
}

export default function ViewChatButton({ roomId, otherUserName, listingTitle }: ViewChatButtonProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="text-gray-400 hover:text-blue-600 transition-colors"
                title="View Conversation"
            >
                <FaEye />
            </button>

            {isOpen && (
                <ChatViewer
                    roomId={roomId}
                    isOpen={isOpen}
                    onClose={() => setIsOpen(false)}
                    otherUserName={otherUserName}
                    listingTitle={listingTitle}
                />
            )}
        </>
    );
}
