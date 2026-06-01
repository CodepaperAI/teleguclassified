import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkListingData() {
    console.log("Fetching sample listings...");

    const { data, error } = await supabase
        .from('listings')
        .select('id, title, category_id, sub_category_label, sub_item_label')
        .eq('status', 'active')
        .limit(10);

    if (error) {
        console.error("Error fetching listings:", error);
        return;
    }

    console.table(data);
}

checkListingData();
