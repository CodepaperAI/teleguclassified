import { createAdminClient } from "@/lib/supabase/admin";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui-custom/Table";
import { Badge } from "@/components/ui-custom/Badge";
import { EmptyState } from "@/components/ui-custom/EmptyState";
import { FaMessage } from "react-icons/fa6";
import Link from "next/link";
import ViewChatButton from "./ViewChatButton";

export default async function UserMessagesPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const { id } = params;
    const supabase = createAdminClient();

    // Fetch rooms where user is buyer OR seller
    const { data: rooms, error } = await supabase
        .from("chat_rooms")
        .select(`
            id,
            buyer_id,
            seller_id,
            listing_id,
            last_message,
            last_message_at,
            created_at,
            listing:listings!chat_rooms_listing_id_fkey (
                id,
                title,
                images
            ),
            buyer:profiles!chat_rooms_buyer_id_fkey (
                id,
                full_name
            ),
            seller:profiles!chat_rooms_seller_id_fkey (
                id,
                full_name
            )
        `)
        .or(`buyer_id.eq.${id},seller_id.eq.${id}`)
        .order("last_message_at", { ascending: false });

    if (error) {
        return <div className="p-4 text-red-500">Error loading messages: {error.message}</div>;
    }

    if (!rooms || rooms.length === 0) {
        return (
            <EmptyState
                icon={FaMessage}
                title="No Conversations Found"
                description="This user has not started any conversations yet."
            />
        );
    }

    return (
        <div>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Other Participant</TableHead>
                        <TableHead>Listing</TableHead>
                        <TableHead>Last Message</TableHead>
                        <TableHead>Updated</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {rooms.map((room: any) => {
                        const isBuyer = room.buyer_id === id;
                        const otherUser = isBuyer ? room.seller : room.buyer;
                        const listing = room.listing;

                        return (
                            <TableRow key={room.id}>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600">
                                            {(otherUser?.full_name?.[0] || "?").toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="font-medium text-gray-900">
                                                {otherUser?.full_name || "Unknown User"}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {isBuyer ? "Seller" : "Buyer"}
                                            </div>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <span className="font-medium text-gray-900 max-w-[200px] truncate block">
                                        {listing?.title || "Unknown Listing"}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    <span className="text-gray-500 max-w-[200px] truncate block" title={room.last_message || ""}>
                                        {room.last_message || "No messages"}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    {(room.last_message_at || room.created_at) ? new Date(room.last_message_at || room.created_at).toLocaleDateString() : 'N/A'}
                                </TableCell>
                                <TableCell className="text-right">
                                    <ViewChatButton
                                        roomId={room.id}
                                        otherUserName={otherUser?.full_name || "Unknown"}
                                        listingTitle={listing?.title || "Unknown Listing"}
                                    />
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
}
