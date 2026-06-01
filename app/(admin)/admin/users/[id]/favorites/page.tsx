import { createAdminClient } from "@/lib/supabase/admin";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui-custom/Table";
import { Badge } from "@/components/ui-custom/Badge";
import { EmptyState } from "@/components/ui-custom/EmptyState";
import { FaHeart, FaEye } from "react-icons/fa6";
import Link from "next/link";

export default async function UserFavoritesPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const { id } = params;
    const supabase = createAdminClient();

    const { data: favorites, error } = await supabase
        .from("favorites")
        .select(`
            created_at,
            listing:listings (
                id,
                title,
                price,
                price_type,
                status,
                images
            )
        `)
        .eq("user_id", id)
        .order("created_at", { ascending: false });

    if (error) {
        return <div className="p-4 text-red-500">Error loading favorites: {error.message}</div>;
    }

    if (!favorites || favorites.length === 0) {
        return (
            <EmptyState
                icon={FaHeart}
                title="No Favorites Found"
                description="This user has not added any listings to their favorites."
            />
        );
    }

    return (
        <div>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Listing</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Favorited On</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {favorites.map((fav) => {
                        // @ts-ignore
                        const listing = fav.listing;
                        if (!listing) return null;

                        return (
                            <TableRow key={`${fav.created_at}_${listing.id}`}>
                                <TableCell>
                                    <span className="font-medium text-gray-900 max-w-[250px] truncate block">
                                        {listing.title}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    {listing.price_type === "contact" ? "Contact" :
                                        listing.price ? `$${listing.price.toLocaleString()}` : "Free"}
                                </TableCell>
                                <TableCell>
                                    <Badge variant={listing.status === 'active' ? 'active' : 'default'}>
                                        {listing.status}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    {fav.created_at ? new Date(fav.created_at).toLocaleDateString() : 'Unknown'}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Link href={`/product/${listing.id}`} target="_blank" className="p-1.5 hover:bg-gray-100 rounded text-gray-600 transition-colors">
                                            <FaEye />
                                        </Link>
                                    </div>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
}
