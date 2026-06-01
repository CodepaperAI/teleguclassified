import styles from "./page.module.css";
import AdminListingsClient from "./AdminListingsClient";
import { getCategoriesTree } from "@/lib/db/categories";
import { FaPlus, FaLayerGroup } from "react-icons/fa6";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui-custom/Card";
import { EmptyState } from "@/components/ui-custom/EmptyState";

export default async function UserListingsPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const { id } = params;
    const supabase = createAdminClient();

    // 1. Fetch Listings
    const { data: listings, error: listingsError } = await supabase
        .from("listings")
        .select("*")
        .eq("user_id", id)
        .order("created_at", { ascending: false });

    // 2. Fetch Categories for the "Add" form
    const categories = await getCategoriesTree();

    // 3. Fetch Premium Plans for the "Upgrade" form
    const { data: plans } = await supabase
        .from("premium_plans")
        .select("*")
        .eq("is_active", true)
        .order("price", { ascending: true });

    if (listingsError) {
        return (
            <Card className="border-red-200">
                <CardContent className="pt-6 text-red-600">
                    Error loading listings: {listingsError.message}
                </CardContent>
            </Card>
        );
    }

    return (
        <Card style={{ overflow: 'visible' }}>
            <CardHeader className={styles.cardHeader}>
                <div>
                    <CardTitle>User Listings</CardTitle>
                    <CardDescription>Manage listings created by this user.</CardDescription>
                </div>
            </CardHeader>
            <CardContent className="p-0 pb-40 min-h-[500px]" style={{ overflow: 'visible' }}>
                <AdminListingsClient 
                    listings={listings || []} 
                    userId={id} 
                    categories={categories}
                    premiumPlans={plans || []}
                />
            </CardContent>
        </Card>
    );
}
