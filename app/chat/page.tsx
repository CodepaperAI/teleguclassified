"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function ChatRedirect() {
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const listingId = searchParams.get("id");
        const roomId = searchParams.get("room");
        const initialMessage = searchParams.get("initialMessage");
        
        let url = "/messages";
        const params = new URLSearchParams();
        if (roomId) params.set("room", roomId);
        if (listingId) params.set("id", listingId);
        if (initialMessage) params.set("initialMessage", initialMessage);
        
        if (params.toString()) {
            url += `?${params.toString()}`;
        }
        
        router.replace(url);
    }, [router, searchParams]);

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
            <div className="loader">Redirecting to messages...</div>
        </div>
    );
}

export default function ChatPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ChatRedirect />
        </Suspense>
    );
}
