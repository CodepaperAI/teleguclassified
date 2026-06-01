import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import AdminListingsClient from "@/components/admin/AdminListingsClient";

interface Params {
    searchParams: {
        q?: string;
        category?: string;
        status?: string;
        price_type?: string;
        sort?: string;
        date_filter?: string;
        start_date?: string;
        end_date?: string;
    };
}

export const dynamic = "force-dynamic";

export default async function AdminListingsPage(props: { searchParams: Promise<Params['searchParams']> }) {
    const searchParams = await props.searchParams;
    const supabase = createAdminClient();

    // Fetch categories and plans for filters and actions
    const { data: categories } = await supabase.from('categories').select('id, label').order('label');
    const { data: premiumPlans } = await supabase.from('premium_plans').select('*').order('price');

    // Calculate Date Range
    const now = new Date();
    let startDate: Date | null = null;
    let endDate: Date | null = null;

    const dateFilter = searchParams.date_filter || 'this_month'; // Default to this_month if undefined

    if (dateFilter === 'this_month') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    } else if (dateFilter === 'last_month') {
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    } else if (dateFilter === 'this_year') {
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
    } else if (dateFilter === 'custom') {
        if (searchParams.start_date) {
            startDate = new Date(searchParams.start_date);
        }
        if (searchParams.end_date) {
            endDate = new Date(searchParams.end_date);
            endDate.setHours(23, 59, 59);
        }
    } else if (dateFilter === 'all_time') {
        startDate = null;
        endDate = null;
    }

    // Build the query
    let query = supabase
        .from("listings")
        .select("*");

    // Apply Date Filter
    if (startDate) {
        query = query.gte('created_at', startDate.toISOString());
    }
    if (endDate) {
        query = query.lte('created_at', endDate.toISOString());
    }

    // Default Sort: Newest First
    query = query.order('created_at', { ascending: false });

    // Fetch data
    const { data: listings, error } = await query;

    if (error) {
        console.error("Error fetching listings:", error);
        return <div>Error loading listings</div>;
    }

    return (
        <AdminListingsClient
            initialListings={listings || []}
            categories={categories || []}
            premiumPlans={premiumPlans || []}
        />
    );
}
