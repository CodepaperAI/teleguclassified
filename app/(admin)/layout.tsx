import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { checkHasAdminAccess, checkIsAdmin } from "@/lib/db/profile";
import AdminLayoutClient from "@/components/admin/AdminLayoutClient";

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    console.log("Admin Layout Debug:");
    console.log("User exists:", !!user);
    console.log("User ID:", user?.id);

    if (!user) {
        console.log("Redirecting to /login because no user");
        redirect("/login");
    }

    const hasAccess = await checkHasAdminAccess(user.id, supabase);
    console.log("Has Admin Access:", hasAccess);

    if (!hasAccess) {
        console.log("Redirecting to / because no access");
        redirect("/");
    }

    const isAdmin = await checkIsAdmin(user.id, supabase);
    const { data: teamData } = await supabase
        .from('team_members')
        .select('permissions')
        .eq('user_id', user.id)
        .single();

    const permissions = teamData?.permissions || (isAdmin ? ['*'] : []);

    return (
        <AdminLayoutClient isAdmin={isAdmin} permissions={permissions}>
            {children}
        </AdminLayoutClient>
    );
}
