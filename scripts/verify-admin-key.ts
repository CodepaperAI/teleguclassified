
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

// Manually load env vars for script execution
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log("URL:", supabaseUrl);
console.log("Key length:", supabaseServiceKey?.length);
console.log("Key start:", supabaseServiceKey?.substring(0, 10));

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing env vars in script");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function test() {
    console.log("Attempting to fetch users with Service Role...");
    // Only service_role can list users from auth.users
    const { data: users, error } = await supabase.auth.admin.listUsers();

    if (error) {
        console.error("Error fetching users:", error);
    } else {
        console.log("Success! Users found:", users.users.length);
        if (users.users.length > 0) {
            const userId = users.users[0].id;
            console.log("Sample User ID:", userId);

            console.log("Attempting to fetch Profile for this user...");
            const { data: profile, error: dbError } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", userId)
                .single();

            if (dbError) {
                console.error("Error fetching profile:", dbError);
            } else {
                console.log("Success! Profile found:", profile ? "Yes" : "No");
                console.log("Profile Data:", profile);
            }
        }
    }
}

test();
