import { getAllLocations } from "@/lib/db/locations";
import LocationManager from "@/components/admin/LocationManager";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
    title: "Manage Locations | Admin",
};

export const revalidate = 0; // Disable caching to ensure fresh list

export default async function AdminLocationsPage() {
    const supabase = await createClient();
    const locations = await getAllLocations(supabase);

    return (
        <div>
            <div style={{ padding: '20px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>Manage Locations</h1>
                <p style={{ color: '#64748b', marginBottom: '24px' }}>Add, edit, and organize states/provinces and their corresponding cities.</p>
                <LocationManager initialLocations={locations} />
            </div>
        </div>
    );
}
