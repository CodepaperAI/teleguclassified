import { createAdminClient } from "@/lib/supabase/admin";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui-custom/Table";
import { Badge } from "@/components/ui-custom/Badge";
import { EmptyState } from "@/components/ui-custom/EmptyState";
import { FaMoneyBillTransfer } from "react-icons/fa6";

export default async function UserTransactionsPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const { id } = params;
    const supabase = createAdminClient();

    // @ts-ignore
    const { data: transactions, error } = await supabase
        .from("payments")
        .select(`
            *,
            listing:listings (
                title
            )
        `)
        .eq("user_id", id)
        .order("created_at", { ascending: false });

    if (error) {
        return <div className="p-4 text-red-500">Error loading transactions: {error.message}</div>;
    }

    if (!transactions || transactions.length === 0) {
        return (
            <EmptyState
                icon={FaMoneyBillTransfer}
                title="No Transactions Found"
                description="This user has not made any transactions yet."
            />
        );
    }

    return (
        <div>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Plan</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {transactions.map((tx: any) => (
                        <TableRow key={tx.id}>
                            <TableCell>
                                {tx.created_at ? new Date(tx.created_at).toLocaleDateString() : 'Unknown'}
                            </TableCell>
                            <TableCell>
                                {tx.listing?.title
                                    ? `Boost for "${tx.listing.title}"`
                                    : "Premium Subscription"}
                            </TableCell>
                            <TableCell className="font-medium">
                                ${tx.amount} {tx.currency}
                            </TableCell>
                            <TableCell>
                                <Badge variant={
                                    (tx.status === 'succeeded' || tx.status === 'paid' || tx.status === 'completed') ? 'active' :
                                        (tx.status === 'pending' || tx.status === 'processing') ? 'pending' :
                                            'default'
                                }>
                                    {tx.status}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                {tx.plan_type || "N/A"}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
